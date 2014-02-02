module.exports = Particle;

var Shape = require('../shapes/Shape')
,   Vec3 = require('../math/Vec3')
,   Quaternion = require('../math/Quaternion')
,   Body = require('./Body')
,   Material = require('../material/Material')

/**
 * A body consisting of one point mass. Does not have orientation.
 * @class Particle
 * @constructor
 * @param {Number} mass
 * @param {Material} material
 */
function Particle(mass,material){

    // Check input
    if(typeof(mass)!=="number"){
        throw new Error("Argument 1 (mass) must be a number.");
    }
    if(typeof(material)!=="undefined" && !(material instanceof(Material))){
        throw new Error("Argument 2 (material) must be an instance of Material.");
    }

    Body.call(this,"particle");

    /**
     * @property position
     * @type {Vec3}
     */
    this.position = new Vec3();

    /**
     * Initial position of the body
     * @property initPosition
     * @type {Vec3}
     */
    this.initPosition = new Vec3();

    /**
     * @property velocity
     * @type {Vec3}
     */
    this.velocity = new Vec3();

    /**
     * @property initVelocity
     * @type {Vec3}
     */
    this.initVelocity = new Vec3();

    /**
     * Linear force on the body
     * @property force
     * @type {Vec3}
     */
    this.force = new Vec3();

    /**
     * @property mass
     * @type {Number}
     */
    this.mass = mass;

    /**
     * @property invMass
     * @type {Number}
     */
    this.invMass = mass>0 ? 1.0/mass : 0;

    /**
     * @property material
     * @type {Material}
     */
    this.material = material;

    /**
     * @property float linearDamping
     * @type {Number}
     */
    this.linearDamping = 0.01; // Perhaps default should be zero here?

    /**
     * One of the states Body.DYNAMIC, Body.STATIC and Body.KINEMATIC
     * @property motionstate
     * @type {Number}
     */
    this.motionstate = (mass <= 0.0 ? Body.STATIC : Body.DYNAMIC);

    /**
     * If true, the body will automatically fall to sleep.
     * @property allowSleep
     * @type {Boolean}
     */
    this.allowSleep = true;

    // 0:awake, 1:sleepy, 2:sleeping
    this.sleepState = 0;

    /**
     * If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
     * @property sleepSpeedLimit
     * @type {Number}
     */
    this.sleepSpeedLimit = 0.1;

    /**
     * If the body has been sleepy for this sleepTimeLimit seconds, it is considered sleeping.
     * @property sleepTimeLimit
     * @type {Number}
     */
    this.sleepTimeLimit = 1;

    this.timeLastSleepy = 0;

};

Particle.prototype = new Body();
Particle.prototype.constructor = Particle;

/**
* @method isAwake
* @return bool
*/
Particle.prototype.isAwake = function(){
    return this.sleepState === 0;
};

/**
* @method isSleepy
* @return bool
*/
Particle.prototype.isSleepy = function(){
    return this.sleepState === 1;
};

/**
 * @method isSleeping
 * @return bool
 */
Particle.prototype.isSleeping = function(){
    return this.sleepState === 2;
};

/**
 * Wake the body up.
 * @method wakeUp
 */
Particle.prototype.wakeUp = function(){
    var s = this.sleepState;
    this.sleepState = 0;
    if(s === 2){
        this.dispatchEvent({type:"wakeup"});
    }
};

/**
 * Force body sleep
 * @method sleep
 */
Particle.prototype.sleep = function(){
    this.sleepState = 2;
};

/**
 * Called every timestep to update internal sleep timer and change sleep state if needed.
 * @method sleepTick
 * @param {Number} time The world time in seconds
 */
Particle.prototype.sleepTick = function(time){
    if(this.allowSleep){
        var sleepState = this.sleepState;
        var speedSquared = this.velocity.norm2();
        var speedLimitSquared = Math.pow(this.sleepSpeedLimit,2);
        if(sleepState===0 && speedSquared < speedLimitSquared){
            this.sleepState = 1; // Sleepy
            this.timeLastSleepy = time;
            this.dispatchEvent({type:"sleepy"});
        } else if(sleepState===1 && speedSquared > speedLimitSquared){
            this.wakeUp(); // Wake up
        } else if(sleepState===1 && (time - this.timeLastSleepy ) > this.sleepTimeLimit){
            this.sleepState = 2; // Sleeping
            this.dispatchEvent({type:"sleep"});
        }
    }
};
