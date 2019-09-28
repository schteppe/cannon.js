namespace CANNON
{
    export class ConeEquation extends Equation
    {
        axisA: Vec3;
        axisB: Vec3;
        /**
         * The cone angle to keep
         */
        angle: number

        /**
         * Cone equation. Works to keep the given body world vectors aligned, or tilted within a given angle from each other.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options: { maxForce?: number, axisA?: Vec3, axisB?: Vec3, angle?: number } = {})
        {
            super(bodyA, bodyB, -(typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6);

            this.axisA = options.axisA ? options.axisA.clone() : new Vec3(1, 0, 0);
            this.axisB = options.axisB ? options.axisB.clone() : new Vec3(0, 1, 0);

            this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 0;
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

            // The angle between two vector is:
            // cos(theta) = a * b / (length(a) * length(b) = { len(a) = len(b) = 1 } = a * b

            // g = a * b
            // gdot = (b x a) * wi + (a x b) * wj
            // G = [0 bxa 0 axb]
            // W = [vi wi vj wj]
            GA.rotational.copy(njxni);
            GB.rotational.copy(nixnj);

            var g = Math.cos(this.angle) - ni.dot(nj),
                GW = this.computeGW(),
                GiMf = this.computeGiMf();

            var B = - g * a - GW * b - h * GiMf;

            return B;
        }

    }

    var tmpVec1 = new Vec3();
    var tmpVec2 = new Vec3();
}