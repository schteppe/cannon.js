namespace CANNON
{
    export class RotationalMotorEquation extends Equation
    {

        /**
         * World oriented rotational axis
         */
        axisA: Vec3;

        /**
         * World oriented rotational axis
         */
        axisB: Vec3; // World oriented rotational axis

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

            this.axisA = new Vec3();
            this.axisB = new Vec3(); // World oriented rotational axis
            this.targetVelocity = 0;
        }

        computeB(h: number)
        {
            var a = this.a,
                b = this.b,
                bi = this.bi,
                bj = this.bj,

                axisA = this.axisA,
                axisB = this.axisB,

                GA = this.jacobianElementA,
                GB = this.jacobianElementB;

            // g = 0
            // gdot = axisA * wi - axisB * wj
            // gdot = G * W = G * [vi wi vj wj]
            // =>
            // G = [0 axisA 0 -axisB]

            GA.rotational.copy(axisA);
            axisB.negate(GB.rotational);

            var GW = this.computeGW() - this.targetVelocity,
                GiMf = this.computeGiMf();

            var B = - GW * b - h * GiMf;

            return B;
        }
    }
}