/**
 * cannon.js v0.3.8 - A lightweight 3D physics engine for the web
 * 
 * http://github.com/schteppe/cannon.js
 * 
 * Copyright (c) 2012 Stefan Hedman (steffe.se)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * The Software shall be used for Good, not Evil.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Our main namespace definition
 * @author schteppe / https://github.com/schteppe
 */

var CANNON = CANNON || {};

// Maintain compatibility with older browsers
if(!self.Int32Array){
  self.Int32Array = Array;
  self.Float32Array = Array;
}
/**
 * @class Broadphase
 * @author schteppe / https://github.com/schteppe
 * @todo Make it a base class for broadphase implementations, and rename this one to NaiveBroadphase
 */
CANNON.Broadphase = function(){
  /// The world to search for collisions in.
  this.world = null;
};

CANNON.Broadphase.prototype.constructor = CANNON.BroadPhase;

/**
 * Get the collision pairs from the world
 * @return array
 */
CANNON.Broadphase.prototype.collisionPairs = function(){
  throw "collisionPairs not implemented for this BroadPhase class!";
};

/**
 * Naive broadphase implementation, used in lack of better ones and for
 * comparisons in performance tests.
 *
 * The naive broadphase looks at all possible pairs without restriction,
 * therefore it has complexity N^2 (which is really bad)
 */
CANNON.NaiveBroadphase = function(){
  
};

CANNON.NaiveBroadphase.prototype = new CANNON.Broadphase();
CANNON.NaiveBroadphase.prototype.constructor = CANNON.NaiveBroadphase;

/**
 * Get all the collision pairs in a physics world
 * @param World world
 * @todo Should be placed in a subclass to BroadPhase
 */
CANNON.NaiveBroadphase.prototype.collisionPairs = function(){
  var world = this.world;
  var pairs1 = [];
  var pairs2 = [];
  var n = world.numObjects();

  // Local fast access
  var SPHERE =   CANNON.Shape.types.SPHERE;
  var PLANE =    CANNON.Shape.types.PLANE;
  var BOX =      CANNON.Shape.types.BOX;
  var COMPOUND = CANNON.Shape.types.COMPOUND;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var type = world.type;
  var body = world.body;

  // Naive N^2 ftw!
  for(var i=0; i<n; i++){
    for(var j=0; j<i; j++){

      // --- Box / sphere / compound collision ---
      if((type[i]==BOX      && type[j]==BOX) ||
	 (type[i]==BOX      && type[j]==COMPOUND) ||
	 (type[i]==BOX      && type[j]==SPHERE) ||
	 (type[i]==SPHERE   && type[j]==BOX) ||
	 (type[i]==SPHERE   && type[j]==SPHERE) ||
	 (type[i]==SPHERE   && type[j]==COMPOUND) ||
	 (type[i]==COMPOUND && type[j]==COMPOUND) ||
	 (type[i]==COMPOUND && type[j]==SPHERE) ||
	 (type[i]==COMPOUND && type[j]==BOX)){
	// Rel. position
	var r = new CANNON.Vec3(x[j]-x[i],
				y[j]-y[i],
				z[j]-z[i]);
	var boundingRadius1 = body[i]._shape.boundingSphereRadius();
	var boundingRadius2 = body[j]._shape.boundingSphereRadius();
	if(r.norm()<(boundingRadius1+boundingRadius2)){
	  pairs1.push(i);
	  pairs2.push(j);
	}

      // --- Sphere/box/compound versus plane ---
      } else if((type[i]==SPHERE && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==SPHERE) ||

		(type[i]==BOX && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==BOX) ||

		(type[i]==COMPOUND && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==COMPOUND)){

	var pi = type[i]==PLANE ? i : j; // Plane
	var oi = type[i]!=PLANE ? i : j; // Other
	
	// Rel. position
	var r = new CANNON.Vec3(x[oi]-x[pi],
				y[oi]-y[pi],
				z[oi]-z[pi]);
	var normal = body[pi]._shape.normal;
	var q = r.dot(normal)-body[oi]._shape.boundingSphereRadius();
	if(q<0.0){
	  pairs1.push(i);
	  pairs2.push(j);
	}
      }
    }
  }
  return [pairs1,pairs2];
};
/**
 * Produce a 3x3 matrix. Columns first!
 * @class Mat3
 * @param elements
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Mat3 = function(elements){
  if(elements)
    this.elements = new Float32Array(elements);
  else
    this.elements = new Float32Array(9);
};

/**
 * Sets the matrix to identity
 * @todo Should perhaps be renamed to setIdentity() to be more clear.
 * @todo Create another function that immediately creates an identity matrix eg. eye()
 */
CANNON.Mat3.prototype.identity = function(){
  this.elements[0] = 1;
  this.elements[1] = 0;
  this.elements[2] = 0;

  this.elements[3] = 0;
  this.elements[4] = 1;
  this.elements[5] = 0;

  this.elements[6] = 0;
  this.elements[7] = 0;
  this.elements[8] = 1;
};

/**
 * Matrix-Vector multiplication
 * @param Vec3 v The vector to multiply with
 * @param Vec3 target Optional, target to save the result in.
 */
CANNON.Mat3.prototype.vmult = function(v,target){
  if(target===undefined)
    target = new CANNON.Vec3();

  var vec = [v.x, v.y, v.z];
  var targetvec = [0, 0, 0];
  for(var i=0; i<3; i++)
    for(var j=0; j<3; j++)
      targetvec[i] += this.elements[i+3*j]*vec[i];

  target.x = targetvec[0];
  target.y = targetvec[1];
  target.z = targetvec[2];
  return target;
};

/**
 * Matrix-scalar multiplication
 * @param float s
 */
CANNON.Mat3.prototype.smult = function(s){
  for(var i=0; i<this.elements.length; i++)
    this.elements[i] *= s;
};

/**
 * Matrix multiplication
 * @param Mat3 m
 * @return Mat3
 */
CANNON.Mat3.prototype.mmult = function(m){
  var r = new CANNON.Mat3();
  for(var i=0; i<3; i++)
    for(var j=0; j<3; j++){
      var sum = 0.0;
      for(var k=0; k<3; k++)
	sum += this.elements[i+k] * m.elements[k+j*3];
      r.elements[i+j*3] = sum; 
    }
  return r;
};

/**
 * Solve Ax=b
 * @param Vec3 b The right hand side
 * @return Vec3 The solution x
 */
CANNON.Mat3.prototype.solve = function(b,target){

  target = target || new CANNON.Vec3();

  // Construct equations
  var nr = 3; // num rows
  var nc = 4; // num cols
  var eqns = new Float32Array(nr*nc);
  for(var i=0; i<3; i++)
    for(var j=0; j<3; j++)
      eqns[i+nc*j] = this.elements[i+3*j];
  eqns[3+4*0] = b.x;
  eqns[3+4*1] = b.y;
  eqns[3+4*2] = b.z;
  
  // Compute right upper triangular version of the matrix - Gauss elimination
  var n = 3;
  var k = n;
  var i;
  var np;
  var kp = 4; // num rows
  var p;
  var els;
  do {
    i = k - n;
    if (eqns[i+nc*i] == 0) {
      for (j = i + 1; j < k; j++) {
	if (eqns[i+nc*j] != 0) {
	  els = [];
	  np = kp;
	  do {
	    p = kp - np;
	    els.push(eqns[p+nc*i] + eqns[p+nc*j]);
	  } while (--np);
	  eqns[i+nc*0] = els[0];
	  eqns[i+nc*1] = els[1];
	  eqns[i+nc*2] = els[2];
	  break;
	}
      }
    }
    if (eqns[i+nc*i] != 0) {
      for (j = i + 1; j < k; j++) {
	var multiplier = eqns[i+nc*j] / eqns[i+nc*i];
	els = [];
	np = kp;
	do {
	  p = kp - np;
	  els.push(p <= i ? 0 : eqns[p+nc*j] - eqns[p+nc*i] * multiplier);
	} while (--np);
	eqns[j+nc*0] = els[0];
	eqns[j+nc*1] = els[1];
	eqns[j+nc*2] = els[2];
      }
    }
  } while (--n);
  // Get the solution
  target.z = eqns[2*nc+3] / eqns[2*nc+2];
  target.y = (eqns[1*nc+3] - eqns[1*nc+2]*target.z) / eqns[1*nc+1];
  target.x = (eqns[0*nc+3] - eqns[0*nc+2]*target.z - eqns[0*nc+1]*target.y) / eqns[0*nc+0];

  if(isNaN(target.x) || isNaN(target.y) || isNaN(target.z) ||
     target.x==Infinity || target.y==Infinity || target.z==Infinity)
    throw "Could not solve equation! Got x=["+target.toString()+"], b=["+b.toString()+"], A=["+this.toString()+"]";

  return target;
};

/**
 * Get an element in the matrix by index. Index starts at 0, not 1!!!
 * @param int i
 * @param int j
 * @param float value Optional. If provided, the matrix element will be set to this value.
 */
CANNON.Mat3.prototype.e = function(i,j,value){
  if(value==undefined)
    return this.elements[i+3*j];
  else {
    // Set value
    this.elements[i+3*j] = value;
  }
};

/**
 * Copy the matrix
 * @param Mat3 target Optional. Target to save the copy in.
 * @return Mat3
 */
CANNON.Mat3.prototype.copy = function(target){
  target = target || new Mat3();
  for(var i=0; i<this.elements.length; i++)
    target.elements[i] = this.elements[i];
  return target;
};

CANNON.Mat3.prototype.toString = function(){
  var r = "";
  var sep = ",";
  for(var i=0; i<9; i++)
    r += this.elements[i] + sep;
  return r;
};/**
 * 3-dimensional vector
 * @class Vec3
 * @param float x
 * @param float y
 * @param float z
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Vec3 = function(x,y,z){
  this.x = x||0.0;
  this.y = y||0.0;
  this.z = z||0.0;
};

/**
 * Vector cross product
 * @param Vec3 v
 * @param Vec3 target Optional. Target to save in.
 * @return Vec3
 */
CANNON.Vec3.prototype.cross = function(v,target){
  if(target==undefined)
    target = new CANNON.Vec3();
  var A = [this.x, this.y, this.z];
  var B = [v.x, v.y, v.z];
  
  target.x = (A[1] * B[2]) - (A[2] * B[1]);
  target.y = (A[2] * B[0]) - (A[0] * B[2]);
  target.z = (A[0] * B[1]) - (A[1] * B[0]);

  return target;
};

/**
 * Set the vectors' 3 elements
 * @param float x
 * @param float y
 * @param float z
 */
CANNON.Vec3.prototype.set = function(x,y,z){
  this.x = x;
  this.y = y;
  this.z = z;
};
    
/**
 * Vector addition
 * @param Vec3 v
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.Vec3.prototype.vadd = function(v,target){
  if(target){
    target.x += v.x;
    target.y += v.y;
    target.z += v.z;
  } else {
    return new CANNON.Vec3(this.x+v.x,
			    this.y+v.y,
			    this.z+v.z);
  }  
};
    
/**
 * Vector subtraction
 * @param v
 * @param target Optional. Target to save in.
 * @return Vec3
 */
CANNON.Vec3.prototype.vsub = function(v,target){
  if(target){
    target.x -= v.x;
    target.y -= v.y;
    target.z -= v.z;
  } else {
    return new CANNON.Vec3(this.x-v.x,
			   this.y-v.y,
			   this.z-v.z);
  }
};

/**
 * Get the cross product matrix a_cross from a vector, such that
 *   a x b = a_cross * b = c
 * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
 * @return Mat3
 */
CANNON.Vec3.prototype.crossmat = function(){
  return new CANNON.Mat3([      0,  -this.z,   this.y,
			    this.z,        0,  -this.x,
			   -this.y,   this.x,        0]);
};

/**
 * Normalize the vector. Note that this changes the values in the vector.
 * @return float Returns the norm of the vector
 */
CANNON.Vec3.prototype.normalize = function(){
  var n = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  if(n>0.0){
    this.x /= n;
    this.y /= n;
    this.z /= n;
  } else {
    // Make something up
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
  return n;
};

/**
 * Get the 2-norm (length) of the vector
 * @return float
 */
CANNON.Vec3.prototype.norm = function(){
  return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
};

/**
 * Multiply the vector with a scalar
 * @param float scalar
 * @param Vec3 saveinme
 * @return Vec3
 */
CANNON.Vec3.prototype.mult = function(scalar,saveinme){
  if(!saveinme)
    saveinme = new CANNON.Vec3();
  saveinme.x = scalar*this.x;
  saveinme.y = scalar*this.y;
  saveinme.z = scalar*this.z;
  return saveinme;
};

/**
 * Calculate dot product
 * @param Vec3 v
 * @return float
 */
CANNON.Vec3.prototype.dot = function(v){
  return (this.x * v.x + this.y * v.y + this.z * v.z);
};

/**
 * Make the vector point in the opposite direction.
 * @param Vec3 target Optional target to save in
 * @return Vec3
 */
CANNON.Vec3.prototype.negate = function(target){
  target = target || new CANNON.Vec3();
  target.x = -this.x;
  target.y = -this.y;
  target.z = -this.z;
  return target;
};

/**
 * Compute two artificial tangents to the vector
 * @param Vec3 t1 Vector object to save the first tangent in
 * @param Vec3 t2 Vector object to save the second tangent in
 */
CANNON.Vec3.prototype.tangents = function(t1,t2){
  var norm = this.norm();
  var n = new CANNON.Vec3(this.x/norm,
			   this.y/norm,
			   this.z/norm);
  if(n.x<0.9)
    n.cross(new CANNON.Vec3(1,0,0),t1);
  else
    n.cross(new CANNON.Vec3(0,1,0),t1);
  n.cross(t1,t2);
};

/**
 * Converts to a more readable format
 * @return string
 */
CANNON.Vec3.prototype.toString = function(){
  return this.x+","+this.y+","+this.z;
};

CANNON.Vec3.prototype.copy = function(target){
  target = target || new CANNON.Vec3();
  target.x = this.x;
  target.y = this.y;
  target.z = this.z;
  return target;
};
/**
 * 4-dimensional quaternion
 * @class Quaternion
 * @param float x
 * @param float y
 * @param float z 
 * @param float w
 */
CANNON.Quaternion = function(x,y,z,w){
  this.x = x!=undefined ? x : 1;
  this.y = y!=undefined ? y : 0;
  this.z = z!=undefined ? z : 0;
  this.w = w!=undefined ? w : 0;
};

/**
 * Convert to a readable format
 */
CANNON.Quaternion.prototype.toString = function(){
  return this.x+","+this.y+","+this.z+","+this.w;
};

/**
 * Quaternion multiplication
 * @param Quaternion q
 * @param Quaternion target Optional.
 * @return Quaternion
 */ 
CANNON.Quaternion.prototype.mult = function(q,target){
  if(target==undefined)
    target = new CANNON.Quaternion();
  
  var va = new CANNON.Vec3(this.x,this.y,this.z);
  var vb = new CANNON.Vec3(q.x,q.y,q.z);
  target.w = this.w*q.w - va.dot(vb);
  vaxvb = va.cross(vb);
  target.x = this.w * vb.x + q.w*va.x + vaxvb.x;
  target.y = this.w * vb.y + q.w*va.y + vaxvb.y;
  target.z = this.w * vb.z + q.w*va.z + vaxvb.z;
  return target;
};

/**
 * Normalize the quaternion. Note that this changes the values of the quaternion.
 */
CANNON.Quaternion.prototype.normalize = function(){
  var l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);
  if ( l === 0 ) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;
  } else {
    l = 1 / l;
    this.x *= l;
    this.y *= l;
    this.z *= l;
    this.w *= l;
  }
};

/**
 * Multiply the quaternion by a vector
 * @param Vec3 v
 * @param Vec3 target Optional
 * @return Vec3
 */
CANNON.Quaternion.prototype.vmult = function(v,target){
  target = target || new CANNON.Vec3();
  var x = v.x,
      y = v.y,
      z = v.z;

  var qx = this.x,
      qy = this.y,
      qz = this.z,
      qw = this.w;

  // q*v
  var ix =  qw * x + qy * z - qz * y,
      iy =  qw * y + qz * x - qx * z,
      iz =  qw * z + qx * y - qy * x,
      iw = -qx * x - qy * y - qz * z;
  
  target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

  // Version 2...
  /*
  target.x = (qw*qw+qx*qx-qy*qy-qz*qz)*x + (2*qx*qy-2*qw*qz)*y + (2*qx*qz+2*qw*qy)*z;
  target.y = (2*qx*qy+2*qw*qz) * x + (qw*qw-qx*qx+qy*qy-qz*qz) * y + (2*qy*qz+2*qw*qx) * z;
  target.z = (2*qx*qz-2*qw*qy) * x + (2*qy*qz-2*qw*qx) * y + (qw*qw-qx*qx-qy*qy+qz*qz) * z;
  */
  return target;
};/**
 * @class Shape
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Shape = function(){

  /**
   * The type of this shape. Must be set to an int > 0 by subclasses.
   * @see Cannon.Shape.types
   */
  this.type = 0;
};

CANNON.Shape.prototype.constructor = CANNON.Shape;

/**
 * Get the bounding sphere radius from this shape
 * @return float
 */
CANNON.Shape.prototype.boundingSphereRadius = function(){
  throw "boundingSphereRadius() not implemented for shape type "+this.type;
};

/**
 * Get the volume of this shape
 * @return float
 */
CANNON.Shape.prototype.volume = function(){
  throw "volume() not implemented for shape type "+this.type;
};

/**
 * Calculates the inertia in the local frame for this shape.
 * @return Vec3
 * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
 */
CANNON.Shape.prototype.calculateLocalInertia = function(mass,target){
  throw "calculateLocalInertia() not implemented for shape type "+this.type;
};

/**
 * Calculates inertia in a specified frame for this shape.
 * @return Vec3
 */
CANNON.Shape.prototype.calculateTransformedInertia = function(mass,quat,target){
  if(target==undefined)
    target = new CANNON.Vec3();

  // Compute inertia in the world frame
  quat.normalize();
  var localInertia = this.calculateLocalInertia(mass);

  // @todo Is this rotation OK? Check!
  var worldInertia = quat.vmult(localInertia);
  target.x = Math.abs(worldInertia.x);
  target.y = Math.abs(worldInertia.y);
  target.z = Math.abs(worldInertia.z);
  return target;
  //throw "calculateInertia() not implemented for shape type "+this.type;
};

CANNON.Shape.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4,
  COMPOUND:8
};

/**
 * Rigid body base class
 * @class RigidBody
 * @param mass
 * @param shape
 * @todo Motion state? Like dynamic, kinematic, static...
 * @todo Viscous damping property
 */
CANNON.RigidBody = function(mass,shape,material){
  // Local variables
  this._position = new CANNON.Vec3();
  this._velocity = new CANNON.Vec3();
  this._force = new CANNON.Vec3();
  this._tau = new CANNON.Vec3();
  this._quaternion = new CANNON.Quaternion(1,0,0,0);
  this._rotvelo = new CANNON.Vec3();
  this._mass = mass;
  this._shape = shape;
  this._inertia = shape.calculateLocalInertia(mass);
  this._material = material;
  this._linearDamping = 0.01;
  this._angularDamping = 0.01;

  /// Reference to the world the body is living in
  this._world = null;

  /// Equals -1 before added to the world. After adding, it is the world body index
  this._id = -1;
};

/**
 * Get or set linear damping on the body, a number between 0 and 1. If it is zero, no damping is done. If one, the body will not move.
 * @param float d Optional. If not provided, current damping is returned.
 * @return float
 */
CANNON.RigidBody.prototype.linearDamping = function(d){
  if(d==undefined)
    return this._linearDamping;
  else {
    d = Number(d);
    if(!isNaN(d) && d>=0.0 && d<=1.0)
      this._linearDamping = d;
    else
      throw "Damping must be a number between 0 and 1";
  }
};

/**
 * Get or set angular damping on the body, a number between 0 and 1. If it is zero, no damping is done. If one, the body will not move.
 * @param float d Optional. If not provided, current damping is returned.
 * @return float
 */
CANNON.RigidBody.prototype.angularDamping = function(d){
  if(d==undefined)
    return this._angularDamping;
  else {
    d = Number(d);
    if(!isNaN(d) && d>=0.0 && d<=1.0)
      this._angularDamping = d;
    else
      throw "Damping must be a number between 0 and 1";
  }
};

/**
 * Get/set mass. Note: When changing mass, you should change the inertia too.
 * @param float m
 * @return float
 */
CANNON.RigidBody.prototype.mass = function(m){
  if(m==undefined){
    // Get
    if(this._id!=-1)
      return this._world.mass[this._id];
    else
      return this._mass;
  } else {
    // Set
    if(this._id!=-1){
      this._world.mass[this._id] = m;
      this._world.invm[this._id] = 1.0/m;
    } else
      this._mass = m;
  }
};

/**
 * Get/set shape.
 * @param Shape s
 * @return Shape
 */
CANNON.RigidBody.prototype.shape = function(s){
  if(s==undefined){
    // Get
    return this._shape;
  } else {
    // Set
    this._shape = s;
    if(this._id!=-1){
      // @todo More things to update here when changing shape?
      this._world.type[this._id] = shape.type;
    }
  }
};

/**
 * Sets the center of mass position of the object
 * @param float x
 * @param float y
 * @param float z
 */
CANNON.RigidBody.prototype.setPosition = function(x,y,z){
  if(this._id!=-1){
    this._world.x[this._id] = x;
    this._world.y[this._id] = y;
    this._world.z[this._id] = z;
    this._world.clearCollisionState(this);
  } else {
    this._position.x = x;
    this._position.y = y;
    this._position.z = z;
  }
};

/**
 * Gets the center of mass position of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getPosition = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.x[this._id];
    target.y = this._world.y[this._id];
    target.z = this._world.z[this._id];
  } else {
    target.x = this._position.x;
    target.y = this._position.y;
    target.z = this._position.z;
  }
  return target;
};

/**
 * Sets the orientation of the object
 * @param float x
 * @param float y
 * @param float z
 * @param float w
 */
CANNON.RigidBody.prototype.setOrientation = function(x,y,z,w){
  var q = new CANNON.Quaternion(x,y,z,w);
  q.normalize();
  if(this._id!=-1){
    this._world.qx[this._id] = q.x;
    this._world.qy[this._id] = q.y;
    this._world.qz[this._id] = q.z;
    this._world.qw[this._id] = q.w;
  } else {
    this._quaternion.x = q.x;
    this._quaternion.y = q.y;
    this._quaternion.z = q.z;
    this._quaternion.w = q.w;
  }
};

/**
 * Gets the orientation of the object
 * @param Quaternion target Optional.
 * @return Quaternion
 */
CANNON.RigidBody.prototype.getOrientation = function(target){
  target = target || new CANNON.Quaternion();
  if(this._id!=-1){
    target.x = this._world.qx[this._id];
    target.y = this._world.qy[this._id];
    target.z = this._world.qz[this._id];
    target.w = this._world.qw[this._id];
  } else {
    target.x = this._quaternion.x;
    target.y = this._quaternion.y;
    target.z = this._quaternion.z;
    target.w = this._quaternion.w;
  }
  target.normalize();
  return target;
};

/**
 * Sets the velocity of the object
 */
CANNON.RigidBody.prototype.setVelocity = function(x,y,z){
  if(this._id!=-1){
    this._world.vx[this._id] = x;
    this._world.vy[this._id] = y;
    this._world.vz[this._id] = z;
  } else {
    this._velocity.x = x;
    this._velocity.y = y;
    this._velocity.z = z;
  }
};

/**
 * Gets the velocity of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getVelocity = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.x[this._id];
    target.y = this._world.y[this._id];
    target.z = this._world.z[this._id];
  } else {
    target.x = this._velocity.x;
    target.y = this._velocity.y;
    target.z = this._velocity.z;
  }
  return target;
};

/**
 * Sets the angularvelocity of the object
 */
CANNON.RigidBody.prototype.setAngularVelocity = function(x,y,z){
  if(this._id!=-1){
    this._world.wx[this._id] = x;
    this._world.wy[this._id] = y;
    this._world.wz[this._id] = z;
  } else {
    this._rotvelo.x = x;
    this._rotvelo.y = y;
    this._rotvelo.z = z;
  }
};

/**
 * Gets the angularvelocity of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getAngularvelocity = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.wx[this._id];
    target.y = this._world.wy[this._id];
    target.z = this._world.wz[this._id];
  } else {
    target.x = this._rotvelo.x;
    target.y = this._rotvelo.y;
    target.z = this._rotvelo.z;
  }
  return target;
};

/**
 * Sets the force on the object
 * @param float x
 * @param float y
 * @param float z
 */
CANNON.RigidBody.prototype.setForce = function(x,y,z){
  if(this._id!=-1){
    this._world.fx[this._id] = x;
    this._world.fy[this._id] = y;
    this._world.fz[this._id] = z;
  } else {
    this._force.x = x;
    this._force.y = y;
    this._force.z = z;
  }
};

/**
 * Gets the force of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getForce = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.fx[this._id];
    target.y = this._world.fy[this._id];
    target.z = this._world.fz[this._id];
  } else {
    target.x = this._force.x;
    target.y = this._force.y;
    target.z = this._force.z;
  }
  return target;
};

/**
 * Sets the torque on the object
 * @param float x
 * @param float y
 * @param float z
 */
CANNON.RigidBody.prototype.setTorque = function(x,y,z){
  if(this._id!=-1){
    this._world.taux[this._id] = x;
    this._world.tauy[this._id] = y;
    this._world.tauz[this._id] = z;
  } else {
    this._tau.x = x;
    this._tau.y = y;
    this._tau.z = z;
  }
};

/**
 * Gets the torque of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getTorque = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.taux[this._id];
    target.y = this._world.tauy[this._id];
    target.z = this._world.tauz[this._id];
  } else {
    target.x = this._torque.x;
    target.y = this._torque.y;
    target.z = this._torque.z;
  }
  return target;
};/**
 * Spherical rigid body
 * @class Sphere
 * @param float radius
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Sphere = function(radius){
  CANNON.Shape.call(this);
  this.radius = radius!=undefined ? Number(radius) : 1.0;
  this.type = CANNON.Shape.types.SPHERE;
};

CANNON.Sphere.prototype = new CANNON.Shape();
CANNON.Sphere.prototype.constructor = CANNON.Sphere;

CANNON.Sphere.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();
  var I = 2.0*mass*this.radius*this.radius/5.0;
  target.x = I;
  target.y = I;
  target.z = I;
  return target;
};

CANNON.Sphere.prototype.volume = function(){
  return 4.0 * Math.PI * this.radius / 3.0;
};

CANNON.Sphere.prototype.boundingSphereRadius = function(){
  return this.radius;
};/**
 * Box
 * @param Vec3 halfExtents
 * @author schteppe
 */
CANNON.Box = function(halfExtents){
  CANNON.Shape.call(this);
  this.halfExtents = halfExtents;
  this.type = CANNON.Shape.types.BOX;
};

CANNON.Box.prototype = new CANNON.Shape();
CANNON.Box.prototype.constructor = CANNON.Box;

CANNON.Box.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();
  target.x = 1.0 / 12.0 * mass * (   this.halfExtents.y*this.halfExtents.y
				   + this.halfExtents.z*this.halfExtents.z );
  target.y = 1.0 / 12.0 * mass * (   this.halfExtents.x*this.halfExtents.x
				   + this.halfExtents.z*this.halfExtents.z );
  target.z = 1.0 / 12.0 * mass * (   this.halfExtents.y*this.halfExtents.y
				   + this.halfExtents.x*this.halfExtents.x );
  return target;
};

/**
 * Get the box corners
 * @param Quaternion quat Orientation to apply to the corner vectors. If not provided,
 * the vectors will be in respect to the local frame.
 * @return array
 */
CANNON.Box.prototype.getCorners = function(quat){
  var corners = [];
  var ex = this.halfExtents;
  corners.push(new CANNON.Vec3(  ex.x,  ex.y,  ex.z));
  corners.push(new CANNON.Vec3( -ex.x,  ex.y,  ex.z));
  corners.push(new CANNON.Vec3( -ex.x, -ex.y,  ex.z));
  corners.push(new CANNON.Vec3( -ex.x, -ex.y, -ex.z));
  corners.push(new CANNON.Vec3(  ex.x, -ex.y, -ex.z));
  corners.push(new CANNON.Vec3(  ex.x,  ex.y, -ex.z));
  corners.push(new CANNON.Vec3( -ex.x,  ex.y, -ex.z));
  corners.push(new CANNON.Vec3(  ex.x, -ex.y,  ex.z));

  for(var i=0; quat!=undefined && i<corners.length; i++)
    quat.vmult(corners[i],corners[i]);

  return corners;
};

/**
 * Get the box 6 side normals
 * @param bool includeNegative If true, this function returns 6 vectors. If false, it only returns 3 (but you get 6 by reversing those 3)
 * @param Quaternion quat Orientation to apply to the normal vectors. If not provided,
 * the vectors will be in respect to the local frame.
 * @return array
 */
CANNON.Box.prototype.getSideNormals = function(includeNegative,quat){
  var sides = [];
  var ex = this.halfExtents;
  sides.push(new CANNON.Vec3(  ex.x,     0,     0));
  sides.push(new CANNON.Vec3(     0,  ex.y,     0));
  sides.push(new CANNON.Vec3(     0,     0,  ex.z));
  if(includeNegative!=undefined && includeNegative){
    sides.push(new CANNON.Vec3( -ex.x,     0,     0));
    sides.push(new CANNON.Vec3(     0, -ex.y,     0));
    sides.push(new CANNON.Vec3(     0,     0, -ex.z));
  }

  for(var i=0; quat!=undefined && i<sides.length; i++)
    quat.vmult(sides[i],sides[i]);

  return sides;
};

CANNON.Box.prototype.volume = function(){
  return 2.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
};

CANNON.Box.prototype.boundingSphereRadius = function(){
  return this.halfExtents.norm();
};/**
 * @class Plane
 * @param Vec3 normal
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Plane = function(normal){
  CANNON.Shape.call(this);
  normal.normalize();
  this.normal = normal;
  this.type = CANNON.Shape.types.PLANE;
};

CANNON.Plane.prototype = new CANNON.Shape();
CANNON.Plane.prototype.constructor = CANNON.Plane;

CANNON.Plane.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();
  return target;
};

CANNON.Plane.prototype.volume = function(){
  return Infinity; // The plane is infinite...
};/**
 * Compound shape
 * @author schteppe - https://github.com/schteppe
 */
CANNON.Compound = function(){
  CANNON.Shape.call(this);
  this.type = CANNON.Shape.types.COMPOUND;
  this.childShapes = [];
  this.childOffsets = [];
  this.childOrientations = [];
};

CANNON.Compound.prototype = new CANNON.Shape();
CANNON.Compound.prototype.constructor = CANNON.Compound;

/**
 * Add a subshape
 * @param Shape shape
 * @param Vec3 offset
 * @param Quaternion orientation
 */
CANNON.Compound.prototype.addChild = function(shape,offset,orientation){
  offset = offset || new CANNON.Vec3(0,0,0);
  orientation = orientation || new CANNON.Quaternion(1,0,0,0);
  this.childShapes.push(shape);
  this.childOffsets.push(offset);
  this.childOrientations.push(orientation);
};

CANNON.Compound.prototype.volume = function(){
  var r = 0.0;
  for(var i = 0; i<this.childShapes.length; i++)
    r += this.childShapes[i].volume();
  return r;
};

/**
 * Calculate the inertia in the local frame.
 * @return Vec3
 */
CANNON.Compound.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();

  // Calculate the total volume, we will spread out this objects' mass on the sub shapes
  var V = this.volume();

  for(var i = 0; i<this.childShapes.length; i++){
    // Get child information
    var b = this.childShapes[i];
    var o = this.childOffsets[i];
    var q = this.childOrientations[i];
    var m = b.volume() / V * mass;

    // Get the child inertia, transformed relative to local frame
    var inertia = b.calculateTransformedInertia(m,q);

    // Add its inertia using the parallel axis theorem, i.e.
    // I += I_child;    
    // I += m_child * r^2

    target.vadd(inertia,target);
    var mr2 = new CANNON.Vec3(m*o.x*o.x,
			      m*o.y*o.y,
			      m*o.z*o.z);
    target.vadd(mr2,target);
  }
  return target;
};

CANNON.Compound.prototype.boundingSphereRadius = function(){
  var r = 0.0;
  for(var i = 0; i<this.childShapes.length; i++){
    var candidate = this.childOffsets[i].norm() + this.childShapes[i].boundingSphereRadius();
    if(r < candidate)
      r = candidate;
  }
  return r;
};/**
 * Constraint solver.
 * @todo The spook parameters should be specified for each constraint, not globally.
 * @author schteppe / https://github.com/schteppe
 */
CANNON.Solver = function(a,b,eps,k,d,iter,h){
  this.iter = iter || 10;
  this.h = h || 1.0/60.0;
  this.a = a;
  this.b = b;
  this.eps = eps;
  this.k = k;
  this.d = d;
  this.reset(0);
  this.debug = false;

  if(this.debug)
    console.log("a:",a,"b",b,"eps",eps,"k",k,"d",d);
};

/**
 * Resets the solver, removes all constraints and prepares for a new round of solving
 * @param int numbodies The number of bodies in the new system
 * @todo vlambda does not need to be instantiated again if the number of bodies is the same. Set to zero instead.
 */
CANNON.Solver.prototype.reset = function(numbodies){
  this.G = [];
  this.MinvTrace = [];
  this.Fext = [];
  this.q = [];
  this.qdot = [];
  this.n = 0;
  this.upper = [];
  this.lower = [];
  this.hasupper = [];
  this.haslower = [];
  this.i = []; // To keep track of body id's
  this.j = [];

  // Create new arrays or reuse the ones that exists?
  if(numbodies && (this.vxlambda==undefined || this.vxlambda.length!=numbodies)){
    this.vxlambda = new Float32Array(numbodies);
    this.vylambda = new Float32Array(numbodies);
    this.vzlambda = new Float32Array(numbodies);
    this.wxlambda = new Float32Array(numbodies);
    this.wylambda = new Float32Array(numbodies);
    this.wzlambda = new Float32Array(numbodies);
  } else if(this.vxlambda!=undefined && this.vxlambda.length==numbodies){
    for(var i=0; i<this.vxlambda.length; i++){
      this.vxlambda[i] = 0.0;
      this.vylambda[i] = 0.0;
      this.vzlambda[i] = 0.0;
      this.wxlambda[i] = 0.0;
      this.wylambda[i] = 0.0;
      this.wzlambda[i] = 0.0;
    }
  }
};

/**
 * Add a constraint to the solver
 * @param array G Jacobian vector, 12 elements (6 dof per body)
 * @param array MinvTrace The trace of the Inverse mass matrix (12 elements). The mass matrix is 12x12 elements from the beginning and 6x6 matrix per body (mass matrix and inertia matrix).
 * @param array q The constraint violation vector in generalized coordinates (12 elements)
 * @param array qdot The time-derivative of the constraint violation vector q.
 * @param array Fext External forces (12 elements)
 * @param float lower Lower constraint force bound
 * @param float upper Upper constraint force bound
 * @param int body_i The first rigid body index
 * @param int body_j The second rigid body index - set to -1 if none
 * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
 */
CANNON.Solver.prototype.addConstraint = function(G,MinvTrace,q,qdot,Fext,lower,upper,body_i,body_j){
  if(this.debug){
    console.log("Adding constraint ",this.n);
    console.log("G:",G);
    console.log("q:",q);
    console.log("qdot:",qdot);
    console.log("Fext:",Fext);
  }
  
  for(var i=0; i<12; i++){
    this.q.push(q[i]);
    this.qdot.push(qdot[i]);
    this.MinvTrace.push(MinvTrace[i]);
    this.G.push(G[i]);
    this.Fext.push(Fext[i]);

    this.upper.push(upper);
    this.hasupper.push(!isNaN(upper));
    this.lower.push(lower);
    this.haslower.push(!isNaN(lower));
  }

  this.i.push(body_i);
  this.j.push(body_j);

  this.n += 1;

  // Return result index
  return this.n - 1; 
};

/**
 * Add a non-penetration constraint to the solver
 * @param Vec3 ni
 * @param Vec3 ri
 * @param Vec3 rj
 * @param Vec3 iMi
 * @param Vec3 iMj
 * @param Vec3 iIi
 * @param Vec3 iIj
 * @param Vec3 v1
 * @param Vec3 v2
 * @param Vec3 w1
 * @param Vec3 w2
 */
CANNON.Solver.prototype.addNonPenetrationConstraint
  = function(i,j,xi,xj,ni,ri,rj,iMi,iMj,iIi,iIj,vi,vj,wi,wj,fi,fj,taui,tauj){
  
  var rxn = ri.cross(ni);
  var u = vj.vsub(vi); // vj.vadd(rj.cross(wj)).vsub(vi.vadd(ri.cross(wi)));

  // g = ( xj + rj - xi - ri ) .dot ( ni )
  var qvec = xj.vadd(rj).vsub(xi.vadd(ri));
  var q = qvec.dot(ni);

  if(q<0.0){
    if(this.debug){
      console.log("i:",i,"j",j,"xi",xi.toString(),"xj",xj.toString());
      console.log("ni",ni.toString(),"ri",ri.toString(),"rj",rj.toString());
      console.log("iMi",iMi.toString(),"iMj",iMj.toString(),"iIi",iIi.toString(),"iIj",iIj.toString(),"vi",vi.toString(),"vj",vj.toString(),"wi",wi.toString(),"wj",wj.toString(),"fi",fi.toString(),"fj",fj.toString(),"taui",taui.toString(),"tauj",tauj.toString());
    }
    this.addConstraint( // Non-penetration constraint jacobian
			[ -ni.x,  -ni.y,  -ni.z,
			  -rxn.x, -rxn.y, -rxn.z,
			  ni.x,   ni.y,   ni.z,
			  rxn.x,  rxn.y,  rxn.z],
			
			// Inverse mass matrix & inertia
			[iMi.x, iMi.y, iMi.z,
			 iIi.z, iIi.y, iIi.z,
			 iMj.x, iMj.y, iMj.z,
			 iIj.z, iIj.y, iIj.z],
			
			// q - constraint violation
			[-qvec.x,-qvec.y,-qvec.z,
			 0,0,0,
			 qvec.x,qvec.y,qvec.z,
			 0,0,0],
			
			// qdot - motion along penetration normal
			[-u.x, -u.y, -u.z,
			 0,0,0,
			 u.x, u.y, u.z,
			 0,0,0],
			
			// External force - forces & torques
			[fi.x,fi.y,fi.z,
			 taui.x,taui.y,taui.z,
			 fj.x,fj.y,fj.z,
			 tauj.x,tauj.y,tauj.z],
			
			0,
			'inf',
			i,
			j);
  }
};

/**
 * Solves the system, and sets the vlambda and wlambda properties of the Solver object
 */
CANNON.Solver.prototype.solve = function(){
  this.i = new Int16Array(this.i);
  var n = this.n;
  var lambda = new Float32Array(n);
  var dlambda = new Float32Array(n);
  var ulambda = new Float32Array(12*n); // 6 dof per constraint, and 2 bodies
  var B = new Float32Array(n);
  var c = new Float32Array(n);
  var precomp = new Int16Array(n);
  var G = new Float32Array(this.G);
  for(var k = 0; k<this.iter; k++){
    for(var l=0; l<n; l++){

      // Bodies participating in constraint
      var body_i = this.i[l];
      var body_j = this.j[l];

      var l12 = 12*l;
      if(!precomp[l]){
	// Precompute constants c[l] and B[l] for contact l
	var G_Minv_Gt = 0.0;
	var Gq = 0.0;
	var GW = 0.0;
	var GMinvf = 0.0;
	for(var i=0; i<12; i++){
	  var addi = l12+i;
	  G_Minv_Gt += G[addi] * this.MinvTrace[addi] * G[addi];
	  Gq +=        G[addi] * this.q[addi];
	  GW +=        G[addi] * this.qdot[addi];
	  GMinvf +=    G[addi] * this.MinvTrace[addi] * this.Fext[addi];
	}
	c[l] = 1.0 / (G_Minv_Gt + this.eps); // 1.0 / ( G*Minv*Gt + eps)
	B[l] = ( - this.a * Gq
		 - this.b * GW
		 - this.h * GMinvf);
	precomp[l] = 1;

	if(this.debug){
	  console.log("G_Minv_Gt["+l+"]:",G_Minv_Gt);
	  console.log("Gq["+l+"]:",Gq);
	  console.log("GW["+l+"]:",GW);
	  console.log("GMinvf["+l+"]:",GMinvf);
	}
      }

      var Gulambda = 0.0;
      /*
      for(var i=0; i<12; i++)
	Gulambda +=  this.G[i + l12] * ulambda[i + l12];
      */
      Gulambda += G[0+l12] * this.vxlambda[body_i]; // previuously calculated lambdas
      Gulambda += G[1+l12] * this.vylambda[body_i];
      Gulambda += G[2+l12] * this.vzlambda[body_i];
      Gulambda += G[3+l12] * this.wxlambda[body_i];
      Gulambda += G[4+l12] * this.wylambda[body_i];
      Gulambda += G[5+l12] * this.wzlambda[body_i];

      Gulambda += G[6+l12] * this.vxlambda[body_j];
      Gulambda += G[7+l12] * this.vylambda[body_j];
      Gulambda += G[8+l12] * this.vzlambda[body_j];
      Gulambda += G[9+l12] * this.wxlambda[body_j];
      Gulambda += G[10+l12] * this.wylambda[body_j];
      Gulambda += G[11+l12] * this.wzlambda[body_j];

      dlambda[l] = c[l] * ( B[l] - Gulambda - this.eps * lambda[l]);
      if(this.debug)
	console.log("dlambda["+l+"]=",dlambda[l]);
      lambda[l] = lambda[l] + dlambda[l];

      // Clamp lambda if out of bounds
      // @todo check if limits are numbers
      if(this.haslower[l] && lambda[l]<this.lower[l]){
	if(this.debug)
	  console.log("hit lower bound for constraint "+l+", truncating "+lambda[l]+" to "+this.lower[l]);
	lambda[l] = this.lower[l];
	dlambda[l] = this.lower[l]-lambda[l];
      }
      if(this.hasupper && lambda[l]>this.upper[l]){
	if(this.debug)
	  console.log("hit upper bound for constraint "+l+", truncating "+lambda[l]+" to "+this.upper[l]);
	lambda[l] = this.upper[l];
	dlambda[l] = this.upper[l]-lambda[l];
      }

      // Add velocity changes to keep track of them
      /*
      for(var i=0; i<12; i++)
	ulambda[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
      */
      this.vxlambda[body_i] += dlambda[l] * this.MinvTrace[l12+0] * G[l12+0];
      this.vylambda[body_i] += dlambda[l] * this.MinvTrace[l12+1] * G[l12+1];
      this.vzlambda[body_i] += dlambda[l] * this.MinvTrace[l12+2] * G[l12+2];
      this.wxlambda[body_i] += dlambda[l] * this.MinvTrace[l12+3] * G[l12+3];
      this.wylambda[body_i] += dlambda[l] * this.MinvTrace[l12+4] * G[l12+4];
      this.wzlambda[body_i] += dlambda[l] * this.MinvTrace[l12+5] * G[l12+5];

      this.vxlambda[body_j] += dlambda[l] * this.MinvTrace[l12+6] * G[l12+6];
      this.vylambda[body_j] += dlambda[l] * this.MinvTrace[l12+7] * G[l12+7];
      this.vzlambda[body_j] += dlambda[l] * this.MinvTrace[l12+8] * G[l12+8];
      this.wxlambda[body_j] += dlambda[l] * this.MinvTrace[l12+9] * G[l12+9];
      this.wylambda[body_j] += dlambda[l] * this.MinvTrace[l12+10] * G[l12+10];
      this.wzlambda[body_j] += dlambda[l] * this.MinvTrace[l12+11] * G[l12+11];

        /*
	ulambda_i[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
	ulambda_j[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
	*/
    }
  }

  if(this.debug)
    for(var l=0; l<n; l++)
      console.log("ulambda["+l+"]=",
		  ulambda[l*12+0],
		  ulambda[l*12+1],
		  ulambda[l*12+2],
		  ulambda[l*12+3],
		  ulambda[l*12+4],
		  ulambda[l*12+5],
		  ulambda[l*12+6],
		  ulambda[l*12+7],
		  ulambda[l*12+8],
		  ulambda[l*12+9],
		  ulambda[l*12+10],
		  ulambda[l*12+11]);
  this.result = ulambda;
};
/**
 * Defines a physics material.
 * @class Material
 */
CANNON.Material = function(name){
  this.name = name;
  this._id = -1;
};

/**
 * Defines what happens when two materials meet.
 * @class ContactMaterial
 * @param Material m1
 * @param Material m2
 * @param float static_friction
 * @param float kinetic_friction
 * @param float restitution
 * @todo Contact solving parameters here too?
 */
CANNON.ContactMaterial = function(m1, m2, static_friction, kinetic_friction, restitution){

  /// Contact material index in the world, -1 until added to the world
  this._id = -1;

  /// The two materials participating in the contact
  this.materials = [m1,m2];

  /// Static friction
  this.static_friction =  static_friction!=undefined ?  Number(static_friction) :  0.3;

  /// Kinetic friction
  this.kinetic_friction = kinetic_friction!=undefined ? Number(kinetic_friction) : 0.3;

  /// Restitution
  this.restitution =      restitution!=undefined ?      Number(restitution) :      0.3;
  
};

/**
 * The physics world
 * @class World
 */
CANNON.World = function(){

  /// @deprecated The application GUI should take care of pausing
  this.paused = false;

  /// The wall-clock time since simulation start
  this.time = 0.0;

  /// Number of timesteps taken since start
  this.stepnumber = 0;

  /// Spring constant
  this.spook_k = 3000.0;

  /// Stabilization parameter (number of timesteps until stabilization)
  this.spook_d = 3.0;

  var th = this;

  /// Contact solver parameters, @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
  this.spook_a = function(h){ return 4.0 / (h * (1 + 4 * th.spook_d)); };
  this.spook_b = (4.0 * this.spook_d) / (1 + 4 * this.spook_d);
  this.spook_eps = function(h){ return 4.0 / (h * h * th.spook_k * (1 + 4 * th.spook_d)); };

  /// The contact solver
  this.solver = new CANNON.Solver(this.spook_a(1.0/60.0),
				  this.spook_b,
				  this.spook_eps(1.0/60.0),
				  this.spook_k,
				  this.spook_d,
				  5,
				  1.0/60.0);

  this._materials = [];
  this._material_contactmaterial_refs = [];
  /// ContactMaterial objects
  this._contactmaterials = [];
  this._contact_material1 = [];
  this._contact_material2 = [];
  this._contact_friction_k = [];
  this._contact_friction_s = [];
  this._contact_restitution = [];
};

/**
 * Toggle pause mode. When pause is enabled, step() won't do anything.
 * @todo Pausing is the simulation gui's responsibility, should remove this.
 */
CANNON.World.prototype.togglepause = function(){
  this.paused = !this.paused;
};

/**
 * Get the contact material between bodies bi and bj
 */
CANNON.World.prototype._getContactMaterialId = function(bi,bj){
  if(this.material[bi]>=0 && this.material[bj]>=0){
    // Material found
    var i = this._materials[this.material[bi]]._id;
    var j = this._materials[this.material[bj]]._id;
    if(i<j){
      var temp = i;
      i = j;
      j = temp;
    }
    return this._material_contactmaterial_refs[i+j*this._materials.length];
  }
  return -1;
};

/**
 * Add an impulse to the colliding bodies i and j
 * @param int i Body number 1
 * @param int i Body number 2
 * @param Vec3 ri Vector from body 1's center of mass to the contact point on its surface
 * @param Vec3 ri Vector from body 1's center of mass to the contact point on its surface
 * @param Vec3 ui The relative velocity eg. vj+wj*rj - (vi+wj*rj)
 * @param Vec3 ni The contact normal pointing out from body i.
 * @param float e The coefficient of restitution
 * @param float mu The contact friction
 * @todo Use it in the code!
 */
CANNON.World.prototype._addImpulse = function(i,j,ri,rj,ui,ni,e,mu){

  var ri_star = ri.crossmat();
  var rj_star = rj.crossmat();
  
  // Inverse inertia matrices
  var ii = this.inertiax[i]>0 ? 1.0/this.inertiax[i] : 0.0;
  var Iinv_i = new CANNON.Mat3([ii,0,0,
				0,ii,0,
				0,0,ii]);
  ii = this.inertiax[j]>0 ? 1.0/this.inertiax[j] : 0.0;
  var Iinv_j = new CANNON.Mat3([ii,0,0,
				0,ii,0,
				0,0,ii]);

  // Collision matrix:
  // K = 1/mi + 1/mj - ri_star*I_inv_i*ri_star - rj_star*I_inv_j*rj_star;
  var im = this.invm[i] + this.invm[j];
  var K = new CANNON.Mat3([im,0,0,
			   0,im,0,
			   0,0,im]);
  var rIr_i = ri_star.mmult(Iinv_i.mmult(ri_star));
  var rIr_j = rj_star.mmult(Iinv_j.mmult(rj_star));

  /*
  // @todo add back when this works
  for(var el = 0; el<9; el++)
    K.elements[el] -= (rIr_i.elements[el] + rIr_j.elements[el]);
  */
	
  // First assume stick friction
  // Final velocity if stick:
  var v_f = ni.mult(-e * ui.dot(ni));

  var J =  K.solve(v_f.vsub(ui));

  // Check if slide mode (J_t > J_n) - outside friction cone
  var mu = 0.0; // quick fix
  if(mu>0){
    var J_n = ni.mult(J.dot(ni));
    var J_t = J.vsub(J_n);
    if(J_t.norm() > J_n.mult(mu).norm()){

      // Calculate impulse j = -(1+e)u_n / nK(n-mu*t)
      var v_tang = ui.vsub(ni.mult(ui.dot(ni)));
      var tangent = v_tang.mult(1.0/(v_tang.norm() + 0.0001));
      var impulse = -(1+e)*(ui.dot(ni))/(ni.dot(K.vmult((ni.vsub(tangent.mult(mu))))));
      J = ni.mult(impulse).vsub(tangent.mult(mu * impulse));
    }
  }

  // Add to velocities
  var imi = this.invm[i];
  var imj = this.invm[j];

  // du = uprim - u
  //   => uprim = du + u
  // vi = vi + J/mi
  // vj = vj - J/mj

  // Convert back to non-relative velocities:
  // u_rel = vj - vi
  // vi = vj - u_rel
  // vj = vi + u_rel

  this.vx[i] +=  J.x * imi - (this.vx[j] - ui.x);
  this.vy[i] +=  J.y * imi - (this.vy[j] - ui.y);
  this.vz[i] +=  J.z * imi - (this.vz[j] - ui.z);
  this.vx[j] -=  J.x * imj + (this.vx[i] + ui.x);
  this.vy[j] -=  J.y * imj + (this.vy[i] + ui.y);
  this.vz[j] -=  J.z * imj + (this.vz[i] + ui.z);

  var cr = ri.cross(J);
  var wadd = cr.mult(1.0/this.inertiax[i]);

  /*
  // Add rotational impulses
  this.wx[i] += wadd.x;
  this.wy[i] += wadd.y;
  this.wz[i] += wadd.z;
  cr = rj.cross(J);
  wadd = cr.mult(1.0/this.inertiax[j]); // @todo fix to suit asymmetric inertia
  this.wx[j] -= wadd.x;
  this.wy[j] -= wadd.y;
  this.wz[j] -= wadd.z;
  */
};

/**
 * Get number of objects in the world.
 * @return int
 */
CANNON.World.prototype.numObjects = function(){
  return this.x ? this.x.length : 0;
};

/**
 * Clear the contact state for a body.
 * @param RigidBody body
 */
CANNON.World.prototype.clearCollisionState = function(body){
  var n = this.numObjects();
  var i = body._id;
  for(var idx=0; idx<n; idx++){
    var j = idx;
    if(i>j) this.collision_matrix[j+i*n] = 0;
    else    this.collision_matrix[i+j*n] = 0;
  }
};

/**
 * Add a rigid body to the simulation.
 * @param RigidBody body
 * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
 * @todo Adding an array of bodies should be possible. This would save some loops too
 */
CANNON.World.prototype.add = function(body){
  if(!body)
    return;

  var n = this.numObjects();

  old_x = this.x;
  old_y = this.y;
  old_z = this.z;
  
  old_vx = this.vx;
  old_vy = this.vy;
  old_vz = this.vz;
  
  old_fx = this.fx;
  old_fy = this.fy;
  old_fz = this.fz;
  
  old_taux = this.taux;
  old_tauy = this.tauy;
  old_tauz = this.tauz;
  
  old_wx = this.wx;
  old_wy = this.wy;
  old_wz = this.wz;
  
  old_qx = this.qx;
  old_qy = this.qy;
  old_qz = this.qz;
  old_qw = this.qw;

  old_type = this.type;
  old_body = this.body;
  old_fixed = this.fixed;
  old_invm = this.invm;
  old_mass = this.mass;
  old_material = this.material;

  old_inertiax = this.inertiax;
  old_inertiay = this.inertiay;
  old_inertiaz = this.inertiaz;

  old_iinertiax = this.iinertiax;
  old_iinertiay = this.iinertiay;
  old_iinertiaz = this.iinertiaz;

  this.x = new Float32Array(n+1);
  this.y = new Float32Array(n+1);
  this.z = new Float32Array(n+1);
  
  this.vx = new Float32Array(n+1);
  this.vy = new Float32Array(n+1);
  this.vz = new Float32Array(n+1);
  
  this.fx = new Float32Array(n+1);
  this.fy = new Float32Array(n+1);
  this.fz = new Float32Array(n+1);
  
  this.taux = new Float32Array(n+1);
  this.tauy = new Float32Array(n+1);
  this.tauz = new Float32Array(n+1);
  
  this.wx = new Float32Array(n+1);
  this.wy = new Float32Array(n+1);
  this.wz = new Float32Array(n+1);
  
  this.qx = new Float32Array(n+1);
  this.qy = new Float32Array(n+1);
  this.qz = new Float32Array(n+1);
  this.qw = new Float32Array(n+1);

  this.type = new Int16Array(n+1);
  this.body = [];
  this.fixed = new Int16Array(n+1);
  this.mass = new Float32Array(n+1);
  /// References to material for each body
  this.material = new Int16Array(n+1);
  this.inertiax = new Float32Array(n+1);
  this.inertiay = new Float32Array(n+1);
  this.inertiaz = new Float32Array(n+1);
  this.iinertiax = new Float32Array(n+1);
  this.iinertiay = new Float32Array(n+1);
  this.iinertiaz = new Float32Array(n+1);
  this.invm = new Float32Array(n+1);
  
  // Add old data to new array
  for(var i=0; i<n; i++){
    this.x[i] = old_x[i];
    this.y[i] = old_y[i];
    this.z[i] = old_z[i];
  
    this.vx[i] = old_vx[i];
    this.vy[i] = old_vy[i];
    this.vz[i] = old_vz[i];
  
    this.fx[i] = old_fx[i];
    this.fy[i] = old_fy[i];
    this.fz[i] = old_fz[i];
  
    this.taux[i] = old_taux[i];
    this.tauy[i] = old_tauy[i];
    this.tauz[i] = old_tauz[i];
  
    this.wx[i] = old_wx[i];
    this.wy[i] = old_wy[i];
    this.wz[i] = old_wz[i];
  
    this.qx[i] = old_qx[i];
    this.qy[i] = old_qy[i];
    this.qz[i] = old_qz[i];
    this.qw[i] = old_qw[i];

    this.type[i] = old_type[i];
    this.body[i] = old_body[i];
    this.fixed[i] = old_fixed[i];
    this.invm[i] = old_invm[i];
    this.mass[i] = old_mass[i];
    this.material[i] = old_material[i];
    this.inertiax[i] = old_inertiax[i];
    this.inertiay[i] = old_inertiay[i];
    this.inertiaz[i] = old_inertiaz[i];
    this.iinertiax[i] = old_iinertiax[i];
    this.iinertiay[i] = old_iinertiay[i];
    this.iinertiaz[i] = old_iinertiaz[i];
  }

  // Add one more
  this.x[n] = body._position.x;
  this.y[n] = body._position.y;
  this.z[n] = body._position.z;
  
  this.vx[n] = body._velocity.x;
  this.vy[n] = body._velocity.y;
  this.vz[n] = body._velocity.z;
  
  this.fx[n] = body._force.x;
  this.fy[n] = body._force.y;
  this.fz[n] = body._force.z;
  
  this.taux[n] = body._tau.x;
  this.tauy[n] = body._tau.y;
  this.tauz[n] = body._tau.z;

  this.wx[n] = body._rotvelo.x;
  this.wy[n] = body._rotvelo.y;
  this.wz[n] = body._rotvelo.z;
  
  this.qx[n] = body._quaternion.x;
  this.qy[n] = body._quaternion.y;
  this.qz[n] = body._quaternion.z;
  this.qw[n] = body._quaternion.w;

  this.type[n] = body._shape.type;
  this.body[n] = body; // Keep reference to body
  this.fixed[n] = body._mass<=0.0 ? 1 : 0;
  this.invm[n] = body._mass>0 ? 1.0/body._mass : 0;
  this.mass[n] = body._mass;
  this.material[n] = body._material!=undefined ? body._material._id : -1;

  this.inertiax[n] = body._inertia.x;
  this.inertiay[n] = body._inertia.y;
  this.inertiaz[n] = body._inertia.z;
  this.iinertiax[n] = body._inertia.x > 0 ? 1.0/body._inertia.x : 0.0;
  this.iinertiay[n] = body._inertia.y > 0 ? 1.0/body._inertia.y : 0.0;
  this.iinertiaz[n] = body._inertia.z > 0 ? 1.0/body._inertia.z : 0.0;

  body._id = n; // give id as index in table
  body._world = this;

  // Create collision matrix
  this.collision_matrix = new Int16Array((n+1)*(n+1));
};

/**
 * Adds a contact material to the world
 * @param ContactMaterial cmat
 */
CANNON.World.prototype.addContactMaterial = function(cmat) {

  // Expand old arrays

  // Two more contact material rows+cols
  var newcm = new Int16Array((this._materials.length+2)
			     * (this._materials.length+2));
  for(var i=0; i<newcm.length; i++)
    newcm[i] = -1;
  for(var i=0; i<this._materials.length; i++)
    for(var j=0; j<this._materials.length; j++)
      newcm[i+this._materials.length*j] = this._material_contactmaterial_refs[i+this._materials.length*j];
  this._material_contactmaterial_refs = newcm;
  
  // Add the materials to an array for access later
  for(var i=0; i<2; i++){
    if(cmat.materials[i]._id==-1){
      this._materials.push(cmat.materials[i]);
      cmat.materials[i]._id = this._materials.length-1;
    }
  }
  
  // Save (material1,material2) -> (contact material) reference for easy access later
  var i = cmat.materials[0]._id;
  var j = cmat.materials[1]._id; // Make sure i>j, ie upper right matrix
  
  this._material_contactmaterial_refs[i+this._materials.length*j]
    = (this._contact_material1.length); // The index of the contact material

  // Add the contact material properties
  this._contactmaterials.push(cmat);
  this._contact_material1.push(cmat.materials[0]._id);
  this._contact_material2.push(cmat.materials[1]._id);
  this._contact_friction_k.push(cmat.kinematic_friction);
  this._contact_friction_s.push(cmat.static_friction);
  this._contact_restitution.push(cmat.restitution);
};

/**
 * Get/set the broadphase collision detector for the world.
 * @param BroadPhase broadphase
 * @return BroadPhase
 */
CANNON.World.prototype.broadphase = function(broadphase){
  if(broadphase){
    this._broadphase = broadphase;
    broadphase.world = this;
  } else
    return this._broadphase;
};

/**
 * Get/set the number of iterations
 * @param int n
 * @return int
 */
CANNON.World.prototype.iterations = function(n){
  if(n)
    this.solver.iter = parseInt(n);
  else
    return this.solver.iter;
};

/**
 * Set the gravity
 * @param Vec3
 * @return Vec3
 */
CANNON.World.prototype.gravity = function(g){
  if(g==undefined)
    return this.gravity;
  else
    this.gravity = g;
};

/**
 * Step the simulation
 * @param float dt
 */
CANNON.World.prototype.step = function(dt){

  var world = this;

  if(world.paused)
    return;

  // 1. Collision detection
  var pairs = this._broadphase.collisionPairs(this);
  var p1 = pairs[0];
  var p2 = pairs[1];

  // Get references to things that are accessed often. Will save some lookup time.
  var SPHERE = CANNON.Shape.types.SPHERE;
  var PLANE = CANNON.Shape.types.PLANE;
  var BOX = CANNON.Shape.types.BOX;
  var COMPOUND = CANNON.Shape.types.COMPOUND;
  var types = world.type;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var qx = world.qx;
  var qy = world.qy;
  var qz = world.qz;
  var qw = world.qw;
  var vx = world.vx;
  var vy = world.vy;
  var vz = world.vz;
  var wx = world.wx;
  var wy = world.wy;
  var wz = world.wz;
  var fx = world.fx;
  var fy = world.fy;
  var fz = world.fz;
  var taux = world.taux;
  var tauy = world.tauy;
  var tauz = world.tauz;
  var invm = world.invm;

  // @todo reuse these somehow?
  var vx_lambda = new Float32Array(world.x.length);
  var vy_lambda = new Float32Array(world.y.length);
  var vz_lambda = new Float32Array(world.z.length);
  var wx_lambda = new Float32Array(world.x.length);
  var wy_lambda = new Float32Array(world.y.length);
  var wz_lambda = new Float32Array(world.z.length);

  var lambdas = new Float32Array(p1.length);
  var lambdas_t1 = new Float32Array(p1.length);
  var lambdas_t2 = new Float32Array(p1.length);
  for(var i=0; i<lambdas.length; i++){
    lambdas[i] = 0;
    lambdas_t1[i] = 0;
    lambdas_t2[i] = 0;
    vx_lambda[i] = 0;
    vy_lambda[i] = 0;
    vz_lambda[i] = 0;
    wx_lambda[i] = 0;
    wy_lambda[i] = 0;
    wz_lambda[i] = 0;
  }

  var that = this;

  /**
   * Keep track of contacts for current and previous timesteps
   * @param int i Body index
   * @param int j Body index
   * @param int which 0 means current, -1 one timestep behind, -2 two behind etc
   * @param int newval New contact status
   */
  function cmatrix(i,j,which,newval){
    // i == column
    // j == row
    if((which==0 && i<j) || // Current uses upper part of the matrix
       (which==-1 && i>j)){ // Previous uses lower part of the matrix
      var temp = j;
      j = i;
      i = temp;
    }
    if(newval===undefined)
      return that.collision_matrix[i+j*that.numObjects()];
    else
      that.collision_matrix[i+j*that.numObjects()] = parseInt(newval);
  }

  // Begin with transferring old contact data to the right place
  for(var i=0; i<this.numObjects(); i++)
    for(var j=0; j<i; j++){
      cmatrix(i,j,-1, cmatrix(i,j,0));
      cmatrix(i,j,0,0);
    }

  // Add gravity to all objects
  for(var i=0; i<world.numObjects(); i++){
    fx[i] += world.gravity.x * world.mass[i];
    fy[i] += world.gravity.y * world.mass[i];
    fz[i] += world.gravity.z * world.mass[i];
  }

  // Reset contact solver
  this.solver.reset(world.numObjects());
  var cid = new Int16Array(p1.length); // For saving constraint refs

  /**
   * Near phase calculation, get the contact point, normal, etc.
   * @param array result The result one will get back with all the contact point information
   * @param Shape si Colliding shape
   * @param Shape sj
   * @param Vec3 xi Position of the center of mass
   * @param Vec3 xj
   * @param Quaternion qi Rotation around the center of mass
   * @param Quaternion qj
   * @todo All collision cases
   * @todo Replace the current nearphase with this function.
   */
  function nearPhase(result,si,sj,xi,xj,qi,qj){
    var swapped=false;
    if(si.type>sj.type){
      var temp;
      temp=sj;   sj=si;   si=temp;
      temp=xj;   xj=xi;   xi=temp;
      temp=qj;   qj=qi;   qi=temp;
      swapped = true;
    }

    /**
     * Make a contact object.
     * @return object
     */
    function makeResult(){
      return {
	  ri:new CANNON.Vec3(), // Vector from body i center to contact point
	  rj:new CANNON.Vec3(), // Vector from body j center to contact point
	  ni:new CANNON.Vec3()  // Contact normal protruding body i
	};
    }

    /**
     * Swaps the body references in the contact
     * @param object r
     */
    function swapResult(r){
      var temp;
      temp = r.ri; r.ri = r.rj; r.rj = temp;
      temp = r.rj; r.rj = r.ri; r.ri = temp;
      r.ni.negate();
    }

    /**
     * Go recursive for compound shapes
     * @param Shape si
     * @param CompoundShape sj
     */
    function recurseCompound(result,si,sj,xi,xj,qi,qj){
      for(var i=0; i<sj.childShapes.length; i++){
	var r = [];
	nearPhase(r,
		  si,
		  sj.childShapes[i],
		  xi,
		  xj.vadd(sj.childOffsets[i]), // Transform the shape to its local frame
		  qi,
		  qj.mult(sj.childOrientations[i]));
	for(var j=0; j<r.length; j++)
	  result.push(r[j]); // Do we have to transform back?
      }
    }

    if(si.type==CANNON.Shape.types.SPHERE){
      if(sj.type==CANNON.Shape.types.SPHERE){ // sphere-sphere

	// We will have one contact in this case
	var r = makeResult();

	// Contact normal
	xj.vsub(xi,r.ni);
	r.ni.normalize();

	// Contact point locations
	r.ni.copy(r.ri);
	r.ni.copy(r.rj);
	r.ri.mult(si.radius,r.ri);
	r.rj.mult(sj.radius,r.rj);

      } else if(sj.type==CANNON.Shape.types.PLANE){ // sphere-plane

	// We will have one contact in this case
	var r = makeResult();

	// Contact normal
	sj.normal.copy(r.ni);
	r.ni.negate(); // body i is the sphere, flip normal
	r.ni.normalize();

	// Vector from sphere center to contact point
	r.ni.mult(si.radius,r.ri);

	// Project down shpere on plane
	var point_on_plane_to_sphere = xi.vsub(xj);
	var plane_to_sphere = r.ni.mult(r.ni.dot(point_on_plane_to_sphere));
	var xp = xi.vsub(plane_to_sphere); // The sphere position projected to plane
	xp.vsub(plane_to_sphere,r.rj);
	result.push(r);
	
      } else if(sj.type==CANNON.Shape.types.BOX){ // sphere-box

	// we refer to the box as body j
	var xixj =  xj.vsub(xi);
	var sides = sj.getSideNormals(true,qi);
	var R =     si.radius;
	var penetrating_sides = [];

	for(var idx=0; idx<sides.length && penetrating_sides.length<=3; idx++){ // Max 3 penetrating sides
	  // Need vector from side center to sphere center, r
	  var ns = sides[idx].copy();
	  var h = ns.norm();
	  var r = xixj.vsub(ns);
	  ns.normalize();
	  var dot = ns.dot(r);
	  if(dot<h+R && dot>0)
	    penetrating_sides.push(idx);
	}

	// Identify collision type
	if(penetrating_sides.length==1){
	  var res = makeResult();
	  // "Flat" collision against one side, normal is the side normal
	  var axis = penetrating_sides[0];
	  var h = sides[axis];
	  res.ni = h.copy();
	  res.ni.normalize();
	  var r = xj.vsub(xi.vadd(h)); // center of box side to center of sphere
	  var t1 = sides[(axis+1)%3];
	  var t2 = sides[(axis+2)%3];
	  t1.normalize();
	  t2.normalize();
	  res.ri = h.vsub(t1.mult(r.dot(t1))).vsub(t2.mult(r.dot(t2)));
	  res.rj = res.ni.copy();
	  res.rj.normalize();
	  res.rj.mult(-R,res.rj);
	  result.push(res);

	} else if(penetrating_sides.length==2){
	  // Contact with edge
	  // normal is the edge-sphere unit vector, orthogonal to the edge
	  // Warning: Here be dragons!
	  var res = makeResult();
	  var axis1 = penetrating_sides[0];
	  var axis2 = penetrating_sides[1];
	  var edgeCenter = sides[axis1].vadd(sides[axis2]);
	  var edgeTangent = sides[axis1].cross(sides[axis2]);
	  edgeTangent.normalize();
	  var r = xj.vsub(edgeCenter.vadd(xi));
	  res.ri = edgeCenter.vadd(edgeTangent.mult(r.dot(edgeTangent)));
	  res.rj = xi.vadd(res.ri).vsub(xj);
	  res.rj.normalize();
	  res.rj.mult(R);
	  res.ni = res.rj.copy();
	  res.ni.negate(res.ni);
	  res.ni.normalize();
	  result.push(res);

	} else if(penetrating_sides.length==3){
	  // Corner collision
	  var res = makeResult();
	  var s1 = sides[penetrating_sides[0]];
	  var s2 = sides[penetrating_sides[1]];
	  var s3 = sides[penetrating_sides[2]];
	  var corner = s1.vadd(s2).vadd(s3);
	  var ri = corner;
	  res.ni = corner.vadd(xi).vsub(xj);
	  res.ni.normalize();
	  res.rj = res.ni.mult(-R);
	  result.push(res);

	} else {
	  // No contact...
	}

      } else if(sj.type==CANNON.Shape.types.COMPOUND){ // sphere-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
      }
      
    } else if(si.type==CANNON.Shape.types.PLANE){
      
      if(sj.type==CANNON.Shape.types.PLANE){
	throw "Plane-plane collision... wait what?";
	
      } else if(sj.type==CANNON.Shape.types.BOX){

	// Collision normal
	var n = si.normal.copy();

	// Loop over corners
	var numcontacts = 0;
	var corners = sj.getCorners();
	for(var idx=0; idx<corners.length && numcontacts<=4; idx++){ // max 4 corners against plane
	  var r = makeResult();
	  corners[idx].copy(r.rj);

	  // Transform corner into the world frame
	  quat.vmult(r.rj,r.rj);

	  // Project down corner to plane to get xj
	  var point_on_plane_to_corner = xj.vadd(r.rj.mult(0.5)).vsub(xi);
	  var plane_to_corner = n.mult(n.dot(point_on_plane_to_corner));
	  xi.vsub(plane_to_corner,r.ri);

	  // Set contact normal
	  n.copy(r.ni);

	  // Add contact
	  result.push(r);
	}
	
      } else if(sj.type==CANNON.Shape.types.COMPOUND){ // plane-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
      }
      
    } else if(si.type==CANNON.Shape.types.BOX){
      
      if(sj.type==CANNON.Shape.types.BOX){ // box-box
	throw "box-box collision not implemented yet";
      }
      
      if(sj.type==CANNON.Shape.types.COMPOUND){ // box-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
	
      }
      
    } else if(si.type==CANNON.Shape.types.COMPOUND){
      
      if(sj.type==CANNON.Shape.types.COMPOUND){ // compound-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
	
      }
    }
    
    // Swap back if we swapped bodies in the beginning
    for(var i=0; swapped && i<result.length; i++)
      swapResult(result[i]);
  }

  // Loop over all collisions
  for(var k=0; k<p1.length; k++){

    // Get current collision indeces
    var i = p1[k];
    var j = p2[k];
    
    // Check last step stats
    var lastCollisionState = cmatrix(i,j,-1);
    
    // Get collision properties
    var mu_s = 0.3, mu_k = 0.3, e = 0.2;
    var cm = this._getContactMaterialId(i,j);
    if(cm!=-1){
      mu_s = this._contact_friction_s[cm];
      mu_k = this._contact_friction_k[cm];
      e = this._contact_restitution[cm];
    }
    
    // sphere-plane collision
    if((types[i]==SPHERE && types[j]==PLANE) ||
       (types[i]==PLANE  && types[j]==SPHERE)){
      // Identify what is what
      var pi, si;
      if(types[i]==SPHERE){
	si=i;
	pi=j;
      } else {
	si=j;
	pi=i;
      }

      // Collision normal
      var n = world.body[pi]._shape.normal.copy();
      n.normalize();
      n.negate(n); // We are working with the sphere as body i!

      // Vector from sphere center to contact point
      var rsi = n.mult(world.body[si]._shape.radius);
      var rsixn = rsi.cross(n);

      // Project down shpere on plane???
      var point_on_plane_to_sphere = new CANNON.Vec3(x[si]-x[pi],
						     y[si]-y[pi],
						     z[si]-z[pi]);
      var xs = new CANNON.Vec3(x[si],y[si],z[si]);
      var plane_to_sphere = n.mult(n.dot(point_on_plane_to_sphere));
      var xp = xs.vsub(plane_to_sphere); // The sphere position projected to plane
      var rj = new CANNON.Vec3(xp.x-x[pi],
			       xp.y-y[pi],
			       xp.z-z[pi]);
      var xj = new CANNON.Vec3(x[pi],
			       y[pi],
			       z[pi]);

      // Pseudo name si := i
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      // xj is in this case the penetration point on the plane, and rj=0
      var qvec = new CANNON.Vec3(xj.x + rj.x - x[si] - rsi.x,
				 xj.y + rj.y - y[si] - rsi.y,
				 xj.z + rj.z - z[si] - rsi.z);
      var q = qvec.dot(n);
	
      // Action if penetration
      if(q<0.0){
	cmatrix(si,pi,0,1); // Set current contact state to contact
	var v_sphere = new CANNON.Vec3(vx[si],vy[si],vz[si]);
	var w_sphere = new CANNON.Vec3(wx[si],wy[si],wz[si]);
	var v_contact = w_sphere.cross(rsi);
	var u = v_sphere;//.vadd(w_sphere.cross(rsi));
	/*
	// Which collision state?
	if(lastCollisionState==0){ // No contact last timestep -> impulse

	  // Inverse inertia matrix
	  //console.log("sphere-plane...");
	  this._addImpulse(si,pi,rsi,rj,u,n,mu_s,e);

	} else if(lastCollisionState==1){ // Last contact was also overlapping - contact
	*/
	  // --- Solve for contacts ---
	  var iM = world.invm[si];
	  var iI = world.inertiax[si] > 0 ? 1.0/world.inertiax[si] : 0; // Sphere - same for all dims
	  cid[k] = this.solver
	    .addConstraint( // Non-penetration constraint jacobian
			   [-n.x,-n.y,-n.z,
			    0,0,0,
			    0,0,0,
			    0,0,0],
			 
			   // Inverse mass matrix
			   [iM,iM,iM,
			    iI,iI,iI,
			    0,0,0,   // Static plane -> infinite mass
			    0,0,0],
			 
			   // q - constraint violation
			   [-qvec.x*2,-qvec.y*2,-qvec.z*2, // why *2 ?
			    0,0,0,
			    0,0,0,
			    0,0,0],
			 
			   // qdot - motion along penetration normal
			   [v_sphere.x, v_sphere.y, v_sphere.z,
			    0,0,0,
			    0,0,0,
			    0,0,0],
			 
			   // External force - forces & torques
			   [fx[si],fy[si],fz[si],
			    taux[si],tauy[si],tauz[si],
			    0,0,0,
			    0,0,0],
			   0,
			   'inf',
			   si,
			   pi);
	  /*}*/
      }

    } else if(types[i]==SPHERE && types[j]==SPHERE){

      var ri = new CANNON.Vec3(x[j]-x[i],y[j]-y[i],z[j]-z[i]);
      var rj = new CANNON.Vec3(x[i]-x[j],y[i]-y[j],z[i]-z[j]);
      var nlen = ri.norm();
      ri.normalize();
      ri.mult(world.body[i]._shape.radius,ri);
      rj.normalize();
      rj.mult(world.body[j]._shape.radius,rj);
      var ni = new CANNON.Vec3(x[j]-x[i],
			       y[j]-y[i],
			       z[j]-z[i]);
      ni.normalize();
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      var q_vec = new CANNON.Vec3(x[j]+rj.x-x[i]-ri.x,
				  y[j]+rj.y-y[i]-ri.y,
				  z[j]+rj.z-z[i]-ri.z);
      var q = q_vec.dot(ni);

      // Sphere contact!
      if(q<0.0){ // Violation always < 0

	// Set contact
	cmatrix(i,j,0,1);
	
	var v_sphere_i = new CANNON.Vec3(vx[i],vy[i],vz[i]);
	var v_sphere_j = new CANNON.Vec3(vx[j],vy[j],vz[j]);
	var w_sphere_i = new CANNON.Vec3(wx[i],wy[i],wz[i]);
	var w_sphere_j = new CANNON.Vec3(wx[j],wy[j],wz[j]);
	v_sphere_i.vadd(ri.cross(w_sphere_i));
	v_sphere_j.vadd(rj.cross(w_sphere_j));
	  
	var u = v_sphere_j.vsub(v_sphere_i);

	if(lastCollisionState == 0){ // No contact last timestep -> impulse
	  //console.log("sphere-sphere impulse...");
	  this._addImpulse(i,j,ri,rj,u,ni,mu_s,e);
	  
	} else { // Contact in last timestep -> contact solve
	  //console.log("sphere-sphere contact...");
	  // gdot = ( vj + wj x rj - vi - wi x ri ) .dot ( ni )
	  // => W = ( vj + wj x rj - vi - wi x ri )
	  
	  var iM_i = !world.fixed[i] ? world.invm[i] : 0;
	  var iI_i = !world.fixed[i] ? 1.0/world.inertiax[i] : 0;
	  var iM_j = !world.fixed[j] ? world.invm[j] : 0;
	  var iI_j = !world.fixed[j] ? 1.0/world.inertiax[j] : 0;
	  var rxni = ri.cross(ni);
	  
	  cid[k] = this.solver
	    .addConstraint( // Non-penetration constraint jacobian
			   [-ni.x,   -ni.y,   -ni.z,
			    0,0,0,//-rxni.x, -rxni.y, -rxni.z,
			    ni.x,   ni.y,    ni.z,
			    0,0,0],//rxni.x, rxni.y,  rxni.z],
			   
			   // Inverse mass matrix
			   [iM_i, iM_i, iM_i,
			    iI_i, iI_i, iI_i,
			    iM_j, iM_j, iM_j,
			    iI_j, iI_j, iI_j],
			   
			   // q - constraint violation
			   [-q_vec.x,-q_vec.y,-q_vec.z,
			    0,0,0,
			    q_vec.x,q_vec.y,q_vec.z,
			    0,0,0],
			   
			   [vx[i],vy[i],vz[i],
			    0,0,0,
			    vx[j],vy[j],vz[j],
			    0,0,0],
			   
			   // External force - forces & torques
			   [fx[i],fy[i],fz[i],
			    taux[i],tauy[i],tauz[i],
			    fx[j],fy[j],fz[j],
			    taux[j],tauy[j],tauz[j]],
			   0,
			   'inf',
			   i,
			   j);
	}
      }
    } else if((types[i]==COMPOUND && types[j]==PLANE) ||
	      (types[i]==PLANE && types[j]==COMPOUND)){

      throw "Compound-plane collision is not implemented yet...";

    } else if((types[i]==BOX && types[j]==PLANE) || 
	      (types[i]==PLANE && types[j]==BOX)){
      
      // Identify what is what
      var pi, bi;
      if(types[i]==BOX){
	bi=i;
	pi=j;
      } else {
	bi=j;
	pi=i;
      }
      
      // Collision normal
      var n = world.body[pi]._shape.normal.copy();
      n.negate(n); // We are working with the box as body i!

      var xi = new CANNON.Vec3(world.x[bi],
			       world.y[bi],
			       world.z[bi]);

      // Compute inertia in the world frame
      var quat = new CANNON.Quaternion(qx[bi],qy[bi],qz[bi],qw[bi]);
      quat.normalize();
      var localInertia = new CANNON.Vec3(world.inertiax[bi],
					 world.inertiay[bi],
					 world.inertiaz[bi]);
      // @todo Is this rotation OK? Check!
      var worldInertia = quat.vmult(localInertia);
      worldInertia.x = Math.abs(worldInertia.x);
      worldInertia.y = Math.abs(worldInertia.y);
      worldInertia.z = Math.abs(worldInertia.z);

      var corners = world.body[bi]._shape.getCorners();
      
      // Loop through each corner
      var numcontacts = 0;
      for(var idx=0; idx<corners.length && numcontacts<=4; idx++){ // max 4 corners against plane

	var ri = corners[idx];

	// Compute penetration corner in the world frame
	quat.vmult(ri,ri);

	var rixn = ri.cross(n);

	// Project down corner to plane to get xj
	var point_on_plane_to_corner = new CANNON.Vec3(xi.x+ri.x*0.5-x[pi],
						       xi.y+ri.y*0.5-y[pi],
						       xi.z+ri.z*0.5-z[pi]); // 0.5???
	var plane_to_corner = n.mult(n.dot(point_on_plane_to_corner));

	var xj = xi.vsub(plane_to_corner);
	
	// Pseudo name: box index = i
	// g = ( xj + rj - xi - ri ) .dot ( ni )
	var qvec = new CANNON.Vec3(xj.x - x[bi] - ri.x*0.5, // 0.5???
				   xj.y - y[bi] - ri.y*0.5,
				   xj.z - z[bi] - ri.z*0.5);
	var q = qvec.dot(n);
	n.mult(q,qvec);
	
	// Action if penetration
	if(q<0.0){

	  numcontacts++;

	  var v_box = new CANNON.Vec3(vx[bi],vy[bi],vz[bi]);
	  var w_box = new CANNON.Vec3(wx[bi],wy[bi],wz[bi]);

	  var v_contact = w_box.cross(ri);
	  var u = v_box.vadd(w_box.cross(ri));

	  var iM = world.invm[bi];
	  cid[k] = this.solver
	    .addConstraint( // Non-penetration constraint jacobian
			   [-n.x,-n.y,-n.z,
			    -rixn.x,-rixn.y,-rixn.z,
			    0,0,0,
			    0,0,0],
			   
			   // Inverse mass matrix
			   [iM,iM,iM,
			    1.0/worldInertia.x, 1.0/worldInertia.y, 1.0/worldInertia.z,
			    0,0,0,   // Static plane -> infinite mass
			    0,0,0],
			   
			   // q - constraint violation
			   [-qvec.x,-qvec.y,-qvec.z,
			    0,0,0,
			    0,0,0,
			    0,0,0],
			   
			   // qdot - motion along penetration normal
			   [v_box.x, v_box.y, v_box.z,
			    w_box.x, w_box.y, w_box.z,
			    0,0,0,
			    0,0,0],
			   
			   // External force - forces & torques
			   [fx[bi],fy[bi],fz[bi],
			    taux[bi],tauy[bi],tauz[bi],
			    fx[pi],fy[pi],fz[pi],
			    taux[pi],tauy[pi],tauz[pi]],

			   0,
			   'inf',
			   bi,
			   pi);
	}
      }

    } else if((types[i]==BOX && types[j]==SPHERE) || 
	      (types[i]==SPHERE && types[j]==BOX)){

      /*
	--- Box-sphere collision ---
	We have several scenarios here... But obviously we can only have 1 contact point
	- One of the 8 corners penetrate - normal is the sphere center-->corner vector
	- Sphere is penetrating one of the 6 box side - normal is the box side
	- Sphere collides with one of the 12 box edges
	
	To identify scenario, we project the vector from the box center to the
	sphere center onto each of the 6 box side normals, penetration if r*n<h+rs
	3 side penetrations => corner
	2 side penetrations => edge
	1 side penetrations => side
      */

      // Identify what is what
      var si, bi;
      if(types[i]==BOX){
	bi=i;
	si=j;
      } else {
	bi=j;
	si=i;
      }
      
      // we refer to the box as body i
      var xi = new CANNON.Vec3(world.x[bi],world.y[bi],world.z[bi]);
      var xj = new CANNON.Vec3(world.x[si],world.y[si],world.z[si]);
      var xixj = xj.vsub(xi);

      var qi = new CANNON.Quaternion(world.qx[bi],world.qy[bi],world.qz[bi],world.qw[bi]);
      var sides = world.body[bi]._shape.getSideNormals(true,qi);
      var R = world.body[si]._shape.radius;

      var penetrating_sides = [];
      for(var idx=0; idx<sides.length && penetrating_sides.length<=3; idx++){ // Max 3 penetrating sides
	// Need vector from side center to sphere center, r
	var ns = sides[idx].copy();
	var h = ns.norm();
	var r = xixj.vsub(ns);
	ns.normalize();
	var dot = ns.dot(r);
	if(dot<h+R && dot>0)
	  penetrating_sides.push(idx);
      }


      var iMi = new CANNON.Vec3(world.invm[bi],
				world.invm[bi],
				world.invm[bi]);
      var iMj = new CANNON.Vec3(world.invm[si],
				world.invm[si],
				world.invm[si]);
      var iIi = new CANNON.Vec3(world.iinertiax[bi],
				world.iinertiay[bi],
				world.iinertiaz[bi]); // @todo rotate into world frame
      var iIj = new CANNON.Vec3(world.iinertiax[si],
				world.iinertiay[si],
				world.iinertiaz[si]);
      var vi = new CANNON.Vec3(vx[bi],vy[bi],vz[bi]);
      var vj = new CANNON.Vec3(vx[si],vy[si],vz[si]);
      var wi = new CANNON.Vec3(wx[bi],wy[bi],wz[bi]);
      var wj = new CANNON.Vec3(wx[si],wy[si],wz[si]);

      var fi = new CANNON.Vec3(fx[bi],fy[bi],fz[bi]);
      var fj = new CANNON.Vec3(fx[si],fy[si],fz[si]);

      var taui = new CANNON.Vec3(taux[bi],tauy[bi],tauz[bi]);
      var tauj = new CANNON.Vec3(taux[si],tauy[si],tauz[si]);

      // Identify collision type
      if(penetrating_sides.length==1){
	// "Flat" collision against one side, normal is the side normal
	var axis = penetrating_sides[0];
	var h = sides[axis];
	var ni = h.copy();
	ni.normalize();
	var r = xj.vsub(xi.vadd(h)); // center of box side to center of sphere
	var t1 = sides[(axis+1)%3];
	var t2 = sides[(axis+2)%3];
	t1.normalize();
	t2.normalize();
	var ri = h.vsub(t1.mult(r.dot(t1))).vsub(t2.mult(r.dot(t2)));
	var rj = ni.copy();
	rj.normalize();
	rj.mult(-R,rj);
	this.solver
	  .addNonPenetrationConstraint(bi,si,xi,xj,ni,ri,rj,iMi,iMj,iIi,iIj,vi,vj,wi,wj,fi,fj,taui,tauj);
      } else if(penetrating_sides.length==2){
	// Contact with edge
	// normal is the edge-sphere unit vector, orthogonal to the edge
	var axis1 = penetrating_sides[0];
	var axis2 = penetrating_sides[1];
	var edgeCenter = sides[axis1].vadd(sides[axis2]);
	var edgeTangent = sides[axis1].cross(sides[axis2]);
	edgeTangent.normalize();
	var r = xj.vsub(edgeCenter.vadd(xi));
	var ri = edgeCenter.vadd(edgeTangent.mult(r.dot(edgeTangent)));
	var rj = xi.vadd(ri).vsub(xj);
	rj.normalize();
	rj.mult(R);
	var ni = rj.copy();
	ni.negate(ni);
	ni.normalize();
	this.solver
	  .addNonPenetrationConstraint(bi,si,xi,xj,ni,ri,rj,iMi,iMj,iIi,iIj,vi,vj,wi,wj,fi,fj,taui,tauj);
      } else if(penetrating_sides.length==3){
	// Corner collision
	var s1 = sides[penetrating_sides[0]];
	var s2 = sides[penetrating_sides[1]];
	var s3 = sides[penetrating_sides[2]];
	var corner = s1.vadd(s2).vadd(s3);
	var ri = corner;
	var ni = corner.vadd(xi).vsub(xj);
	ni.normalize();
	var rj = ni.mult(-R);
	// @todo add contact constraint
      } else {
	// No contact...
      }

      /*
      // Scenario 1: Corner collision
      var corners = world.body[bi]._shape.getCorners();

      // Loop through each corner
      var numcontacts = 0;
      for(var idx=0; idx<corners.length && numcontacts<=1; idx++){ // max 1 corner

	var ri = corners[idx];

	// Rotate corner into the world frame
	quat.vmult(ri,ri);

	var rj = new CANNON.Vec3(x[bi] + ri.x - x[si],
				 y[bi] + ri.y - y[si],
				 z[bi] + ri.z - z[si]);
	
	// Pseudo name: box index = i
	// g = ( xj + rj - xi - ri ) .dot ( ni )
	var qvec = new CANNON.Vec3(xj.x + rj.x - xi.x - ri.x,
				   xj.y + rj.y - xi.y - ri.y,
				   xj.z + rj.z - xi.z - ri.z);
	var q = qvec.dot(n);
	n.mult(q,qvec);
	
	// Action if penetration
	if(q<0.0){

	  var rixn = ri.cross(n);

	  numcontacts++;

	  var v_box = new CANNON.Vec3(vx[bi],vy[bi],vz[bi]);
	  var w_box = new CANNON.Vec3(wx[bi],wy[bi],wz[bi]);
	  var v_sphere = new CANNON.Vec3(vx[si],vy[si],vz[si]);
	  var w_sphere = new CANNON.Vec3(wx[si],wy[si],wz[si]);
	  var u = v_sphere.vadd(w_sphere.cross(rj)).vsub(v_box.vadd(w_box.cross(ri)));

	  var iMi = world.invm[bi];
	  var iMj = world.invm[si];

	  var iIbx = 1.0/worldInertia.x,
  	      iIby = 1.0/worldInertia.y,
	      iIbz = 1.0/worldInertia.z;
	  cid[k] = this.solver
	    .addConstraint( // Non-penetration constraint jacobian
			   [-n.x,-n.y,-n.z,
			    -rixn.x,-rixn.y,-rixn.z,
			    0,0,0,
			    0,0,0],
			   
			   // Inverse mass matrix
			   [iMi,iMi,iMi,
			    iIbx,iIby,iIbz,
			    iMj,iMj,iMj,
			    Is,Is,Is], // Symmetric for sphere
			   
			   // q - constraint violation
			   [-qvec.x,-qvec.y,-qvec.z,
			    0,0,0,
			    qvec.x,qvec.y,qvec.z,
			    0,0,0],
			   
			   // qdot - motion along penetration normal
			   [v_box.x, v_box.y, v_box.z,
			    w_box.x, w_box.y, w_box.z,
			    0,0,0,
			    0,0,0],
			   
			   // External force - forces & torques
			   [fx[bi],fy[bi],fz[bi],
			    taux[bi],tauy[bi],tauz[bi],
			    fx[pi],fy[pi],fz[pi],
			    taux[pi],tauy[pi],tauz[pi]],

			   0,
			   'inf',
			   bi,
			   pi);
	}
      }

      // Still no contacts? Check scenario 2 - the 6 box sides
      if(numcontacts==0){
	// Idea: get the 6 side normals

	// @todo
      }

      // Still no contacts? Check scenario 3 - the 12 box edges
      if(numcontacts==0){
	// @todo
      }
      */
    }
  }

  if(this.solver.n){
    this.solver.solve();
    //world.togglepause();

    // Apply constraint velocities
    for(var i=0; i<world.numObjects(); i++){
      vx[i] += this.solver.vxlambda[i];
      vy[i] += this.solver.vylambda[i];
      vz[i] += this.solver.vzlambda[i];
      wx[i] += this.solver.wxlambda[i];
      wy[i] += this.solver.wylambda[i];
      wz[i] += this.solver.wzlambda[i];
    }
  }

  // Apply damping
  for(var i=0; i<world.numObjects(); i++){
    var ld = 1.0 - this.body[i].linearDamping();
    var ad = 1.0 - this.body[i].angularDamping();
    vx[i] *= ld;
    vy[i] *= ld;
    vz[i] *= ld;
    wx[i] *= ad;
    wy[i] *= ad;
    wz[i] *= ad;
  }

  // Leap frog
  // vnew = v + h*f/m
  // xnew = x + h*vnew
  for(var i=0; i<world.numObjects(); i++){
    if(!world.fixed[i]){
      vx[i] += fx[i] * world.invm[i] * dt;
      vy[i] += fy[i] * world.invm[i] * dt;
      vz[i] += fz[i] * world.invm[i] * dt;

      wx[i] += taux[i] * 1.0/world.inertiax[i] * dt;
      wy[i] += tauy[i] * 1.0/world.inertiay[i] * dt;
      wz[i] += tauz[i] * 1.0/world.inertiaz[i] * dt;

      // Use new velocity  - leap frog
      x[i] += vx[i] * dt;
      y[i] += vy[i] * dt;
      z[i] += vz[i] * dt;
      
      var q = new CANNON.Quaternion(qx[i],qy[i],qz[i],qw[i]);
      var w = new CANNON.Quaternion(wx[i],wy[i],wz[i],0);

      var wq = w.mult(q);

      qx[i] += dt * 0.5 * wq.x;
      qy[i] += dt * 0.5 * wq.y;
      qz[i] += dt * 0.5 * wq.z;
      qw[i] += dt * 0.5 * wq.w;
      
      q.x = qx[i];
      q.y = qy[i];
      q.z = qz[i];
      q.w = qw[i];

      q.normalize();

      qx[i]=q.x;
      qy[i]=q.y;
      qz[i]=q.z;
      qw[i]=q.w;
    }
  }

  // Reset all forces
  for(var i = 0; i<world.numObjects(); i++){
    fx[i] = 0.0;
    fy[i] = 0.0;
    fz[i] = 0.0;
    taux[i] = 0.0;
    tauy[i] = 0.0;
    tauz[i] = 0.0;
  }

  // Update world time
  world.time += dt;
  world.stepnumber += 1;
};

