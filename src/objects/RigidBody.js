/*global CANNON:true */

/**
 * @class CANNON.RigidBody
 * @brief Rigid body base class
 * @param float mass
 * @param CANNON.Shape shape
 * @param CANNON.Material material
 * @todo Motion state? Like dynamic, kinematic, static...
 */
CANNON.RigidBody = function(mass,shape,material){

  /**
   * @property CANNON.Vec3 position
   * @memberof CANNON.RigidBody
   */
  this.position = new CANNON.Vec3();

  /**
   * @property CANNON.Vec3 initPosition
   * @memberof CANNON.RigidBody
   * @brief Initial position of the body
   */
  this.initPosition = new CANNON.Vec3();

  /**
   * @property CANNON.Vec3 velocity
   * @memberof CANNON.RigidBody
   */
  this.velocity = new CANNON.Vec3();

  /**
   * @property CANNON.Vec3 initVelocity
   * @memberof CANNON.RigidBody
   */
  this.initVelocity = new CANNON.Vec3();

  /**
   * @property CANNON.Vec3 force
   * @memberof CANNON.RigidBody
   * @brief Linear force on the body
   */
  this.force = new CANNON.Vec3();

  /**
   * @property CANNON.Vec3 tau
   * @memberof CANNON.RigidBody
   * @brief Rotational force on the body, around center of mass
   */
  this.tau = new CANNON.Vec3();

  /**
   * @property CANNON.Quaternion quaternion
   * @memberof CANNON.RigidBody
   * @brief Orientation of the body
   */
  this.quaternion = new CANNON.Quaternion();

  /**
   * @property CANNON.Quaternion initQuaternion
   * @memberof CANNON.RigidBody
   */
  this.initQuaternion = new CANNON.Quaternion();

  /**
   * @property CANNON.Vec3 angularVelocity
   * @memberof CANNON.RigidBody
   */
  this.angularVelocity = new CANNON.Vec3();

  /**
   * @property CANNON.Vec3 initAngularVelocity
   * @memberof CANNON.RigidBody
   */
  this.initAngularVelocity = new CANNON.Vec3();

  /**
   * @property float mass
   * @memberof CANNON.RigidBody
   */
  this.mass = mass;

  /**
   * @property float invMass
   * @memberof CANNON.RigidBody
   */
  this.invMass = mass>0 ? 1.0/mass : 0;

  /**
   * @property CANNON.Shape shape
   * @memberof CANNON.RigidBody
   */
  this.shape = shape;

  /**
   * @property CANNON.Vec3 inertia
   * @memberof CANNON.RigidBody
   */
  this.inertia = shape.calculateLocalInertia(mass);

  /**
   * @property CANNON.Vec3 intInertia
   * @memberof CANNON.RigidBody
   */
  this.invInertia = new CANNON.Vec3(this.inertia.x>0 ? 1.0/this.inertia.x : 0,
				    this.inertia.y>0 ? 1.0/this.inertia.y : 0,
				    this.inertia.z>0 ? 1.0/this.inertia.z : 0);

  /**
   * @property CANNON.Material material
   * @memberof CANNON.RigidBody
   */
  this.material = material;

  /**
   * @property float linearDamping
   * @memberof CANNON.RigidBody
   */
  this.linearDamping = 0.01; // Perhaps default should be zero here?

  /**
   * @property float angularDamping
   * @memberof CANNON.RigidBody
   */
  this.angularDamping = 0.01;

  /**
   * @property bool fixed
   * @memberof CANNON.RigidBody
   * @brief True if the body is static
   */
  this.fixed = (mass <= 0.0);

  /**
   * @property CANNON.World world
   * @memberof CANNON.RigidBody
   * @brief Reference to the world the body is living in
   */
  this.world = null;
};
