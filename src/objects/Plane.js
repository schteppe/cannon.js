/**
 * Plane
 * @class Plane
 * @param Vec3 position
 * @param Vec3 normal
 * @todo Should be able to create it using only scalar+vector
 */
CANNON.Plane = function(position, normal){
  normal.normalize();
  CANNON.RigidBody.apply(this,[CANNON.RigidBody.prototype.types.PLANE]);
  //this.position = position;
  this.mass = 0.0;
  this.geodata = {normal:normal};
};

CANNON.Plane.prototype = new CANNON.RigidBody();
CANNON.Plane.prototype.constructor = CANNON.Plane;