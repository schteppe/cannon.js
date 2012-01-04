/**
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
