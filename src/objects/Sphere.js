/**
 * Spherical rigid body
 * @class Sphere
 * @param Vec3 position
 * @param float radius
 * @param float mass
 */
PHYSICS.Sphere = function(position,radius,mass){
  PHYSICS.RigidBody.apply(this,
			  [PHYSICS.RigidBody.prototype.types.SPHERE]);
  this.position = position;
  this.mass = mass;
  this.geodata = {radius:radius};
  var I = 2.0*mass*radius*radius/5.0;
  this.inertia = new PHYSICS.Vec3(I,I,I);
};
