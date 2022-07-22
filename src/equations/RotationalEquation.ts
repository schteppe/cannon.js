import { Vector3 } from '@feng3d/math';
import { Equation } from './Equation';

export class RotationalEquation extends Equation
{
    axisA: Vector3;
    axisB: Vector3;

    maxAngle: number;

    /**
     * Rotational constraint. Works to keep the local vectors orthogonal to each other in world space.
     *
     * @param bodyA
     * @param bodyB
     * @param options
     *
     * @author schteppe
     */
    constructor(bodyA: Body, bodyB: Body, options: { axisA?: Vector3, axisB?: Vector3, maxForce?: number } = {})
    {
        super(bodyA, bodyB, -(typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6);

        this.axisA = options.axisA ? options.axisA.clone() : new Vector3(1, 0, 0);
        this.axisB = options.axisB ? options.axisB.clone() : new Vector3(0, 1, 0);

        this.maxAngle = Math.PI / 2;
    }

    computeB(h: number)
    {
        const a = this.a;
        const b = this.b;

        const ni = this.axisA;
        const nj = this.axisB;

        const nixnj = tmpVec1;
        const njxni = tmpVec2;

        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;

        // Caluclate cross products
        ni.crossTo(nj, nixnj);
        nj.crossTo(ni, njxni);

        // g = ni * nj
        // gdot = (nj x ni) * wi + (ni x nj) * wj
        // G = [0 njxni 0 nixnj]
        // W = [vi wi vj wj]
        GA.rotational.copy(njxni);
        GB.rotational.copy(nixnj);

        const g = Math.cos(this.maxAngle) - ni.dot(nj);
        const GW = this.computeGW();
        const GiMf = this.computeGiMf();

        const B = -g * a - GW * b - h * GiMf;

        return B;
    }
}

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
