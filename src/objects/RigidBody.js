/*global CANNON:true */

/**
 * @class CANNON.RigidBody
 * @brief Rigid body base class
 * @param float mass
 * @param CANNON.Shape shape
 * @param CANNON.Material material
 */
CANNON.RigidBody = function(mass,shape,material){

    // Check input
    if(typeof(mass)!="number")
    throw new Error("Argument 1 (mass) must be a number.");
    if(typeof(material)!="undefined" && !(material instanceof(CANNON.Material)))
    throw new Error("Argument 3 (material) must be an instance of CANNON.Material.");

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

    /**
     * @property CANNON.Vec3 intInertia
     * @memberof CANNON.RigidBody
     */
    this.invInertia = new CANNON.Vec3(this.inertia.x>0 ? 1.0/this.inertia.x : 0,
                                      this.inertia.y>0 ? 1.0/this.inertia.y : 0,
                                      this.inertia.z>0 ? 1.0/this.inertia.z : 0);

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

    this.calculateAABB();
};

CANNON.RigidBody.constructor = CANNON.RigidBody;

CANNON.RigidBody.prototype.calculateAABB = function(){
    this.shape.calculateWorldAABB(this.position,
                  this.quaternion,
                  this.aabbmin,
                  this.aabbmax);
};

CANNON.RigidBody.prototype.applyImpulse = function(worldPoint,force,dt){
    dt = dt || 1/60;
    var r=new CANNON.Vec3(), rotForce=new CANNON.Vec3();
    worldPoint.vsub(this.position,r);
    r.cross(force,rotForce);
    this.velocity.vadd(force.mult(dt),this.velocity);
    this.angularVelocity.vadd(rotForce.mult(dt),this.angularVelocity);
};