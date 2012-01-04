/**
 * physics.js v0.0.2 - A lightweight 3D physics engine for the web
 * 
 * http://github.com/schteppe/physics.js
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
 * Our main namespace
 * @author schteppe
 */
var PHYSICS = PHYSICS || {};

// Maintain compatibility with older browsers
if(!self.Int32Array){
  self.Int32Array = Array;
  self.Float32Array = Array;
}
/**
 * @class BroadPhase
 * @todo Make it a base class for broadphase implementations
 */
PHYSICS.BroadPhase = function(){
  
};

/**
 * Get all the collision pairs in a physics world
 * @param World world
 * @todo Should be placed in a subclass to BroadPhase
 */
PHYSICS.BroadPhase.prototype.collisionPairs = function(world){
  var pairs1 = [];
  var pairs2 = [];
  var n = world.numObjects();

  // Local fast access
  var SPHERE = PHYSICS.RigidBody.prototype.types.SPHERE;
  var PLANE = PHYSICS.RigidBody.prototype.types.PLANE;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var vx = world.vx;
  var vy = world.vy;
  var vz = world.vz;
  var geodata = world.geodata;
  var type = world.type;

  // Naive N^2 ftw!
  for(var i=0; i<n; i++){
    for(var j=0; j<i; j++){
      if(type[i]==SPHERE && 
	 type[j]==SPHERE){
	var r2 = (geodata[i].radius + geodata[j].radius);
	if(Math.abs(x[i]-x[j]) < r2 && 
	   Math.abs(y[i]-y[j]) < r2 && 
	   Math.abs(z[i]-z[j]) < r2){
	  pairs1.push(i);
	  pairs2.push(j);
	}
      } else if((type[i]==SPHERE && 
		 type[j]==PLANE) ||
		(type[i]==PLANE && 
		 type[j]==SPHERE)){
	var si = type[i]==SPHERE ? i : j;
	var pi = type[i]==PLANE ? i : j;

	// Rel. position
	var r = new PHYSICS.Vec3(x[si]-x[pi],
				 y[si]-y[pi],
				 z[si]-z[pi]);
	var normal = geodata[pi].normal;
	var q = r.dot(normal)-geodata[si].radius;
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
 */
PHYSICS.Mat3 = function(elements){
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
PHYSICS.Mat3.prototype.identity = function(){
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
PHYSICS.Mat3.prototype.vmult = function(v,target){
  if(target===undefined)
    target = new PHYSICS.Vec3();

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
PHYSICS.Mat3.prototype.smult = function(s){
  for(var i=0; i<this.elements.length; i++)
    this.elements[i] *= s;
};

/**
 * Matrix multiplication
 * @param Mat3 m
 * @return Mat3
 */
PHYSICS.Mat3.prototype.mmult = function(m){
  var r = new PHYSICS.Mat3();
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
 * @return Vec3 The solution x
 */
PHYSICS.Mat3.prototype.solve = function(b){
  var equations = $M([
		      [ this.elements[0], this.elements[1], this.elements[2],  b.x],
		      [ this.elements[3], this.elements[4], this.elements[5],  b.y],
		      [ this.elements[6], this.elements[7], this.elements[8],  b.z]
		      ]);
  
  var eqns = equations.toRightTriangular();
  
  var sol_z = eqns.e(3,4) / eqns.e(3,3);
  var sol_y = (eqns.e(2,4) - eqns.e(2,3)*sol_z) / eqns.e(2,2);
  var sol_x = (eqns.e(1,4) - eqns.e(1,3)*sol_z - eqns.e(1,2)*sol_y) / eqns.e(1,1);
  return new PHYSICS.Vec3(sol_x,
			  sol_y,
			  sol_z);
};
/**
 * 3-dimensional vector
 * @class Vec3
 * @param float x
 * @param float y
 * @param float z
 */
PHYSICS.Vec3 = function(x,y,z){
  this.x = x;
  this.y = y;
  this.z = z;
};

/**
 * Vector cross product
 * @param Vec3 v
 * @return Vec3
 */
PHYSICS.Vec3.prototype.cross = function(v){
  var A = [this.x, this.y, this.z];
  var B = [v.x, v.y, v.z];
  return new PHYSICS.Vec3(
		  (A[1] * B[2]) - (A[2] * B[1]),
		  (A[2] * B[0]) - (A[0] * B[2]),
		  (A[0] * B[1]) - (A[1] * B[0])
		  );
};

/**
 * Set the vectors' 3 elements
 * @param float x
 * @param float y
 * @param float z
 */
PHYSICS.Vec3.prototype.set = function(x,y,z){
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
PHYSICS.Vec3.prototype.vadd = function(v,target){
  if(target){
    target.x += v.x;
    target.y += v.y;
    target.z += v.z;
  } else {
    return new PHYSICS.Vec3(this.x+v.x,
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
PHYSICS.Vec3.prototype.vsub = function(v,target){
  if(target){
    target.x -= v.x;
    target.y -= v.y;
    target.z -= v.z;
  } else {
    return new PHYSICS.Vec3(this.x-v.x,
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
PHYSICS.Vec3.prototype.crossmat = function(){
  return new PHYSICS.Mat3([      0,  -this.z,   this.y,
			    this.z,        0,  -this.x,
			   -this.y,   this.x,        0]);
};

/**
 * Normalize the vector. Note that this changes the values in the vector.
 * @return float Returns the norm of the vector
 */
PHYSICS.Vec3.prototype.normalize = function(){
  var n = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  this.x /= n;
  this.y /= n;
  this.z /= n;
  return n;
};

/**
 * Get the 2-norm (length) of the vector
 * @return float
 */
PHYSICS.Vec3.prototype.norm = function(){
  return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
};

/**
 * Multiply the vector with a scalar
 * @param float scalar
 * @param Vec3 saveinme
 * @return Vec3
 */
PHYSICS.Vec3.prototype.mult = function(scalar,saveinme){
  if(!saveinme)
    saveinme = new PHYSICS.Vec3();
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
PHYSICS.Vec3.prototype.dot = function(v){
  return (this.x * v.x + this.y * v.y + this.z * v.z);
};

/**
 * 4-dimensional quaternion
 * @class Quaternion
 * @param float x
 * @param float y
 * @param float z 
 * @param float w
 */
PHYSICS.Quaternion = function(x,y,z,w){
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
};

/**
 * Quaternion multiplication
 * @param Quaternion q
 * @param Quaternion target Optional.
 * @return Quaternion
 */ 
PHYSICS.Quaternion.prototype.mult = function(q,target){
  if(target==undefined)
    target = new PHYSICS.Quaternion();
  
  var va = new PHYSICS.Vec3(this.x,this.y,this.z);
  var vb = new PHYSICS.Vec3(q.x,q.y,q.z);
  target.w = this.w*q.w - va.dot(vb);
  console.log(q);
  vaxvb = va.cross(vb);
  target.x = this.w * vb.x + q.w*va.x + vaxvb.x;
  target.y = this.w * vb.y + q.w*va.y + vaxvb.y;
  target.z = this.w * vb.z + q.w*va.z + vaxvb.z;
  return target;
};

/**
 * Normalize the quaternion. Note that this changes the values of the quaternion.
 */
PHYSICS.Quaternion.prototype.normalize = function(){
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
// === Sylvester ===
// Vector and Matrix mathematics modules for JavaScript
// Copyright (c) 2007 James Coglan
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var Sylvester = {
  version: '0.1.3',
  precision: 1e-6
};

function Vector() {}
Vector.prototype = {

  // Returns element i of the vector
  e: function(i) {
    return (i < 1 || i > this.elements.length) ? null : this.elements[i-1];
  },

  // Returns the number of elements the vector has
  dimensions: function() {
    return this.elements.length;
  },

  // Returns the modulus ('length') of the vector
  modulus: function() {
    return Math.sqrt(this.dot(this));
  },

  // Returns true iff the vector is equal to the argument
  eql: function(vector) {
    var n = this.elements.length;
    var V = vector.elements || vector;
    if (n != V.length) { return false; }
    do {
      if (Math.abs(this.elements[n-1] - V[n-1]) > Sylvester.precision) { return false; }
    } while (--n);
    return true;
  },

  // Returns a copy of the vector
  dup: function() {
    return Vector.create(this.elements);
  },

  // Maps the vector to another vector according to the given function
  map: function(fn) {
    var elements = [];
    this.each(function(x, i) {
      elements.push(fn(x, i));
    });
    return Vector.create(elements);
  },
  
  // Calls the iterator for each element of the vector in turn
  each: function(fn) {
    var n = this.elements.length, k = n, i;
    do { i = k - n;
      fn(this.elements[i], i+1);
    } while (--n);
  },

  // Returns a new vector created by normalizing the receiver
  toUnitVector: function() {
    var r = this.modulus();
    if (r === 0) { return this.dup(); }
    return this.map(function(x) { return x/r; });
  },

  // Returns the angle between the vector and the argument (also a vector)
  angleFrom: function(vector) {
    var V = vector.elements || vector;
    var n = this.elements.length, k = n, i;
    if (n != V.length) { return null; }
    var dot = 0, mod1 = 0, mod2 = 0;
    // Work things out in parallel to save time
    this.each(function(x, i) {
      dot += x * V[i-1];
      mod1 += x * x;
      mod2 += V[i-1] * V[i-1];
    });
    mod1 = Math.sqrt(mod1); mod2 = Math.sqrt(mod2);
    if (mod1*mod2 === 0) { return null; }
    var theta = dot / (mod1*mod2);
    if (theta < -1) { theta = -1; }
    if (theta > 1) { theta = 1; }
    return Math.acos(theta);
  },

  // Returns true iff the vector is parallel to the argument
  isParallelTo: function(vector) {
    var angle = this.angleFrom(vector);
    return (angle === null) ? null : (angle <= Sylvester.precision);
  },

  // Returns true iff the vector is antiparallel to the argument
  isAntiparallelTo: function(vector) {
    var angle = this.angleFrom(vector);
    return (angle === null) ? null : (Math.abs(angle - Math.PI) <= Sylvester.precision);
  },

  // Returns true iff the vector is perpendicular to the argument
  isPerpendicularTo: function(vector) {
    var dot = this.dot(vector);
    return (dot === null) ? null : (Math.abs(dot) <= Sylvester.precision);
  },

  // Returns the result of adding the argument to the vector
  add: function(vector) {
    var V = vector.elements || vector;
    if (this.elements.length != V.length) { return null; }
    return this.map(function(x, i) { return x + V[i-1]; });
  },

  // Returns the result of subtracting the argument from the vector
  subtract: function(vector) {
    var V = vector.elements || vector;
    if (this.elements.length != V.length) { return null; }
    return this.map(function(x, i) { return x - V[i-1]; });
  },

  // Returns the result of multiplying the elements of the vector by the argument
  multiply: function(k) {
    return this.map(function(x) { return x*k; });
  },

  x: function(k) { return this.multiply(k); },

  // Returns the scalar product of the vector with the argument
  // Both vectors must have equal dimensionality
  dot: function(vector) {
    var V = vector.elements || vector;
    var i, product = 0, n = this.elements.length;
    if (n != V.length) { return null; }
    do { product += this.elements[n-1] * V[n-1]; } while (--n);
    return product;
  },

  // Returns the vector product of the vector with the argument
  // Both vectors must have dimensionality 3
  cross: function(vector) {
    var B = vector.elements || vector;
    if (this.elements.length != 3 || B.length != 3) { return null; }
    var A = this.elements;
    return Vector.create([
      (A[1] * B[2]) - (A[2] * B[1]),
      (A[2] * B[0]) - (A[0] * B[2]),
      (A[0] * B[1]) - (A[1] * B[0])
    ]);
  },

  // Returns the (absolute) largest element of the vector
  max: function() {
    var m = 0, n = this.elements.length, k = n, i;
    do { i = k - n;
      if (Math.abs(this.elements[i]) > Math.abs(m)) { m = this.elements[i]; }
    } while (--n);
    return m;
  },

  // Returns the index of the first match found
  indexOf: function(x) {
    var index = null, n = this.elements.length, k = n, i;
    do { i = k - n;
      if (index === null && this.elements[i] == x) {
        index = i + 1;
      }
    } while (--n);
    return index;
  },

  // Returns a diagonal matrix with the vector's elements as its diagonal elements
  toDiagonalMatrix: function() {
    return Matrix.Diagonal(this.elements);
  },

  // Returns the result of rounding the elements of the vector
  round: function() {
    return this.map(function(x) { return Math.round(x); });
  },

  // Returns a copy of the vector with elements set to the given value if they
  // differ from it by less than Sylvester.precision
  snapTo: function(x) {
    return this.map(function(y) {
      return (Math.abs(y - x) <= Sylvester.precision) ? x : y;
    });
  },

  // Returns the vector's distance from the argument, when considered as a point in space
  distanceFrom: function(obj) {
    if (obj.anchor) { return obj.distanceFrom(this); }
    var V = obj.elements || obj;
    if (V.length != this.elements.length) { return null; }
    var sum = 0, part;
    this.each(function(x, i) {
      part = x - V[i-1];
      sum += part * part;
    });
    return Math.sqrt(sum);
  },

  // Returns true if the vector is point on the given line
  liesOn: function(line) {
    return line.contains(this);
  },

  // Return true iff the vector is a point in the given plane
  liesIn: function(plane) {
    return plane.contains(this);
  },

  // Rotates the vector about the given object. The object should be a 
  // point if the vector is 2D, and a line if it is 3D. Be careful with line directions!
  rotate: function(t, obj) {
    var V, R, x, y, z;
    switch (this.elements.length) {
      case 2:
        V = obj.elements || obj;
        if (V.length != 2) { return null; }
        R = Matrix.Rotation(t).elements;
        x = this.elements[0] - V[0];
        y = this.elements[1] - V[1];
        return Vector.create([
          V[0] + R[0][0] * x + R[0][1] * y,
          V[1] + R[1][0] * x + R[1][1] * y
        ]);
        break;
      case 3:
        if (!obj.direction) { return null; }
        var C = obj.pointClosestTo(this).elements;
        R = Matrix.Rotation(t, obj.direction).elements;
        x = this.elements[0] - C[0];
        y = this.elements[1] - C[1];
        z = this.elements[2] - C[2];
        return Vector.create([
          C[0] + R[0][0] * x + R[0][1] * y + R[0][2] * z,
          C[1] + R[1][0] * x + R[1][1] * y + R[1][2] * z,
          C[2] + R[2][0] * x + R[2][1] * y + R[2][2] * z
        ]);
        break;
      default:
        return null;
    }
  },

  // Returns the result of reflecting the point in the given point, line or plane
  reflectionIn: function(obj) {
    if (obj.anchor) {
      // obj is a plane or line
      var P = this.elements.slice();
      var C = obj.pointClosestTo(P).elements;
      return Vector.create([C[0] + (C[0] - P[0]), C[1] + (C[1] - P[1]), C[2] + (C[2] - (P[2] || 0))]);
    } else {
      // obj is a point
      var Q = obj.elements || obj;
      if (this.elements.length != Q.length) { return null; }
      return this.map(function(x, i) { return Q[i-1] + (Q[i-1] - x); });
    }
  },

  // Utility to make sure vectors are 3D. If they are 2D, a zero z-component is added
  to3D: function() {
    var V = this.dup();
    switch (V.elements.length) {
      case 3: break;
      case 2: V.elements.push(0); break;
      default: return null;
    }
    return V;
  },

  // Returns a string representation of the vector
  inspect: function() {
    return '[' + this.elements.join(', ') + ']';
  },

  // Set vector's elements from an array
  setElements: function(els) {
    this.elements = (els.elements || els).slice();
    return this;
  }
};
  
// Constructor function
Vector.create = function(elements) {
  var V = new Vector();
  return V.setElements(elements);
};

// i, j, k unit vectors
Vector.i = Vector.create([1,0,0]);
Vector.j = Vector.create([0,1,0]);
Vector.k = Vector.create([0,0,1]);

// Random vector of size n
Vector.Random = function(n) {
  var elements = [];
  do { elements.push(Math.random());
  } while (--n);
  return Vector.create(elements);
};

// Vector filled with zeros
Vector.Zero = function(n) {
  var elements = [];
  do { elements.push(0);
  } while (--n);
  return Vector.create(elements);
};



function Matrix() {}
Matrix.prototype = {

  // Returns element (i,j) of the matrix
  e: function(i,j) {
    if (i < 1 || i > this.elements.length || j < 1 || j > this.elements[0].length) { return null; }
    return this.elements[i-1][j-1];
  },

  // Returns row k of the matrix as a vector
  row: function(i) {
    if (i > this.elements.length) { return null; }
    return Vector.create(this.elements[i-1]);
  },

  // Returns column k of the matrix as a vector
  col: function(j) {
    if (j > this.elements[0].length) { return null; }
    var col = [], n = this.elements.length, k = n, i;
    do { i = k - n;
      col.push(this.elements[i][j-1]);
    } while (--n);
    return Vector.create(col);
  },

  // Returns the number of rows/columns the matrix has
  dimensions: function() {
    return {rows: this.elements.length, cols: this.elements[0].length};
  },

  // Returns the number of rows in the matrix
  rows: function() {
    return this.elements.length;
  },

  // Returns the number of columns in the matrix
  cols: function() {
    return this.elements[0].length;
  },

  // Returns true iff the matrix is equal to the argument. You can supply
  // a vector as the argument, in which case the receiver must be a
  // one-column matrix equal to the vector.
  eql: function(matrix) {
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    if (this.elements.length != M.length ||
        this.elements[0].length != M[0].length) { return false; }
    var ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        if (Math.abs(this.elements[i][j] - M[i][j]) > Sylvester.precision) { return false; }
      } while (--nj);
    } while (--ni);
    return true;
  },

  // Returns a copy of the matrix
  dup: function() {
    return Matrix.create(this.elements);
  },

  // Maps the matrix to another matrix (of the same dimensions) according to the given function
  map: function(fn) {
    var els = [], ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      els[i] = [];
      do { j = kj - nj;
        els[i][j] = fn(this.elements[i][j], i + 1, j + 1);
      } while (--nj);
    } while (--ni);
    return Matrix.create(els);
  },

  // Returns true iff the argument has the same dimensions as the matrix
  isSameSizeAs: function(matrix) {
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    return (this.elements.length == M.length &&
        this.elements[0].length == M[0].length);
  },

  // Returns the result of adding the argument to the matrix
  add: function(matrix) {
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    if (!this.isSameSizeAs(M)) { return null; }
    return this.map(function(x, i, j) { return x + M[i-1][j-1]; });
  },

  // Returns the result of subtracting the argument from the matrix
  subtract: function(matrix) {
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    if (!this.isSameSizeAs(M)) { return null; }
    return this.map(function(x, i, j) { return x - M[i-1][j-1]; });
  },

  // Returns true iff the matrix can multiply the argument from the left
  canMultiplyFromLeft: function(matrix) {
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    // this.columns should equal matrix.rows
    return (this.elements[0].length == M.length);
  },

  // Returns the result of multiplying the matrix from the right by the argument.
  // If the argument is a scalar then just multiply all the elements. If the argument is
  // a vector, a vector is returned, which saves you having to remember calling
  // col(1) on the result.
  multiply: function(matrix) {
    if (!matrix.elements) {
      return this.map(function(x) { return x * matrix; });
    }
    var returnVector = matrix.modulus ? true : false;
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    if (!this.canMultiplyFromLeft(M)) { return null; }
    var ni = this.elements.length, ki = ni, i, nj, kj = M[0].length, j;
    var cols = this.elements[0].length, elements = [], sum, nc, c;
    do { i = ki - ni;
      elements[i] = [];
      nj = kj;
      do { j = kj - nj;
        sum = 0;
        nc = cols;
        do { c = cols - nc;
          sum += this.elements[i][c] * M[c][j];
        } while (--nc);
        elements[i][j] = sum;
      } while (--nj);
    } while (--ni);
    var M = Matrix.create(elements);
    return returnVector ? M.col(1) : M;
  },

  x: function(matrix) { return this.multiply(matrix); },

  // Returns a submatrix taken from the matrix
  // Argument order is: start row, start col, nrows, ncols
  // Element selection wraps if the required index is outside the matrix's bounds, so you could
  // use this to perform row/column cycling or copy-augmenting.
  minor: function(a, b, c, d) {
    var elements = [], ni = c, i, nj, j;
    var rows = this.elements.length, cols = this.elements[0].length;
    do { i = c - ni;
      elements[i] = [];
      nj = d;
      do { j = d - nj;
        elements[i][j] = this.elements[(a+i-1)%rows][(b+j-1)%cols];
      } while (--nj);
    } while (--ni);
    return Matrix.create(elements);
  },

  // Returns the transpose of the matrix
  transpose: function() {
    var rows = this.elements.length, cols = this.elements[0].length;
    var elements = [], ni = cols, i, nj, j;
    do { i = cols - ni;
      elements[i] = [];
      nj = rows;
      do { j = rows - nj;
        elements[i][j] = this.elements[j][i];
      } while (--nj);
    } while (--ni);
    return Matrix.create(elements);
  },

  // Returns true iff the matrix is square
  isSquare: function() {
    return (this.elements.length == this.elements[0].length);
  },

  // Returns the (absolute) largest element of the matrix
  max: function() {
    var m = 0, ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        if (Math.abs(this.elements[i][j]) > Math.abs(m)) { m = this.elements[i][j]; }
      } while (--nj);
    } while (--ni);
    return m;
  },

  // Returns the indeces of the first match found by reading row-by-row from left to right
  indexOf: function(x) {
    var index = null, ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        if (this.elements[i][j] == x) { return {i: i+1, j: j+1}; }
      } while (--nj);
    } while (--ni);
    return null;
  },

  // If the matrix is square, returns the diagonal elements as a vector.
  // Otherwise, returns null.
  diagonal: function() {
    if (!this.isSquare) { return null; }
    var els = [], n = this.elements.length, k = n, i;
    do { i = k - n;
      els.push(this.elements[i][i]);
    } while (--n);
    return Vector.create(els);
  },

  // Make the matrix upper (right) triangular by Gaussian elimination.
  // This method only adds multiples of rows to other rows. No rows are
  // scaled up or switched, and the determinant is preserved.
  toRightTriangular: function() {
    var M = this.dup(), els;
    var n = this.elements.length, k = n, i, np, kp = this.elements[0].length, p;
    do { i = k - n;
      if (M.elements[i][i] == 0) {
        for (j = i + 1; j < k; j++) {
          if (M.elements[j][i] != 0) {
            els = []; np = kp;
            do { p = kp - np;
              els.push(M.elements[i][p] + M.elements[j][p]);
            } while (--np);
            M.elements[i] = els;
            break;
          }
        }
      }
      if (M.elements[i][i] != 0) {
        for (j = i + 1; j < k; j++) {
          var multiplier = M.elements[j][i] / M.elements[i][i];
          els = []; np = kp;
          do { p = kp - np;
            // Elements with column numbers up to an including the number
            // of the row that we're subtracting can safely be set straight to
            // zero, since that's the point of this routine and it avoids having
            // to loop over and correct rounding errors later
            els.push(p <= i ? 0 : M.elements[j][p] - M.elements[i][p] * multiplier);
          } while (--np);
          M.elements[j] = els;
        }
      }
    } while (--n);
    return M;
  },

  toUpperTriangular: function() { return this.toRightTriangular(); },

  // Returns the determinant for square matrices
  determinant: function() {
    if (!this.isSquare()) { return null; }
    var M = this.toRightTriangular();
    var det = M.elements[0][0], n = M.elements.length - 1, k = n, i;
    do { i = k - n + 1;
      det = det * M.elements[i][i];
    } while (--n);
    return det;
  },

  det: function() { return this.determinant(); },

  // Returns true iff the matrix is singular
  isSingular: function() {
    return (this.isSquare() && this.determinant() === 0);
  },

  // Returns the trace for square matrices
  trace: function() {
    if (!this.isSquare()) { return null; }
    var tr = this.elements[0][0], n = this.elements.length - 1, k = n, i;
    do { i = k - n + 1;
      tr += this.elements[i][i];
    } while (--n);
    return tr;
  },

  tr: function() { return this.trace(); },

  // Returns the rank of the matrix
  rank: function() {
    var M = this.toRightTriangular(), rank = 0;
    var ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        if (Math.abs(M.elements[i][j]) > Sylvester.precision) { rank++; break; }
      } while (--nj);
    } while (--ni);
    return rank;
  },
  
  rk: function() { return this.rank(); },

  // Returns the result of attaching the given argument to the right-hand side of the matrix
  augment: function(matrix) {
    var M = matrix.elements || matrix;
    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
    var T = this.dup(), cols = T.elements[0].length;
    var ni = T.elements.length, ki = ni, i, nj, kj = M[0].length, j;
    if (ni != M.length) { return null; }
    do { i = ki - ni;
      nj = kj;
      do { j = kj - nj;
        T.elements[i][cols + j] = M[i][j];
      } while (--nj);
    } while (--ni);
    return T;
  },

  // Returns the inverse (if one exists) using Gauss-Jordan
  inverse: function() {
    if (!this.isSquare() || this.isSingular()) { return null; }
    var ni = this.elements.length, ki = ni, i, j;
    var M = this.augment(Matrix.I(ni)).toRightTriangular();
    var np, kp = M.elements[0].length, p, els, divisor;
    var inverse_elements = [], new_element;
    // Matrix is non-singular so there will be no zeros on the diagonal
    // Cycle through rows from last to first
    do { i = ni - 1;
      // First, normalise diagonal elements to 1
      els = []; np = kp;
      inverse_elements[i] = [];
      divisor = M.elements[i][i];
      do { p = kp - np;
        new_element = M.elements[i][p] / divisor;
        els.push(new_element);
        // Shuffle of the current row of the right hand side into the results
        // array as it will not be modified by later runs through this loop
        if (p >= ki) { inverse_elements[i].push(new_element); }
      } while (--np);
      M.elements[i] = els;
      // Then, subtract this row from those above it to
      // give the identity matrix on the left hand side
      for (j = 0; j < i; j++) {
        els = []; np = kp;
        do { p = kp - np;
          els.push(M.elements[j][p] - M.elements[i][p] * M.elements[j][i]);
        } while (--np);
        M.elements[j] = els;
      }
    } while (--ni);
    return Matrix.create(inverse_elements);
  },

  inv: function() { return this.inverse(); },

  // Returns the result of rounding all the elements
  round: function() {
    return this.map(function(x) { return Math.round(x); });
  },

  // Returns a copy of the matrix with elements set to the given value if they
  // differ from it by less than Sylvester.precision
  snapTo: function(x) {
    return this.map(function(p) {
      return (Math.abs(p - x) <= Sylvester.precision) ? x : p;
    });
  },

  // Returns a string representation of the matrix
  inspect: function() {
    var matrix_rows = [];
    var n = this.elements.length, k = n, i;
    do { i = k - n;
      matrix_rows.push(Vector.create(this.elements[i]).inspect());
    } while (--n);
    return matrix_rows.join('\n');
  },

  // Set the matrix's elements from an array. If the argument passed
  // is a vector, the resulting matrix will be a single column.
  setElements: function(els) {
    var i, elements = els.elements || els;
    if (typeof(elements[0][0]) != 'undefined') {
      var ni = elements.length, ki = ni, nj, kj, j;
      this.elements = [];
      do { i = ki - ni;
        nj = elements[i].length; kj = nj;
        this.elements[i] = [];
        do { j = kj - nj;
          this.elements[i][j] = elements[i][j];
        } while (--nj);
      } while(--ni);
      return this;
    }
    var n = elements.length, k = n;
    this.elements = [];
    do { i = k - n;
      this.elements.push([elements[i]]);
    } while (--n);
    return this;
  }
};

// Constructor function
Matrix.create = function(elements) {
  var M = new Matrix();
  return M.setElements(elements);
};

// Identity matrix of size n
Matrix.I = function(n) {
  var els = [], k = n, i, nj, j;
  do { i = k - n;
    els[i] = []; nj = k;
    do { j = k - nj;
      els[i][j] = (i == j) ? 1 : 0;
    } while (--nj);
  } while (--n);
  return Matrix.create(els);
};

// Diagonal matrix - all off-diagonal elements are zero
Matrix.Diagonal = function(elements) {
  var n = elements.length, k = n, i;
  var M = Matrix.I(n);
  do { i = k - n;
    M.elements[i][i] = elements[i];
  } while (--n);
  return M;
};

// Rotation matrix about some axis. If no axis is
// supplied, assume we're after a 2D transform
Matrix.Rotation = function(theta, a) {
  if (!a) {
    return Matrix.create([
      [Math.cos(theta),  -Math.sin(theta)],
      [Math.sin(theta),   Math.cos(theta)]
    ]);
  }
  var axis = a.dup();
  if (axis.elements.length != 3) { return null; }
  var mod = axis.modulus();
  var x = axis.elements[0]/mod, y = axis.elements[1]/mod, z = axis.elements[2]/mod;
  var s = Math.sin(theta), c = Math.cos(theta), t = 1 - c;
  // Formula derived here: http://www.gamedev.net/reference/articles/article1199.asp
  // That proof rotates the co-ordinate system so theta
  // becomes -theta and sin becomes -sin here.
  return Matrix.create([
    [ t*x*x + c, t*x*y - s*z, t*x*z + s*y ],
    [ t*x*y + s*z, t*y*y + c, t*y*z - s*x ],
    [ t*x*z - s*y, t*y*z + s*x, t*z*z + c ]
  ]);
};

// Special case rotations
Matrix.RotationX = function(t) {
  var c = Math.cos(t), s = Math.sin(t);
  return Matrix.create([
    [  1,  0,  0 ],
    [  0,  c, -s ],
    [  0,  s,  c ]
  ]);
};
Matrix.RotationY = function(t) {
  var c = Math.cos(t), s = Math.sin(t);
  return Matrix.create([
    [  c,  0,  s ],
    [  0,  1,  0 ],
    [ -s,  0,  c ]
  ]);
};
Matrix.RotationZ = function(t) {
  var c = Math.cos(t), s = Math.sin(t);
  return Matrix.create([
    [  c, -s,  0 ],
    [  s,  c,  0 ],
    [  0,  0,  1 ]
  ]);
};

// Random matrix of n rows, m columns
Matrix.Random = function(n, m) {
  return Matrix.Zero(n, m).map(
    function() { return Math.random(); }
  );
};

// Matrix filled with zeros
Matrix.Zero = function(n, m) {
  var els = [], ni = n, i, nj, j;
  do { i = n - ni;
    els[i] = [];
    nj = m;
    do { j = m - nj;
      els[i][j] = 0;
    } while (--nj);
  } while (--ni);
  return Matrix.create(els);
};



function Line() {}
Line.prototype = {

  // Returns true if the argument occupies the same space as the line
  eql: function(line) {
    return (this.isParallelTo(line) && this.contains(line.anchor));
  },

  // Returns a copy of the line
  dup: function() {
    return Line.create(this.anchor, this.direction);
  },

  // Returns the result of translating the line by the given vector/array
  translate: function(vector) {
    var V = vector.elements || vector;
    return Line.create([
      this.anchor.elements[0] + V[0],
      this.anchor.elements[1] + V[1],
      this.anchor.elements[2] + (V[2] || 0)
    ], this.direction);
  },

  // Returns true if the line is parallel to the argument. Here, 'parallel to'
  // means that the argument's direction is either parallel or antiparallel to
  // the line's own direction. A line is parallel to a plane if the two do not
  // have a unique intersection.
  isParallelTo: function(obj) {
    if (obj.normal) { return obj.isParallelTo(this); }
    var theta = this.direction.angleFrom(obj.direction);
    return (Math.abs(theta) <= Sylvester.precision || Math.abs(theta - Math.PI) <= Sylvester.precision);
  },

  // Returns the line's perpendicular distance from the argument,
  // which can be a point, a line or a plane
  distanceFrom: function(obj) {
    if (obj.normal) { return obj.distanceFrom(this); }
    if (obj.direction) {
      // obj is a line
      if (this.isParallelTo(obj)) { return this.distanceFrom(obj.anchor); }
      var N = this.direction.cross(obj.direction).toUnitVector().elements;
      var A = this.anchor.elements, B = obj.anchor.elements;
      return Math.abs((A[0] - B[0]) * N[0] + (A[1] - B[1]) * N[1] + (A[2] - B[2]) * N[2]);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      var A = this.anchor.elements, D = this.direction.elements;
      var PA1 = P[0] - A[0], PA2 = P[1] - A[1], PA3 = (P[2] || 0) - A[2];
      var modPA = Math.sqrt(PA1*PA1 + PA2*PA2 + PA3*PA3);
      if (modPA === 0) return 0;
      // Assumes direction vector is normalized
      var cosTheta = (PA1 * D[0] + PA2 * D[1] + PA3 * D[2]) / modPA;
      var sin2 = 1 - cosTheta*cosTheta;
      return Math.abs(modPA * Math.sqrt(sin2 < 0 ? 0 : sin2));
    }
  },

  // Returns true iff the argument is a point on the line
  contains: function(point) {
    var dist = this.distanceFrom(point);
    return (dist !== null && dist <= Sylvester.precision);
  },

  // Returns true iff the line lies in the given plane
  liesIn: function(plane) {
    return plane.contains(this);
  },

  // Returns true iff the line has a unique point of intersection with the argument
  intersects: function(obj) {
    if (obj.normal) { return obj.intersects(this); }
    return (!this.isParallelTo(obj) && this.distanceFrom(obj) <= Sylvester.precision);
  },

  // Returns the unique intersection point with the argument, if one exists
  intersectionWith: function(obj) {
    if (obj.normal) { return obj.intersectionWith(this); }
    if (!this.intersects(obj)) { return null; }
    var P = this.anchor.elements, X = this.direction.elements,
        Q = obj.anchor.elements, Y = obj.direction.elements;
    var X1 = X[0], X2 = X[1], X3 = X[2], Y1 = Y[0], Y2 = Y[1], Y3 = Y[2];
    var PsubQ1 = P[0] - Q[0], PsubQ2 = P[1] - Q[1], PsubQ3 = P[2] - Q[2];
    var XdotQsubP = - X1*PsubQ1 - X2*PsubQ2 - X3*PsubQ3;
    var YdotPsubQ = Y1*PsubQ1 + Y2*PsubQ2 + Y3*PsubQ3;
    var XdotX = X1*X1 + X2*X2 + X3*X3;
    var YdotY = Y1*Y1 + Y2*Y2 + Y3*Y3;
    var XdotY = X1*Y1 + X2*Y2 + X3*Y3;
    var k = (XdotQsubP * YdotY / XdotX + XdotY * YdotPsubQ) / (YdotY - XdotY * XdotY);
    return Vector.create([P[0] + k*X1, P[1] + k*X2, P[2] + k*X3]);
  },

  // Returns the point on the line that is closest to the given point or line
  pointClosestTo: function(obj) {
    if (obj.direction) {
      // obj is a line
      if (this.intersects(obj)) { return this.intersectionWith(obj); }
      if (this.isParallelTo(obj)) { return null; }
      var D = this.direction.elements, E = obj.direction.elements;
      var D1 = D[0], D2 = D[1], D3 = D[2], E1 = E[0], E2 = E[1], E3 = E[2];
      // Create plane containing obj and the shared normal and intersect this with it
      // Thank you: http://www.cgafaq.info/wiki/Line-line_distance
      var x = (D3 * E1 - D1 * E3), y = (D1 * E2 - D2 * E1), z = (D2 * E3 - D3 * E2);
      var N = Vector.create([x * E3 - y * E2, y * E1 - z * E3, z * E2 - x * E1]);
      var P = Plane.create(obj.anchor, N);
      return P.intersectionWith(this);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      if (this.contains(P)) { return Vector.create(P); }
      var A = this.anchor.elements, D = this.direction.elements;
      var D1 = D[0], D2 = D[1], D3 = D[2], A1 = A[0], A2 = A[1], A3 = A[2];
      var x = D1 * (P[1]-A2) - D2 * (P[0]-A1), y = D2 * ((P[2] || 0) - A3) - D3 * (P[1]-A2),
          z = D3 * (P[0]-A1) - D1 * ((P[2] || 0) - A3);
      var V = Vector.create([D2 * x - D3 * z, D3 * y - D1 * x, D1 * z - D2 * y]);
      var k = this.distanceFrom(P) / V.modulus();
      return Vector.create([
        P[0] + V.elements[0] * k,
        P[1] + V.elements[1] * k,
        (P[2] || 0) + V.elements[2] * k
      ]);
    }
  },

  // Returns a copy of the line rotated by t radians about the given line. Works by
  // finding the argument's closest point to this line's anchor point (call this C) and
  // rotating the anchor about C. Also rotates the line's direction about the argument's.
  // Be careful with this - the rotation axis' direction affects the outcome!
  rotate: function(t, line) {
    // If we're working in 2D
    if (typeof(line.direction) == 'undefined') { line = Line.create(line.to3D(), Vector.k); }
    var R = Matrix.Rotation(t, line.direction).elements;
    var C = line.pointClosestTo(this.anchor).elements;
    var A = this.anchor.elements, D = this.direction.elements;
    var C1 = C[0], C2 = C[1], C3 = C[2], A1 = A[0], A2 = A[1], A3 = A[2];
    var x = A1 - C1, y = A2 - C2, z = A3 - C3;
    return Line.create([
      C1 + R[0][0] * x + R[0][1] * y + R[0][2] * z,
      C2 + R[1][0] * x + R[1][1] * y + R[1][2] * z,
      C3 + R[2][0] * x + R[2][1] * y + R[2][2] * z
    ], [
      R[0][0] * D[0] + R[0][1] * D[1] + R[0][2] * D[2],
      R[1][0] * D[0] + R[1][1] * D[1] + R[1][2] * D[2],
      R[2][0] * D[0] + R[2][1] * D[1] + R[2][2] * D[2]
    ]);
  },

  // Returns the line's reflection in the given point or line
  reflectionIn: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var A = this.anchor.elements, D = this.direction.elements;
      var A1 = A[0], A2 = A[1], A3 = A[2], D1 = D[0], D2 = D[1], D3 = D[2];
      var newA = this.anchor.reflectionIn(obj).elements;
      // Add the line's direction vector to its anchor, then mirror that in the plane
      var AD1 = A1 + D1, AD2 = A2 + D2, AD3 = A3 + D3;
      var Q = obj.pointClosestTo([AD1, AD2, AD3]).elements;
      var newD = [Q[0] + (Q[0] - AD1) - newA[0], Q[1] + (Q[1] - AD2) - newA[1], Q[2] + (Q[2] - AD3) - newA[2]];
      return Line.create(newA, newD);
    } else if (obj.direction) {
      // obj is a line - reflection obtained by rotating PI radians about obj
      return this.rotate(Math.PI, obj);
    } else {
      // obj is a point - just reflect the line's anchor in it
      var P = obj.elements || obj;
      return Line.create(this.anchor.reflectionIn([P[0], P[1], (P[2] || 0)]), this.direction);
    }
  },

  // Set the line's anchor point and direction.
  setVectors: function(anchor, direction) {
    // Need to do this so that line's properties are not
    // references to the arguments passed in
    anchor = Vector.create(anchor);
    direction = Vector.create(direction);
    if (anchor.elements.length == 2) {anchor.elements.push(0); }
    if (direction.elements.length == 2) { direction.elements.push(0); }
    if (anchor.elements.length > 3 || direction.elements.length > 3) { return null; }
    var mod = direction.modulus();
    if (mod === 0) { return null; }
    this.anchor = anchor;
    this.direction = Vector.create([
      direction.elements[0] / mod,
      direction.elements[1] / mod,
      direction.elements[2] / mod
    ]);
    return this;
  }
};

  
// Constructor function
Line.create = function(anchor, direction) {
  var L = new Line();
  return L.setVectors(anchor, direction);
};

// Axes
Line.X = Line.create(Vector.Zero(3), Vector.i);
Line.Y = Line.create(Vector.Zero(3), Vector.j);
Line.Z = Line.create(Vector.Zero(3), Vector.k);



function Plane() {}
Plane.prototype = {

  // Returns true iff the plane occupies the same space as the argument
  eql: function(plane) {
    return (this.contains(plane.anchor) && this.isParallelTo(plane));
  },

  // Returns a copy of the plane
  dup: function() {
    return Plane.create(this.anchor, this.normal);
  },

  // Returns the result of translating the plane by the given vector
  translate: function(vector) {
    var V = vector.elements || vector;
    return Plane.create([
      this.anchor.elements[0] + V[0],
      this.anchor.elements[1] + V[1],
      this.anchor.elements[2] + (V[2] || 0)
    ], this.normal);
  },

  // Returns true iff the plane is parallel to the argument. Will return true
  // if the planes are equal, or if you give a line and it lies in the plane.
  isParallelTo: function(obj) {
    var theta;
    if (obj.normal) {
      // obj is a plane
      theta = this.normal.angleFrom(obj.normal);
      return (Math.abs(theta) <= Sylvester.precision || Math.abs(Math.PI - theta) <= Sylvester.precision);
    } else if (obj.direction) {
      // obj is a line
      return this.normal.isPerpendicularTo(obj.direction);
    }
    return null;
  },
  
  // Returns true iff the receiver is perpendicular to the argument
  isPerpendicularTo: function(plane) {
    var theta = this.normal.angleFrom(plane.normal);
    return (Math.abs(Math.PI/2 - theta) <= Sylvester.precision);
  },

  // Returns the plane's distance from the given object (point, line or plane)
  distanceFrom: function(obj) {
    if (this.intersects(obj) || this.contains(obj)) { return 0; }
    if (obj.anchor) {
      // obj is a plane or line
      var A = this.anchor.elements, B = obj.anchor.elements, N = this.normal.elements;
      return Math.abs((A[0] - B[0]) * N[0] + (A[1] - B[1]) * N[1] + (A[2] - B[2]) * N[2]);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      var A = this.anchor.elements, N = this.normal.elements;
      return Math.abs((A[0] - P[0]) * N[0] + (A[1] - P[1]) * N[1] + (A[2] - (P[2] || 0)) * N[2]);
    }
  },

  // Returns true iff the plane contains the given point or line
  contains: function(obj) {
    if (obj.normal) { return null; }
    if (obj.direction) {
      return (this.contains(obj.anchor) && this.contains(obj.anchor.add(obj.direction)));
    } else {
      var P = obj.elements || obj;
      var A = this.anchor.elements, N = this.normal.elements;
      var diff = Math.abs(N[0]*(A[0] - P[0]) + N[1]*(A[1] - P[1]) + N[2]*(A[2] - (P[2] || 0)));
      return (diff <= Sylvester.precision);
    }
  },

  // Returns true iff the plane has a unique point/line of intersection with the argument
  intersects: function(obj) {
    if (typeof(obj.direction) == 'undefined' && typeof(obj.normal) == 'undefined') { return null; }
    return !this.isParallelTo(obj);
  },

  // Returns the unique intersection with the argument, if one exists. The result
  // will be a vector if a line is supplied, and a line if a plane is supplied.
  intersectionWith: function(obj) {
    if (!this.intersects(obj)) { return null; }
    if (obj.direction) {
      // obj is a line
      var A = obj.anchor.elements, D = obj.direction.elements,
          P = this.anchor.elements, N = this.normal.elements;
      var multiplier = (N[0]*(P[0]-A[0]) + N[1]*(P[1]-A[1]) + N[2]*(P[2]-A[2])) / (N[0]*D[0] + N[1]*D[1] + N[2]*D[2]);
      return Vector.create([A[0] + D[0]*multiplier, A[1] + D[1]*multiplier, A[2] + D[2]*multiplier]);
    } else if (obj.normal) {
      // obj is a plane
      var direction = this.normal.cross(obj.normal).toUnitVector();
      // To find an anchor point, we find one co-ordinate that has a value
      // of zero somewhere on the intersection, and remember which one we picked
      var N = this.normal.elements, A = this.anchor.elements,
          O = obj.normal.elements, B = obj.anchor.elements;
      var solver = Matrix.Zero(2,2), i = 0;
      while (solver.isSingular()) {
        i++;
        solver = Matrix.create([
          [ N[i%3], N[(i+1)%3] ],
          [ O[i%3], O[(i+1)%3]  ]
        ]);
      }
      // Then we solve the simultaneous equations in the remaining dimensions
      var inverse = solver.inverse().elements;
      var x = N[0]*A[0] + N[1]*A[1] + N[2]*A[2];
      var y = O[0]*B[0] + O[1]*B[1] + O[2]*B[2];
      var intersection = [
        inverse[0][0] * x + inverse[0][1] * y,
        inverse[1][0] * x + inverse[1][1] * y
      ];
      var anchor = [];
      for (var j = 1; j <= 3; j++) {
        // This formula picks the right element from intersection by
        // cycling depending on which element we set to zero above
        anchor.push((i == j) ? 0 : intersection[(j + (5 - i)%3)%3]);
      }
      return Line.create(anchor, direction);
    }
  },

  // Returns the point in the plane closest to the given point
  pointClosestTo: function(point) {
    var P = point.elements || point;
    var A = this.anchor.elements, N = this.normal.elements;
    var dot = (A[0] - P[0]) * N[0] + (A[1] - P[1]) * N[1] + (A[2] - (P[2] || 0)) * N[2];
    return Vector.create([P[0] + N[0] * dot, P[1] + N[1] * dot, (P[2] || 0) + N[2] * dot]);
  },

  // Returns a copy of the plane, rotated by t radians about the given line
  // See notes on Line#rotate.
  rotate: function(t, line) {
    var R = Matrix.Rotation(t, line.direction).elements;
    var C = line.pointClosestTo(this.anchor).elements;
    var A = this.anchor.elements, N = this.normal.elements;
    var C1 = C[0], C2 = C[1], C3 = C[2], A1 = A[0], A2 = A[1], A3 = A[2];
    var x = A1 - C1, y = A2 - C2, z = A3 - C3;
    return Plane.create([
      C1 + R[0][0] * x + R[0][1] * y + R[0][2] * z,
      C2 + R[1][0] * x + R[1][1] * y + R[1][2] * z,
      C3 + R[2][0] * x + R[2][1] * y + R[2][2] * z
    ], [
      R[0][0] * N[0] + R[0][1] * N[1] + R[0][2] * N[2],
      R[1][0] * N[0] + R[1][1] * N[1] + R[1][2] * N[2],
      R[2][0] * N[0] + R[2][1] * N[1] + R[2][2] * N[2]
    ]);
  },

  // Returns the reflection of the plane in the given point, line or plane.
  reflectionIn: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var A = this.anchor.elements, N = this.normal.elements;
      var A1 = A[0], A2 = A[1], A3 = A[2], N1 = N[0], N2 = N[1], N3 = N[2];
      var newA = this.anchor.reflectionIn(obj).elements;
      // Add the plane's normal to its anchor, then mirror that in the other plane
      var AN1 = A1 + N1, AN2 = A2 + N2, AN3 = A3 + N3;
      var Q = obj.pointClosestTo([AN1, AN2, AN3]).elements;
      var newN = [Q[0] + (Q[0] - AN1) - newA[0], Q[1] + (Q[1] - AN2) - newA[1], Q[2] + (Q[2] - AN3) - newA[2]];
      return Plane.create(newA, newN);
    } else if (obj.direction) {
      // obj is a line
      return this.rotate(Math.PI, obj);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      return Plane.create(this.anchor.reflectionIn([P[0], P[1], (P[2] || 0)]), this.normal);
    }
  },

  // Sets the anchor point and normal to the plane. If three arguments are specified,
  // the normal is calculated by assuming the three points should lie in the same plane.
  // If only two are sepcified, the second is taken to be the normal. Normal vector is
  // normalised before storage.
  setVectors: function(anchor, v1, v2) {
    anchor = Vector.create(anchor);
    anchor = anchor.to3D(); if (anchor === null) { return null; }
    v1 = Vector.create(v1);
    v1 = v1.to3D(); if (v1 === null) { return null; }
    if (typeof(v2) == 'undefined') {
      v2 = null;
    } else {
      v2 = Vector.create(v2);
      v2 = v2.to3D(); if (v2 === null) { return null; }
    }
    var A1 = anchor.elements[0], A2 = anchor.elements[1], A3 = anchor.elements[2];
    var v11 = v1.elements[0], v12 = v1.elements[1], v13 = v1.elements[2];
    var normal, mod;
    if (v2 !== null) {
      var v21 = v2.elements[0], v22 = v2.elements[1], v23 = v2.elements[2];
      normal = Vector.create([
        (v12 - A2) * (v23 - A3) - (v13 - A3) * (v22 - A2),
        (v13 - A3) * (v21 - A1) - (v11 - A1) * (v23 - A3),
        (v11 - A1) * (v22 - A2) - (v12 - A2) * (v21 - A1)
      ]);
      mod = normal.modulus();
      if (mod === 0) { return null; }
      normal = Vector.create([normal.elements[0] / mod, normal.elements[1] / mod, normal.elements[2] / mod]);
    } else {
      mod = Math.sqrt(v11*v11 + v12*v12 + v13*v13);
      if (mod === 0) { return null; }
      normal = Vector.create([v1.elements[0] / mod, v1.elements[1] / mod, v1.elements[2] / mod]);
    }
    this.anchor = anchor;
    this.normal = normal;
    return this;
  }
};

// Constructor function
Plane.create = function(anchor, v1, v2) {
  var P = new Plane();
  return P.setVectors(anchor, v1, v2);
};

// X-Y-Z planes
Plane.XY = Plane.create(Vector.Zero(3), Vector.k);
Plane.YZ = Plane.create(Vector.Zero(3), Vector.i);
Plane.ZX = Plane.create(Vector.Zero(3), Vector.j);
Plane.YX = Plane.XY; Plane.ZY = Plane.YZ; Plane.XZ = Plane.ZX;

// Utility functions
var $V = Vector.create;
var $M = Matrix.create;
var $L = Line.create;
var $P = Plane.create;
/**
 * Rigid body base class
 * @class RigidBody
 * @param type
 * @param Vec3 position
 * @param float mass
 * @param object geodata
 * @param Vec3 velocity
 * @param Vec3 force
 * @param Vec3 rotvelo
 * @param Quaternion quat
 * @param Vec3 tau
 * @param Vec3 inertia
 */
PHYSICS.RigidBody = function(type,position,mass,geodata,velocity,force,rotvelo,quat,tau,inertia){
  this.position = position;
  this.velocity = velocity;
  this.force = force;
  this.tau = tau||new PHYSICS.Vec3(0,0,0);
  this.quaternion = quat;
  this.rotvelo = rotvelo;
  this.type = type;
  this.mass = mass;
  this.geodata = geodata;
  this.id = -1;
  this.world = null;
  this.inertia = inertia || new PHYSICS.Vec3(1,1,1);
};

/**
 * Enum for object types: SPHERE, PLANE
 */
PHYSICS.RigidBody.prototype.types = {
  SPHERE:1,
  PLANE:2
};/**
 * Spherical rigid body
 * @class Sphere
 * @param Vec3 position
 * @param float radius
 * @param float mass
 */
PHYSICS.Sphere = function(position,radius,mass){
  var I = 2.0*mass*radius*radius/5.0;
  PHYSICS.RigidBody.apply(this,
			  [PHYSICS.RigidBody.prototype.types.SPHERE,
			   position,
			   mass,
                           {radius:radius},
			   new PHYSICS.Vec3(0,0,0),
			   new PHYSICS.Vec3(0,0,0),
			   new PHYSICS.Vec3(0,10,0), // rotvelo
			   new PHYSICS.Quaternion(1,0,0,0),
			   new PHYSICS.Vec3(0,0,0), // tau
			   new PHYSICS.Vec3(I,I,I)]);
};
/**
 * Plane
 * @class Plane
 * @param Vec3 position
 * @param Vec3 normal
 * @todo Should be able to create it using only scalar+vector
 */
PHYSICS.Plane = function(position, normal){
  normal.normalize();
  PHYSICS.RigidBody.apply(this,		
			  [PHYSICS.RigidBody.prototype.types.PLANE,
			   position,
			   0,
                           {normal:normal},
			   new PHYSICS.Vec3(0,0,0),
			   new PHYSICS.Vec3(0,0,0),
			   new PHYSICS.Vec3(0,0,0),
			   new PHYSICS.Quaternion(1,0,0,0)]);
};

/**
 * The physics world
 * @class World
 */
PHYSICS.World = function(){

  // Some default values
  this.paused = false;
  this.time = 0.0;
  this.stepnumber = 0;
  this.iter = 10;

  this.spook_k = 300.0;
  this.spook_d = 1;

  var th = this;
  this.spook_a = function(h){ return 4.0 / (h * (1 + 4 * th.spook_d)); };
  this.spook_b = (4.0 * this.spook_d) / (1 + 4 * this.spook_d);
  this.spook_eps = function(h){ return 4.0 / (h * h * th.spook_k * (1 + 4 * th.spook_d)); };
};

/**
 * Get number of objects in the world.
 * @return int
 */
PHYSICS.World.prototype.togglepause = function(){
  this.paused = !this.paused;
};

/**
 * Get number of objects in the world.
 * @return int
 */
PHYSICS.World.prototype.numObjects = function(){
  return this.x ? this.x.length : 0;
};

/**
 * Add a rigid body to the simulation.
 * @param RigidBody body
 * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
 * @todo Adding an array of bodies should be possible. This would save some loops too
 */
PHYSICS.World.prototype.add = function(body){
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
  old_geodata = this.geodata;
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
  this.geodata = [];
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
    this.geodata[i] = old_geodata[i];
    this.body[i] = old_body[i];
    this.fixed[i] = old_geodata[i];
    this.invm[i] = old_invm[i];
    this.mass[i] = old_mass[i];
    this.inertiax[i] = old_inertiax[i];
    this.inertiay[i] = old_inertiay[i];
    this.inertiaz[i] = old_inertiaz[i];
  }

  // Add one more
  this.x[n] = body.position.x;
  this.y[n] = body.position.y;
  this.z[n] = body.position.z;
  
  this.vx[n] = body.velocity.x;
  this.vy[n] = body.velocity.y;
  this.vz[n] = body.velocity.z;
  
  this.fx[n] = body.force.x;
  this.fy[n] = body.force.y;
  this.fz[n] = body.force.z;
  
  this.taux[n] = body.tau.x;
  this.tauy[n] = body.tau.y;
  this.tauz[n] = body.tau.z;

  this.wx[n] = body.rotvelo.x;
  this.wy[n] = body.rotvelo.y;
  this.wz[n] = body.rotvelo.z;
  
  this.qx[n] = body.quaternion.x;
  this.qy[n] = body.quaternion.y;
  this.qz[n] = body.quaternion.z;
  this.qw[n] = body.quaternion.w;

  this.type[n] = body.type;
  this.geodata[n] = body.geodata;
  this.body[n] = body; // Keep reference to body
  this.fixed[n] = body.mass<=0.0;
  this.invm[n] = body.mass>0 ? 1.0/body.mass : 0;
  this.mass[n] = body.mass;

  this.inertiax[n] = body.inertia.x;
  this.inertiay[n] = body.inertia.y;
  this.inertiaz[n] = body.inertia.z;

  body.id = n-1; // give id as index in table
  body.world = this;

  // Create collision matrix
  this.collision_matrix = new Int16Array((n+1)*(n+1));
};

/**
 * Get/set the broadphase collision detector for the world.
 * @param BroadPhase broadphase
 * @return BroadPhase
 */
PHYSICS.World.prototype.broadphase = function(broadphase){
  if(broadphase){
    this._broadphase = broadphase;
  } else
    return this._broadphase;
};

/**
 * Get/set the number of iterations
 * @param int n
 * @return int
 */
PHYSICS.World.prototype.iterations = function(n){
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
PHYSICS.World.prototype.gravity = function(g){
  if(g==undefined)
    return this.gravity;
  else
    this.gravity = g;
};

/**
 * Step the simulation
 * @param float dt
 */
PHYSICS.World.prototype.step = function(dt){
  if(this.paused)
    return;

  // 1. Collision detection
  var pairs = this._broadphase.collisionPairs(this);
  var p1 = pairs[0];
  var p2 = pairs[1];

  // Get references to things that are accessed often. Will save some lookup time.
  var SPHERE = PHYSICS.RigidBody.prototype.types.SPHERE;
  var PLANE = PHYSICS.RigidBody.prototype.types.PLANE;
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
  for(var i=0; i<lambdas.length; i++){
    lambdas[i] = 0;
    vx_lambda[i] = 0;
    vy_lambda[i] = 0;
    vz_lambda[i] = 0;
    wx_lambda[i] = 0;
    wy_lambda[i] = 0;
    wz_lambda[i] = 0;
  }

  var that = this;
  function cmatrix(i,j,newval){
    if(i>j){
      var temp = j;
      j = i;
      i = temp;
    }
    if(newval===undefined)
      return that.collision_matrix[i+j*that.numObjects()];
    else {
      that.collision_matrix[i+j*that.numObjects()] = parseInt(newval);
    }
  }

  // Resolve impulses
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
      var r = new PHYSICS.Vec3(x[si]-x[pi],
			       y[si]-y[pi],
			       z[si]-z[pi]);
      r = n.mult(r.dot(n));
      var q = (r.dot(n)-world.geodata[si].radius);

      var w_sphere = new PHYSICS.Vec3(wx[si], wy[si], wz[si]);
      var v_sphere = new PHYSICS.Vec3(vx[si], vy[si], vz[si]);
      // Contact velocity
      // v = (body(n).V(1:3) + cr(body(n).V(4:6)',rn)') - (body(m).V(1:3) + cr(body(m).V(4:6)',rm)');
      // @todo

      var cr = v_sphere.vadd(v_sphere.cross(r)); // OK

      var v_contact = new PHYSICS.Vec3(vx[si]+cr.x,
				       vy[si]+cr.y,
				       vz[si]+cr.z); // OK
     
      v_sphere.vadd(w_sphere.cross(r),v_contact);

      // Relative velocity
      var u = n.mult(v_sphere.dot(n));
      
      // Action if penetration
      if(q<=0.0 && cmatrix(si,pi)==0){ // No impact for separating contacts
	if(u.dot(n)<0.0)
	  cmatrix(si,pi,1);
	var r_star = r.crossmat();
	
	var invm = this.invm;
	// Collision matrix:
	// K = eye(3,3)/body(n).m - r_star*body(n).Iinv*r_star;
	var K = new PHYSICS.Mat3();
	K.identity();
	K.elements[0] *= invm[si];
	K.elements[4] *= invm[si];
	K.elements[8] *= invm[si];

	var rIr = r_star.mmult(K.mmult(r_star));
	for(var el = 0; el<9; el++)
	  K.elements[el] -= rIr.elements[el];
	
	// First assume stick friction
	var e = 0.8;

	// Final velocity if stick
	var v_f = n.mult((1-e) * (v_contact.dot(n))); 

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
	var wadd = cr.mult(world.mass[si]);
	wx[si] += wadd.x; //body(n).V(4:6) = body(n).V(4:6) + (body(n).Iinv*cr(impulse_vec,r))';
	wy[si] += wadd.y;
	wz[si] += wadd.z;
	
	cmatrix(si,pi,-1); // Just applied impulse - set impact
      } else if(q<=0 & cmatrix(si,pi)==-1)
	cmatrix(si,pi,1); // Last step was impact and we are still penetrated- set contact
      else if(q>0)
	cmatrix(si,pi,0); // No penetration any more- set no contact

    } else if(types[i]==SPHERE &&
	      types[j]==SPHERE){

      var n = new PHYSICS.Vec3(x[i]-x[j],
			       y[i]-y[j],
			       z[i]-z[j]);
      n.normalize();
      var q = (nlen - (world.geodata[i].radius+world.geodata[j].radius));
      var u = new PHYSICS.Vec3(vx[i]-vx[j],
			       vy[i]-vy[j],
			       vz[i]-vz[j]);
      u = n.mult(u.dot(n));
      if(q<0.0 && u.dot(n)<0){
	var e = 0.5;
	var u_new = n.mult(-(u.dot(n)*e));
	
	vx[i] += e*(u_new.x - u.x)*invm[j];
	vy[i] += e*(u_new.y - u.y)*invm[j];
	vz[i] += e*(u_new.z - u.z)*invm[j];

	vx[j] -= e*(u_new.x - u.x)*invm[i];
	vy[j] -= e*(u_new.y - u.y)*invm[i];
	vz[j] -= e*(u_new.z - u.z)*invm[i];

	// Todo, implement below things. They are general impulses from granular.m
	var r = new PHYSICS.Vec3(x[i]-x[j],
				 y[i]-y[j],
				 z[i]-z[j]);
	var ri = n.mult(world.geodata[i].radius);
	var rj = n.mult(world.geodata[j].radius);

	/*
            % Collide with core
                r = dR;
                rn = -body(n).r_core * normal;
                rm = body(m).r_core * normal;
                v = (body(n).V(1:3) + cr(body(n).V(4:6)',rn)') - (body(m).V(1:3) + cr(body(m).V(4:6)',rm)');
                if v*r > 0 
                    COLLISION_MATRIX(n,m) = 1;
                    break                                                  % No impact for separating contacts
                end
                r_star = getSTAR2(r);
                rn_star = getSTAR2(rn);
                rm_star = getSTAR2(rm);
	*/

	var r_star = r.crossmat();
	var rn_star = rn.crossmat();
	var rm_star = rm.crossmat();

	/*

                K = eye(3,3)/body(n).m + eye(3,3)/body(m).m - rn_star*body(m).Iinv*rn_star - rm_star*body(n).Iinv*rm_star; 
                % First assume stick friction
                v_f = - e_pair * (v*normal) * normal';               % Final velocity if stick
                impulse_vec =  K\(v_f - v)';
                % Check if slide mode (J_t > J_n) - outside friction cone
                if MU>0
                    J_n = (impulse_vec'*normal) * normal;
                    J_t = impulse_vec - J_n;
                    if norm(J_t) > norm(MU*J_n)                    
                            v_tang = v' - (v*normal)*normal;
                            tangent =  v_tang/(norm(v_tang) + 10^(-6));
                            impulse = -(1+e_pair)*(v*normal)/(normal' * K * (normal - MU*tangent));
                            impulse_vec = impulse * normal - MU * impulse * tangent;
                    end
                end
                 bodyTotmass = body(n).m + body(m).m;
                 body(n).V(1:3) = body(n).V(1:3) +  1/body(n).m * impulse_vec';
                 body(n).V(4:6) = body(n).V(4:6) + (body(n).Iinv*cr(impulse_vec,rn))';
                 %body(n).x(1:3) = body(n).x(1:3) + penetration*normal * (body(n).m/bodyTotmass);
                 body(n).L = body(n).I*body(n).V(4:6)';
                 body(m).V(1:3) = body(m).V(1:3) -  1/body(m).m * impulse_vec';
                 body(m).V(4:6) = body(m).V(4:6) + (body(m).Iinv*cr(impulse_vec,rm))';
                 %body(m).x(1:3) = body(m).x(1:3) - penetration*normal * (body(m).m/bodyTotmass);
                 body(m).L = body(m).I*body(m).V(4:6)';
	 */


      }
    }
  }

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
	var r = new PHYSICS.Vec3(x[si]-x[pi],
				 y[si]-y[pi],
				 z[si]-z[pi]);
	var q = (r.dot(n)-world.geodata[si].radius)*2;
	var v_sphere = new PHYSICS.Vec3(vx[si],
					vy[si],
					vz[si]);
	
	var u = n.mult(v_sphere.dot(n));
	
	// Action if penetration
	if(q<0.0){

	  // Solve for lambda
	  var old_lambda = lambdas[k];
	  var fs = new PHYSICS.Vec3(fx[si],
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
	}
      } else if(types[i]==SPHERE &&
		types[j]==SPHERE){
	var r = new PHYSICS.Vec3(x[i]-x[j],
				 y[i]-y[j],
				 z[i]-z[j]);
	var nlen = r.norm();
	var n = new PHYSICS.Vec3(x[i]-x[j],
				 y[i]-y[j],
				 z[i]-z[j]);
	n.normalize();
	var q = (nlen - (world.geodata[i].radius+world.geodata[j].radius))*2;
	var u = new PHYSICS.Vec3(vx[i]-vx[j],
				 vy[i]-vy[j],
				 vz[i]-vz[j]);
	u = n.mult(u.dot(n));
	if(q<0.0){

	  // Solve for lambda
	  var old_lambda = lambdas[k];
	  var fi = new PHYSICS.Vec3(fx[i],
				    fy[i],
				    fz[i]);
	  var fj = new PHYSICS.Vec3(fx[j],
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

  // Add gravity to all objects
  for(var i=0; i<world.numObjects(); i++){
    if(!world.fixed[i]){
      fx[i] += world.gravity.x * world.mass[i];
      fy[i] += world.gravity.y * world.mass[i];
      fz[i] += world.gravity.z * world.mass[i];
    }
  }

  // Leap frog
  // vnew = v + h*f/m
  // xnew = x + h*vnew
  for(var i=0; i<world.numObjects(); i++){
    vx[i] += fx[i] * world.invm[i] * dt + vx_lambda[i];
    vy[i] += fy[i] * world.invm[i] * dt + vy_lambda[i];
    vz[i] += fz[i] * world.invm[i] * dt + vz_lambda[i];

    wx[i] += taux[i] * 1.0/world.inertiax[i] * dt + wx_lambda[i];
    wy[i] += tauy[i] * 1.0/world.inertiay[i] * dt + wy_lambda[i];
    wz[i] += tauz[i] * 1.0/world.inertiaz[i] * dt + wz_lambda[i];

    // Use new velocity  - leap frog
    x[i] += vx[i] * dt;
    y[i] += vy[i] * dt;
    z[i] += vz[i] * dt;
    
    var q = new PHYSICS.Quaternion(qx[i],qy[i],qz[i],qw[i]);
    var w = new PHYSICS.Quaternion(wx[i],wy[i],wz[i],0);
    var wq = w.mult(q);
    wq.normalize();
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

  // Read all data into object references again
  for(var i=0; i<world.numObjects(); i++){
    world.body[i].position.x = x[i];
    world.body[i].position.y = y[i];
    world.body[i].position.z = z[i];

    world.body[i].rotvelo.x = vx[i];
    world.body[i].rotvelo.y = vy[i];
    world.body[i].rotvelo.z = vz[i];

    world.body[i].quaternion.x = qx[i];
    world.body[i].quaternion.y = qy[i];
    world.body[i].quaternion.z = qz[i];
    world.body[i].quaternion.w = qw[i];
  }  
};

