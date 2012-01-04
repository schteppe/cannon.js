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
			  [PHYSICS.RigidBody.prototype.types.PLANE]);
  this.position = position;
  this.mass = 0.0;
  this.geodata = {normal:normal};
};

