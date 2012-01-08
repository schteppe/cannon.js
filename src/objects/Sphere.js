/**
 * Spherical rigid body
 * @class Sphere
 * @param Vec3 position
 * @param float radius
 * @param float mass
 */
CANNON.Sphere = function(position,radius,mass){
  CANNON.RigidBody.apply(this,[CANNON.RigidBody.prototype.types.SPHERE]);
  //this.position = position;
  this.mass = mass;
  this.geodata = {radius:radius};
  var I = 2.0*mass*radius*radius/5.0;
  this.inertia = new CANNON.Vec3(I,I,I);
};

CANNON.Sphere.prototype = new CANNON.RigidBody();
CANNON.Sphere.prototype.constructor = CANNON.Sphere;