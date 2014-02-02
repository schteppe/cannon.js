module.exports = RigidBody;

var Shape = require('./Shape')
,   Vec3 = require('../math/Vec3')
,   Quaternion = require('../math/Quaternion')
,   Particle = require('./Particle')
,   Material = require('../material/Material')

/**
 * Rigid body base class
 * @class RigidBody
 * @constructor
 * @param {Number} mass
 * @param {Shape} shape
 * @param {Material} material
 */
function RigidBody(mass,shape,material){

    // Check input
    if(typeof(mass)!=="number"){
        throw new Error("Argument 1 (mass) must be a number.");
    }
    if(typeof(material)!=="undefined" && !(material instanceof(Material))){
        throw new Error("Argument 3 (material) must be an instance of Material.");
    }

    Particle.call(this,mass,material);

    var that = this;

    /**
     * Rotational force on the body, around center of mass
     * @property Vec3 tau
     * @todo should be renamed to .angularForce
     */
    this.tau = new Vec3();

    /**
     * Orientation of the body
     * @property quaternion
     * @type {Quaternion}
     */
    this.quaternion = new Quaternion();

    /**
     * @property initQuaternion
     * @type {Quaternion}
     */
    this.initQuaternion = new Quaternion();

    /**
     * @property angularVelocity
     * @type {Vec3}
     */
    this.angularVelocity = new Vec3();

    /**
     * @property initAngularVelocity
     * @type {Vec3}
     */
    this.initAngularVelocity = new Vec3();

    /**
     * @property shape
     * @type {Shape}
     */
    this.shape = shape;

    /**
     * @property inertia
     * @type {Vec3}
     */
    this.inertia = new Vec3();
    shape.calculateLocalInertia(mass,this.inertia);

    this.inertiaWorld = new Vec3();
    this.inertia.copy(this.inertiaWorld);
    this.inertiaWorldAutoUpdate = false;

    /**
     * @property intInertia
     * @type {Vec3}
     */
    this.invInertia = new Vec3(this.inertia.x>0 ? 1.0/this.inertia.x : 0,
                                      this.inertia.y>0 ? 1.0/this.inertia.y : 0,
                                      this.inertia.z>0 ? 1.0/this.inertia.z : 0);
    this.invInertiaWorld = new Vec3();
    this.invInertia.copy(this.invInertiaWorld);
    this.invInertiaWorldAutoUpdate = false;

    /**
     * @property angularDamping
     * @type {Number}
     */
    this.angularDamping = 0.01; // Perhaps default should be zero here?

    /**
     * @property aabbmin
     * @type {Vec3}
     */
    this.aabbmin = new Vec3();

    /**
     * @property aabbmax
     * @type {Vec3}
     */
    this.aabbmax = new Vec3();

    /**
     * Indicates if the AABB needs to be updated before use.
     * @property aabbNeedsUpdate
     * @type {Boolean}
     */
    this.aabbNeedsUpdate = true;

    this.wlambda = new Vec3();
};

RigidBody.prototype = new Particle(0);
RigidBody.prototype.constructor = RigidBody;

/**
 * Updates the .aabbmin and .aabbmax properties
 * @method computeAABB
 */
RigidBody.prototype.computeAABB = function(){
    this.shape.calculateWorldAABB(this.position,
                                  this.quaternion,
                                  this.aabbmin,
                                  this.aabbmax);
    this.aabbNeedsUpdate = false;
};

/**
 * Apply force to a world point. This could for example be a point on the RigidBody surface. Applying force this way will add to Body.force and Body.tau.
 * @method applyForce
 * @param  {Vec3} force The amount of force to add.
 * @param  {Vec3} worldPoint A world point to apply the force on.
 */
var RigidBody_applyForce_r = new Vec3();
var RigidBody_applyForce_rotForce = new Vec3();
RigidBody.prototype.applyForce = function(force,worldPoint){
    // Compute point position relative to the body center
    var r = RigidBody_applyForce_r;
    worldPoint.vsub(this.position,r);

    // Compute produced rotational force
    var rotForce = RigidBody_applyForce_rotForce;
    r.cross(force,rotForce);

    // Add linear force
    this.force.vadd(force,this.force);

    // Add rotational force
    this.tau.vadd(rotForce,this.tau);
};

/**
 * Apply impulse to a world point. This could for example be a point on the RigidBody surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
 * @method applyImpulse
 * @param  {Vec3} impulse The amount of impulse to add.
 * @param  {Vec3} worldPoint A world point to apply the force on.
 */
var RigidBody_applyImpulse_r = new Vec3();
var RigidBody_applyImpulse_velo = new Vec3();
var RigidBody_applyImpulse_rotVelo = new Vec3();
RigidBody.prototype.applyImpulse = function(impulse,worldPoint){
    // Compute point position relative to the body center
    var r = RigidBody_applyImpulse_r;
    worldPoint.vsub(this.position,r);

    // Compute produced central impulse velocity
    var velo = RigidBody_applyImpulse_velo;
    impulse.copy(velo);
    velo.mult(this.invMass,velo);

    // Add linear impulse
    this.velocity.vadd(velo, this.velocity);

    // Compute produced rotational impulse velocity
    var rotVelo = RigidBody_applyImpulse_rotVelo;
    r.cross(impulse,rotVelo);
    rotVelo.x *= this.invInertia.x;
    rotVelo.y *= this.invInertia.y;
    rotVelo.z *= this.invInertia.z;

    // Add rotational Impulse
    this.angularVelocity.vadd(rotVelo, this.angularVelocity);
};
