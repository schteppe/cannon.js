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

  // Check input
  if(typeof(mass)!="number")
      throw new Error("Argument 1 (mass) must be a number.");
  if(typeof(shape)!="object" || !(shape instanceof(CANNON.Shape)))
      throw new Error("Argument 2 (shape) must be an instance of CANNON.Shape.");
  if(typeof(material)!="undefined" && !(material instanceof(CANNON.Material)))
      throw new Error("Argument 3 (material) must be an instance of CANNON.Material.");

  // Extend the EventTarget class
  CANNON.EventTarget.apply(this);

  var that = this;

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
  this.inertia = new CANNON.Vec3();
  shape.calculateLocalInertia(mass,this.inertia);

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
   * @property int motionstate
   * @memberof CANNON.RigidBody
   * @brief One of the states CANNON.RigidBody.DYNAMIC, CANNON.RigidBody.STATIC and CANNON.RigidBody.KINEMATIC
   */
  this.motionstate = (mass <= 0.0 ? CANNON.RigidBody.STATIC : CANNON.RigidBody.DYNAMIC);

  /**
   * @property CANNON.World world
   * @memberof CANNON.RigidBody
   * @brief Reference to the world the body is living in
   */
  this.world = null;

  /**
   * @property function preStep
   * @memberof CANNON.RigidBody
   * @brief Callback function that is used BEFORE stepping the system. Use it to apply forces, for example. Inside the function, "this" will refer to this CANNON.RigidBody object.
   * @todo dispatch an event from the World instead
   */
  this.preStep = null;

  /**
   * @property function postStep
   * @memberof CANNON.RigidBody
   * @brief Callback function that is used AFTER stepping the system. Inside the function, "this" will refer to this CANNON.RigidBody object.
   * @todo dispatch an event from the World instead
   */
  this.postStep = null;

  /**
   * @property bool allowSleep
   * @memberof CANNON.RigidBody
   * @brief If true, the body will automatically fall to sleep.
   */
  this.allowSleep = true;

  // 0:awake, 1:sleepy, 2:sleeping
  var sleepState = 0;

  /**
   * @fn isAwake
   * @memberof CANNON.RigidBody
   */
  this.isAwake = function(){ return sleepState == 0; }

  /**
   * @fn isSleepy
   * @memberof CANNON.RigidBody
   */
  this.isSleepy = function(){ return sleepState == 1; }

  /**
   * @fn isSleeping
   * @memberof CANNON.RigidBody
   */
  this.isSleeping = function(){ return sleepState == 2; }

  /**
   * @property float sleepSpeedLimit
   * @memberof CANNON.RigidBody
   * @brief If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
   */
  this.sleepSpeedLimit = 0.1;

  /**
   * @property float sleepTimeLimit
   * @memberof CANNON.RigidBody
   * @brief If the body has been sleepy for this sleepTimeLimit milliseconds, it is considered sleeping.
   */
  this.sleepTimeLimit = 1000;
  var timeLastSleepy = new Date().getTime();

  /**
   * @fn wakeUp
   * @memberof CANNON.RigidBody
   * @brief Wake the body up.
   */
  this.wakeUp = function(){
      sleepState = 0;
      that.dispatchEvent({type:"wakeup"});
  };

  /**
   * @fn sleepTick
   * @memberof CANNON.RigidBody
   * @brief Called every timestep to update internal sleep timer and change sleep state if needed.
   */
  this.sleepTick = function(){
      if(that.allowSleep){
	  if(sleepState==0 && that.velocity.norm()<that.sleepSpeedLimit){
	      sleepState = 1; // Sleepy
	      timeLastSleepy = new Date().getTime();
	      that.dispatchEvent({type:"sleepy"});
	  } else if(sleepState==1 && that.velocity.norm()>that.sleepSpeedLimit){
	      that.wakeUp(); // Wake up
	  } else if(sleepState==1 && (new Date().getTime() - timeLastSleepy)>that.sleepTimeLimit){
	      sleepState = 2; // Sleeping
	      that.dispatchEvent({type:"sleep"});
	  }
      }
  };
};

/**
 * @brief A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
 */
CANNON.RigidBody.DYNAMIC = 1;

/**
 * @brief A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
 */
CANNON.RigidBody.STATIC = 2;

/**
 * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
 */
CANNON.RigidBody.KINEMATIC = 4;