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
 * @return string
 */
CANNON.Quaternion.prototype.toString = function(){
  return this.x+","+this.y+","+this.z+","+this.w;
};

/**
 * Set the quaternion components given an axis and an angle.
 * @param Vec3 axis
 * @param float angle
 */
CANNON.Quaternion.prototype.setFromAxisAngle = function(axis,angle){
  var s = Math.sin(angle*0.5);
  this.x = axis.x * s;
  this.y = axis.y * s;
  this.z = axis.z * s;
  this.w = Math.cos(angle*0.5);
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
};