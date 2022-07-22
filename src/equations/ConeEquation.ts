import { Vector3 } from '@feng3d/math';
import { Body } from '../objects/Body';
import { Equation } from './Equation';

export class ConeEquation extends Equation
{
    axisA: Vector3;
    axisB: Vector3;
    /**
     * The cone angle to keep
     */
    angle: number;

    /**
     * Cone equation. Works to keep the given body world vectors aligned, or tilted within a given angle from each other.
     *
     * @param bodyA
     * @param bodyB
     * @param options
     *
     * @author schteppe
     */
    constructor(bodyA: Body, bodyB: Body, options: { maxForce?: number, axisA?: Vector3, axisB?: Vector3, angle?: number } = {})
    {
        super(bodyA, bodyB, -(typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6);

        this.axisA = options.axisA ? options.axisA.clone() : new Vector3(1, 0, 0);
        this.axisB = options.axisB ? options.axisB.clone() : new Vector3(0, 1, 0);

        this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 0;
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

        // The angle between two vector is:
        // cos(theta) = a * b / (length(a) * length(b) = { len(a) = len(b) = 1 } = a * b

        // g = a * b
        // gdot = (b x a) * wi + (a x b) * wj
        // G = [0 bxa 0 axb]
        // W = [vi wi vj wj]
        GA.rotational.copy(njxni);
        GB.rotational.copy(nixnj);

        const g = Math.cos(this.angle) - ni.dot(nj);
            const GW = this.computeGW();
            const GiMf = this.computeGiMf();

        const B = -g * a - GW * b - h * GiMf;

        return B;
    }
}

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
