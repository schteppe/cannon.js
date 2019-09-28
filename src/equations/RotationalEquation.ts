namespace CANNON
{
    export class RotationalEquation extends Equation
    {
        axisA: Vec3;
        axisB: Vec3;

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
        constructor(bodyA: Body, bodyB: Body, options: { axisA?: Vec3, axisB?: Vec3, maxForce?: number } = {})
        {
            super(bodyA, bodyB, -(typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6);

            this.axisA = options.axisA ? options.axisA.clone() : new Vec3(1, 0, 0);
            this.axisB = options.axisB ? options.axisB.clone() : new Vec3(0, 1, 0);

            this.maxAngle = Math.PI / 2;
        }

        computeB(h: number)
        {
            var a = this.a,
                b = this.b,

                ni = this.axisA,
                nj = this.axisB,

                nixnj = tmpVec1,
                njxni = tmpVec2,

                GA = this.jacobianElementA,
                GB = this.jacobianElementB;

            // Caluclate cross products
            ni.cross(nj, nixnj);
            nj.cross(ni, njxni);

            // g = ni * nj
            // gdot = (nj x ni) * wi + (ni x nj) * wj
            // G = [0 njxni 0 nixnj]
            // W = [vi wi vj wj]
            GA.rotational.copy(njxni);
            GB.rotational.copy(nixnj);

            var g = Math.cos(this.maxAngle) - ni.dot(nj),
                GW = this.computeGW(),
                GiMf = this.computeGiMf();

            var B = - g * a - GW * b - h * GiMf;

            return B;
        }

    }

    var tmpVec1 = new Vec3();
    var tmpVec2 = new Vec3();
}