import { Equation } from './Equation'
import { Vec3 } from '../math/Vec3'

/**
 * Contact/non-penetration constraint equation
 * @class ContactEquation
 * @constructor
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @extends Equation
 */
export class ContactEquation extends Equation {
  constructor(bodyA, bodyB, maxForce = 1e6) {
    super(bodyA, bodyB, 0, maxForce)

    /**
     * @property restitution
     * @type {Number}
     */
    this.restitution = 0.0 // "bounciness": u1 = -e*u0

    /**
     * World-oriented vector that goes from the center of bi to the contact point.
     * @property {Vec3} ri
     */
    this.ri = new Vec3()

    /**
     * World-oriented vector that starts in body j position and goes to the contact point.
     * @property {Vec3} rj
     */
    this.rj = new Vec3()

    /**
     * Contact normal, pointing out of body i.
     * @property {Vec3} ni
     */
    this.ni = new Vec3()
  }

  computeB(h) {
    const a = this.a
    const b = this.b
    const bi = this.bi
    const bj = this.bj
    const ri = this.ri
    const rj = this.rj
    const rixn = ContactEquation_computeB_temp1
    const rjxn = ContactEquation_computeB_temp2
    const vi = bi.velocity
    const wi = bi.angularVelocity
    const fi = bi.force
    const taui = bi.torque
    const vj = bj.velocity
    const wj = bj.angularVelocity
    const fj = bj.force
    const tauj = bj.torque
    const penetrationVec = ContactEquation_computeB_temp3
    const GA = this.jacobianElementA
    const GB = this.jacobianElementB
    const n = this.ni

    // Caluclate cross products
    ri.cross(n, rixn)
    rj.cross(n, rjxn)

    // g = xj+rj -(xi+ri)
    // G = [ -ni  -rixn  ni  rjxn ]
    n.negate(GA.spatial)
    rixn.negate(GA.rotational)
    GB.spatial.copy(n)
    GB.rotational.copy(rjxn)

    // Calculate the penetration vector
    penetrationVec.copy(bj.position)
    penetrationVec.vadd(rj, penetrationVec)
    penetrationVec.vsub(bi.position, penetrationVec)
    penetrationVec.vsub(ri, penetrationVec)

    const g = n.dot(penetrationVec)

    // Compute iteration
    const ePlusOne = this.restitution + 1
    const GW = ePlusOne * vj.dot(n) - ePlusOne * vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn)
    const GiMf = this.computeGiMf()

    const B = -g * a - GW * b - h * GiMf

    return B
  }

  /**
   * Get the current relative velocity in the contact point.
   * @method getImpactVelocityAlongNormal
   * @return {number}
   */
  getImpactVelocityAlongNormal() {
    const vi = ContactEquation_getImpactVelocityAlongNormal_vi
    const vj = ContactEquation_getImpactVelocityAlongNormal_vj
    const xi = ContactEquation_getImpactVelocityAlongNormal_xi
    const xj = ContactEquation_getImpactVelocityAlongNormal_xj
    const relVel = ContactEquation_getImpactVelocityAlongNormal_relVel

    this.bi.position.vadd(this.ri, xi)
    this.bj.position.vadd(this.rj, xj)

    this.bi.getVelocityAtWorldPoint(xi, vi)
    this.bj.getVelocityAtWorldPoint(xj, vj)

    vi.vsub(vj, relVel)

    return this.ni.dot(relVel)
  }
}

const ContactEquation_computeB_temp1 = new Vec3() // Temp vectors
const ContactEquation_computeB_temp2 = new Vec3()
const ContactEquation_computeB_temp3 = new Vec3()

const ContactEquation_getImpactVelocityAlongNormal_vi = new Vec3()
const ContactEquation_getImpactVelocityAlongNormal_vj = new Vec3()
const ContactEquation_getImpactVelocityAlongNormal_xi = new Vec3()
const ContactEquation_getImpactVelocityAlongNormal_xj = new Vec3()
const ContactEquation_getImpactVelocityAlongNormal_relVel = new Vec3()
