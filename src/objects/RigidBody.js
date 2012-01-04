/**
 * Rigid body base class
 * @class RigidBody
 * @param type
 * @param Vec3 position
 * @param float mass
 * @param object geodata
 * @param Vec3 velocity
 * @param Vec3 force
 * @param Vec3 rotvelo
 * @param Quaternion quat
 * @param Vec3 tau
 * @param Vec3 inertia
 */
PHYSICS.RigidBody = function(type,position,mass,geodata,velocity,force,rotvelo,quat,tau,inertia){
  this.position = position;
  this.velocity = velocity;
  this.force = force;
  this.tau = tau||new PHYSICS.Vec3(0,0,0);
  this.quaternion = quat;
  this.rotvelo = rotvelo;
  this.type = type;
  this.mass = mass;
  this.geodata = geodata;
  this.id = -1;
  this.world = null;
  this.inertia = inertia || new PHYSICS.Vec3(1,1,1);
};

/**
 * Enum for object types: SPHERE, PLANE
 */
PHYSICS.RigidBody.prototype.types = {
  SPHERE:1,
  PLANE:2
};