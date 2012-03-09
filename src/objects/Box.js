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