import { Vector3 } from '@feng3d/math';
import { Equation } from '../equations/Equation';
import { RotationalEquation } from '../equations/RotationalEquation';
import { RotationalMotorEquation } from '../equations/RotationalMotorEquation';
import { PointToPointConstraint } from './PointToPointConstraint';

export class HingeConstraint extends PointToPointConstraint
{
    /**
     * Rotation axis, defined locally in bodyA.
     */
    axisA: Vector3;
    /**
     * Rotation axis, defined locally in bodyB.
     */
    axisB: Vector3;
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
    constructor(bodyA: Body, bodyB: Body, options: { pivotA?: Vector3, pivotB?: Vector3, maxForce?: number, axisA?: Vector3, axisB?: Vector3, collideConnected?: boolean } = {})
    {
        const maxForce = typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6;

        super(bodyA, options.pivotA ? options.pivotA.clone() : new Vector3(), bodyB, options.pivotB ? options.pivotB.clone() : new Vector3(), maxForce);

        const axisA = this.axisA = options.axisA ? options.axisA.clone() : new Vector3(1, 0, 0);
        axisA.normalize();

        const axisB = this.axisB = options.axisB ? options.axisB.clone() : new Vector3(1, 0, 0);
        axisB.normalize();

        const r1 = this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, options);

        const r2 = this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, options);

        const motor = this.motorEquation = new RotationalMotorEquation(bodyA, bodyB, maxForce);
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
        const bodyA = this.bodyA;
        const bodyB = this.bodyB;
        const motor = this.motorEquation;
        const r1 = this.rotationalEquation1;
        const r2 = this.rotationalEquation2;
        const worldAxisA = HingeConstraintUpdateTmpVec1;
        const worldAxisB = HingeConstraintUpdateTmpVec2;

        const axisA = this.axisA;
        const axisB = this.axisB;

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

const HingeConstraintUpdateTmpVec1 = new Vector3();
const HingeConstraintUpdateTmpVec2 = new Vector3();
