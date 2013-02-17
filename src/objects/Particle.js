/*global CANNON:true */

/**
 * @class CANNON.Particle
 * @brief A body consisting of one point mass. Does not have orientation.
 * @param float mass
 * @param CANNON.Material material
 */
CANNON.Particle = function(mass,material){

    // Check input
    if(typeof(mass)!="number")
        throw new Error("Argument 1 (mass) must be a number.");
    if(typeof(material)!="undefined" && !(material instanceof(CANNON.Material)))
        throw new Error("Argument 3 (material) must be an instance of CANNON.Material.");

    CANNON.Body.call(this,"particle");

    var that = this;

    /**
    * @property CANNON.Vec3 position
    * @memberof CANNON.Particle
    */
    this.position = new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 initPosition
    * @memberof CANNON.Particle
    * @brief Initial position of the body
    */
    this.initPosition = new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 velocity
    * @memberof CANNON.Particle
    */
    this.velocity = new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 initVelocity
    * @memberof CANNON.Particle
    */
    this.initVelocity = new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 force
    * @memberof CANNON.Particle
    * @brief Linear force on the body
    */
    this.force = new CANNON.Vec3();

    /**
    * @property float mass
    * @memberof CANNON.Particle
    */
    this.mass = mass;

    /**
    * @property float invMass
    * @memberof CANNON.Particle
    */
    this.invMass = mass>0 ? 1.0/mass : 0;

    /**
    * @property CANNON.Material material
    * @memberof CANNON.Particle
    */
    this.material = material;

    /**
    * @property float linearDamping
    * @memberof CANNON.Particle
    */
    this.linearDamping = 0.01; // Perhaps default should be zero here?

    /**
    * @property int motionstate
    * @memberof CANNON.Particle
    * @brief One of the states CANNON.Body.DYNAMIC, CANNON.Body.STATIC and CANNON.Body.KINEMATIC
    */
    this.motionstate = (mass <= 0.0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC);

    /**
    * @property bool allowSleep
    * @memberof CANNON.Particle
    * @brief If true, the body will automatically fall to sleep.
    */
    this.allowSleep = true;

    // 0:awake, 1:sleepy, 2:sleeping
    this.sleepState = 0;

    /**
    * @method isAwake
    * @memberof CANNON.Particle
    * @return bool
    */
    this.isAwake = function(){ return this.sleepState == 0; }

    /**
    * @method isSleepy
    * @memberof CANNON.Particle
    * @return bool
    */
    this.isSleepy = function(){ return this.sleepState == 1; }

    /**
    * @method isSleeping
    * @memberof CANNON.Particle
    * @return bool
    */
    this.isSleeping = function(){ return this.sleepState == 2; }

    /**
    * @property float sleepSpeedLimit
    * @memberof CANNON.Particle
    * @brief If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
    */
    this.sleepSpeedLimit = 0.1;

    /**
    * @property float sleepTimeLimit
    * @memberof CANNON.Particle
    * @brief If the body has been sleepy for this sleepTimeLimit milliseconds, it is considered sleeping.
    */
    this.sleepTimeLimit = 1000;
    this.timeLastSleepy = 0;

    /**
    * @method wakeUp
    * @memberof CANNON.Particle
    * @brief Wake the body up.
    */
    this.wakeUp = function(){
        this.sleepState = 0;
        that.dispatchEvent({type:"wakeup"});
    };

    /**
    * @method sleep
    * @memberof CANNON.Particle
    * @brief Force body sleep
    */
    this.sleep = function(){
        this.sleepState = 2;
    };

    /**
    * @method sleepTick
    * @memberof CANNON.Particle
    * @brief Called every timestep to update internal sleep timer and change sleep state if needed.
    */
    this.sleepTick = function(time){
        if(that.allowSleep){
          if(this.sleepState==0 && that.velocity.norm()<that.sleepSpeedLimit){
              this.sleepState = 1; // Sleepy
              this.timeLastSleepy = time;
              that.dispatchEvent({type:"sleepy"});
          } else if(this.sleepState==1 && that.velocity.norm()>that.sleepSpeedLimit){
              that.wakeUp(); // Wake up
          } else if(this.sleepState==1 && (time - this.timeLastSleepy)>that.sleepTimeLimit){
              this.sleepState = 2; // Sleeping
              that.dispatchEvent({type:"sleep"});
          }
        }
    };
};
