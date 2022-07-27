import { Quaternion, Vector3 } from '@feng3d/math';
import { Body } from '../objects/Body';
import { World } from '../world/World';
import { WheelInfo } from './WheelInfo';

export class RaycastVehicle
{
    chassisBody: Body;

    /**
     * An array of WheelInfo objects.
     */
    wheelInfos: WheelInfo[];

    /**
     * Will be set to true if the car is sliding.
     */
    sliding: boolean;

    world: World;

    /**
     * Index of the right axis, 0=x, 1=y, 2=z
     */
    indexRightAxis: number;

    /**
     * Index of the forward axis, 0=x, 1=y, 2=z
     */
    indexForwardAxis: number;

    /**
     * Index of the up axis, 0=x, 1=y, 2=z
     */
    indexUpAxis: number;

    currentVehicleSpeedKmHour: number;

    constraints;

    /**
     * Vehicle helper class that casts rays from the wheel positions towards the ground and applies forces.
     *
     * @param options
     */
    constructor(options: { chassisBody?: Body, indexRightAxis?: number, indexForwardAxis?: number, indexUpAxis?: number } = {})
    {
        this.chassisBody = options.chassisBody;
        this.wheelInfos = [];
        this.sliding = false;
        this.world = null;
        this.indexRightAxis = typeof (options.indexRightAxis) !== 'undefined' ? options.indexRightAxis : 1;
        this.indexForwardAxis = typeof (options.indexForwardAxis) !== 'undefined' ? options.indexForwardAxis : 0;
        this.indexUpAxis = typeof (options.indexUpAxis) !== 'undefined' ? options.indexUpAxis : 2;
    }

    /**
     * Add a wheel. For information about the options, see WheelInfo.
     *
     * @param options
     */
    addWheel(options = {})
    {
        const info = new WheelInfo(options);
        const index = this.wheelInfos.length;
        this.wheelInfos.push(info);

        return index;
    }

    /**
     * Set the steering value of a wheel.
     *
     * @param value
     * @param wheelIndex
     */
    setSteeringValue(value: number, wheelIndex: number)
    {
        const wheel = this.wheelInfos[wheelIndex];
        wheel.steering = value;
    }

    /**
     * Set the wheel force to apply on one of the wheels each time step
     *
     * @param value
     * @param wheelIndex
     */
    applyEngineForce(value: number, wheelIndex: number)
    {
        this.wheelInfos[wheelIndex].engineForce = value;
    }

    /**
     * Set the braking force of a wheel
     *
     * @param brake
     * @param wheelIndex
     */
    setBrake(brake: number, wheelIndex: number)
    {
        this.wheelInfos[wheelIndex].brake = brake;
    }

    /**
     * Add the vehicle including its constraints to the world.
     *
     * @param world
     */
    addToWorld(world: World)
    {
        world.addBody(this.chassisBody);

        world.on('preStep', this._preStepCallback, this);
        this.world = world;
    }

    _preStepCallback()
    {
        this.updateVehicle(this.world.dt);
    }

    /**
     * Get one of the wheel axles, world-oriented.
     * @param axisIndex
     * @param result
     */
    getVehicleAxisWorld(axisIndex: number, result: Vector3)
    {
        result.set(
            axisIndex === 0 ? 1 : 0,
            axisIndex === 1 ? 1 : 0,
            axisIndex === 2 ? 1 : 0
        );
        this.chassisBody.vectorToWorldFrame(result, result);
    }

    updateVehicle(timeStep: number)
    {
        const wheelInfos = this.wheelInfos;
        const numWheels = wheelInfos.length;
        const chassisBody = this.chassisBody;

        for (let i = 0; i < numWheels; i++)
        {
            this.updateWheelTransform(i);
        }

        this.currentVehicleSpeedKmHour = 3.6 * chassisBody.velocity.length;

        const forwardWorld = new Vector3();
        this.getVehicleAxisWorld(this.indexForwardAxis, forwardWorld);

        if (forwardWorld.dot(chassisBody.velocity) < 0)
        {
            this.currentVehicleSpeedKmHour *= -1;
        }

        // simulate suspension
        for (let i = 0; i < numWheels; i++)
        {
            this.castRay(wheelInfos[i]);
        }

        this.updateSuspension(timeStep);

        const impulse = new Vector3();
        const relpos = new Vector3();
        for (let i = 0; i < numWheels; i++)
        {
            // apply suspension force
            const wheel = wheelInfos[i];
            let suspensionForce = wheel.suspensionForce;
            if (suspensionForce > wheel.maxSuspensionForce)
            {
                suspensionForce = wheel.maxSuspensionForce;
            }
            wheel.raycastResult.hitNormalWorld.scaleNumberTo(suspensionForce * timeStep, impulse);

            wheel.raycastResult.hitPointWorld.subTo(chassisBody.position, relpos);
            chassisBody.applyImpulse(impulse, relpos);
        }

        this.updateFriction(timeStep);

        const hitNormalWorldScaledWithProj = new Vector3();
        const fwd = new Vector3();
        const vel = new Vector3();
        for (let i = 0; i < numWheels; i++)
        {
            const wheel = wheelInfos[i];
            // let relpos = new Vector3();
            // wheel.chassisConnectionPointWorld.subTo(chassisBody.position, relpos);
            chassisBody.getVelocityAtWorldPoint(wheel.chassisConnectionPointWorld, vel);

            // Hack to get the rotation in the correct direction
            let m = 1;
            switch (this.indexUpAxis)
            {
                case 1:
                    m = -1;
                    break;
            }

            if (wheel.isInContact)
            {
                this.getVehicleAxisWorld(this.indexForwardAxis, fwd);
                const proj = fwd.dot(wheel.raycastResult.hitNormalWorld);
                wheel.raycastResult.hitNormalWorld.scaleNumberTo(proj, hitNormalWorldScaledWithProj);

                fwd.subTo(hitNormalWorldScaledWithProj, fwd);

                const proj2 = fwd.dot(vel);
                wheel.deltaRotation = m * proj2 * timeStep / wheel.radius;
            }

            if ((wheel.sliding || !wheel.isInContact) && wheel.engineForce !== 0 && wheel.useCustomSlidingRotationalSpeed)
            {
                // Apply custom rotation when accelerating and sliding
                wheel.deltaRotation = (wheel.engineForce > 0 ? 1 : -1) * wheel.customSlidingRotationalSpeed * timeStep;
            }

            // Lock wheels
            if (Math.abs(wheel.brake) > Math.abs(wheel.engineForce))
            {
                wheel.deltaRotation = 0;
            }

            wheel.rotation += wheel.deltaRotation; // Use the old value
            wheel.deltaRotation *= 0.99; // damping of rotation when not in contact
        }
    }

    updateSuspension(_deltaTime: number)
    {
        const chassisBody = this.chassisBody;
        const chassisMass = chassisBody.mass;
        const wheelInfos = this.wheelInfos;
        const numWheels = wheelInfos.length;

        for (let wIt = 0; wIt < numWheels; wIt++)
        {
            const wheel = wheelInfos[wIt];

            if (wheel.isInContact)
            {
                let force;

                // Spring
                const suspLength = wheel.suspensionRestLength;
                const currentLength = wheel.suspensionLength;
                const lengthDiff = (suspLength - currentLength);

                force = wheel.suspensionStiffness * lengthDiff * wheel.clippedInvContactDotSuspension;

                // Damper
                const projectedRelVel = wheel.suspensionRelativeVelocity;
                let suspDamping;
                if (projectedRelVel < 0)
                {
                    suspDamping = wheel.dampingCompression;
                }
                else
                {
                    suspDamping = wheel.dampingRelaxation;
                }
                force -= suspDamping * projectedRelVel;

                wheel.suspensionForce = force * chassisMass;
                if (wheel.suspensionForce < 0)
                {
                    wheel.suspensionForce = 0;
                }
            }
            else
            {
                wheel.suspensionForce = 0;
            }
        }
    }

    /**
     * Remove the vehicle including its constraints from the world.
     *
     * @param world
     */
    removeFromWorld(world: World)
    {
        world.removeBody(this.chassisBody);
        world.off('preStep', this._preStepCallback, this);
        this.world = null;
    }

    castRay(wheel: WheelInfo)
    {
        const rayvector = castRay$rayvector;
        const target = castRay$target;

        this.updateWheelTransformWorld(wheel);
        const chassisBody = this.chassisBody;

        let depth = -1;

        const raylen = wheel.suspensionRestLength + wheel.radius;

        wheel.directionWorld.scaleNumberTo(raylen, rayvector);
        const source = wheel.chassisConnectionPointWorld;
        source.addTo(rayvector, target);
        const raycastResult = wheel.raycastResult;

        // const param = 0;

        raycastResult.reset();
        // Turn off ray collision with the chassis temporarily
        const oldState = chassisBody.collisionResponse;
        chassisBody.collisionResponse = false;

        // Cast ray against world
        this.world.raycastClosest(source, target, {
            skipBackfaces: true
        }, raycastResult);
        chassisBody.collisionResponse = oldState;

        const object = raycastResult.body;

        wheel.raycastResult.groundObject = 0;// ?

        if (object)
        {
            depth = raycastResult.distance;
            wheel.raycastResult.hitNormalWorld = raycastResult.hitNormalWorld;
            wheel.isInContact = true;

            const hitDistance = raycastResult.distance;
            wheel.suspensionLength = hitDistance - wheel.radius;

            // clamp on max suspension travel
            const minSuspensionLength = wheel.suspensionRestLength - wheel.maxSuspensionTravel;
            const maxSuspensionLength = wheel.suspensionRestLength + wheel.maxSuspensionTravel;
            if (wheel.suspensionLength < minSuspensionLength)
            {
                wheel.suspensionLength = minSuspensionLength;
            }
            if (wheel.suspensionLength > maxSuspensionLength)
            {
                wheel.suspensionLength = maxSuspensionLength;
                wheel.raycastResult.reset();
            }

            const denominator = wheel.raycastResult.hitNormalWorld.dot(wheel.directionWorld);

            const chassisVelocityAtContactPoint = new Vector3();
            chassisBody.getVelocityAtWorldPoint(wheel.raycastResult.hitPointWorld, chassisVelocityAtContactPoint);

            const projVel = wheel.raycastResult.hitNormalWorld.dot(chassisVelocityAtContactPoint);

            if (denominator >= -0.1)
            {
                wheel.suspensionRelativeVelocity = 0;
                wheel.clippedInvContactDotSuspension = 1 / 0.1;
            }
            else
            {
                const inv = -1 / denominator;
                wheel.suspensionRelativeVelocity = projVel * inv;
                wheel.clippedInvContactDotSuspension = inv;
            }
        }
        else
        {
            // put wheel info as in rest position
            wheel.suspensionLength = wheel.suspensionRestLength + 0 * wheel.maxSuspensionTravel;
            wheel.suspensionRelativeVelocity = 0.0;
            wheel.directionWorld.scaleNumberTo(-1, wheel.raycastResult.hitNormalWorld);
            wheel.clippedInvContactDotSuspension = 1.0;
        }

        return depth;
    }

    updateWheelTransformWorld(wheel: WheelInfo)
    {
        wheel.isInContact = false;
        const chassisBody = this.chassisBody;
        chassisBody.pointToWorldFrame(wheel.chassisConnectionPointLocal, wheel.chassisConnectionPointWorld);
        chassisBody.vectorToWorldFrame(wheel.directionLocal, wheel.directionWorld);
        chassisBody.vectorToWorldFrame(wheel.axleLocal, wheel.axleWorld);
    }

    /**
     * Update one of the wheel transform.
     * Note when rendering wheels: during each step, wheel transforms are updated BEFORE the chassis; ie. their position becomes invalid after the step. Thus when you render wheels, you must update wheel transforms before rendering them. See raycastVehicle demo for an example.
     *
     * @param wheelIndex The wheel index to update.
     */
    updateWheelTransform(wheelIndex: number)
    {
        const up = tmpVec4;
        const right = tmpVec5;
        const fwd = tmpVec6;

        const wheel = this.wheelInfos[wheelIndex];
        this.updateWheelTransformWorld(wheel);

        wheel.directionLocal.scaleNumberTo(-1, up);
        right.copy(wheel.axleLocal);
        up.crossTo(right, fwd);
        fwd.normalize();
        right.normalize();

        // Rotate around steering over the wheelAxle
        const steering = wheel.steering;
        const steeringOrn = new Quaternion();
        steeringOrn.fromAxisAngle(up, steering);

        const rotatingOrn = new Quaternion();
        rotatingOrn.fromAxisAngle(right, wheel.rotation);

        // World rotation of the wheel
        const q = wheel.worldTransform.quaternion;
        this.chassisBody.quaternion.multTo(steeringOrn, q);
        q.multTo(rotatingOrn, q);

        q.normalize();

        // world position of the wheel
        const p = wheel.worldTransform.position;
        p.copy(wheel.directionWorld);
        p.scaleNumberTo(wheel.suspensionLength, p);
        p.addTo(wheel.chassisConnectionPointWorld, p);
    }

    /**
     * Get the world transform of one of the wheels
     *
     * @param wheelIndex
     */
    getWheelTransformWorld(wheelIndex: number)
    {
        return this.wheelInfos[wheelIndex].worldTransform;
    }

    updateFriction(timeStep: number)
    {
        const surfNormalWS$scaled$proj = updateFriction$surfNormalWS$scaled$proj;

        // calculate the impulse, so that the wheels don't move sidewards
        const wheelInfos = this.wheelInfos;
        const numWheels = wheelInfos.length;
        const chassisBody = this.chassisBody;
        const forwardWS = updateFriction$forwardWS;
        const axle = updateFriction$axle;

        let numWheelsOnGround = 0;

        for (let i = 0; i < numWheels; i++)
        {
            const wheel = wheelInfos[i];

            const groundObject = wheel.raycastResult.body;
            if (groundObject)
            {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                numWheelsOnGround++;
            }

            wheel.sideImpulse = 0;
            wheel.forwardImpulse = 0;
            if (!forwardWS[i])
            {
                forwardWS[i] = new Vector3();
            }
            if (!axle[i])
            {
                axle[i] = new Vector3();
            }
        }

        for (let i = 0; i < numWheels; i++)
        {
            const wheel = wheelInfos[i];

            const groundObject = wheel.raycastResult.body;

            if (groundObject)
            {
                const axlei = axle[i];
                const wheelTrans = this.getWheelTransformWorld(i);

                // Get world axle
                wheelTrans.vectorToWorldFrame(directions[this.indexRightAxis], axlei);

                const surfNormalWS = wheel.raycastResult.hitNormalWorld;
                const proj = axlei.dot(surfNormalWS);
                surfNormalWS.scaleNumberTo(proj, surfNormalWS$scaled$proj);
                axlei.subTo(surfNormalWS$scaled$proj, axlei);
                axlei.normalize();

                surfNormalWS.crossTo(axlei, forwardWS[i]);
                forwardWS[i].normalize();

                wheel.sideImpulse = resolveSingleBilateral(
                    chassisBody,
                    wheel.raycastResult.hitPointWorld,
                    groundObject,
                    wheel.raycastResult.hitPointWorld,
                    axlei
                );

                wheel.sideImpulse *= sideFrictionStiffness2;
            }
        }

        const sideFactor = 1;
        const fwdFactor = 0.5;

        this.sliding = false;
        for (let i = 0; i < numWheels; i++)
        {
            const wheel = wheelInfos[i];
            const groundObject = wheel.raycastResult.body;

            let rollingFriction = 0;

            wheel.slipInfo = 1;
            if (groundObject)
            {
                const defaultRollingFrictionImpulse = 0;
                const maxImpulse = wheel.brake ? wheel.brake : defaultRollingFrictionImpulse;

                // btWheelContactPoint contactPt(chassisBody,groundObject,wheelInfraycastInfo.hitPointWorld,forwardWS[wheel],maxImpulse);
                // rollingFriction = calcRollingFriction(contactPt);
                rollingFriction = calcRollingFriction(chassisBody, groundObject, wheel.raycastResult.hitPointWorld, forwardWS[i], maxImpulse);

                rollingFriction += wheel.engineForce * timeStep;

                // rollingFriction = 0;
                const factor = maxImpulse / rollingFriction;
                wheel.slipInfo *= factor;
            }

            // switch between active rolling (throttle), braking and non-active rolling friction (nthrottle/break)

            wheel.forwardImpulse = 0;
            wheel.skidInfo = 1;

            if (groundObject)
            {
                wheel.skidInfo = 1;

                const maximp = wheel.suspensionForce * timeStep * wheel.frictionSlip;
                const maximpSide = maximp;

                const maximpSquared = maximp * maximpSide;

                wheel.forwardImpulse = rollingFriction;// wheelInfo.engineForce* timeStep;

                const x = wheel.forwardImpulse * fwdFactor;
                const y = wheel.sideImpulse * sideFactor;

                const impulseSquared = x * x + y * y;

                wheel.sliding = false;
                if (impulseSquared > maximpSquared)
                {
                    this.sliding = true;
                    wheel.sliding = true;

                    const factor = maximp / Math.sqrt(impulseSquared);

                    wheel.skidInfo *= factor;
                }
            }
        }

        if (this.sliding)
        {
            for (let i = 0; i < numWheels; i++)
            {
                const wheel = wheelInfos[i];
                if (wheel.sideImpulse !== 0)
                {
                    if (wheel.skidInfo < 1)
                    {
                        wheel.forwardImpulse *= wheel.skidInfo;
                        wheel.sideImpulse *= wheel.skidInfo;
                    }
                }
            }
        }

        // apply the impulses
        for (let i = 0; i < numWheels; i++)
        {
            const wheel = wheelInfos[i];

            const relPos = new Vector3();
            wheel.raycastResult.hitPointWorld.subTo(chassisBody.position, relPos);
            // cannons applyimpulse is using world coord for the position
            // rel_pos.copy(wheel.raycastResult.hitPointWorld);

            if (wheel.forwardImpulse !== 0)
            {
                const impulse = new Vector3();
                forwardWS[i].scaleNumberTo(wheel.forwardImpulse, impulse);
                chassisBody.applyImpulse(impulse, relPos);
            }

            if (wheel.sideImpulse !== 0)
            {
                const groundObject = wheel.raycastResult.body;

                const relPos2 = new Vector3();
                wheel.raycastResult.hitPointWorld.subTo(groundObject.position, relPos2);
                // rel_pos2.copy(wheel.raycastResult.hitPointWorld);
                const sideImp = new Vector3();
                axle[i].scaleNumberTo(wheel.sideImpulse, sideImp);

                // Scale the relative position in the up direction with rollInfluence.
                // If rollInfluence is 1, the impulse will be applied on the hitPoint (easy to roll over), if it is zero it will be applied in the same plane as the center of mass (not easy to roll over).
                chassisBody.vectorToLocalFrame(relPos, relPos);
                relPos['xyz'[this.indexUpAxis]] *= wheel.rollInfluence;
                chassisBody.vectorToWorldFrame(relPos, relPos);
                chassisBody.applyImpulse(sideImp, relPos);

                // apply friction impulse on the ground
                sideImp.scaleNumberTo(-1, sideImp);
                groundObject.applyImpulse(sideImp, relPos2);
            }
        }
    }
}

// const tmpVec1 = new Vector3();
// const tmpVec2 = new Vector3();
// const tmpVec3 = new Vector3();
const tmpVec4 = new Vector3();
const tmpVec5 = new Vector3();
const tmpVec6 = new Vector3();
// const tmpRay = new Ray();

// const torque = new Vector3();

const castRay$rayvector = new Vector3();
const castRay$target = new Vector3();

const directions = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1)
];
const updateFriction$surfNormalWS$scaled$proj = new Vector3();
const updateFriction$axle: Vector3[] = [];
const updateFriction$forwardWS: Vector3[] = [];
const sideFrictionStiffness2 = 1;

const calcRollingFriction$vel1 = new Vector3();
const calcRollingFriction$vel2 = new Vector3();
const calcRollingFriction$vel = new Vector3();

function calcRollingFriction(body0: Body, body1: Body, frictionPosWorld: Vector3, frictionDirectionWorld: Vector3, maxImpulse: number)
{
    let j1 = 0;
    const contactPosWorld = frictionPosWorld;

    // let rel_pos1 = new Vector3();
    // let rel_pos2 = new Vector3();
    const vel1 = calcRollingFriction$vel1;
    const vel2 = calcRollingFriction$vel2;
    const vel = calcRollingFriction$vel;
    // contactPosWorld.subTo(body0.position, rel_pos1);
    // contactPosWorld.subTo(body1.position, rel_pos2);

    body0.getVelocityAtWorldPoint(contactPosWorld, vel1);
    body1.getVelocityAtWorldPoint(contactPosWorld, vel2);
    vel1.subTo(vel2, vel);

    const vrel = frictionDirectionWorld.dot(vel);

    const denom0 = computeImpulseDenominator(body0, frictionPosWorld, frictionDirectionWorld);
    const denom1 = computeImpulseDenominator(body1, frictionPosWorld, frictionDirectionWorld);
    const relaxation = 1;
    const jacDiagABInv = relaxation / (denom0 + denom1);

    // calculate j that moves us to zero relative velocity
    j1 = -vrel * jacDiagABInv;

    if (maxImpulse < j1)
    {
        j1 = maxImpulse;
    }
    if (j1 < -maxImpulse)
    {
        j1 = -maxImpulse;
    }

    return j1;
}

const computeImpulseDenominator$r0 = new Vector3();
const computeImpulseDenominator$c0 = new Vector3();
const computeImpulseDenominator$vec = new Vector3();
const computeImpulseDenominator$m = new Vector3();
function computeImpulseDenominator(body: Body, pos: Vector3, normal: Vector3)
{
    const r0 = computeImpulseDenominator$r0;
    const c0 = computeImpulseDenominator$c0;
    const vec = computeImpulseDenominator$vec;
    const m = computeImpulseDenominator$m;

    pos.subTo(body.position, r0);
    r0.crossTo(normal, c0);
    body.invInertiaWorld.vmult(c0, m);
    m.crossTo(r0, vec);

    return body.invMass + normal.dot(vec);
}

const resolveSingleBilateral$vel1 = new Vector3();
const resolveSingleBilateral$vel2 = new Vector3();
const resolveSingleBilateral$vel = new Vector3();

// bilateral constraint between two dynamic objects
function resolveSingleBilateral(body1: Body, pos1: Vector3, body2: Body, pos2: Vector3, normal: Vector3)
{
    const normalLenSqr = normal.lengthSquared;
    if (normalLenSqr > 1.1)
    {
        return 0; // no impulse
    }
    // let rel_pos1 = new Vector3();
    // let rel_pos2 = new Vector3();
    // pos1.subTo(body1.position, rel_pos1);
    // pos2.subTo(body2.position, rel_pos2);

    const vel1 = resolveSingleBilateral$vel1;
    const vel2 = resolveSingleBilateral$vel2;
    const vel = resolveSingleBilateral$vel;
    body1.getVelocityAtWorldPoint(pos1, vel1);
    body2.getVelocityAtWorldPoint(pos2, vel2);

    vel1.subTo(vel2, vel);

    const relVel = normal.dot(vel);

    const contactDamping = 0.2;
    const massTerm = 1 / (body1.invMass + body2.invMass);
    const impulse = -contactDamping * relVel * massTerm;

    return impulse;
}
