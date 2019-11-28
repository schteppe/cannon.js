namespace CANNON
{
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
            var a = this.a,
                b = this.b,
                bi = this.bi,
                bj = this.bj,
                ri = this.ri,
                rj = this.rj,
                rixt = FrictionEquation_computeB_temp1,
                rjxt = FrictionEquation_computeB_temp2,
                t = this.t;

            // Caluclate cross products
            ri.crossTo(t, rixt);
            rj.crossTo(t, rjxt);

            // G = [-t -rixt t rjxt]
            // And remember, this is a pure velocity constraint, g is always zero!
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB;
            t.negateTo(GA.spatial);
            rixt.negateTo(GA.rotational);
            GB.spatial.copy(t);
            GB.rotational.copy(rjxt);

            var GW = this.computeGW();
            var GiMf = this.computeGiMf();

            var B = - GW * b - h * GiMf;

            return B;
        }
    }

    var FrictionEquation_computeB_temp1 = new Vector3();
    var FrictionEquation_computeB_temp2 = new Vector3();
}