import { Vec3 } from '../math/Vec3'
import { Equation } from './Equation'

/**
 * Rotational constraint. Works to keep the local vectors orthogonal to each other in world space.
 * @class RotationalEquation
 * @constructor
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {Vec3} [options.axisA]
 * @param {Vec3} [options.axisB]
 * @param {number} [options.maxForce]
 * @extends Equation
 */
export class RotationalEquation extends Equation {
  constructor(bodyA, bodyB, options = {}) {
    const maxForce = typeof options.maxForce !== 'undefined' ? options.maxForce : 1e6

    super(bodyA, bodyB, -maxForce, maxForce)

    this.axisA = options.axisA ? options.axisA.clone() : new Vec3(1, 0, 0)
    this.axisB = options.axisB ? options.axisB.clone() : new Vec3(0, 1, 0)

    this.maxAngle = Math.PI / 2
  }

  computeB(h) {
    const a = this.a
    const b = this.b
    const ni = this.axisA
    const nj = this.axisB
    const nixnj = tmpVec1
    const njxni = tmpVec2
    const GA = this.jacobianElementA
    const GB = this.jacobianElementB

    // Caluclate cross products
    ni.cross(nj, nixnj)
    nj.cross(ni, njxni)

    // g = ni * nj
    // gdot = (nj x ni) * wi + (ni x nj) * wj
    // G = [0 njxni 0 nixnj]
    // W = [vi wi vj wj]
    GA.rotational.copy(njxni)
    GB.rotational.copy(nixnj)

    const g = Math.cos(this.maxAngle) - ni.dot(nj)
    const GW = this.computeGW()
    const GiMf = this.computeGiMf()

    const B = -g * a - GW * b - h * GiMf

    return B
  }
}

const tmpVec1 = new Vec3()
const tmpVec2 = new Vec3()
