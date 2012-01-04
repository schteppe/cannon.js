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

