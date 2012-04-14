/**
 * @class CANNON.RigidBody
 * @brief Rigid body base class
 * @param float mass
 * @param CANNON.Shape shape
 * @param CANNON.Material material
 * @todo Motion state? Like dynamic, kinematic, static...
 */
CANNON.RigidBody = function(mass,shape,material){
  // Local variables
  this.position = new CANNON.Vec3();
  this.initPosition = new CANNON.Vec3();
  this.velocity = new CANNON.Vec3();
  this.initVelocity = new CANNON.Vec3();
  this.force = new CANNON.Vec3();
  this.tau = new CANNON.Vec3();
  this.quaternion = new CANNON.Quaternion();
  this.initQuaternion = new CANNON.Quaternion();
  this.angularVelocity = new CANNON.Vec3();
  this.initAngularVelocity = new CANNON.Vec3();
  this.mass = mass;
  this.invMass = mass>0 ? 1.0/mass : 0;
  this.shape = shape;
  this.inertia = shape.calculateLocalInertia(mass);
  this.invInertia = new CANNON.Vec3(this.inertia.x>0 ? 1.0/this.inertia.x : 0,
				    this.inertia.y>0 ? 1.0/this.inertia.y : 0,
				    this.inertia.z>0 ? 1.0/this.inertia.z : 0);
  this.material = material;
  this.linearDamping = 0.01; // Perhaps default should be zero here?
  this.angularDamping = 0.01;
  this.fixed = (mass <= 0.0);

  /// Reference to the world the body is living in
  this.world = null;
};
