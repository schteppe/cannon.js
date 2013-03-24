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

    this.inertiaWorld = new CANNON.Vec3();
    this.inertia.copy(this.inertiaWorld);
    this.inertiaWorldAutoUpdate = false;

    /**
     * @property CANNON.Vec3 intInertia
     * @memberof CANNON.RigidBody
     */
    this.invInertia = new CANNON.Vec3(this.inertia.x>0 ? 1.0/this.inertia.x : 0,
                                      this.inertia.y>0 ? 1.0/this.inertia.y : 0,
                                      this.inertia.z>0 ? 1.0/this.inertia.z : 0);
    this.invInertiaWorld = new CANNON.Vec3();
    this.invInertia.copy(this.invInertiaWorld);
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
    this.aabbmin = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 aabbmax
     * @memberof CANNON.RigidBody
     */
    this.aabbmax = new CANNON.Vec3();

    /**
     * @property bool aabbNeedsUpdate
     * @memberof CANNON.RigidBody
     * @brief Indicates if the AABB needs to be updated before use.
     */
    this.aabbNeedsUpdate = true;

    this.wlambda = new CANNON.Vec3();
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
var RigidBody_applyForce_r = new CANNON.Vec3();
var RigidBody_applyForce_rotForce = new CANNON.Vec3();
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
var RigidBody_applyImpulse_r = new CANNON.Vec3();
var RigidBody_applyImpulse_velo = new CANNON.Vec3();
var RigidBody_applyImpulse_rotVelo = new CANNON.Vec3();
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
