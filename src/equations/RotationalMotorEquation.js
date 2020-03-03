import { Vec3 } from '../math/Vec3'
import { Equation } from './Equation'

/**
 * Rotational motor constraint. Tries to keep the relative angular velocity of the bodies to a given value.
 * @class RotationalMotorEquation
 * @constructor
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {Number} maxForce
 * @extends Equation
 */
export class RotationalMotorEquation extends Equation {
  constructor(bodyA, bodyB, maxForce = 1e6) {
    super(bodyA, bodyB, -maxForce, maxForce)

    /**
     * World oriented rotational axis
     * @property {Vec3} axisA
     */
    this.axisA = new Vec3()

    /**
     * World oriented rotational axis
     * @property {Vec3} axisB
     */
    this.axisB = new Vec3() // World oriented rotational axis

    /**
     * Motor velocity
     * @property {Number} targetVelocity
     */
    this.targetVelocity = 0
  }

  computeB(h) {
    const a = this.a
    const b = this.b
    const bi = this.bi
    const bj = this.bj
    const axisA = this.axisA
    const axisB = this.axisB
    const GA = this.jacobianElementA
    const GB = this.jacobianElementB

    // g = 0
    // gdot = axisA * wi - axisB * wj
    // gdot = G * W = G * [vi wi vj wj]
    // =>
    // G = [0 axisA 0 -axisB]

    GA.rotational.copy(axisA)
    axisB.negate(GB.rotational)

    const GW = this.computeGW() - this.targetVelocity
    const GiMf = this.computeGiMf()

    const B = -GW * b - h * GiMf

    return B
  }
}
