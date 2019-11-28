namespace CANNON
{
    export class RigidVehicle
    {
        wheelBodies: Body[];
        coordinateSystem: Vec3;
        chassisBody: Body;
        constraints: HingeConstraint[];
        wheelAxes: Vec3[];
        wheelForces: number[];

        /**
         * Simple vehicle helper class with spherical rigid body wheels.
         * 
         * @param options 
         */
        constructor(options: { coordinateSystem?: Vec3, chassisBody?: Body } = {})
        {
            this.wheelBodies = [];

            this.coordinateSystem = typeof (options.coordinateSystem) === 'undefined' ? new Vec3(1, 2, 3) : options.coordinateSystem.clone();

            this.chassisBody = options.chassisBody;

            if (!this.chassisBody)
            {
                // No chassis body given. Create it!
                var chassisShape = new Box(new Vec3(5, 2, 0.5));
                throw "下一行代码有问题？！"
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
        addWheel(options: { body?: Body, isFrontWheel?: boolean, position?: Vec3, axis?: Vec3 } = {})
        {
            var wheelBody = options.body;
            if (!wheelBody)
            {
                throw "下一行代码有问题？！";
                // wheelBody = new Body(1, new Sphere(1.2));
            }
            this.wheelBodies.push(wheelBody);
            this.wheelForces.push(0);

            // Position constrain wheels
            var zero = new Vec3();
            var position = typeof (options.position) !== 'undefined' ? options.position.clone() : new Vec3();

            // Set position locally to the chassis
            var worldPosition = new Vec3();
            this.chassisBody.pointToWorldFrame(position, worldPosition);
            wheelBody.position.set(worldPosition.x, worldPosition.y, worldPosition.z);

            // Constrain wheel
            var axis = typeof (options.axis) !== 'undefined' ? options.axis.clone() : new Vec3(0, 1, 0);
            this.wheelAxes.push(axis);

            var hingeConstraint = new HingeConstraint(this.chassisBody, wheelBody, {
                pivotA: position,
                axisA: axis,
                pivotB: Vec3.ZERO,
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
            var axis = this.wheelAxes[wheelIndex];

            var c = Math.cos(value),
                s = Math.sin(value),
                x = axis.x,
                y = axis.y;
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
            var hingeConstraint = this.constraints[wheelIndex];
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
            var hingeConstraint = this.constraints[wheelIndex];
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
            var axis = this.wheelAxes[wheelIndex];
            var wheelBody = this.wheelBodies[wheelIndex];
            var bodyTorque = wheelBody.torque;

            axis.scale(value, torque);
            wheelBody.vectorToWorldFrame(torque, torque);
            bodyTorque.vadd(torque, bodyTorque);
        }

        /**
         * Add the vehicle including its constraints to the world.
         * 
         * @param world
         */
        addToWorld(world: World)
        {
            var constraints = this.constraints;
            var bodies = this.wheelBodies.concat([this.chassisBody]);

            for (var i = 0; i < bodies.length; i++)
            {
                world.addBody(bodies[i]);
            }

            for (var i = 0; i < constraints.length; i++)
            {
                world.addConstraint(constraints[i]);
            }

            world.addEventListener('preStep', this._update.bind(this));
        }

        private _update()
        {
            var wheelForces = this.wheelForces;
            for (var i = 0; i < wheelForces.length; i++)
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
            var constraints = this.constraints;
            var bodies = this.wheelBodies.concat([this.chassisBody]);

            for (var i = 0; i < bodies.length; i++)
            {
                world.remove(bodies[i]);
            }

            for (var i = 0; i < constraints.length; i++)
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
            var axis = this.wheelAxes[wheelIndex];
            var wheelBody = this.wheelBodies[wheelIndex];
            var w = wheelBody.angularVelocity;
            this.chassisBody.vectorToWorldFrame(axis, worldAxis);
            return w.dot(worldAxis);
        }

    }


    var torque = new Vec3();

    var worldAxis = new Vec3();
}