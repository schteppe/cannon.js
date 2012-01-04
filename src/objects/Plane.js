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

