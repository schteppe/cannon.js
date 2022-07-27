import { Vector3 } from 'feng3d';
import { Body } from '../objects/Body';
import { Equation } from './Equation';

export class RotationalMotorEquation extends Equation
{
    /**
     * World oriented rotational axis
     */
    axisA: Vector3;

    /**
     * World oriented rotational axis
     */
    axisB: Vector3; // World oriented rotational axis

    /**
     * Motor velocity
     */
    targetVelocity: number;

    /**
     * Rotational motor constraint. Tries to keep the relative angular velocity of the bodies to a given value.
     *
     * @param bodyA
     * @param bodyB
     * @param maxForce
     *
     * @author schteppe
     */
    constructor(bodyA: Body, bodyB: Body, maxForce: number)
    {
        super(bodyA, bodyB, -(typeof (maxForce) !== 'undefined' ? maxForce : 1e6), typeof (maxForce) !== 'undefined' ? maxForce : 1e6);

        this.axisA = new Vector3();
        this.axisB = new Vector3(); // World oriented rotational axis
        this.targetVelocity = 0;
    }

    computeB(h: number)
    {
        // const a = this.a;
        const b = this.b;
        // const bi = this.bi;
        // const bj = this.bj;

        const axisA = this.axisA;
        const axisB = this.axisB;

        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;

        // g = 0
        // gdot = axisA * wi - axisB * wj
        // gdot = G * W = G * [vi wi vj wj]
        // =>
        // G = [0 axisA 0 -axisB]

        GA.rotational.copy(axisA);
        axisB.negateTo(GB.rotational);

        const GW = this.computeGW() - this.targetVelocity;
        const GiMf = this.computeGiMf();

        const B = -GW * b - h * GiMf;

        return B;
    }
}
