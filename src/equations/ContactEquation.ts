namespace CANNON
{
    export class ContactEquation extends Equation
    {

        restitution: number; // "bounciness": u1 = -e*u0

        /**
         * World-oriented vector that goes from the center of bi to the contact point.
         */
        ri: Vec3;

        /**
         * World-oriented vector that starts in body j position and goes to the contact point.
         */
        rj: Vec3;

        /**
         * Contact normal, pointing out of body i.
         */
        ni: Vec3;

        /**
         * Contact/non-penetration constraint equation
         * 
         * @param bodyA
         * @param bodyB
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, maxForce?: number)
        {
            super(bodyA, bodyB, 0, typeof (maxForce) !== 'undefined' ? maxForce : 1e6);

            this.restitution = 0.0; // "bounciness": u1 = -e*u0
            this.ri = new Vec3();
            this.rj = new Vec3();
            this.ni = new Vec3();
        }

        computeB(h: number)
        {
            var a = this.a,
                b = this.b,
                bi = this.bi,
                bj = this.bj,
                ri = this.ri,
                rj = this.rj,
                rixn = ContactEquation_computeB_temp1,
                rjxn = ContactEquation_computeB_temp2,

                vi = bi.velocity,
                wi = bi.angularVelocity,
                fi = bi.force,
                taui = bi.torque,

                vj = bj.velocity,
                wj = bj.angularVelocity,
                fj = bj.force,
                tauj = bj.torque,

                penetrationVec = ContactEquation_computeB_temp3,

                GA = this.jacobianElementA,
                GB = this.jacobianElementB,

                n = this.ni;

            // Caluclate cross products
            ri.cross(n, rixn);
            rj.cross(n, rjxn);

            // g = xj+rj -(xi+ri)
            // G = [ -ni  -rixn  ni  rjxn ]
            n.negate(GA.spatial);
            rixn.negate(GA.rotational);
            GB.spatial.copy(n);
            GB.rotational.copy(rjxn);

            // Calculate the penetration vector
            penetrationVec.copy(bj.position);
            penetrationVec.vadd(rj, penetrationVec);
            penetrationVec.vsub(bi.position, penetrationVec);
            penetrationVec.vsub(ri, penetrationVec);

            var g = n.dot(penetrationVec);

            // Compute iteration
            var ePlusOne = this.restitution + 1;
            var GW = ePlusOne * vj.dot(n) - ePlusOne * vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
            var GiMf = this.computeGiMf();

            var B = - g * a - GW * b - h * GiMf;

            return B;
        }

        /**
         * Get the current relative velocity in the contact point.
         */
        getImpactVelocityAlongNormal()
        {
            var vi = ContactEquation_getImpactVelocityAlongNormal_vi;
            var vj = ContactEquation_getImpactVelocityAlongNormal_vj;
            var xi = ContactEquation_getImpactVelocityAlongNormal_xi;
            var xj = ContactEquation_getImpactVelocityAlongNormal_xj;
            var relVel = ContactEquation_getImpactVelocityAlongNormal_relVel;

            this.bi.position.vadd(this.ri, xi);
            this.bj.position.vadd(this.rj, xj);

            this.bi.getVelocityAtWorldPoint(xi, vi);
            this.bj.getVelocityAtWorldPoint(xj, vj);

            vi.vsub(vj, relVel);

            return this.ni.dot(relVel);
        }

    }

    var ContactEquation_computeB_temp1 = new Vec3(); // Temp vectors
    var ContactEquation_computeB_temp2 = new Vec3();
    var ContactEquation_computeB_temp3 = new Vec3();


    var ContactEquation_getImpactVelocityAlongNormal_vi = new Vec3();
    var ContactEquation_getImpactVelocityAlongNormal_vj = new Vec3();
    var ContactEquation_getImpactVelocityAlongNormal_xi = new Vec3();
    var ContactEquation_getImpactVelocityAlongNormal_xj = new Vec3();
    var ContactEquation_getImpactVelocityAlongNormal_relVel = new Vec3();
}