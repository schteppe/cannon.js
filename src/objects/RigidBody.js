module.exports = RigidBody;

var Shape = require('../shapes/Shape');
var Vec3 = require('../math/Vec3');
var Mat3 = require('../math/Mat3');
var Quaternion = require('../math/Quaternion');
var Particle = require('./Particle');
var Body = require('./Body');
var Material = require('../material/Material');

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

    this.interpolatedPosition = new Vec3();
    this.interpolatedQuaternion = new Quaternion();

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

    /**
     * @property {Vec3} invInertia
     */
    this.invInertia = new Vec3();

    /**
     * @property {Mat3} invInertiaWorld
     */
    this.invInertiaWorld = new Mat3();

    this.invMassSolve = 0;

    /**
     * @property {Vec3} invInertiaSolve
     */
    this.invInertiaSolve = new Vec3();

    /**
     * @property {Mat3} invInertiaWorldSolve
     */
    this.invInertiaWorldSolve = new Mat3();

    /**
     * Set to true if you don't want the body to rotate. Make sure to run .updateMassProperties() after changing this.
     * @property {Boolean} fixedRotation
     */
    this.fixedRotation = false;

    /**
     * @property {Number} angularDamping
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

    this.updateMassProperties();
}

RigidBody.prototype = new Particle(0);
RigidBody.prototype.constructor = RigidBody;

/**
 * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
 * @method updateSolveMassProperties
 */
RigidBody.prototype.updateSolveMassProperties = function(){
    if(this.sleepState === Body.SLEEPING || this.type === Body.KINEMATIC){
        this.invMassSolve = 0;
        this.invInertiaSolve.setZero();
        this.invInertiaWorldSolve.setZero();
    } else {
        this.invMassSolve = this.invMass;
        this.invInertia.copy(this.invInertiaSolve);
        this.invInertiaWorld.copy(this.invInertiaWorldSolve);
    }
};

/**
 * Convert a world point to local body frame.
 * @method pointToLocalFrame
 * @param  {Vec3} worldPoint
 * @param  {Vec3} result
 * @return {Vec3}
 */
RigidBody.prototype.pointToLocalFrame = function(worldPoint,result){
    var result = result || new Vec3();
    worldPoint.vsub(this.position,result);
    this.quaternion.conjugate().vmult(result,result);
    return result;
};

/**
 * Convert a local body point to world frame.
 * @method pointToWorldFrame
 * @param  {Vec3} worldPoint
 * @param  {Vec3} result
 * @return {Vec3}
 */
RigidBody.prototype.pointToWorldFrame = function(localPoint,result){
    var result = result || new Vec3();
    this.quaternion.vmult(localPoint,result);
    result.vadd(this.position,result);
    return result;
};

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

var uiw_m1 = new Mat3(),
    uiw_m2 = new Mat3(),
    uiw_m3 = new Mat3();

/**
 * Update .inertiaWorld and .invInertiaWorld
 * @method updateInertiaWorld
 */
RigidBody.prototype.updateInertiaWorld = function(force){
    var I = this.invInertia;
    if (I.x == I.y && I.y == I.z && !force) {
        // If inertia M = s*I, where I is identity and s a scalar, then
        //    R*M*R' = R*(s*I)*R' = s*R*I*R' = s*R*R' = s*I = M
        // where R is the rotation matrix.
        // In other words, we don't have to transform the inertia if all
        // inertia diagonal entries are equal.
    } else {
        var m1 = uiw_m1,
            m2 = uiw_m2,
            m3 = uiw_m3;
        m1.setRotationFromQuaternion(this.quaternion);
        m1.transpose(m2);
        m1.scale(I,m1);
        m1.mmult(m2,this.invInertiaWorld);
        //m3.getTrace(this.invInertiaWorld);
    }

    /*
    this.quaternion.vmult(this.inertia,this.inertiaWorld);
    this.quaternion.vmult(this.invInertia,this.invInertiaWorld);
    */
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

    /*
    rotVelo.x *= this.invInertia.x;
    rotVelo.y *= this.invInertia.y;
    rotVelo.z *= this.invInertia.z;
    */
    this.invInertiaWorld.vmult(rotVelo,rotVelo);

    // Add rotational Impulse
    this.angularVelocity.vadd(rotVelo, this.angularVelocity);
};

/**
 * Should be called whenever you change the body mass.
 * @method updateMassProperties
 */
RigidBody.prototype.updateMassProperties = function(){
    this.invMass = this.mass>0 ? 1.0/this.mass : 0;
    this.shape.calculateLocalInertia(this.mass, this.inertia);
    var I = this.inertia;
    var fixed = this.fixedRotation;
    this.invInertia.set(
        I.x > 0 && !fixed ? 1.0 / I.x : 0,
        I.y > 0 && !fixed ? 1.0 / I.y : 0,
        I.z > 0 && !fixed ? 1.0 / I.z : 0
    );
    this.updateInertiaWorld(true);
};
