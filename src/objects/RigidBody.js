/**
 * @class CANNON.RigidBody
 * @brief Rigid body base class
 * @param float mass
 * @param CANNON.Shape shape
 * @param CANNON.Material material
 */
CANNON.RigidBody = function(mass,shape,material){

    // Check input
    if(typeof(mass)!=="number"){
        throw new Error("Argument 1 (mass) must be a number.");
    }
    if(typeof(material)!=="undefined" && !(material instanceof(CANNON.Material))){
        throw new Error("Argument 3 (material) must be an instance of CANNON.Material.");
    }

    CANNON.Particle.call(this,mass,material);

    var that = this;

    /**
     * @property CANNON.Vec3 tau
     * @memberof CANNON.RigidBody
     * @brief Rotational force on the body, around center of mass
     */
    this.tau = vec3.create();

    /**
     * @property CANNON.Quaternion quaternion
     * @memberof CANNON.RigidBody
     * @brief Orientation of the body
     */
    this.quaternion = quat.create();

    /**
     * @property CANNON.Quaternion initQuaternion
     * @memberof CANNON.RigidBody
     */
    this.initQuaternion = quat.create();

    /**
     * @property CANNON.Vec3 angularVelocity
     * @memberof CANNON.RigidBody
     */
    this.angularVelocity = vec3.create();

    /**
     * @property CANNON.Vec3 initAngularVelocity
     * @memberof CANNON.RigidBody
     */
    this.initAngularVelocity = vec3.create();

    /**
     * @property CANNON.Shape shape
     * @memberof CANNON.RigidBody
     */
    this.shape = shape;

    /**
     * @property CANNON.Vec3 inertia
     * @memberof CANNON.RigidBody
     */
    this.inertia = vec3.create();
    shape.calculateLocalInertia(mass,this.inertia);

    this.inertiaWorld = vec3.create();
    vec3.copy(this.inertiaWorld, this.inertia);
    this.inertiaWorldAutoUpdate = false;

    /**
     * @property CANNON.Vec3 intInertia
     * @memberof CANNON.RigidBody
     */
    this.invInertia = vec3.fromValues(  this.inertia[0]>0 ? 1.0/this.inertia[0] : 0,
                                        this.inertia[1]>0 ? 1.0/this.inertia[1] : 0,
                                        this.inertia[2]>0 ? 1.0/this.inertia[2] : 0 );
    this.invInertiaWorld = vec3.create();
    vec3.copy(this.invInertiaWorld, this.invInertia);
    this.invInertiaWorldAutoUpdate = false;

    /**
     * @property float angularDamping
     * @memberof CANNON.RigidBody
     */
    this.angularDamping = 0.01; // Perhaps default should be zero here?

    /**
     * @property CANNON.Vec3 aabbmin
     * @memberof CANNON.RigidBody
     */
    this.aabbmin = vec3.create();

    /**
     * @property CANNON.Vec3 aabbmax
     * @memberof CANNON.RigidBody
     */
    this.aabbmax = vec3.create();

    /**
     * @property bool aabbNeedsUpdate
     * @memberof CANNON.RigidBody
     * @brief Indicates if the AABB needs to be updated before use.
     */
    this.aabbNeedsUpdate = true;

    this.wlambda = vec3.create();
};

CANNON.RigidBody.prototype = new CANNON.Particle(0);
CANNON.RigidBody.prototype.constructor = CANNON.RigidBody;

CANNON.RigidBody.prototype.computeAABB = function(){
    this.shape.calculateWorldAABB(this.position,
                                  this.quaternion,
                                  this.aabbmin,
                                  this.aabbmax);
    this.aabbNeedsUpdate = false;
};

/**
 * Apply force to a world point. This could for example be a point on the RigidBody surface. Applying force this way will add to Body.force and Body.tau.
 * @param  CANNON.Vec3 force The amount of force to add.
 * @param  CANNON.Vec3 worldPoint A world point to apply the force on.
 */
var RigidBody_applyForce_r = vec3.create();
var RigidBody_applyForce_rotForce = vec3.create();
CANNON.RigidBody.prototype.applyForce = function(force,worldPoint){
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
 * @param  CANNON.Vec3 impulse The amount of impulse to add.
 * @param  CANNON.Vec3 worldPoint A world point to apply the force on.
 */
var RigidBody_applyImpulse_r = vec3.create();
var RigidBody_applyImpulse_velo = vec3.create();
var RigidBody_applyImpulse_rotVelo = vec3.create();
CANNON.RigidBody.prototype.applyImpulse = function(impulse,worldPoint){
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
