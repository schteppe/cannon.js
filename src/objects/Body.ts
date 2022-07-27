import { EventEmitter } from 'feng3d';
import { Box3, Matrix3x3, Quaternion, Vector3 } from 'feng3d';
import { ContactEquation } from '../equations/ContactEquation';
import { Material } from '../material/Material';
import { Box } from '../shapes/Box';
import { Shape } from '../shapes/Shape';
import { World } from '../world/World';

export interface BodyEventMap
{
    wakeup: any
    sleepy: any
    sleep: any

    collide: { body: Body, contact: ContactEquation }
}

export class Body<T extends BodyEventMap = BodyEventMap> extends EventEmitter<T>
{
    id: number;

    /**
     * Reference to the world the body is living in
     */
    world: World;

    vlambda: Vector3;

    collisionFilterGroup: number;

    collisionFilterMask: number;

    /**
     * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
     */
    collisionResponse: boolean;

    /**
     * World space position of the body.
     */
    position: Vector3;

    previousPosition: Vector3;

    /**
     * Interpolated position of the body.
     */
    interpolatedPosition: Vector3;

    /**
     * Initial position of the body
     */
    initPosition: Vector3;

    /**
     * World space velocity of the body.
     */
    velocity: Vector3;

    initVelocity: Vector3;

    /**
     * Linear force on the body in world space.
     */
    force: Vector3;

    mass: number;

    invMass: number;

    material: Material;

    linearDamping: number;

    /**
     * One of: Body.DYNAMIC, Body.STATIC and Body.KINEMATIC.
     */
    type: number;

    /**
     * If true, the body will automatically fall to sleep.
     */
    allowSleep: boolean;

    /**
     * Current sleep state.
     */
    sleepState: number;

    /**
     * If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
     */
    sleepSpeedLimit: number;

    /**
     * If the body has been sleepy for this sleepTimeLimit seconds, it is considered sleeping.
     */
    sleepTimeLimit: number;

    timeLastSleepy: number;

    _wakeUpAfterNarrowphase: boolean;

    /**
     * World space rotational force on the body, around center of mass.
     */
    torque: Vector3;

    /**
     * World space orientation of the body.
     */
    quaternion: Quaternion;

    initQuaternion: Quaternion;

    previousQuaternion: Quaternion;

    /**
     * Interpolated orientation of the body.
     */
    interpolatedQuaternion: Quaternion;

    /**
     * Angular velocity of the body, in world space. Think of the angular velocity as a vector, which the body rotates around. The length of this vector determines how fast (in radians per second) the body rotates.
     */
    angularVelocity: Vector3;

    initAngularVelocity: Vector3;

    shapes: Shape[];

    /**
     * Position of each Shape in the body, given in local Body space.
     */
    shapeOffsets: Vector3[];

    /**
     * Orientation of each Shape, given in local Body space.
     */
    shapeOrientations: Quaternion[];

    inertia: Vector3;

    invInertia: Vector3;

    invInertiaWorld: Matrix3x3;

    invMassSolve: number;

    invInertiaSolve: Vector3;

    invInertiaWorldSolve: Matrix3x3;

    /**
     * Set to true if you don't want the body to rotate. Make sure to run .updateMassProperties() after changing this.
     */
    fixedRotation: boolean;

    angularDamping: number;

    /**
     * Use this property to limit the motion along any world axis. (1,1,1) will allow motion along all axes while (0,0,0) allows none.
     */
    linearFactor: Vector3;

    /**
     * Use this property to limit the rotational motion along any world axis. (1,1,1) will allow rotation along all axes while (0,0,0) allows none.
     */
    angularFactor: Vector3;

    /**
     * World space bounding box of the body and its shapes.
     */
    aabb: Box3;

    /**
     * Indicates if the AABB needs to be updated before use.
     */
    aabbNeedsUpdate: boolean;

    /**
     * Total bounding radius of the Body including its shapes, relative to body.position.
     */
    boundingRadius: number;

    wlambda: Vector3;

    shape: Shape;

    index: number;

    /**
     * Base class for all body types.
     *
     * @param options
     * @param a
     *
     * @example
     *     let body = new Body({
     *         mass: 1
     *     });
     *     let shape = new Sphere(1);
     *     body.addShape(shape);
     *     world.addBody(body);
     */
    constructor(options: {
        collisionFilterGroup?: number, collisionFilterMask?: number, position?: Vector3, velocity?: Vector3,
        material?: Material, mass?: number, linearDamping?: number, type?: number, allowSleep?: boolean,
        sleepSpeedLimit?: number, sleepTimeLimit?: number, quaternion?: Quaternion, angularVelocity?: Vector3,
        fixedRotation?: boolean, angularDamping?: number, linearFactor?: Vector3, angularFactor?: Vector3, shape?: Shape,
    } = {})
    {
        super();

        this.id = Body.idCounter++;
        this.world = null;
        this.vlambda = new Vector3();
        this.collisionFilterGroup = typeof (options.collisionFilterGroup) === 'number' ? options.collisionFilterGroup : 1;
        this.collisionFilterMask = typeof (options.collisionFilterMask) === 'number' ? options.collisionFilterMask : -1;
        this.collisionResponse = true;
        this.position = new Vector3();
        this.previousPosition = new Vector3();
        this.interpolatedPosition = new Vector3();
        this.initPosition = new Vector3();

        if (options.position)
        {
            this.position.copy(options.position);
            this.previousPosition.copy(options.position);
            this.interpolatedPosition.copy(options.position);
            this.initPosition.copy(options.position);
        }
        this.velocity = new Vector3();

        if (options.velocity)
        {
            this.velocity.copy(options.velocity);
        }

        this.initVelocity = new Vector3();
        this.force = new Vector3();

        const mass = typeof (options.mass) === 'number' ? options.mass : 0;
        this.mass = mass;
        this.invMass = mass > 0 ? 1.0 / mass : 0;
        this.material = options.material || null;
        this.linearDamping = typeof (options.linearDamping) === 'number' ? options.linearDamping : 0.01;
        this.type = (mass <= 0.0 ? Body.STATIC : Body.DYNAMIC);
        if (typeof (options.type) === typeof (Body.STATIC))
        {
            this.type = options.type;
        }
        this.allowSleep = typeof (options.allowSleep) !== 'undefined' ? options.allowSleep : true;
        this.sleepState = 0;
        this.sleepSpeedLimit = typeof (options.sleepSpeedLimit) !== 'undefined' ? options.sleepSpeedLimit : 0.1;
        this.sleepTimeLimit = typeof (options.sleepTimeLimit) !== 'undefined' ? options.sleepTimeLimit : 1;

        this.timeLastSleepy = 0;

        this._wakeUpAfterNarrowphase = false;
        this.torque = new Vector3();
        this.quaternion = new Quaternion();
        this.initQuaternion = new Quaternion();
        this.previousQuaternion = new Quaternion();
        this.interpolatedQuaternion = new Quaternion();

        if (options.quaternion)
        {
            this.quaternion.copy(options.quaternion);
            this.initQuaternion.copy(options.quaternion);
            this.previousQuaternion.copy(options.quaternion);
            this.interpolatedQuaternion.copy(options.quaternion);
        }
        this.angularVelocity = new Vector3();

        if (options.angularVelocity)
        {
            this.angularVelocity.copy(options.angularVelocity);
        }
        this.initAngularVelocity = new Vector3();
        this.shapes = [];
        this.shapeOffsets = [];
        this.shapeOrientations = [];
        this.inertia = new Vector3();
        this.invInertia = new Vector3();
        this.invInertiaWorld = new Matrix3x3();

        this.invMassSolve = 0;
        this.invInertiaSolve = new Vector3();
        this.invInertiaWorldSolve = new Matrix3x3();
        this.fixedRotation = typeof (options.fixedRotation) !== 'undefined' ? options.fixedRotation : false;
        this.angularDamping = typeof (options.angularDamping) !== 'undefined' ? options.angularDamping : 0.01;
        this.linearFactor = new Vector3(1, 1, 1);
        if (options.linearFactor)
        {
            this.linearFactor.copy(options.linearFactor);
        }
        this.angularFactor = new Vector3(1, 1, 1);
        if (options.angularFactor)
        {
            this.angularFactor.copy(options.angularFactor);
        }
        this.aabb = new Box3();
        this.aabbNeedsUpdate = true;
        this.boundingRadius = 0;

        this.wlambda = new Vector3();

        if (options.shape)
        {
            this.addShape(options.shape);
        }

        this.updateMassProperties();
    }

    /**
     * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
     */
    static DYNAMIC = 1;

    /**
     * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
     */
    static STATIC = 2;

    /**
     * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
     */
    static KINEMATIC = 4;

    static AWAKE = 0;

    static SLEEPY = 1;

    static SLEEPING = 2;

    static idCounter = 0;

    /**
     * Wake the body up.
     */
    wakeUp()
    {
        const s = this.sleepState;
        this.sleepState = 0;
        this._wakeUpAfterNarrowphase = false;
        if (s === Body.SLEEPING)
        {
            this.emit('wakeup');
        }
    }

    /**
     * Force body sleep
     */
    sleep()
    {
        this.sleepState = Body.SLEEPING;
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this._wakeUpAfterNarrowphase = false;
    }

    /**
     * Called every timestep to update internal sleep timer and change sleep state if needed.
     */
    sleepTick(time: number)
    {
        if (this.allowSleep)
        {
            const sleepState = this.sleepState;
            const speedSquared = this.velocity.lengthSquared + this.angularVelocity.lengthSquared;
            const speedLimitSquared = Math.pow(this.sleepSpeedLimit, 2);
            if (sleepState === Body.AWAKE && speedSquared < speedLimitSquared)
            {
                this.sleepState = Body.SLEEPY; // Sleepy
                this.timeLastSleepy = time;
                this.emit('sleepy');
            }
            else if (sleepState === Body.SLEEPY && speedSquared > speedLimitSquared)
            {
                this.wakeUp(); // Wake up
            }
            else if (sleepState === Body.SLEEPY && (time - this.timeLastSleepy) > this.sleepTimeLimit)
            {
                this.sleep(); // Sleeping
                this.emit('sleep');
            }
        }
    }

    /**
     * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
     */
    updateSolveMassProperties()
    {
        if (this.sleepState === Body.SLEEPING || this.type === Body.KINEMATIC)
        {
            this.invMassSolve = 0;
            this.invInertiaSolve.setZero();
            this.invInertiaWorldSolve.setZero();
        }
        else
        {
            this.invMassSolve = this.invMass;
            this.invInertiaSolve.copy(this.invInertia);
            this.invInertiaWorldSolve.copy(this.invInertiaWorld);
        }
    }

    /**
     * Convert a world point to local body frame.
     *
     * @param worldPoint
     * @param result
     */
    pointToLocalFrame(worldPoint: Vector3, result = new Vector3())
    {
        worldPoint.subTo(this.position, result);
        this.quaternion.inverseTo().vmult(result, result);

        return result;
    }

    /**
     * Convert a world vector to local body frame.
     *
     * @param worldPoint
     * @param result
     */
    vectorToLocalFrame(worldVector, result = new Vector3())
    {
        this.quaternion.inverseTo().vmult(worldVector, result);

        return result;
    }

    /**
     * Convert a local body point to world frame.
     *
     * @param localPoint
     * @param result
     */
    pointToWorldFrame(localPoint: Vector3, result = new Vector3())
    {
        this.quaternion.vmult(localPoint, result);
        result.addTo(this.position, result);

        return result;
    }

    /**
     * Convert a local body point to world frame.
     *
     * @param localVector
     * @param result
     */
    vectorToWorldFrame(localVector: Vector3, result = new Vector3())
    {
        this.quaternion.vmult(localVector, result);

        return result;
    }

    /**
     * Add a shape to the body with a local offset and orientation.
     *
     * @param shape
     * @param _offset
     * @param_orientation
     * @return The body object, for chainability.
     */
    addShape(shape: Shape, _offset?: Vector3, _orientation?: Quaternion)
    {
        const offset = new Vector3();
        const orientation = new Quaternion();

        if (_offset)
        {
            offset.copy(_offset);
        }
        if (_orientation)
        {
            orientation.copy(_orientation);
        }

        this.shapes.push(shape);
        this.shapeOffsets.push(offset);
        this.shapeOrientations.push(orientation);
        this.updateMassProperties();
        this.updateBoundingRadius();

        this.aabbNeedsUpdate = true;

        shape.body = this;

        return this;
    }

    /**
     * Update the bounding radius of the body. Should be done if any of the shapes are changed.
     */
    updateBoundingRadius()
    {
        const shapes = this.shapes;
        const shapeOffsets = this.shapeOffsets;
        const N = shapes.length;
        let radius = 0;

        for (let i = 0; i !== N; i++)
        {
            const shape = shapes[i];
            shape.updateBoundingSphereRadius();
            const offset = shapeOffsets[i].length;
            const r = shape.boundingSphereRadius;
            if (offset + r > radius)
            {
                radius = offset + r;
            }
        }

        this.boundingRadius = radius;
    }

    /**
     * Updates the .aabb
     *
     * @todo rename to updateAABB()
     */
    computeAABB()
    {
        const shapes = this.shapes;
        const shapeOffsets = this.shapeOffsets;
        const shapeOrientations = this.shapeOrientations;
        const N = shapes.length;
        const offset = tmpVec;
        const orientation = tmpQuat;
        const bodyQuat = this.quaternion;
        const aabb = this.aabb;
        const shapeAABB = computeAABB$shapeAABB;

        for (let i = 0; i !== N; i++)
        {
            const shape = shapes[i];

            // Get shape world position
            bodyQuat.vmult(shapeOffsets[i], offset);
            offset.addTo(this.position, offset);

            // Get shape world quaternion
            shapeOrientations[i].multTo(bodyQuat, orientation);

            // Get shape AABB
            shape.calculateWorldAABB(offset, orientation, shapeAABB.min, shapeAABB.max);

            if (i === 0)
            {
                aabb.copy(shapeAABB);
            }
            else
            {
                aabb.union(shapeAABB);
            }
        }

        this.aabbNeedsUpdate = false;
    }

    /**
     * Update .inertiaWorld and .invInertiaWorld
     */
    updateInertiaWorld(force?)
    {
        const I = this.invInertia;
        if (I.x === I.y && I.y === I.z && !force)
        {
            // If inertia M = s*I, where I is identity and s a scalar, then
            //    R*M*R' = R*(s*I)*R' = s*R*I*R' = s*R*R' = s*I = M
            // where R is the rotation matrix.
            // In other words, we don't have to transform the inertia if all
            // inertia diagonal entries are equal.
        }
        else
        {
            const m1 = uiw$m1;
            const m2 = uiw$m2;
            // const m3 = uiw$m3;
            m1.setRotationFromQuaternion(this.quaternion);
            m1.transposeTo(m2);
            m1.scale(I, m1);
            m1.mmult(m2, this.invInertiaWorld);
        }
    }

    /**
     * Apply force to a world point. This could for example be a point on the Body surface. Applying force this way will add to Body.force and Body.torque.
     *
     * @param force The amount of force to add.
     * @param relativePoint A point relative to the center of mass to apply the force on.
     */
    applyForce(force: Vector3, relativePoint: Vector3)
    {
        if (this.type !== Body.DYNAMIC)
        { // Needed?
            return;
        }

        // Compute produced rotational force
        const rotForce = Body$applyForce$rotForce;
        relativePoint.crossTo(force, rotForce);

        // Add linear force
        this.force.addTo(force, this.force);

        // Add rotational force
        this.torque.addTo(rotForce, this.torque);
    }

    /**
     * Apply force to a local point in the body.
     *
     * @param force The force vector to apply, defined locally in the body frame.
     * @param localPoint A local point in the body to apply the force on.
     */
    applyLocalForce(localForce: Vector3, localPoint: Vector3)
    {
        if (this.type !== Body.DYNAMIC)
        {
            return;
        }

        const worldForce = Body$applyLocalForce$worldForce;
        const relativePointWorld = Body$applyLocalForce$relativePointWorld;

        // Transform the force vector to world space
        this.vectorToWorldFrame(localForce, worldForce);
        this.vectorToWorldFrame(localPoint, relativePointWorld);

        this.applyForce(worldForce, relativePointWorld);
    }

    /**
     * Apply impulse to a world point. This could for example be a point on the Body surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
     *
     * @param impulse The amount of impulse to add.
     * @param relativePoint A point relative to the center of mass to apply the force on.
     */
    applyImpulse(impulse: Vector3, relativePoint: Vector3)
    {
        if (this.type !== Body.DYNAMIC)
        {
            return;
        }

        // Compute point position relative to the body center
        const r = relativePoint;

        // Compute produced central impulse velocity
        const velo = Body$applyImpulse$velo;
        velo.copy(impulse);
        velo.scaleNumberTo(this.invMass, velo);

        // Add linear impulse
        this.velocity.addTo(velo, this.velocity);

        // Compute produced rotational impulse velocity
        const rotVelo = Body$applyImpulse$rotVelo;
        r.crossTo(impulse, rotVelo);

        /*
        rotVelo.x *= this.invInertia.x;
        rotVelo.y *= this.invInertia.y;
        rotVelo.z *= this.invInertia.z;
        */
        this.invInertiaWorld.vmult(rotVelo, rotVelo);

        // Add rotational Impulse
        this.angularVelocity.addTo(rotVelo, this.angularVelocity);
    }

    /**
     * Apply locally-defined impulse to a local point in the body.
     *
     * @param force The force vector to apply, defined locally in the body frame.
     * @param localPoint A local point in the body to apply the force on.
     */
    applyLocalImpulse(localImpulse: Vector3, localPoint: Vector3)
    {
        if (this.type !== Body.DYNAMIC)
        {
            return;
        }

        const worldImpulse = Body$applyLocalImpulse$worldImpulse;
        const relativePointWorld = Body$applyLocalImpulse$relativePoint;

        // Transform the force vector to world space
        this.vectorToWorldFrame(localImpulse, worldImpulse);
        this.vectorToWorldFrame(localPoint, relativePointWorld);

        this.applyImpulse(worldImpulse, relativePointWorld);
    }

    /**
     * Should be called whenever you change the body shape or mass.
     */
    updateMassProperties()
    {
        const halfExtents = BodyUpdateMassPropertiesHalfExtents;

        this.invMass = this.mass > 0 ? 1.0 / this.mass : 0;
        const I = this.inertia;
        const fixed = this.fixedRotation;

        // Approximate with AABB box
        this.computeAABB();
        halfExtents.set(
            (this.aabb.max.x - this.aabb.min.x) / 2,
            (this.aabb.max.y - this.aabb.min.y) / 2,
            (this.aabb.max.z - this.aabb.min.z) / 2
        );
        Box.calculateInertia(halfExtents, this.mass, I);

        this.invInertia.set(
            I.x > 0 && !fixed ? 1.0 / I.x : 0,
            I.y > 0 && !fixed ? 1.0 / I.y : 0,
            I.z > 0 && !fixed ? 1.0 / I.z : 0
        );
        this.updateInertiaWorld(true);
    }

    /**
     * Get world velocity of a point in the body.
     * @method getVelocityAtWorldPoint
     * @param  {Vector3} worldPoint
     * @param  {Vector3} result
     * @return {Vector3} The result vector.
     */
    getVelocityAtWorldPoint(worldPoint: Vector3, result: Vector3)
    {
        const r = new Vector3();
        worldPoint.subTo(this.position, r);
        this.angularVelocity.crossTo(r, result);
        this.velocity.addTo(result, result);

        return result;
    }

    /**
     * Move the body forward in time.
     * @param dt Time step
     * @param quatNormalize Set to true to normalize the body quaternion
     * @param quatNormalizeFast If the quaternion should be normalized using "fast" quaternion normalization
     */
    integrate(dt: number, quatNormalize: boolean, quatNormalizeFast: boolean)
    {
        // Save previous position
        this.previousPosition.copy(this.position);
        this.previousQuaternion.copy(this.quaternion);

        if (!(this.type === Body.DYNAMIC || this.type === Body.KINEMATIC) || this.sleepState === Body.SLEEPING)
        { // Only for dynamic
            return;
        }

        const velo = this.velocity;
        const angularVelo = this.angularVelocity;
        const pos = this.position;
        const force = this.force;
        const torque = this.torque;
        const quat = this.quaternion;
        const invMass = this.invMass;
        const invInertia = this.invInertiaWorld;
        const linearFactor = this.linearFactor;

        const iMdt = invMass * dt;
        velo.x += force.x * iMdt * linearFactor.x;
        velo.y += force.y * iMdt * linearFactor.y;
        velo.z += force.z * iMdt * linearFactor.z;

        const e = invInertia.elements;
        const angularFactor = this.angularFactor;
        const tx = torque.x * angularFactor.x;
        const ty = torque.y * angularFactor.y;
        const tz = torque.z * angularFactor.z;
        angularVelo.x += dt * (e[0] * tx + e[1] * ty + e[2] * tz);
        angularVelo.y += dt * (e[3] * tx + e[4] * ty + e[5] * tz);
        angularVelo.z += dt * (e[6] * tx + e[7] * ty + e[8] * tz);

        // Use new velocity  - leap frog
        pos.x += velo.x * dt;
        pos.y += velo.y * dt;
        pos.z += velo.z * dt;

        quat.integrateTo(this.angularVelocity, dt, this.angularFactor, quat);

        if (quatNormalize)
        {
            if (quatNormalizeFast)
            {
                quat.normalizeFast();
            }
            else
            {
                quat.normalize();
            }
        }

        this.aabbNeedsUpdate = true;

        // Update world inertia
        this.updateInertiaWorld();
    }
}

const tmpVec = new Vector3();
const tmpQuat = new Quaternion();

// const torque = new Vector3();
// const invI_tau_dt = new Vector3();
// const w = new Quaternion();
// const wq = new Quaternion();

const BodyUpdateMassPropertiesHalfExtents = new Vector3();

// const Body_applyForce_r = new Vector3();
const Body$applyForce$rotForce = new Vector3();
const Body$applyLocalForce$worldForce = new Vector3();
const Body$applyLocalForce$relativePointWorld = new Vector3();
// const Body_applyImpulse_r = new Vector3();
const Body$applyImpulse$velo = new Vector3();
const Body$applyImpulse$rotVelo = new Vector3();
const Body$applyLocalImpulse$worldImpulse = new Vector3();
const Body$applyLocalImpulse$relativePoint = new Vector3();

const uiw$m1 = new Matrix3x3();
const uiw$m2 = new Matrix3x3();
// const uiw$m3 = new Matrix3x3();

const computeAABB$shapeAABB = new Box3();
