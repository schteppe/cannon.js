import { Vector3 } from 'feng3d';
import { ConeEquation } from '../equations/ConeEquation';
import { RotationalEquation } from '../equations/RotationalEquation';
import { Body } from '../objects/Body';
import { PointToPointConstraint } from './PointToPointConstraint';

export class ConeTwistConstraint extends PointToPointConstraint
{
    axisA: Vector3;
    axisB: Vector3;
    angle: number;
    coneEquation: ConeEquation;
    twistEquation: RotationalEquation;
    twistAngle: number;

    /**
     * @class ConeTwistConstraint
     *
     * @param bodyA
     * @param bodyB
     * @param options
     *
     * @author schteppe
     */
    constructor(bodyA: Body, bodyB: Body, options: {
        pivotA?: Vector3, pivotB?: Vector3, maxForce?: number, axisA?: Vector3, axisB?: Vector3,
        collideConnected?: boolean, angle?: number, twistAngle?: number
    } = {})
    {
        super(bodyA, options.pivotA ? options.pivotA.clone() : new Vector3(), bodyB, options.pivotB ? options.pivotB.clone() : new Vector3(),
            typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6);

        this.axisA = options.axisA ? options.axisA.clone() : new Vector3();
        this.axisB = options.axisB ? options.axisB.clone() : new Vector3();

        const maxForce = typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6;

        this.collideConnected = !!options.collideConnected;

        this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 0;

        /**
         * @property {ConeEquation} coneEquation
         */
        const c = this.coneEquation = new ConeEquation(bodyA, bodyB, options);

        /**
         * @property {RotationalEquation} twistEquation
         */
        const t = this.twistEquation = new RotationalEquation(bodyA, bodyB, options);
        this.twistAngle = typeof (options.twistAngle) !== 'undefined' ? options.twistAngle : 0;

        // Make the cone equation push the bodies toward the cone axis, not outward
        c.maxForce = 0;
        c.minForce = -maxForce;

        // Make the twist equation add torque toward the initial position
        t.maxForce = 0;
        t.minForce = -maxForce;

        this.equations.push(c, t);
    }

    update()
    {
        const bodyA = this.bodyA;
        const bodyB = this.bodyB;
        const cone = this.coneEquation;
        const twist = this.twistEquation;

        super.update();

        // Update the axes to the cone constraint
        bodyA.vectorToWorldFrame(this.axisA, cone.axisA);
        bodyB.vectorToWorldFrame(this.axisB, cone.axisB);

        // Update the world axes in the twist constraint
        this.axisA.tangents(twist.axisA, twist.axisA);
        bodyA.vectorToWorldFrame(twist.axisA, twist.axisA);

        this.axisB.tangents(twist.axisB, twist.axisB);
        bodyB.vectorToWorldFrame(twist.axisB, twist.axisB);

        cone.angle = this.angle;
        twist.maxAngle = this.twistAngle;
    }
}

// var ConeTwistConstraint_update_tmpVec1 = new Vector3();
// var ConeTwistConstraint_update_tmpVec2 = new Vector3();

