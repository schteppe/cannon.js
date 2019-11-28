namespace CANNON
{
    export class Equation
    {

        id: number;

        minForce: number;

        maxForce: number;

        bi: Body;

        bj: Body;

        a: number;

        b: number;

        /**
         * SPOOK parameter
         */
        eps: number;

        jacobianElementA: JacobianElement;

        jacobianElementB: JacobianElement;

        enabled: boolean;

        /**
         * A number, proportional to the force added to the bodies.
         * @readonly
         */
        multiplier: number;

        /**
         * Equation base class
         * @class Equation
         * @constructor
         * @author schteppe
         * @param {Body} bi
         * @param {Body} bj
         * @param {Number} minForce Minimum (read: negative max) force to be applied by the constraint.
         * @param {Number} maxForce Maximum (read: positive max) force to be applied by the constraint.
         */
        constructor(bi: Body, bj: Body, minForce = -1e6, maxForce = 1e6)
        {
            this.id = Equation.id++;

            this.minForce = minForce;
            this.maxForce = maxForce;
            this.bi = bi;
            this.bj = bj;
            this.a = 0.0;
            this.b = 0.0;
            this.eps = 0.0;
            this.jacobianElementA = new JacobianElement();
            this.jacobianElementB = new JacobianElement();
            this.enabled = true;
            this.multiplier = 0;

            // Set typical spook params
            this.setSpookParams(1e7, 4, 1 / 60);
        }

        static id = 0;

        /**
         * Recalculates a,b,eps.
         */
        setSpookParams(stiffness: number, relaxation: number, timeStep: number)
        {
            var d = relaxation,
                k = stiffness,
                h = timeStep;
            this.a = 4.0 / (h * (1 + 4 * d));
            this.b = (4.0 * d) / (1 + 4 * d);
            this.eps = 4.0 / (h * h * k * (1 + 4 * d));
        }

        /**
         * Computes the RHS of the SPOOK equation
         */
        computeB(a: number, b: number, h: number)
        {
            var GW = this.computeGW(),
                Gq = this.computeGq(),
                GiMf = this.computeGiMf();
            return - Gq * a - GW * b - GiMf * h;
        }

        /**
         * Computes G*q, where q are the generalized body coordinates
         */
        computeGq()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                xi = bi.position,
                xj = bj.position;
            return GA.spatial.dot(xi) + GB.spatial.dot(xj);
        }


        /**
         * Computes G*W, where W are the body velocities
         */
        computeGW()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                vi = bi.velocity,
                vj = bj.velocity,
                wi = bi.angularVelocity,
                wj = bj.angularVelocity;
            return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
        }


        /**
         * Computes G*Wlambda, where W are the body velocities
         */
        computeGWlambda()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                vi = bi.vlambda,
                vj = bj.vlambda,
                wi = bi.wlambda,
                wj = bj.wlambda;
            return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
        }

        /**
         * Computes G*inv(M)*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
         */
        computeGiMf()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                fi = bi.force,
                ti = bi.torque,
                fj = bj.force,
                tj = bj.torque,
                invMassi = bi.invMassSolve,
                invMassj = bj.invMassSolve;

            fi.scaleNumberTo(invMassi, iMfi);
            fj.scaleNumberTo(invMassj, iMfj);

            bi.invInertiaWorldSolve.vmult(ti, invIi_vmult_taui);
            bj.invInertiaWorldSolve.vmult(tj, invIj_vmult_tauj);

            return GA.multiplyVectors(iMfi, invIi_vmult_taui) + GB.multiplyVectors(iMfj, invIj_vmult_tauj);
        }

        /**
         * Computes G*inv(M)*G'
         */
        computeGiMGt()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                invMassi = bi.invMassSolve,
                invMassj = bj.invMassSolve,
                invIi = bi.invInertiaWorldSolve,
                invIj = bj.invInertiaWorldSolve,
                result = invMassi + invMassj;

            invIi.vmult(GA.rotational, tmp);
            result += tmp.dot(GA.rotational);

            invIj.vmult(GB.rotational, tmp);
            result += tmp.dot(GB.rotational);

            return result;
        }

        /**
         * Add constraint velocity to the bodies.
         */
        addToWlambda(deltalambda: number)
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                temp = addToWlambda_temp;

            // Add to linear velocity
            // v_lambda += inv(M) * delta_lamba * G
            bi.vlambda.addScaledVectorTo(bi.invMassSolve * deltalambda, GA.spatial, bi.vlambda);
            bj.vlambda.addScaledVectorTo(bj.invMassSolve * deltalambda, GB.spatial, bj.vlambda);

            // Add to angular velocity
            bi.invInertiaWorldSolve.vmult(GA.rotational, temp);
            bi.wlambda.addScaledVectorTo(deltalambda, temp, bi.wlambda);

            bj.invInertiaWorldSolve.vmult(GB.rotational, temp);
            bj.wlambda.addScaledVectorTo(deltalambda, temp, bj.wlambda);
        }

        /**
         * Compute the denominator part of the SPOOK equation: C = G*inv(M)*G' + eps
         */
        computeC()
        {
            return this.computeGiMGt() + this.eps;
        }
    }

    var zero = new Vec3();
    var iMfi = new Vec3();
    var iMfj = new Vec3();
    var invIi_vmult_taui = new Vec3();
    var invIj_vmult_tauj = new Vec3();
    var tmp = new Vec3();


    var addToWlambda_temp = new Vec3();
    var addToWlambda_Gi = new Vec3();
    var addToWlambda_Gj = new Vec3();
    var addToWlambda_ri = new Vec3();
    var addToWlambda_rj = new Vec3();
    var addToWlambda_Mdiag = new Vec3();
}