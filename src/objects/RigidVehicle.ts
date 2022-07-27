import { Vector3 } from '@feng3d/math';
import { HingeConstraint } from '../constraints/HingeConstraint';
import { Body } from '../objects/Body';
import { World } from '../world/World';

export class RigidVehicle
{
    wheelBodies: Body[];
    coordinateSystem: Vector3;
    chassisBody: Body;
    constraints: HingeConstraint[];
    wheelAxes: Vector3[];
    wheelForces: number[];

    /**
     * Simple vehicle helper class with spherical rigid body wheels.
     *
     * @param options
     */
    constructor(options: { coordinateSystem?: Vector3, chassisBody?: Body } = {})
    {
        this.wheelBodies = [];

        this.coordinateSystem = typeof (options.coordinateSystem) === 'undefined' ? new Vector3(1, 2, 3) : options.coordinateSystem.clone();

        this.chassisBody = options.chassisBody;

        if (!this.chassisBody)
        {
            // No chassis body given. Create it!
            // const chassisShape = new Box(new Vector3(5, 2, 0.5));
            throw '下一行代码有问题？！';
            // this.chassisBody = new Body(1, chassisShape);
        }

        this.constraints = [];
        this.wheelAxes = [];
        this.wheelForces = [];
    }

    /**
     * Add a wheel
     *
     * @param options
     */
    addWheel(options: { body?: Body, isFrontWheel?: boolean, position?: Vector3, axis?: Vector3 } = {})
    {
        const wheelBody = options.body;
        if (!wheelBody)
        {
            throw '下一行代码有问题？！';
            // wheelBody = new Body(1, new Sphere(1.2));
        }
        this.wheelBodies.push(wheelBody);
        this.wheelForces.push(0);

        // Position constrain wheels
        // const zero = new Vector3();
        const position = typeof (options.position) !== 'undefined' ? options.position.clone() : new Vector3();

        // Set position locally to the chassis
        const worldPosition = new Vector3();
        this.chassisBody.pointToWorldFrame(position, worldPosition);
        wheelBody.position.set(worldPosition.x, worldPosition.y, worldPosition.z);

        // Constrain wheel
        const axis = typeof (options.axis) !== 'undefined' ? options.axis.clone() : new Vector3(0, 1, 0);
        this.wheelAxes.push(axis);

        const hingeConstraint = new HingeConstraint(this.chassisBody, wheelBody, {
            pivotA: position,
            axisA: axis,
            pivotB: Vector3.ZERO,
            axisB: axis,
            collideConnected: false
        });
        this.constraints.push(hingeConstraint);

        return this.wheelBodies.length - 1;
    }

    /**
     * Set the steering value of a wheel.
     *
     * @param value
     * @param wheelIndex
     *
     * @todo check coordinateSystem
     */
    setSteeringValue(value: number, wheelIndex: number)
    {
        // Set angle of the hinge axis
        const axis = this.wheelAxes[wheelIndex];

        const c = Math.cos(value);
        const s = Math.sin(value);
        const x = axis.x;
        const y = axis.y;
        this.constraints[wheelIndex].axisA.set(
            c * x - s * y,
            s * x + c * y,
            0
        );
    }

    /**
     * Set the target rotational speed of the hinge constraint.
     *
     * @param value
     * @param wheelIndex
     */
    setMotorSpeed(value: number, wheelIndex: number)
    {
        const hingeConstraint = this.constraints[wheelIndex];
        hingeConstraint.enableMotor();
        hingeConstraint.motorTargetVelocity = value;
    }

    /**
     * Set the target rotational speed of the hinge constraint.
     *
     * @param wheelIndex
     */
    disableMotor(wheelIndex: number)
    {
        const hingeConstraint = this.constraints[wheelIndex];
        hingeConstraint.disableMotor();
    }

    /**
     * Set the wheel force to apply on one of the wheels each time step
     *
     * @param value
     * @param wheelIndex
     */
    setWheelForce(value: number, wheelIndex: number)
    {
        this.wheelForces[wheelIndex] = value;
    }

    /**
     * Apply a torque on one of the wheels.
     *
     * @param value
     * @param wheelIndex
     */
    applyWheelForce(value: number, wheelIndex: number)
    {
        const axis = this.wheelAxes[wheelIndex];
        const wheelBody = this.wheelBodies[wheelIndex];
        const bodyTorque = wheelBody.torque;

        axis.scaleNumberTo(value, torque);
        wheelBody.vectorToWorldFrame(torque, torque);
        bodyTorque.addTo(torque, bodyTorque);
    }

    /**
     * Add the vehicle including its constraints to the world.
     *
     * @param world
     */
    addToWorld(world: World)
    {
        const constraints = this.constraints;
        const bodies = this.wheelBodies.concat([this.chassisBody]);

        for (let i = 0; i < bodies.length; i++)
        {
            world.addBody(bodies[i]);
        }

        for (let i = 0; i < constraints.length; i++)
        {
            world.addConstraint(constraints[i]);
        }

        world.on('preStep', this._update, this);
    }

    private _update()
    {
        const wheelForces = this.wheelForces;
        for (let i = 0; i < wheelForces.length; i++)
        {
            this.applyWheelForce(wheelForces[i], i);
        }
    }

    /**
     * Remove the vehicle including its constraints from the world.
     * @param world
     */
    removeFromWorld(world: World)
    {
        const constraints = this.constraints;
        const bodies = this.wheelBodies.concat([this.chassisBody]);

        for (let i = 0; i < bodies.length; i++)
        {
            world.removeBody(bodies[i]);
        }

        for (let i = 0; i < constraints.length; i++)
        {
            world.removeConstraint(constraints[i]);
        }
    }

    /**
     * Get current rotational velocity of a wheel
     *
     * @param wheelIndex
     */
    getWheelSpeed(wheelIndex: number)
    {
        const axis = this.wheelAxes[wheelIndex];
        const wheelBody = this.wheelBodies[wheelIndex];
        const w = wheelBody.angularVelocity;
        this.chassisBody.vectorToWorldFrame(axis, worldAxis);

        return w.dot(worldAxis);
    }
}

const torque = new Vector3();

const worldAxis = new Vector3();
