namespace CANNON
{
    export class HingeConstraint extends PointToPointConstraint
    {
        /**
         * Rotation axis, defined locally in bodyA.
         */
        axisA: Vec3;
        /**
         * Rotation axis, defined locally in bodyB.
         */
        axisB: Vec3;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        motorEquation: RotationalMotorEquation;
        /**
         * Equations to be fed to the solver
         */
        equations: Equation[];
        motorTargetVelocity: number;

        /**
         * Hinge constraint. Think of it as a door hinge. It tries to keep the door in the correct place and with the correct orientation.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options: { pivotA?: Vec3, pivotB?: Vec3, maxForce?: number, axisA?: Vec3, axisB?: Vec3, collideConnected?: boolean } = {})
        {
            var maxForce = typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6;

            super(bodyA, options.pivotA ? options.pivotA.clone() : new Vec3(), bodyB, options.pivotB ? options.pivotB.clone() : new Vec3(), maxForce);

            var axisA = this.axisA = options.axisA ? options.axisA.clone() : new Vec3(1, 0, 0);
            axisA.normalize();

            var axisB = this.axisB = options.axisB ? options.axisB.clone() : new Vec3(1, 0, 0);
            axisB.normalize();

            var r1 = this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, options);

            var r2 = this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, options);

            var motor = this.motorEquation = new RotationalMotorEquation(bodyA, bodyB, maxForce);
            motor.enabled = false; // Not enabled by default

            // Equations to be fed to the solver
            this.equations.push(
                r1, // rotational1
                r2, // rotational2
                motor
            );
        }

        enableMotor()
        {
            this.motorEquation.enabled = true;
        }

        disableMotor()
        {
            this.motorEquation.enabled = false;
        }

        setMotorSpeed(speed: number)
        {
            this.motorEquation.targetVelocity = speed;
        }

        setMotorMaxForce(maxForce: number)
        {
            this.motorEquation.maxForce = maxForce;
            this.motorEquation.minForce = -maxForce;
        }

        update()
        {
            var bodyA = this.bodyA,
                bodyB = this.bodyB,
                motor = this.motorEquation,
                r1 = this.rotationalEquation1,
                r2 = this.rotationalEquation2,
                worldAxisA = HingeConstraint_update_tmpVec1,
                worldAxisB = HingeConstraint_update_tmpVec2;

            var axisA = this.axisA;
            var axisB = this.axisB;

            super.update();

            // Get world axes
            bodyA.quaternion.vmult(axisA, worldAxisA);
            bodyB.quaternion.vmult(axisB, worldAxisB);

            worldAxisA.tangents(r1.axisA, r2.axisA);
            r1.axisB.copy(worldAxisB);
            r2.axisB.copy(worldAxisB);

            if (this.motorEquation.enabled)
            {
                bodyA.quaternion.vmult(this.axisA, motor.axisA);
                bodyB.quaternion.vmult(this.axisB, motor.axisB);
            }
        }
    }


    var HingeConstraint_update_tmpVec1 = new Vec3();
    var HingeConstraint_update_tmpVec2 = new Vec3();
}