import { Vector3 } from '@feng3d/math';
import { Equation } from './Equation';

export class FrictionEquation extends Equation
{
    ri: Vector3;
    rj: Vector3;
    t: Vector3; // tangent

    /**
     * Constrains the slipping in a contact along a tangent
     * @class FrictionEquation
     * @constructor
     * @author schteppe
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @param {Number} slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
     * @extends Equation
     */
    constructor(bodyA: Body, bodyB: Body, slipForce: number)
    {
        super(bodyA, bodyB, -slipForce, slipForce);
        this.ri = new Vector3();
        this.rj = new Vector3();
        this.t = new Vector3(); // tangent
    }

    computeB(h: number)
    {
        // const a = this.a;
        const b = this.b;
        // const bi = this.bi;
        // const bj = this.bj;
        const ri = this.ri;
        const rj = this.rj;
        const rixt = FrictionEquationComputeBTemp1;
        const rjxt = FrictionEquationComputeBTemp2;
        const t = this.t;

        // Caluclate cross products
        ri.crossTo(t, rixt);
        rj.crossTo(t, rjxt);

        // G = [-t -rixt t rjxt]
        // And remember, this is a pure velocity constraint, g is always zero!
        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;
        t.negateTo(GA.spatial);
        rixt.negateTo(GA.rotational);
        GB.spatial.copy(t);
        GB.rotational.copy(rjxt);

        const GW = this.computeGW();
        const GiMf = this.computeGiMf();

        const B = -GW * b - h * GiMf;

        return B;
    }
}

const FrictionEquationComputeBTemp1 = new Vector3();
const FrictionEquationComputeBTemp2 = new Vector3();
