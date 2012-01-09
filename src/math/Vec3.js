/**
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
