import { Vector3 } from '@feng3d/math';
import { JacobianElement } from '../math/JacobianElement';

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
        const d = relaxation;
        const k = stiffness;
        const h = timeStep;
        this.a = 4.0 / (h * (1 + 4 * d));
        this.b = (4.0 * d) / (1 + 4 * d);
        this.eps = 4.0 / (h * h * k * (1 + 4 * d));
    }

    /**
     * Computes the RHS of the SPOOK equation
     */
    computeB(a: number, b: number, h: number)
    {
        const GW = this.computeGW();
        const Gq = this.computeGq();
        const GiMf = this.computeGiMf();

        return -Gq * a - GW * b - GiMf * h;
    }

    /**
     * Computes G*q, where q are the generalized body coordinates
     */
    computeGq()
    {
        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;
        const bi = this.bi;
        const bj = this.bj;
        const xi = bi.position;
        const xj = bj.position;

        return GA.spatial.dot(xi) + GB.spatial.dot(xj);
    }

    /**
     * Computes G*W, where W are the body velocities
     */
    computeGW()
    {
        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;
        const bi = this.bi;
        const bj = this.bj;
        const vi = bi.velocity;
        const vj = bj.velocity;
        const wi = bi.angularVelocity;
        const wj = bj.angularVelocity;

        return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
    }

    /**
     * Computes G*Wlambda, where W are the body velocities
     */
    computeGWlambda()
    {
        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;
        const bi = this.bi;
        const bj = this.bj;
        const vi = bi.vlambda;
        const vj = bj.vlambda;
        const wi = bi.wlambda;
        const wj = bj.wlambda;

        return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
    }

    /**
     * Computes G*inv(M)*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
     */
    computeGiMf()
    {
        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;
        const bi = this.bi;
        const bj = this.bj;
        const fi = bi.force;
        const ti = bi.torque;
        const fj = bj.force;
        const tj = bj.torque;
        const invMassi = bi.invMassSolve;
        const invMassj = bj.invMassSolve;

        fi.scaleNumberTo(invMassi, iMfi);
        fj.scaleNumberTo(invMassj, iMfj);

        bi.invInertiaWorldSolve.vmult(ti, invIiVmultTaui);
        bj.invInertiaWorldSolve.vmult(tj, invIjVmultTauj);

        return GA.multiplyVectors(iMfi, invIiVmultTaui) + GB.multiplyVectors(iMfj, invIjVmultTauj);
    }

    /**
     * Computes G*inv(M)*G'
     */
    computeGiMGt()
    {
        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;
        const bi = this.bi;
        const bj = this.bj;
        const invMassi = bi.invMassSolve;
        const invMassj = bj.invMassSolve;
        const invIi = bi.invInertiaWorldSolve;
        const invIj = bj.invInertiaWorldSolve;
        let result = invMassi + invMassj;

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
        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;
        const bi = this.bi;
        const bj = this.bj;
        const temp = addToWlambdaTemp;

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

// const zero = new Vector3();
const iMfi = new Vector3();
const iMfj = new Vector3();
const invIiVmultTaui = new Vector3();
const invIjVmultTauj = new Vector3();
const tmp = new Vector3();

const addToWlambdaTemp = new Vector3();
// const addToWlambda_Gi = new Vector3();
// const addToWlambda_Gj = new Vector3();
// const addToWlambda_ri = new Vector3();
// const addToWlambda_rj = new Vector3();
// const addToWlambda_Mdiag = new Vector3();
