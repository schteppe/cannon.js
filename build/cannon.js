/**
 * Copyright (c) 2012 cannon.js Authors
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
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
 * @class CANNON.Broadphase
 * @author schteppe
 * @todo Make it a base class for broadphase implementations, and rename this one to NaiveBroadphase
 */
CANNON.Broadphase = function(){
  /// The world to search for collisions in.
  this.world = null;
};
CANNON.Broadphase.prototype.constructor = CANNON.BroadPhase;

/**
 * @fn collisionPairs
 * @memberof CANNON.Broadphase
 * @brief Get the collision pairs from the world
 * @return array
 */
CANNON.Broadphase.prototype.collisionPairs = function(){
  throw "collisionPairs not implemented for this BroadPhase class!";
};

/**
 * @class CANNON.NaiveBroadphase
 * @brief Naive broadphase implementation, used in lack of better ones. The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
 * @extends CANNON.Broadphase
 */
CANNON.NaiveBroadphase = function(){
  
};
CANNON.NaiveBroadphase.prototype = new CANNON.Broadphase();
CANNON.NaiveBroadphase.prototype.constructor = CANNON.NaiveBroadphase;

/**
 * @fn collisionPairs
 * @memberof CANNON.NaiveBroadphase
 * @brief Get all the collision pairs in the physics world
 * @return array An array containing two arrays of integers. The integers corresponds to the body indeces.
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
  var qx = world.qx;
  var qy = world.qy;
  var qz = world.qz;
  var qw = world.qw;
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

	var pi = type[i]==PLANE ? i : j, // Plane
	  oi = type[i]!=PLANE ? i : j, // Other
	  
	  // Rel. position
	  r = new CANNON.Vec3(x[oi]-x[pi],
			      y[oi]-y[pi],
			      z[oi]-z[pi]),
	  quat = new CANNON.Quaternion(qx[pi],qy[pi],qz[pi],qw[pi]),
	  normal = quat.vmult(body[pi]._shape.normal),
	  q = r.dot(normal)-body[oi]._shape.boundingSphereRadius();
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
 * @class CANNON.Mat3
 * @brief Produce a 3x3 matrix. Columns first!
 * @param array elements Array of nine elements. Optional.
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Mat3 = function(elements){
  if(elements)
    this.elements = new Float32Array(elements);
  else
    this.elements = new Float32Array(9);
};

/**
 * @fn identity
 * @memberof CANNON.Mat3
 * @brief Sets the matrix to identity
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
 * @fn vmult
 * @memberof CANNON.vmult
 * @brief Matrix-Vector multiplication
 * @param CANNON.Vec3 v The vector to multiply with
 * @param CANNON.Vec3 target Optional, target to save the result in.
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
 * @fn smult
 * @memberof CANNON.Mat3
 * @brief Matrix-scalar multiplication
 * @param float s
 */
CANNON.Mat3.prototype.smult = function(s){
  for(var i=0; i<this.elements.length; i++)
    this.elements[i] *= s;
};

/**
 * @fn mmult
 * @memberof CANNON.Mat3
 * @brief Matrix multiplication
 * @param CANNON.Mat3 m Matrix to multiply with from left side.
 * @return CANNON.Mat3 The result.
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
 * @fn solve
 * @memberof CANNON.Mat3
 * @brief Solve Ax=b
 * @param CANNON.Vec3 b The right hand side
 * @param CANNON.Vec3 target Optional. Target vector to save in.
 * @return CANNON.Vec3 The solution x
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
 * @fn e
 * @memberof CANNON.Mat3
 * @brief Get an element in the matrix by index. Index starts at 0, not 1!!!
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
 * @fn copy
 * @memberof CANNON.Mat3
 * @brief Copy the matrix
 * @param CANNON.Mat3 target Optional. Target to save the copy in.
 * @return CANNON.Mat3
 */
CANNON.Mat3.prototype.copy = function(target){
  target = target || new Mat3();
  for(var i=0; i<this.elements.length; i++)
    target.elements[i] = this.elements[i];
  return target;
};

/**
 * @fn toString
 * @memberof CANNON.Mat3
 * @brief Returns a string representation of the matrix.
 * @return string
 */
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
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional. Target to save in.
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.cross = function(v,target){
  target = target || new CANNON.Vec3();
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
  return this;
};
    
/**
 * Vector addition
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional.
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.vadd = function(v,target){
  if(target){
    target.x = v.x + this.x;
    target.y = v.y + this.y;
    target.z = v.z + this.z;
  } else {
    return new CANNON.Vec3(this.x + v.x,
			   this.y + v.y,
			   this.z + v.z);
  }  
};
    
/**
 * Vector subtraction
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional. Target to save in.
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.vsub = function(v,target){
  if(target){
    target.x = this.x - v.x;
    target.y = this.y - v.y;
    target.z = this.z - v.z;
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
 * @return CANNON.Mat3
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
 * Get the version of this vector that is of length 1.
 * @param CANNON.Vec3 target Optional target to save in
 * @return CANNON.Vec3 Returns the unit vector
 */
CANNON.Vec3.prototype.unit = function(target){
  target = target || new CANNON.Vec3();
  var ninv = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  if(ninv>0.0){
    ninv = 1.0/ninv;
    target.x = this.x * ninv;
    target.y = this.y * ninv;
    target.z = this.z * ninv;
  } else {
    target.x = 0;
    target.y = 0;
    target.z = 0;
  }
  return target;
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
 * @param CANNON.Vec3 target
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.mult = function(scalar,target){
  if(!target)
    target = new CANNON.Vec3();
  target.x = scalar*this.x;
  target.y = scalar*this.y;
  target.z = scalar*this.z;
  return target;
};

/**
 * Calculate dot product
 * @param CANNON.Vec3 v
 * @return float
 */
CANNON.Vec3.prototype.dot = function(v){
  return (this.x * v.x + this.y * v.y + this.z * v.z);
};

/**
 * Make the vector point in the opposite direction.
 * @param CANNON.Vec3 target Optional target to save in
 * @return CANNON.Vec3
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
 * @param CANNON.Vec3 t1 Vector object to save the first tangent in
 * @param CANNON.Vec3 t2 Vector object to save the second tangent in
 */
CANNON.Vec3.prototype.tangents = function(t1,t2){
  var norm = this.norm();
  if(norm>0.0){
    var n = new CANNON.Vec3(this.x/norm,
			    this.y/norm,
			    this.z/norm);
    if(n.x<0.9){
      var rand = Math.random();
      n.cross(new CANNON.Vec3(rand,0.0000001,0).unit(),t1);
    } else
      n.cross(new CANNON.Vec3(0.0000001,rand,0).unit(),t1);
    n.cross(t1,t2);
  } else {
    // The normal length is zero, make something up
    t1.set(1,0,0).normalize();
    t2.set(0,1,0).normalize();
  }
};

/**
 * Converts to a more readable format
 * @return string
 */
CANNON.Vec3.prototype.toString = function(){
  return this.x+","+this.y+","+this.z;
};

/**
 * Copy the vector.
 * @param CANNON.Vec3 target
 * @return CANNON.Vec3
 */
CANNON.Vec3.prototype.copy = function(target){
  target = target || new CANNON.Vec3();
  target.x = this.x;
  target.y = this.y;
  target.z = this.z;
  return target;
};
/**
 * 4-dimensional quaternion
 * @class CANNON.Quaternion
 * @param float x
 * @param float y
 * @param float z 
 * @param float w
 */
CANNON.Quaternion = function(x,y,z,w){
  this.x = x!=undefined ? x : 0;
  this.y = y!=undefined ? y : 0;
  this.z = z!=undefined ? z : 0;
  this.w = w!=undefined ? w : 1;
};

/**
 * Convert to a readable format
 * @return string
 */
CANNON.Quaternion.prototype.toString = function(){
  return this.x+","+this.y+","+this.z+","+this.w;
};

/**
 * Set the quaternion components given an axis and an angle.
 * @param CANNON.Vec3 axis
 * @param float angle in radians
 */
CANNON.Quaternion.prototype.setFromAxisAngle = function(axis,angle){
  var s = Math.sin(angle*0.5);
  this.x = axis.x * s;
  this.y = axis.y * s;
  this.z = axis.z * s;
  this.w = Math.cos(angle*0.5);
};

/**
 * Set the quaternion value given two vectors. The resulting rotation will be the needed rotation to rotate u to v.
 * @param CANNON.Vec3 u
 * @param CANNON.Vec3 v
 */
CANNON.Quaternion.prototype.setFromVectors = function(u,v){
  var a = u.cross(v);
  this.x = a.x;
  this.y = a.y;
  this.z = a.z;
  this.w = Math.sqrt(Math.pow(u.norm(),2) * Math.pow(v.norm(),2)) + u.dot(v);
  this.normalize();
};

/**
 * Quaternion multiplication
 * @param CANNON.Quaternion q
 * @param CANNON.Quaternion target Optional.
 * @return CANNON.Quaternion
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
 * Get the inverse quaternion rotation.
 * @param CANNON.Quaternion target
 */
CANNON.Quaternion.prototype.inverse = function(target){
  if(target==undefined)
    target = new CANNON.Quaternion();
  
  target.x = -this.x;
  target.y = -this.y;
  target.z = -this.z;
  target.w = this.w;

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
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional
 * @return CANNON.Vec3
 */
CANNON.Quaternion.prototype.vmult = function(v,target){
  target = target || new CANNON.Vec3();
  if(this.w==0.0){
    target.x = v.x;
    target.y = v.y;
    target.z = v.z;
  } else {
    
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
  }

  return target;
};/**
 * @class CANNON.Shape
 * @author schteppe
 * @brief Base class for shapes
 */
CANNON.Shape = function(){

  /**
   * @property int type
   * @memberof CANNON.Shape
   * @brief The type of this shape. Must be set to an int > 0 by subclasses.
   * @see CANNON.Shape.types
   */
  this.type = 0;
};
CANNON.Shape.prototype.constructor = CANNON.Shape;

/**
 * @fn boundingSphereRadius
 * @memberof CANNON.Shape
 * @brief Get the bounding sphere radius from this shape
 * @return float
 */
CANNON.Shape.prototype.boundingSphereRadius = function(){
  throw "boundingSphereRadius() not implemented for shape type "+this.type;
};

/**
 * @fn volume
 * @memberof CANNON.Shape
 * @brief Get the volume of this shape
 * @return float
 */
CANNON.Shape.prototype.volume = function(){
  throw "volume() not implemented for shape type "+this.type;
};

/**
 * @fn calculateLocalInertia
 * @memberof CANNON.Shape
 * @brief Calculates the inertia in the local frame for this shape.
 * @return CANNON.Vec3
 * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
 */
CANNON.Shape.prototype.calculateLocalInertia = function(mass,target){
  throw "calculateLocalInertia() not implemented for shape type "+this.type;
};

/**
 * @fn calculateTransformedInertia
 * @memberof CANNON.Shape
 * @brief Calculates inertia in a specified frame for this shape.
 * @return CANNON.Vec3
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

/**
 * @enum CANNON.Shape.types
 * @brief The available shape types.
 */
CANNON.Shape.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4,
  COMPOUND:8
};

/**
 * Rigid body base class
 * @class CANNON.RigidBody
 * @param float mass
 * @param CANNON.Shape shape
 * @param CANNON.Material material
 * @todo Motion state? Like dynamic, kinematic, static...
 */
CANNON.RigidBody = function(mass,shape,material){
  // Local variables
  this._position = new CANNON.Vec3();
  this._velocity = new CANNON.Vec3();
  this._force = new CANNON.Vec3();
  this._tau = new CANNON.Vec3();
  this._quaternion = new CANNON.Quaternion(0,0,0,1);
  this._rotvelo = new CANNON.Vec3();
  this._mass = mass;
  this._shape = shape;
  this._inertia = shape.calculateLocalInertia(mass);
  this._material = material;
  this._linearDamping = 0.01; // Perhaps default should be zero here?
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
 * @param CANNON.Shape s
 * @return CANNON.Shape
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
 * @param CANNON.Vec3 target Optional.
 * @return CANNON.Vec3
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
 * @param CANNON.Quaternion target Optional.
 * @return CANNON.Quaternion
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
 * @param float x
 * @param float y
 * @param float z
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
 * @param CANNON.Vec3 target Optional.
 * @return CANNON.Vec3
 */
CANNON.RigidBody.prototype.getVelocity = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.vx[this._id];
    target.y = this._world.vy[this._id];
    target.z = this._world.vz[this._id];
  } else {
    target.x = this._velocity.x;
    target.y = this._velocity.y;
    target.z = this._velocity.z;
  }
  return target;
};

/**
 * Sets the angularvelocity of the object
 * @param float x
 * @param float y
 * @param float z
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
 * Gets the angular velocity of the object
 * @param CANNON.Vec3 target Optional.
 * @return CANNON.Vec3
 */
CANNON.RigidBody.prototype.getAngularVelocity = function(target){
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
 * @param CANNON.Vec3 target Optional.
 * @return CANNON.Vec3
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
 * @param CANNON.Vec3 target Optional.
 * @return CANNON.Vec3
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
 * @class CANNON.Sphere
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
 * @class CANNON.Box
 * @param CANNON.Vec3 halfExtents
 * @author schteppe
 * @extends CANNON.Shape
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
  target.x = 1.0 / 12.0 * mass * (   2*this.halfExtents.y*2*this.halfExtents.y
				   + 2*this.halfExtents.z*2*this.halfExtents.z );
  target.y = 1.0 / 12.0 * mass * (   2*this.halfExtents.x*2*this.halfExtents.x
				   + 2*this.halfExtents.z*2*this.halfExtents.z );
  target.z = 1.0 / 12.0 * mass * (   2*this.halfExtents.y*2*this.halfExtents.y
				   + 2*this.halfExtents.x*2*this.halfExtents.x );
  return target;
};

/**
 * @fn getCorners
 * @memberof CANNON.Box
 * @brief Get the box corners
 * @param CANNON.Quaternion quat Orientation to apply to the corner vectors. If not provided, the vectors will be in respect to the local frame.
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
 * @fn getSideNormals
 * @memberof CANNON.Box
 * @brief Get the box 6 side normals
 * @param bool includeNegative If true, this function returns 6 vectors. If false, it only returns 3 (but you get 6 by reversing those 3)
 * @param CANNON.Quaternion quat Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
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
  return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
};

CANNON.Box.prototype.boundingSphereRadius = function(){
  return this.halfExtents.norm();
};/**
 * @class Plane
 * @param CANNON.Vec3 normal
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
 * @param CANNON.Shape shape
 * @param CANNON.Vec3 offset
 * @param CANNON.Quaternion orientation
 */
CANNON.Compound.prototype.addChild = function(shape,offset,orientation){
  offset = offset || new CANNON.Vec3();
  orientation = orientation || new CANNON.Quaternion();
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
 * @return CANNON.Vec3
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

  // Don't know number of constraints yet... Use dynamic arrays
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

  // We know number of bodies so we can allocate these now
  this.vxlambda = new Float32Array(numbodies);
  this.vylambda = new Float32Array(numbodies);
  this.vzlambda = new Float32Array(numbodies);
  this.wxlambda = new Float32Array(numbodies);
  this.wylambda = new Float32Array(numbodies);
  this.wzlambda = new Float32Array(numbodies);
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
    console.log("lower:",lower);
    console.log("upper:",upper);
  }
  
  for(var i=0; i<12; i++){
    this.q.push(q[i]);
    this.qdot.push(qdot[i]);
    this.MinvTrace.push(MinvTrace[i]);
    this.G.push(G[i]);
    this.Fext.push(Fext[i]);
  }

  this.upper.push(upper);
  this.hasupper.push(!isNaN(upper));
  this.lower.push(lower);
  this.haslower.push(!isNaN(lower));
  
  this.i.push(body_i);
  this.j.push(body_j);

  this.n += 1;

  // Return result index
  return this.n - 1; 
};

/**
 * Add a non-penetration constraint to the solver
 * @param CANNON.Vec3 ni
 * @param CANNON.Vec3 ri
 * @param CANNON.Vec3 rj
 * @param CANNON.Vec3 iMi
 * @param CANNON.Vec3 iMj
 * @param CANNON.Vec3 iIi
 * @param CANNON.Vec3 iIj
 * @param CANNON.Vec3 v1
 * @param CANNON.Vec3 v2
 * @param CANNON.Vec3 w1
 * @param CANNON.Vec3 w2
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
	// Only add normal contributions here? See eq. 27 in spooknotes
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
	  console.log("hit lower bound for constraint "+l+", truncating "+lambda[l]+" to the bound "+this.lower[l]);
	lambda[l] = this.lower[l];
	dlambda[l] = this.lower[l]-lambda[l];
      }
      if(this.hasupper && lambda[l]>this.upper[l]){
	if(this.debug)
	  console.log("hit upper bound for constraint "+l+", truncating "+lambda[l]+" to the bound "+this.upper[l]);
	lambda[l] = this.upper[l];
	dlambda[l] = this.upper[l]-lambda[l];
      }

      // Add velocity changes to keep track of them
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
    }
  }

  if(this.debug)
    for(var i=0; i<this.vxlambda.length; i++)
      console.log("dv["+i+"]=",
		  this.vxlambda[i],
		  this.vylambda[i],
		  this.vzlambda[i],
		  this.wxlambda[i],
		  this.wylambda[i],
		  this.wzlambda[i]);
};
/**
 * @class CANNON.Material
 * @brief Defines a physics material.
 * @param string name
 * @author schteppe
 */
CANNON.Material = function(name){
  /**
   * @property string name
   * @memberof CANNON.Material
   */
  this.name = name;
  this._id = -1;
};

/**
 * @class CANNON.ContactMaterial
 * @brief Defines what happens when two materials meet.
 * @param CANNON.Material m1
 * @param CANNON.Material m2
 * @param float friction
 * @param float restitution
 * @todo Contact solving parameters here too?
 */
CANNON.ContactMaterial = function(m1, m2, friction, restitution){

  /// Contact material index in the world, -1 until added to the world
  this._id = -1;

  /// The two materials participating in the contact
  this.materials = [m1,m2];

  /// Kinetic friction
  this.friction = friction!=undefined ? Number(friction) : 0.3;

  /// Restitution
  this.restitution =      restitution!=undefined ?      Number(restitution) :      0.3;
  
};

/**
 * The physics world
 * @class CANNON.World
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

  /// Default and last timestep sizes
  this.default_dt = 1/60;
  this.last_dt = this.default_dt;

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

  // Materials
  this._materials = []; // References to all added materials
  this._contactmaterials = []; // All added contact materials
  this._mats2cmat = []; // Hash: (mat1_id, mat2_id) => contactmat_id
};

/**
 * Toggle pause mode. When pause is enabled, step() won't do anything.
 * @deprecated Pausing is the simulation gui's responsibility, should remove this.
 */
CANNON.World.prototype.togglepause = function(){
  this.paused = !this.paused;
};

/**
 * Get the contact material between materials m1 and m2
 * @param CANNON.Material m1
 * @param CANNON.Material m2
 * @return CANNON.Contactmaterial The contact material if it was found.
 */
CANNON.World.prototype.getContactMaterial = function(m1,m2){
  if((m1 instanceof CANNON.Material) && 
     (m2 instanceof CANNON.Material)){

    var i = m1._id;
    var j = m2._id;

    if(i<j){
      var temp = i;
      i = j;
      j = temp;
    }
    return this._contactmaterials[this._mats2cmat[i+j*this._materials.length]];
  }
};

/**
 * Add an impulse to the colliding bodies i and j
 * @param int i Body number 1
 * @param int i Body number 2
 * @param CANNON.Vec3 ri Vector from body 1's center of mass to the contact point on its surface
 * @param CANNON.Vec3 ri Vector from body 1's center of mass to the contact point on its surface
 * @param CANNON.Vec3 ui The relative velocity eg. vj+wj*rj - (vi+wj*rj)
 * @param CANNON.Vec3 ni The contact normal pointing out from body i.
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
 * @param CANNON.RigidBody body
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
 * @param CANNON.RigidBody body
 * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
 * @todo Adding an array of bodies should be possible. This would save some loops too
 */
CANNON.World.prototype.add = function(body){
  if(!body) return;
  var t = this;

  var n = t.numObjects();

  var old_x =    t.x,    old_y =  t.y,      old_z = t.z;
  var old_vx =   t.vx,   old_vy = t.vy,     old_vz = t.vz;
  var old_fx =   t.fx,   old_fy = t.fy,     old_fz = t.fz;
  var old_taux = t.taux, old_tauy = t.tauy, old_tauz = t.tauz;
  var old_wx =   t.wx,   old_wy = t.wy,     old_wz = t.wz;
  var old_qx =   t.qx,   old_qy = t.qy,     old_qz = t.qz, old_qw = t.qw;

  var old_type = t.type;
  var old_body = t.body;
  var old_fixed = t.fixed;
  var old_invm = t.invm;
  var old_mass = t.mass;
  var old_material = t.material;

  var old_inertiax = t.inertiax, old_inertiay = t.inertiay, old_inertiaz = t.inertiaz;
  var old_iinertiax = t.iinertiax, old_iinertiay = t.iinertiay, old_iinertiaz = t.iinertiaz;

  function f(){ return new Float32Array(n+1); };

  t.x = f();  t.y = f();  t.z = f();
  t.vx = f(); t.vy = f(); t.vz = f();
  t.fx = f(); t.fy = f(); t.fz = f();
  t.taux = f(); t.tauy = f(); t.tauz = f();
  t.wx = f(); t.wy = f(); t.wz = f();
  t.qx = f(); t.qy = f(); t.qz = f(); t.qw = f();

  t.type = new Int16Array(n+1);
  t.body = [];
  t.fixed = new Int16Array(n+1);
  t.mass = f();
  /// References to material for each body
  t.material = new Int16Array(n+1);
  t.inertiax = f();
  t.inertiay = f();
  t.inertiaz = f();
  t.iinertiax = f();
  t.iinertiay = f();
  t.iinertiaz = f();
  t.invm = f();
  
  // Add old data to new array
  for(var i=0; i<n; i++){
    t.x[i] =    old_x[i];    t.y[i] = old_y[i];       t.z[i] = old_z[i];
    t.vx[i] =   old_vx[i];   t.vy[i] = old_vy[i];     t.vz[i] = old_vz[i];
    t.fx[i] =   old_fx[i];   t.fy[i] = old_fy[i];     t.fz[i] = old_fz[i];
    t.taux[i] = old_taux[i]; t.tauy[i] = old_tauy[i]; t.tauz[i] = old_tauz[i];
    t.wx[i] =   old_wx[i];   t.wy[i] = old_wy[i];     t.wz[i] = old_wz[i];

    t.qx[i] = old_qx[i];
    t.qy[i] = old_qy[i];
    t.qz[i] = old_qz[i];
    t.qw[i] = old_qw[i];

    t.type[i] = old_type[i];
    t.body[i] = old_body[i];
    t.fixed[i] = old_fixed[i];
    t.invm[i] = old_invm[i];
    t.mass[i] = old_mass[i];
    t.material[i] = old_material[i];
    t.inertiax[i] = old_inertiax[i];
    t.inertiay[i] = old_inertiay[i];
    t.inertiaz[i] = old_inertiaz[i];
    t.iinertiax[i] = old_iinertiax[i];
    t.iinertiay[i] = old_iinertiay[i];
    t.iinertiaz[i] = old_iinertiaz[i];
  }

  // Add one more
  t.x[n] = body._position.x;
  t.y[n] = body._position.y;
  t.z[n] = body._position.z;
  
  t.vx[n] = body._velocity.x;
  t.vy[n] = body._velocity.y;
  t.vz[n] = body._velocity.z;
  
  t.fx[n] = body._force.x;
  t.fy[n] = body._force.y;
  t.fz[n] = body._force.z;
  
  t.taux[n] = body._tau.x;
  t.tauy[n] = body._tau.y;
  t.tauz[n] = body._tau.z;

  t.wx[n] = body._rotvelo.x;
  t.wy[n] = body._rotvelo.y;
  t.wz[n] = body._rotvelo.z;
  
  t.qx[n] = body._quaternion.x;
  t.qy[n] = body._quaternion.y;
  t.qz[n] = body._quaternion.z;
  t.qw[n] = body._quaternion.w;

  t.type[n] = body._shape.type;
  t.body[n] = body; // Keep reference to body
  t.fixed[n] = body._mass<=0.0 ? 1 : 0;
  t.invm[n] = body._mass>0 ? 1.0/body._mass : 0;
  t.mass[n] = body._mass;
  t.material[n] = body._material!=undefined ? body._material._id : -1;
  t.inertiax[n] = body._inertia.x;
  t.inertiay[n] = body._inertia.y;
  t.inertiaz[n] = body._inertia.z;
  t.iinertiax[n] = body._inertia.x > 0 ? 1.0/body._inertia.x : 0.0;
  t.iinertiay[n] = body._inertia.y > 0 ? 1.0/body._inertia.y : 0.0;
  t.iinertiaz[n] = body._inertia.z > 0 ? 1.0/body._inertia.z : 0.0;

  body._id = n; // give id as index in table
  body._world = t;

  // Create collision matrix
  t.collision_matrix = new Int16Array((n+1)*(n+1));
};


/**
 * Remove a rigid body from the simulation.
 * @param CANNON.RigidBody body
 */
CANNON.World.prototype.remove = function(body){
  if(!body) return;
  var t = this;
  var n = t.numObjects();

  var o = {}; // save old things
  o.x = t.x;       o.y =    t.y;    o.z = t.z;
  o.vx = t.vx;     o.vy =   t.vy;   o.vz = t.vz;
  o.fx = t.fx;     o.fy =   t.fy;   o.fz = t.fz;
  o.taux = t.taux; o.tauy = t.tauy; o.tauz = t.tauz;
  o.wx = t.wx;     o.wy =   t.wy;   o.wz = t.wz;
  o.qx = t.qx;     o.qy =   t.qy;   o.qz = t.qz; o.qw = t.qw;
  o.type = t.type;
  o.body = t.body;
  o.fixed = t.fixed;
  o.mass = t.mass;
  o.material =  t.material;
  o.inertiax =  t.inertiax;  o.inertiay = t.inertiay;   o.inertiaz = t.inertiaz;
  o.iinertiax = t.iinertiax; o.iinertiay = t.iinertiay; o.iinertiaz = t.iinertiaz;
  o.invm =      t.invm;

  function f(){ return new Float32Array(n-1); };

  // Create new arrays
  t.x = f();    t.y = f();    t.z = f();
  t.vx = f();   t.vy = f();   t.vz = f();
  t.fx = f();   t.fy = f();   t.fz = f();
  t.taux = f(); t.tauy = f(); t.tauz = f();
  t.wx = f();   t.wy = f();   t.wz = f();
  t.qx = f();   t.qy = f();   t.qz = f(); t.qw = f();

  t.type = new Int16Array(n-1);
  t.body = [];
  t.fixed = new Int16Array(n-1);
  t.mass = f();
  /// References to material for each body
  t.material = new Int16Array(n-1);
  t.inertiax = f();
  t.inertiay = f();
  t.inertiaz = f();
  t.iinertiax = f();
  t.iinertiay = f();
  t.iinertiaz = f();
  t.invm = f();
  
  // Copy old data to new arrays, without the deleted index
  for(var j=0; j<n; j++){
    if(j!=body._id){      
      var i = j>body._id ? j-1 : j;
      t.x[i] =    o.x[j];    t.y[i] = o.y[j];       t.z[i] = o.z[j];
      t.vx[i] =   o.vx[j];   t.vy[i] = o.vy[j];     t.vz[i] = o.vz[j];
      t.fx[i] =   o.fx[j];   t.fy[i] = o.fy[j];     t.fz[i] = o.fz[j];
      t.taux[i] = o.taux[j]; t.tauy[i] = o.tauy[j]; t.tauz[i] = o.tauz[j];
      t.wx[i] =   o.wx[j];   t.wy[i] = o.wy[j];     t.wz[i] = o.wz[j];
      
      t.qx[i] = o.qx[j];
      t.qy[i] = o.qy[j];
      t.qz[i] = o.qz[j];
      t.qw[i] = o.qw[j];
      
      t.type[i] = o.type[j];
      t.body[i] = o.body[j];

      t.body[i]._id = i;

      t.fixed[i] = o.fixed[j];
      t.invm[i] = o.invm[j];
      t.mass[i] = o.mass[j];
      t.material[i] = o.material[j];
      t.inertiax[i] = o.inertiax[j];
      t.inertiay[i] = o.inertiay[j];
      t.inertiaz[i] = o.inertiaz[j];
      t.iinertiax[i] = o.iinertiax[j];
      t.iinertiay[i] = o.iinertiay[j];
      t.iinertiaz[i] = o.iinertiaz[j];
    }
  }

  // disconnect to the world
  body._id = -1;
  body._world = null;

  // Reset collision matrix
  t.collision_matrix = new Int16Array((n-1)*(n-1));
};

/**
 * Adds a material to the World. A material can only be added once, it's added more times then nothing will happen.
 * @param CANNON.Material m
 */
CANNON.World.prototype.addMaterial = function(m){
  if(m._id==-1){
    this._materials.push(m);
    m._id = this._materials.length-1;

    // Enlarge matrix
    var newcm = new Int16Array((this._materials.length)
			       * (this._materials.length));
    for(var i=0; i<newcm.length; i++)
      newcm[i] = -1;

    // Copy over old values
    for(var i=0; i<this._materials.length-1; i++)
      for(var j=0; j<this._materials.length-1; j++)
	newcm[i+this._materials.length*j] = this._mats2cmat[i+(this._materials.length-1)*j];
    this._mats2cmat = newcm;
  
  }
};

/**
 * Adds a contact material to the World
 * @param CANNON.ContactMaterial cmat
 */
CANNON.World.prototype.addContactMaterial = function(cmat) {

  // Add materials if they aren't already added
  this.addMaterial(cmat.materials[0]);
  this.addMaterial(cmat.materials[1]);

  // Save (material1,material2) -> (contact material) reference for easy access later
  // Make sure i>j, ie upper right matrix
  if(cmat.materials[0]._id > cmat.materials[1]._id){
    i = cmat.materials[0]._id;
    j = cmat.materials[1]._id;
  } else {
    j = cmat.materials[0]._id;
    i = cmat.materials[1]._id;
  }
    
  // Add contact material
  this._contactmaterials.push(cmat);
  cmat._id = this._contactmaterials.length-1;

  // Add current contact material to the material table
  this._mats2cmat[i+this._materials.length*j] = cmat._id; // index of the contact material
};

/**
 * Get/set the broadphase collision detector for the world.
 * @param CANNON.BroadPhase broadphase
 * @return CANNON.BroadPhase
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
  if(n===undefined)
    return this.solver.iter;
  else if(Number(n) && n>0)
    this.solver.iter = parseInt(n);
  else
    throw "Argument must be an integer larger than 0";
};

/**
 * Set the gravity
 * @param CANNON.Vec3
 * @return CANNON.Vec3
 */
CANNON.World.prototype.gravity = function(g){
  if(g==undefined)
    return this._gravity;
  else
    this._gravity = g;
};

/**
 * Step the simulation
 * @param float dt
 */
CANNON.World.prototype.step = function(dt){

  var world = this;
  
  if(dt==undefined){
    if(this.last_dt)
      dt = this.last_dt;
    else
      dt = this.default_dt;
  }

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
    fx[i] += world._gravity.x * world.mass[i];
    fy[i] += world._gravity.y * world.mass[i];
    fz[i] += world._gravity.z * world.mass[i];
  }

  // Reset contact solver
  this.solver.reset(world.numObjects());

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
    var swapped = false;
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
     * @todo Perhaps we should make a Contact class out of this instead...
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
      var temp = CANNON.Vec3()
      temp = r.ri; r.ri = r.rj; r.rj = temp;
      r.ni.negate(r.ni);
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
		  xj.vadd(qj.vmult(sj.childOffsets[i])), // Transform the shape to its local frame
		  qi,
		  qj.mult(sj.childOrientations[i]));
	// Transform back
	for(var j=0; j<r.length; j++){
	  r[j].rj.vadd(qj.vmult(sj.childOffsets[i]),r[j].rj);
	  result.push(r[j]);
	}
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
	r.rj.mult(-sj.radius,r.rj);
	result.push(r);

      } else if(sj.type==CANNON.Shape.types.PLANE){ // sphere-plane

	// We will have one contact in this case
	var r = makeResult();

	// Contact normal
	sj.normal.copy(r.ni);
	qj.vmult(r.ni,r.ni);
	r.ni.negate(r.ni); // body i is the sphere, flip normal
	r.ni.normalize();

	// Vector from sphere center to contact point
	r.ni.mult(si.radius,r.ri);

	// Project down sphere on plane
	var point_on_plane_to_sphere = xi.vsub(xj);
	var plane_to_sphere_ortho = r.ni.mult(r.ni.dot(point_on_plane_to_sphere));
	r.rj = point_on_plane_to_sphere.vsub(plane_to_sphere_ortho); // The sphere position projected to plane
	if(plane_to_sphere_ortho.norm() <= si.radius)
	  result.push(r);
	
      } else if(sj.type==CANNON.Shape.types.BOX){ // sphere-box

	// we refer to the box as body j
	var box_to_sphere =  xi.vsub(xj);
	var sides = sj.getSideNormals(true,qj);
	var R =     si.radius;
	var penetrating_sides = [];

	// Check side (plane) intersections
	var found = false;
	for(var idx=0; idx<sides.length && !found; idx++){ // Max 3 penetrating sides
	  var ns = sides[idx].copy();
	  var h = ns.norm();
	  ns.normalize();
	  var dot = box_to_sphere.dot(ns);
	  if(dot<h+R && dot>0){
	    // Intersects plane. Now check the other two dimensions
	    var ns1 = sides[(idx+1)%3].copy();
	    var ns2 = sides[(idx+2)%3].copy();
	    var h1 = ns1.norm();
	    var h2 = ns2.norm();
	    ns1.normalize();
	    ns2.normalize();
	    var dot1 = box_to_sphere.dot(ns1);
	    var dot2 = box_to_sphere.dot(ns2);
	    if(dot1<h1 && dot1>-h1 && dot2<h2 && dot2>-h2){
	      found = true;
	      var r = makeResult();
	      ns.mult(-R,r.ri); // Sphere r
	      ns.copy(r.ni);
	      r.ni.negate(r.ni); // Normal should be out of sphere
	      ns.mult(h).vadd(ns1.mult(dot1)).vadd(ns2.mult(dot2),r.rj); // box
	      result.push(r);
	    }
	  }
	}

	// Check corners
	for(var j=0; j<2 && !found; j++){
	  for(var k=0; k<2 && !found; k++){
	    for(var l=0; l<2 && !found; l++){
	      var rj = new CANNON.Vec3();
	      if(j) rj.vadd(sides[0],rj);
	      else  rj.vsub(sides[0],rj);
	      if(k) rj.vadd(sides[1],rj);
	      else  rj.vsub(sides[1],rj);
	      if(l) rj.vadd(sides[2],rj);
	      else  rj.vsub(sides[2],rj);

	      // World position of corner
	      var sphere_to_corner = xj.vadd(rj).vsub(xi);
	      if(sphere_to_corner.norm()<R){
		found = true;
		var r = makeResult();
		sphere_to_corner.copy(r.ri);
		r.ri.normalize();
		r.ri.copy(r.ni);
		r.ri.mult(R,r.ri);
		rj.copy(r.rj);
		result.push(r);
	      }
	    }
	  }
	}

	// Check edges
	for(var j=0; j<sides.length && !found; j++){
	  for(var k=0; k<sides.length && !found; k++){
	    if(j%3!=k%3){
	      // Get edge tangent
	      var edgeTangent = sides[k].cross(sides[j]);
	      edgeTangent.normalize();
	      var edgeCenter = sides[j].vadd(sides[k]);
	      
	      var r = xi.vsub(edgeCenter.vadd(xj)); // r = edge center to sphere center
	      var orthonorm = r.dot(edgeTangent); // distance from edge center to sphere center in the tangent direction
	      var orthogonal = edgeTangent.mult(orthonorm); // Vector from edge center to sphere center in the tangent direction
	      
	      // Find the third side orthogonal to this one
	      var l = 0;
	      while(l==j%3 || l==k%3) l++;

	      // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
	      var dist = xi.vsub(orthogonal).vsub(edgeCenter.vadd(xj));

	      // Distances in tangent direction and distance in the plane orthogonal to it
	      var tdist = Math.abs(orthonorm);
	      var ndist = dist.norm();
	      
	      if(tdist < sides[l].norm() && ndist<R){
		found = true;
		var res = makeResult();
		edgeCenter.vadd(orthogonal,res.rj); // box rj
		res.rj.copy(res.rj);
		dist.negate(res.ni);
		res.ni.normalize();
		res.rj.vadd(xj).vsub(xi).unit().mult(R,res.ri);
		result.push(res);
	      }
	    }
	  }
	}

      } else if(sj.type==CANNON.Shape.types.COMPOUND){ // sphere-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
      }
      
    } else if(si.type==CANNON.Shape.types.PLANE){
      
      if(sj.type==CANNON.Shape.types.PLANE){ // plane-plane
	throw "Plane-plane collision... wait, you did WHAT?";
	
      } else if(sj.type==CANNON.Shape.types.BOX){ // plane-box

	// Collision normal
	var n = si.normal.copy();

	// Loop over corners
	var numcontacts = 0;
	var corners = sj.getCorners(qj);
	for(var idx=0; idx<corners.length && numcontacts<=4; idx++){ // max 4 corners against plane
	  var r = makeResult();
	  var worldCorner = corners[idx].vadd(xj);
	  corners[idx].copy(r.rj);

	  // Project down corner to plane to get xj
	  var point_on_plane_to_corner = worldCorner.vsub(xi);
	  var d = n.dot(point_on_plane_to_corner);
	  if(d<=0){
	    numcontacts++;
	    var plane_to_corner = n.mult(d);
	    point_on_plane_to_corner.vsub(plane_to_corner,r.ri);
	    
	    // Set contact normal
	    n.copy(r.ni);
	    
	    // Add contact
	    result.push(r);
	  }
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
  this.contacts = {}; // Preliminary. contacts["i,j"]=>contact array
  for(var k=0; k<p1.length; k++){

    // Get current collision indeces
    var i = p1[k];
    var j = p2[k];
    
    // Check last step stats
    var lastCollisionState = cmatrix(i,j,-1);
    
    // Get collision properties
    var mu = 0.3, e = 0.2;
    var cm = this.getContactMaterial(world.body[i]._material,
				     world.body[j]._material);
    if(cm){
      mu = cm.friction;
      e = cm.restitution;
    }
    
    // Get contacts
    var contacts = [];
    nearPhase(contacts,
	      world.body[i]._shape,
	      world.body[j]._shape,
	      new CANNON.Vec3(x[i],y[i],z[i]),
	      new CANNON.Vec3(x[j],y[j],z[j]),
	      new CANNON.Quaternion(qx[i],qy[i],qz[i],qw[i]),
	      new CANNON.Quaternion(qx[j],qy[j],qz[j],qw[j]));
    this.contacts[i+","+j] = contacts;

    // Add contact constraint(s)
    for(var ci = 0; ci<contacts.length; ci++){
      var c = contacts[ci];
      
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      var gvec = new CANNON.Vec3(x[j] + c.rj.x - x[i] - c.ri.x,
				 y[j] + c.rj.y - y[i] - c.ri.y,
				 z[j] + c.rj.z - z[i] - c.ri.z);
      var g = gvec.dot(c.ni); // Gap, negative if penetration

      // Action if penetration
      if(g<0.0){
	var vi = new CANNON.Vec3(vx[i],vy[i],vz[i]);
	var wi = new CANNON.Vec3(wx[i],wy[i],wz[i]);
	var vj = new CANNON.Vec3(vx[j],vy[j],vz[j]);
	var wj = new CANNON.Vec3(wx[j],wy[j],wz[j]);

	var n = c.ni;
	var tangents = [new CANNON.Vec3(),new CANNON.Vec3()];
	n.tangents(tangents[0],tangents[1]);

	var v_contact_i = vi.vadd(wi.cross(c.ri));
	var v_contact_j = vj.vadd(wj.cross(c.rj));
	var u_rel = v_contact_j.vsub(v_contact_i);
	var w_rel = wj.cross(c.rj).vsub(wi.cross(c.ri));

	var u = (vj.vsub(vi)); // Contact velo
	var uw = (c.rj.cross(wj)).vsub(c.ri.cross(wi));
	u.vsub(uw,u);

	// Get mass properties
	var iMi = world.invm[i];
	var iMj = world.invm[j];
	var iIxi = world.inertiax[i] > 0 ? 1.0/world.inertiax[i] : 0;
	var iIyi = world.inertiay[i] > 0 ? 1.0/world.inertiay[i] : 0;
	var iIzi = world.inertiaz[i] > 0 ? 1.0/world.inertiaz[i] : 0;
	var iIxj = world.inertiax[j] > 0 ? 1.0/world.inertiax[j] : 0;
	var iIyj = world.inertiay[j] > 0 ? 1.0/world.inertiay[j] : 0;
	var iIzj = world.inertiaz[j] > 0 ? 1.0/world.inertiaz[j] : 0;

	// Add contact constraint
	var rixn = c.ri.cross(n);
	var rjxn = c.rj.cross(n);

	var un_rel = n.mult(u_rel.dot(n));
	var u_rixn_rel = rixn.unit().mult(w_rel.dot(rixn.unit()));
	var u_rjxn_rel = rjxn.unit().mult(-w_rel.dot(rjxn.unit()));

	var gn = c.ni.mult(g);

	this.solver
	  .addConstraint( // Non-penetration constraint jacobian
			 [-n.x,-n.y,-n.z,
			  -rixn.x,-rixn.y,-rixn.z,
			  n.x,n.y,n.z,
			  rjxn.x,rjxn.y,rjxn.z],
			 
			 // Inverse mass matrix
			 [iMi,iMi,iMi,
			  iIxi,iIyi,iIzi,
			  iMj,iMj,iMj,
			  iIxj,iIyj,iIzj],
			 
			 // g - constraint violation / gap
			 [-gn.x,-gn.y,-gn.z,
			  0,0,0,//-gn.x,-gn.y,-gn.z,
			  gn.x,gn.y,gn.z,
			  0,0,0//gn.x,gn.y,gn.z
			  ],

			 [-un_rel.x,-un_rel.y,-un_rel.z,
			  0,0,0,//-u_rixn_rel.x,-u_rixn_rel.y,-u_rixn_rel.z,
			  un_rel.x,un_rel.y,un_rel.z,
			  0,0,0//u_rjxn_rel.x,u_rjxn_rel.y,u_rjxn_rel.z
			  ],
			 
			 // External force - forces & torques
			 [fx[i],fy[i],fz[i],
			  taux[i],tauy[i],tauz[i],
			  fx[j],fy[j],fz[j],
			  taux[j],tauy[j],tauz[j]],
			 0,
			 'inf',
			 i,
			 j);

	// Friction constraints
	if(mu>0.0){ // until debugged
	  var g = that.gravity().norm();
	  for(var ti=0; ti<tangents.length; ti++){
	    var t = tangents[ti];
	    var rixt = c.ri.cross(t);
	    var rjxt = c.rj.cross(t);

	    var ut_rel = t.mult(u_rel.dot(t));
	    var u_rixt_rel = rixt.unit().mult(u_rel.dot(rixt.unit()));
	    var u_rjxt_rel = rjxt.unit().mult(-u_rel.dot(rjxt.unit()));
	    this.solver
	      .addConstraint( // Non-penetration constraint jacobian
			     [-t.x,-t.y,-t.z,
			      -rixt.x,-rixt.y,-rixt.z,
			      t.x,t.y,t.z,
			      rjxt.x,rjxt.y,rjxt.z
			      ],
			     
			     // Inverse mass matrix
			     [iMi,iMi,iMi,
			      iIxi,iIyi,iIzi,
			      iMj,iMj,iMj,
			      iIxj,iIyj,iIzj],
			     
			     // g - constraint violation / gap
			     [0,0,0,
			      0,0,0,
			      0,0,0,
			      0,0,0],
			     
			     [-ut_rel.x,-ut_rel.y,-ut_rel.z,
			      0,0,0,//-u_rixt_rel.x,-u_rixt_rel.y,-u_rixt_rel.z,
			      ut_rel.x,ut_rel.y,ut_rel.z,
			      0,0,0//u_rjxt_rel.x,u_rjxt_rel.y,u_rjxt_rel.z
			      ],
			     
			     // External force - forces & torques
			     [fx[i],fy[i],fz[i],
			      taux[i],tauy[i],tauz[i],
			      fx[j],fy[j],fz[j],
			      taux[j],tauy[j],tauz[j]
			      ],

			     -mu*g*(world.mass[i]+world.mass[j]),
			     mu*g*(world.mass[i]+world.mass[j]),

			     i,
			     j);
	  }
	}
      }
    }
  }

  if(this.solver.n){
    this.solver.solve();

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

