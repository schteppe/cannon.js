import { Vector3 } from '@feng3d/math';
import { Equation } from '../equations/Equation';
import { RotationalEquation } from '../equations/RotationalEquation';
import { Body } from '../objects/Body';
import { PointToPointConstraint } from './PointToPointConstraint';

export class LockConstraint extends PointToPointConstraint
{
    xA: Vector3;
    xB: Vector3;
    yA: Vector3;
    yB: Vector3;
    zA: Vector3;
    zB: Vector3;
    rotationalEquation1: RotationalEquation;
    rotationalEquation2: RotationalEquation;
    rotationalEquation3: RotationalEquation;
    motorEquation: Equation;

    /**
     * Lock constraint. Will remove all degrees of freedom between the bodies.
     *
     * @param bodyA
     * @param bodyB
     * @param options
     *
     * @author schteppe
     */
    constructor(bodyA: Body, bodyB: Body, options: { maxForce?: number } = {})
    {
        // The point-to-point constraint will keep a point shared between the bodies
        super(bodyA, new Vector3(), bodyB, new Vector3(), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6);

        // Set pivot point in between
        const pivotA = this.pivotA;
        const pivotB = this.pivotB;
        const halfWay = new Vector3();
        bodyA.position.addTo(bodyB.position, halfWay);
        halfWay.scaleNumberTo(0.5, halfWay);
        bodyB.pointToLocalFrame(halfWay, pivotB);
        bodyA.pointToLocalFrame(halfWay, pivotA);

        // Store initial rotation of the bodies as unit vectors in the local body spaces
        this.xA = bodyA.vectorToLocalFrame(Vector3.X_AXIS);
        this.xB = bodyB.vectorToLocalFrame(Vector3.X_AXIS);
        this.yA = bodyA.vectorToLocalFrame(Vector3.Y_AXIS);
        this.yB = bodyB.vectorToLocalFrame(Vector3.Y_AXIS);
        this.zA = bodyA.vectorToLocalFrame(Vector3.Z_AXIS);
        this.zB = bodyB.vectorToLocalFrame(Vector3.Z_AXIS);

        // ...and the following rotational equations will keep all rotational DOF's in place

        const r1 = this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, options);

        const r2 = this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, options);

        const r3 = this.rotationalEquation3 = new RotationalEquation(bodyA, bodyB, options);

        this.equations.push(r1, r2, r3);
    }

    update()
    {
        const bodyA = this.bodyA;
        const bodyB = this.bodyB;
        // const motor = this.motorEquation;
        const r1 = this.rotationalEquation1;
        const r2 = this.rotationalEquation2;
        const r3 = this.rotationalEquation3;
        // const worldAxisA = LockConstraint_update_tmpVec1;
        // const worldAxisB = LockConstraint_update_tmpVec2;

        super.update();

        // These vector pairs must be orthogonal
        bodyA.vectorToWorldFrame(this.xA, r1.axisA);
        bodyB.vectorToWorldFrame(this.yB, r1.axisB);

        bodyA.vectorToWorldFrame(this.yA, r2.axisA);
        bodyB.vectorToWorldFrame(this.zB, r2.axisB);

        bodyA.vectorToWorldFrame(this.zA, r3.axisA);
        bodyB.vectorToWorldFrame(this.xB, r3.axisB);
    }
}

// var LockConstraint_update_tmpVec1 = new Vector3();
// var LockConstraint_update_tmpVec2 = new Vector3();

