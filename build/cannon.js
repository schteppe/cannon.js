/**
 * cannon.js v0.3.2 - A lightweight 3D physics engine for the web
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
 * @return array
 */
CANNON.Broadphase.prototype.collisionPairs = function(){
  throw "collisionPairs not implemented for this BroadPhase class!";
};

/**
 * Naive broadphase implementation, used in lack of better ones and for
 * comparisons in performance tests.
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
  var SPHERE = CANNON.Shape.types.SPHERE;
  var PLANE =  CANNON.Shape.types.PLANE;
  var BOX =    CANNON.Shape.types.BOX;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var type = world.type;
  var body = world.body;

  // Naive N^2 ftw!
  for(var i=0; i<n; i++){
    for(var j=0; j<i; j++){

      // Sphere-sphere
      if(type[i]==SPHERE && type[j]==SPHERE){
	var r2 = (body[i]._shape.radius + body[j]._shape.radius);
	if(Math.abs(x[i]-x[j]) < r2 && 
	   Math.abs(y[i]-y[j]) < r2 && 
	   Math.abs(z[i]-z[j]) < r2){
	  pairs1.push(i);
	  pairs2.push(j);
	}

	// Sphere-plane
      } else if((type[i]==SPHERE && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==SPHERE)){
	var si = type[i]==SPHERE ? i : j;
	var pi = type[i]==PLANE ? i : j;
	
	// Rel. position
	var r = new CANNON.Vec3(x[si]-x[pi],
				y[si]-y[pi],
				z[si]-z[pi]);
	var normal = body[pi]._shape.normal;
	var q = r.dot(normal)-body[si]._shape.radius;
	if(q<0.0){
	  pairs1.push(i);
	  pairs2.push(j);
	}
	
	// Box-plane
      } else if((type[i]==BOX && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==BOX)){
	var bi = type[i]==BOX   ? i : j;
	var pi = type[i]==PLANE ? i : j;
	
	// Rel. position
	var r = new CANNON.Vec3(x[bi]-x[pi],
				y[bi]-y[pi],
				z[bi]-z[pi]);
	var normal = body[pi]._shape.normal;
	var d = r.dot(normal); // Distance from box center to plane
	var boundingRadius = body[bi]._shape.halfExtents.norm();
	var q = d - boundingRadius;
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
     target.x==Infinity || target.y==Infinity || target.z==Infinity
     )
    throw "Could not solve equation!";

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
  target.x = - this.x;
  target.y = - this.y;
  target.z = - this.z;
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

CANNON.Shape.prototype.boundingSphereRadius = function(){
  throw "boundingSphereRadius not implemented for shape type "+this.type;
};

/**
 * Calculates the inertia in the local frame for this shape.
 * @return Vec3
 * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
 */
CANNON.Shape.prototype.calculateLocalInertia = function(mass,target){
  throw "calculateLocalInertia not implemented for shape type "+this.type;
};

CANNON.Shape.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4
};

/**
 * Rigid body base class
 * @class RigidBody
 * @param type
 */
CANNON.RigidBody = function(mass,shape){
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

  /// Reference to the world the body is living in
  this._world = null;

  /// Equals -1 before added to the world. After adding, it is the world body index
  this._id = -1;
};

/**
 * Get/set mass. Note: When changing mass, you should change the inertia too.
 * @param float m
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
  this.radius = radius!=undefined ? radius : 1.0;
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
/**
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
/**
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
  if(numbodies){
    this.vxlambda = new Float32Array(numbodies);
    this.vylambda = new Float32Array(numbodies);
    this.vzlambda = new Float32Array(numbodies);
    this.wxlambda = new Float32Array(numbodies);
    this.wylambda = new Float32Array(numbodies);
    this.wzlambda = new Float32Array(numbodies);
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
 * Solves the system
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
 * The physics world
 * @class World
 */
CANNON.World = function(){

  // Some default values
  this.paused = false;
  this.time = 0.0;
  this.stepnumber = 0;
  this.iter = 5;

  this.spook_k = 3000.0;
  this.spook_d = 3.0;

  var th = this;
  this.spook_a = function(h){ return 4.0 / (h * (1 + 4 * th.spook_d)); };
  this.spook_b = (4.0 * this.spook_d) / (1 + 4 * this.spook_d);
  this.spook_eps = function(h){ return 4.0 / (h * h * th.spook_k * (1 + 4 * th.spook_d)); };

  this.solver = new CANNON.Solver(this.spook_a(1.0/60.0),
				   this.spook_b,
				   this.spook_eps(1.0/60.0),
				   this.spook_k,
				   this.spook_d,
				   this.iter,
				   1.0/60.0);
};

/**
 * Get number of objects in the world.
 * @return int
 */
CANNON.World.prototype.togglepause = function(){
  this.paused = !this.paused;
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
  old_inertiax = this.inertiax;
  old_inertiay = this.inertiay;
  old_inertiaz = this.inertiaz;

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
  this.inertiax = new Float32Array(n+1);
  this.inertiay = new Float32Array(n+1);
  this.inertiaz = new Float32Array(n+1);
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
    this.inertiax[i] = old_inertiax[i];
    this.inertiay[i] = old_inertiay[i];
    this.inertiaz[i] = old_inertiaz[i];
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

  this.inertiax[n] = body._inertia.x;
  this.inertiay[n] = body._inertia.y;
  this.inertiaz[n] = body._inertia.z;

  body._id = n; // give id as index in table
  body._world = this;

  // Create collision matrix
  this.collision_matrix = new Int16Array((n+1)*(n+1));
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
    this.iter = parseInt(n);
  else
    return this.iter;
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
  if(this.paused)
    return;

  // 1. Collision detection
  var pairs = this._broadphase.collisionPairs(this);
  var p1 = pairs[0];
  var p2 = pairs[1];

  // Get references to things that are accessed often. Will save some lookup time.
  var SPHERE = CANNON.Shape.types.SPHERE;
  var PLANE = CANNON.Shape.types.PLANE;
  var BOX = CANNON.Shape.types.BOX;
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
      

  // Resolve impulses - old
  /*
  for(var k=0; k<p1.length; k++){
    
    // Get current collision indeces
    var i = p1[k];
    var j = p2[k];
    
    // sphere-plane impulse
    if((types[i]==SPHERE && types[j]==PLANE) ||
       (types[i]==PLANE &&  types[j]==SPHERE)){
      
      // Identify what is what
      var pi, si;
      if(types[i]==SPHERE){
	si=i;
	pi=j;
      } else {
	si=j;
	pi=i;
      }

      // @todo apply the notation at http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
      
      // Collision normal
      var n = world.body[pi]._shape.normal;
	
      // Check if penetration
      var r = new CANNON.Vec3(x[si]-x[pi],
			       y[si]-y[pi],
			       z[si]-z[pi]);
      r = n.mult(r.dot(n));
      var q = (r.dot(n)-world.body[si]._shape.radius);

      var w_sphere = new CANNON.Vec3(wx[si], wy[si], wz[si]);
      var v_sphere = new CANNON.Vec3(vx[si], vy[si], vz[si]);
      // Contact velocity
      // v = (body(n).V(1:3) + cr(body(n).V(4:6)',rn)') - (body(m).V(1:3) + cr(body(m).V(4:6)',rm)'); % m is plane
      // @todo

      var v_contact = v_sphere.vadd(r.cross(w_sphere));

      //var v_contact = new CANNON.Vec3(vx[si]+cr.x,
      //vy[si]+cr.y,
      //vz[si]+cr.z);
     
      //v_sphere.vadd(w_sphere.cross(r),v_contact);

      // Relative velocity
      var u = n.mult(v_sphere.dot(n));
      
      // Action if penetration
      if(q<=0.0 && cmatrix(si,pi)==NOCONTACT){ // No impact for separating contacts
	if(u.dot(n)<0.0)
	  cmatrix(si,pi,CONTACT);
	var r_star = r.crossmat();
	var invm = this.invm;

	// Collision matrix:
	// K = eye(3,3)/body(n).m - r_star*body(n).Iinv*r_star;
	var K = new CANNON.Mat3();
	K.identity();
	K.elements[0] *= invm[si];
	K.elements[4] *= invm[si];
	K.elements[8] *= invm[si];

	var rIr = r_star.mmult(K.mmult(r_star));
	for(var el = 0; el<9; el++)
	  K.elements[el] -= rIr.elements[el];
	
	// First assume stick friction
	var e = 0.5;

	// Final velocity if stick
	var v_f = n.mult(-e * (v_contact.dot(n))); 

	var impulse_vec =  K.solve(v_f.vsub(v_contact));
	
	// Check if slide mode (J_t > J_n) - outside friction cone
	var mu = 0.3; // quick fix
	if(mu>0){
	  var J_n = n.mult(impulse_vec.dot(n));
	  var J_t = impulse_vec.vsub(J_n);
	  if(J_t.norm() > J_n.mult(mu).norm()){
	    var v_tang = v_sphere.vsub(n.mult(v_sphere.dot(n)));
	    var tangent = v_tang.mult(1/(v_tang.norm() + 0.0001));
	    var impulse = -(1+e)*(v_sphere.dot(n))/(n.dot(K.vmult((n.vsub(tangent.mult(mu))))));
	    impulse_vec = n.mult(impulse).vsub(tangent.mult(mu * impulse));
	  }
	}

	// Add to velocity
	// todo: add to angular velocity as below
	var add = impulse_vec.mult(invm[si]);
	vx[si] += add.x;
	vy[si] += add.y;
	vz[si] += add.z;

	var cr = impulse_vec.cross(r);
	var wadd = cr.mult(1.0/world.inertiax[si]);

	wx[si] += wadd.x; //body(n).V(4:6) = body(n).V(4:6) + (body(n).Iinv*cr(impulse_vec,r))';
	wy[si] += wadd.y;
	wz[si] += wadd.z;
	
	cmatrix(si,pi,IMPACT); // Just applied impulse - set impact
      } else if(q<=0 & cmatrix(si,pi)==IMPACT)
	cmatrix(si,pi,CONTACT); // Last step was impact and we are still penetrated- set contact
      else if(q>0)
	cmatrix(si,pi,NOCONTACT); // No penetration any more- set no contact

      // Sphere-sphere impulse
    } else if(types[i]==SPHERE && types[j]==SPHERE){

      var n = new CANNON.Vec3(x[i]-x[j],
			       y[i]-y[j],
			       z[i]-z[j]);
      var nlen = n.norm();
      n.normalize();
      var q = (nlen - (world.body[i]._shape.radius+world.body[j]._shape.radius));
      var u = new CANNON.Vec3(vx[i]-vx[j],
			       vy[i]-vy[j],
			       vz[i]-vz[j]);
      u = n.mult(u.dot(n));
      if(q<0.0 && u.dot(n)<0){
	var e = 0.5;
	var u_new = n.mult(-(u.dot(n)*e));
	
	vx[i] += e*(u_new.x - u.x)*world.invm[j];
	vy[i] += e*(u_new.y - u.y)*world.invm[j];
	vz[i] += e*(u_new.z - u.z)*world.invm[j];

	vx[j] -= e*(u_new.x - u.x)*world.invm[i];
	vy[j] -= e*(u_new.y - u.y)*world.invm[i];
	vz[j] -= e*(u_new.z - u.z)*world.invm[i];

	// Todo, implement below things. They are general impulses from granular.m
	var r = new CANNON.Vec3(x[i]-x[j],
				 y[i]-y[j],
				 z[i]-z[j]);
	var ri = n.mult(world.body[i]._shape.radius);
	var rj = n.mult(world.body[j]._shape.radius);

	//            % Collide with core
	//                r = dR;
	//                rn = -body(n).r_core * normal;
	//                rm = body(m).r_core * normal;
	//                v = (body(n).V(1:3) + cr(body(n).V(4:6)',rn)') - (body(m).V(1:3) + cr(body(m).V(4:6)',rm)');
	//                if v*r > 0 
	//                    COLLISION_MATRIX(n,m) = 1;
	//                    break                                                  % No impact for separating contacts
	//                end
	//                r_star = getSTAR2(r);
	//                rn_star = getSTAR2(rn);
	//                rm_star = getSTAR2(rm);

	var r_star = r.crossmat();
	var ri_star = ri.crossmat();
	var rj_star = rj.crossmat();

	//K = eye(3,3)/body(n).m + eye(3,3)/body(m).m - rn_star*body(m).Iinv*rn_star - rm_star*body(n).Iinv*rm_star; 
	//                % First assume stick friction
	//                v_f = - e_pair * (v*normal) * normal';               % Final velocity if stick
	//                impulse_vec =  K\(v_f - v)';
	//                % Check if slide mode (J_t > J_n) - outside friction cone
	//                if MU>0
	//                    J_n = (impulse_vec'*normal) * normal;
	//                    J_t = impulse_vec - J_n;
	//                    if norm(J_t) > norm(MU*J_n)                    
	//                            v_tang = v' - (v*normal)*normal;
	//                            tangent =  v_tang/(norm(v_tang) + 10^(-6));
	//                            impulse = -(1+e_pair)*(v*normal)/(normal' * K * (normal - MU*tangent));
	//                            impulse_vec = impulse * normal - MU * impulse * tangent;
	//                    end
	//                end
	//                 bodyTotmass = body(n).m + body(m).m;
	//                 body(n).V(1:3) = body(n).V(1:3) +  1/body(n).m * impulse_vec';
	//                 body(n).V(4:6) = body(n).V(4:6) + (body(n).Iinv*cr(impulse_vec,rn))';
	//                 %body(n).x(1:3) = body(n).x(1:3) + penetration*normal * (body(n).m/bodyTotmass);
	//                 body(n).L = body(n).I*body(n).V(4:6)';
	//                 body(m).V(1:3) = body(m).V(1:3) -  1/body(m).m * impulse_vec';
	//                 body(m).V(4:6) = body(m).V(4:6) + (body(m).Iinv*cr(impulse_vec,rm))';
	//                 %body(m).x(1:3) = body(m).x(1:3) - penetration*normal * (body(m).m/bodyTotmass);
	//                 body(m).L = body(m).I*body(m).V(4:6)';


      }
    }
  } // End of impulse solve
  */

  /*
  // Iterate over contacts
  for(var l=0; l<this.iterations(); l++){
  for(var k=0; k<p1.length; k++){

  // Get current collision indeces
  var i = p1[k];
  var j = p2[k];
      
  // sphere-plane collision
  if((types[i]==SPHERE &&
  types[j]==PLANE) ||
  (types[i]==PLANE &&
  types[j]==SPHERE)){
	
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
  var n = world.geodata[pi].normal;
	
  // Check if penetration
  var r = new CANNON.Vec3(x[si]-x[pi],
  y[si]-y[pi],
  z[si]-z[pi]);
  var q = (r.dot(n)-world.geodata[si].radius)*2;
  var v_sphere = new CANNON.Vec3(vx[si],
  vy[si],
  vz[si]);
	
  var u = n.mult(v_sphere.dot(n));
	
  // Action if penetration
  if(q<0.0){

  var old_lambda = lambdas[k];
  var fs = new CANNON.Vec3(fx[si],
  fy[si],
  fz[si]);
  var new_deltalambda = (- q*world.spook_a(dt)
  - u.dot(n)*world.spook_b
  - (fs.dot(n)*world.invm[si])*dt
  - old_lambda*world.spook_eps(dt))/(world.invm[si]
  + 1/(world.mass[si]*Math.pow(world.geodata[si].radius,2.0/5.0))
  + world.spook_eps(dt));
	  
  var new_lambda = new_deltalambda - old_lambda; // + ?
	
  // Check sign of lambdas and fix
  if(new_lambda<0){
  new_deltalambda = -new_lambda;
  new_lambda = 0;
  }
	  
  // save for next timestep
  lambdas[k] = new_lambda;
	  
  // Accumulate velocities
  vx_lambda[si] += n.x * new_deltalambda * world.invm[si];
  vy_lambda[si] += n.y * new_deltalambda * world.invm[si];
  vz_lambda[si] += n.z * new_deltalambda * world.invm[si];
	  
  // --- Friction constraint ---
  // First assume stick friction
  var old_lambda_t1 = lambdas_t1[k];
  var old_lambda_t2 = lambdas_t2[k];
	  
  // Construct tangents
  var t1 = new CANNON.Vec3();
  var t2 = new CANNON.Vec3();
  n.tangents(t1,t2);

	  
  }
  } else if(types[i]==SPHERE &&
  types[j]==SPHERE){
  var r = new CANNON.Vec3(x[i]-x[j],
  y[i]-y[j],
  z[i]-z[j]);
  var nlen = r.norm();
  var n = new CANNON.Vec3(x[i]-x[j],
  y[i]-y[j],
  z[i]-z[j]);
  n.normalize();
  var q = (nlen - (world.geodata[i].radius+world.geodata[j].radius))*2;
  var u = new CANNON.Vec3(vx[i]-vx[j],
  vy[i]-vy[j],
  vz[i]-vz[j]);
  u = n.mult(u.dot(n));
  if(q<0.0){

  // Solve for lambda
  var old_lambda = lambdas[k];
  var fi = new CANNON.Vec3(fx[i],
  fy[i],
  fz[i]);
  var fj = new CANNON.Vec3(fx[j],
  fy[j],
  fz[j]);
  var new_deltalambda = (- q*world.spook_a(dt)
  - u.dot(n)*world.spook_b
  - (fi.dot(n)*world.invm[i] + fj.dot(n)*world.invm[j])*dt
  - old_lambda*world.spook_eps(dt))/(world.invm[i]
  + world.invm[j]
  + world.spook_eps(dt));
	
  var new_lambda = new_deltalambda - old_lambda;
	
  // Check sign of lambdas and fix
  if(new_lambda < 0.0){
  new_deltalambda = - new_lambda;
  new_lambda = 0;
  }
	
  // save for next timestep
  lambdas[k] = new_lambda;
	
  // Accumulate velocities
  vx_lambda[i] += n.x * new_deltalambda * world.invm[i];
  vy_lambda[i] += n.y * new_deltalambda * world.invm[i];
  vz_lambda[i] += n.z * new_deltalambda * world.invm[i];
  vx_lambda[j] -= n.x * new_deltalambda * world.invm[j];
  vy_lambda[j] -= n.y * new_deltalambda * world.invm[j];
  vz_lambda[j] -= n.z * new_deltalambda * world.invm[j];

  // Accumulate rotational velocities
  // I.inv() is just the mass for spheres
  // w_lambda[ij] = w_lambda[ij] +- I[ij].inv() * dlambda * (r x n)
  var rxn = r.cross(n);
  var Iinvi = world.mass[i];
  var Iinvj = world.mass[j];
	  
  wx_lambda[i] += Iinvi * new_deltalambda * rxn.x;
  wy_lambda[i] += Iinvi * new_deltalambda * rxn.y;
  wz_lambda[i] += Iinvi * new_deltalambda * rxn.z;
  wx_lambda[j] -= Iinvj * new_deltalambda * rxn.x;
  wy_lambda[j] -= Iinvj * new_deltalambda * rxn.y;
  wz_lambda[j] -= Iinvj * new_deltalambda * rxn.z;
  }
  }
  }
  }
  */

  // Add gravity to all objects
  for(var i=0; i<world.numObjects(); i++){
    fx[i] += world.gravity.x * world.mass[i];
    fy[i] += world.gravity.y * world.mass[i];
    fz[i] += world.gravity.z * world.mass[i];
  }

  this.solver.reset(world.numObjects());
  var cid = new Int16Array(p1.length); // For saving constraint refs
  for(var k=0; k<p1.length; k++){

    // Get current collision indeces
    var i = p1[k];
    var j = p2[k];
      
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
      var n = new CANNON.Vec3(world.body[pi]._shape.normal.x,
			      world.body[pi]._shape.normal.y,
			      world.body[pi]._shape.normal.z);
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
      var xp = xs.vsub(plane_to_sphere);

      // Pseudo name si := i
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      // xj is in this case the penetration point on the plane, and rj=0
      var qvec = new CANNON.Vec3(xp.x - x[si] - rsi.x,
				 xp.y - y[si] - rsi.y,
				 xp.z - z[si] - rsi.z);
      var q = qvec.dot(n);
	
      // Action if penetration
      if(q<0.0){
	cmatrix(si,pi,0,1); // Set current contact state to contact
	var v_sphere = new CANNON.Vec3(vx[si],vy[si],vz[si]);
	var w_sphere = new CANNON.Vec3(wx[si],wy[si],wz[si]);
	var v_contact = w_sphere.cross(rsi);
	var u = v_sphere.vadd(w_sphere.cross(rsi));

	// Which collision state?
	if(cmatrix(si,pi,-1)==0){ // No contact last timestep -> impulse

	  var r_star = rsi.crossmat();
	  var invm = this.invm;

	  // Inverse inertia matrix
	  var Iinv = new CANNON.Mat3([1.0/world.inertiax[si],0.0,0.0,
				      0.0,1.0/world.inertiay[si],0.0,
				      0,0.0,1.0/world.inertiaz[si]]);
	  // Collision matrix:
	  // K = 1/mi - r_star*I_inv*r_star;
	  var im = invm[si];
	  var K = new CANNON.Mat3([im,0,0,
				   0,im,0,
				   0,0,im]);
	  var rIr = r_star.mmult(Iinv.mmult(r_star));
	  for(var el = 0; el<9; el++)
	    K.elements[el] -= rIr.elements[el];
	
	  // First assume stick friction
	  var e = 0.5;

	  // Final velocity if stick
	  var v_f = n.mult(-e * u.dot(n));

	  var impulse_vec =  K.solve(v_f.vsub(u));

	  // Check if slide mode (J_t > J_n) - outside friction cone
	  var mu = 0.3; // quick fix
	  if(mu>0){
	    var J_n = n.mult(impulse_vec.dot(n));
	    var J_t = impulse_vec.vsub(J_n);
	    if(J_t.norm() > J_n.mult(mu).norm()){
	      var v_tang = u.vsub(n.mult(u.dot(n)));//v_sphere instead of u?
	      var tangent = v_tang.mult(1.0/(v_tang.norm() + 0.0001));
	      var impulse = -(1+e)*(u.dot(n))/(n.dot(K.vmult((n.vsub(tangent.mult(mu))))));
	      impulse_vec = n.mult(impulse).vsub(tangent.mult(mu * impulse));
	    }
	  }

	  // Add to velocity
	  // todo: add to angular velocity as below
	  var add = impulse_vec.mult(invm[si]);

	  vx[si] += add.x;
	  vy[si] += add.y;
	  vz[si] += add.z;

	  var cr = impulse_vec.cross(rsi);
	  var wadd = cr.mult(1.0/world.inertiax[si]);

	  wx[si] += wadd.x; //body(n).V(4:6) = body(n).V(4:6) + (body(n).Iinv*cr(impulse_vec,r))';
	  wy[si] += wadd.y;
	  wz[si] += wadd.z;

	} else if(cmatrix(si,pi,-1)==1){ // Last contact was also overlapping - contact
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
			   [-qvec.x,-qvec.y,-qvec.z,
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
			    fx[pi],fy[pi],fz[pi],
			    taux[pi],tauy[pi],tauz[pi]],
			   0,
			   'inf',
			   si,
			   pi);
	}
      }

    } else if(types[i]==SPHERE && types[j]==SPHERE){

      // Penetration constraint:
      var ri = new CANNON.Vec3(x[j]-x[i],
				y[j]-y[i],
				z[j]-z[i]);
      var r = new CANNON.Vec3(x[i]-x[j],
			       y[i]-y[j],
			       z[i]-z[j]);
      var nlen = r.norm();
      ri.normalize();
      ri.mult(world.body[i]._shape.radius,ri);
      var rj = new CANNON.Vec3(x[i]-x[j],
				y[i]-y[j],
				z[i]-z[j]);
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

	// gdot = ( vj + wj x rj - vi - wi x ri ) .dot ( ni )
	// => W = ( vj + wj x rj - vi - wi x ri )
	var v_sphere_i = new CANNON.Vec3(vx[i],vy[i],vz[i]);
	var v_sphere_j = new CANNON.Vec3(vx[j],vy[j],vz[j]);
	var w_sphere_i = new CANNON.Vec3(wx[i],wy[i],wz[i]);
	var w_sphere_j = new CANNON.Vec3(wx[j],wy[j],wz[j]);
	v_sphere_i.vadd(w_sphere_i.cross(ri));
	v_sphere_j.vadd(w_sphere_j.cross(rj));
	
	var u = v_sphere_j.vsub(v_sphere_i);

	var fi = new CANNON.Vec3(fx[i],
				  fy[i],
				  fz[i]);
	var fj = new CANNON.Vec3(fx[j],
				  fy[j],
				  fz[j]);

	var iM_i = !world.fixed[i] ? world.invm[i] : 0;
	var iI_i = !world.fixed[i] ? 1.0/world.inertiax[i] : 0;
	var iM_j = !world.fixed[j] ? world.invm[j] : 0;
	var iI_j = !world.fixed[j] ? 1.0/world.inertiax[j] : 0;
	var rxni = r.cross(ni);

	rxni.normalize();
	//console.log("sphere-sphere...");
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
			 
			 // qdot - motion along penetration normal
			 /*			 [-u.x,-u.y,-u.z,
						 0,0,0,
						 u.x,u.y,u.z,
						 0,0,0],*/
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

      var corners = [];
      var ex = world.body[bi]._shape.halfExtents;
      corners.push(new CANNON.Vec3(  ex.x,  ex.y,  ex.z));
      corners.push(new CANNON.Vec3( -ex.x,  ex.y,  ex.z));
      corners.push(new CANNON.Vec3( -ex.x, -ex.y,  ex.z));
      corners.push(new CANNON.Vec3( -ex.x, -ex.y, -ex.z));
      corners.push(new CANNON.Vec3(  ex.x, -ex.y, -ex.z));
      corners.push(new CANNON.Vec3(  ex.x,  ex.y, -ex.z));
      corners.push(new CANNON.Vec3( -ex.x,  ex.y, -ex.z));
      corners.push(new CANNON.Vec3(  ex.x, -ex.y,  ex.z)); 
      
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
    }
  }

  if(this.solver.n){
    this.solver.solve();
    //world.togglepause();

    // Apply constraint velocities
    /*
      for(var l=0; l<this.solver.n; l++){
      var i = p1[l];
      var j = p2[l];
      if(!world.fixed[i]){
      vx[i] += this.solver.result[0+cid[l]*12];
      vy[i] += this.solver.result[1+cid[l]*12];
      vz[i] += this.solver.result[2+cid[l]*12];
      wx[i] += this.solver.result[3+cid[l]*12];
      wy[i] += this.solver.result[4+cid[l]*12];
      wz[i] += this.solver.result[5+cid[l]*12];
      }

      if(!world.fixed[j]){
      vx[j] += this.solver.result[6+cid[l]*12];
      vy[j] += this.solver.result[7+cid[l]*12];
      vz[j] += this.solver.result[8+cid[l]*12];
      wx[j] += this.solver.result[9+cid[l]*12];
      wy[j] += this.solver.result[10+cid[l]*12];
      wz[j] += this.solver.result[11+cid[l]*12];
      }
      }*/
    for(var i=0; i<world.numObjects(); i++){
      vx[i] += this.solver.vxlambda[i];
      vy[i] += this.solver.vylambda[i];
      vz[i] += this.solver.vzlambda[i];
      wx[i] += this.solver.wxlambda[i];
      wy[i] += this.solver.wylambda[i];
      wz[i] += this.solver.wzlambda[i];
    }
  }

  /*
    if(this.solver.n)
    this.solver.solve();
    if(this.solver.result){
    console.log("v_lambda",vx_lambda,vy_lambda,vz_lambda);
    console.log("new v_lambda:",this.solver.result);
    this.togglepause();
    }
  */
  // --- End of new solver test ---

  // Leap frog
  // vnew = v + h*f/m
  // xnew = x + h*vnew
  for(var i=0; i<world.numObjects(); i++){
    if(!world.fixed[i]){
      vx[i] += fx[i] * world.invm[i] * dt;// + vx_lambda[i];
      vy[i] += fy[i] * world.invm[i] * dt;// + vy_lambda[i];
      vz[i] += fz[i] * world.invm[i] * dt;// + vz_lambda[i];

      wx[i] += taux[i] * 1.0/world.inertiax[i] * dt;// + wx_lambda[i];
      wy[i] += tauy[i] * 1.0/world.inertiay[i] * dt;// + wy_lambda[i];
      wz[i] += tauz[i] * 1.0/world.inertiaz[i] * dt;// + wz_lambda[i];

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

