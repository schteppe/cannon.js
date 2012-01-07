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
PHYSICS.RigidBody = function(type){
  this.type = type;
  this.position = new PHYSICS.Vec3();
  this.velocity = new PHYSICS.Vec3();
  this.force = new PHYSICS.Vec3();
  this.tau = new PHYSICS.Vec3();
  this.quaternion = new PHYSICS.Quaternion();
  this.rotvelo = new PHYSICS.Vec3();
  this.mass = 1.0;
  this.geodata = {};
  this.id = -1;
  this.world = null;
  this.inertia = new PHYSICS.Vec3(1,1,1);
};

/**
 * Enum for object types: SPHERE, PLANE
 */
PHYSICS.RigidBody.prototype.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4
};
