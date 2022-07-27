import { Vector3 } from 'feng3d';
import { Body } from '../objects/Body';
import { Shape } from '../shapes/Shape';
import { Equation } from './Equation';

export class ContactEquation extends Equation
{
    restitution: number; // "bounciness": u1 = -e*u0

    /**
     * World-oriented vector that goes from the center of bi to the contact point.
     */
    ri: Vector3;

    /**
     * World-oriented vector that starts in body j position and goes to the contact point.
     */
    rj: Vector3;

    /**
     * Contact normal, pointing out of body i.
     */
    ni: Vector3;
    si: Shape;
    sj: Shape;
    bodyA: Body;

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
        this.ri = new Vector3();
        this.rj = new Vector3();
        this.ni = new Vector3();
    }

    computeB(h: number)
    {
        const a = this.a;
        const b = this.b;
        const bi = this.bi;
        const bj = this.bj;
        const ri = this.ri;
        const rj = this.rj;
        const rixn = ContactEquationComputeBTemp1;
        const rjxn = ContactEquationComputeBTemp2;

        const vi = bi.velocity;
        const wi = bi.angularVelocity;
        // const fi = bi.force;
        // const taui = bi.torque;

        const vj = bj.velocity;
        const wj = bj.angularVelocity;
        // const fj = bj.force;
        // const tauj = bj.torque;

        const penetrationVec = ContactEquationComputeBTemp3;

        const GA = this.jacobianElementA;
        const GB = this.jacobianElementB;

        const n = this.ni;

        // Caluclate cross products
        ri.crossTo(n, rixn);
        rj.crossTo(n, rjxn);

        // g = xj+rj -(xi+ri)
        // G = [ -ni  -rixn  ni  rjxn ]
        n.negateTo(GA.spatial);
        rixn.negateTo(GA.rotational);
        GB.spatial.copy(n);
        GB.rotational.copy(rjxn);

        // Calculate the penetration vector
        penetrationVec.copy(bj.position);
        penetrationVec.addTo(rj, penetrationVec);
        penetrationVec.subTo(bi.position, penetrationVec);
        penetrationVec.subTo(ri, penetrationVec);

        const g = n.dot(penetrationVec);

        // Compute iteration
        const ePlusOne = this.restitution + 1;
        const GW = ePlusOne * vj.dot(n) - ePlusOne * vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
        const GiMf = this.computeGiMf();

        const B = -g * a - GW * b - h * GiMf;

        return B;
    }

    /**
     * Get the current relative velocity in the contact point.
     */
    getImpactVelocityAlongNormal()
    {
        const vi = ContactEquationGetImpactVelocityAlongNormalVi;
        const vj = ContactEquationGetImpactVelocityAlongNormalVj;
        const xi = ContactEquationGetImpactVelocityAlongNormalXi;
        const xj = ContactEquationGetImpactVelocityAlongNormalXj;
        const relVel = ContactEquationGetImpactVelocityAlongNormalRelVel;

        this.bi.position.addTo(this.ri, xi);
        this.bj.position.addTo(this.rj, xj);

        this.bi.getVelocityAtWorldPoint(xi, vi);
        this.bj.getVelocityAtWorldPoint(xj, vj);

        vi.subTo(vj, relVel);

        return this.ni.dot(relVel);
    }
}

const ContactEquationComputeBTemp1 = new Vector3(); // Temp vectors
const ContactEquationComputeBTemp2 = new Vector3();
const ContactEquationComputeBTemp3 = new Vector3();

const ContactEquationGetImpactVelocityAlongNormalVi = new Vector3();
const ContactEquationGetImpactVelocityAlongNormalVj = new Vector3();
const ContactEquationGetImpactVelocityAlongNormalXi = new Vector3();
const ContactEquationGetImpactVelocityAlongNormalXj = new Vector3();
const ContactEquationGetImpactVelocityAlongNormalRelVel = new Vector3();
