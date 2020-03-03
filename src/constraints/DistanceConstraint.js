import { Constraint } from './Constraint'
import { ContactEquation } from '../equations/ContactEquation'

/**
 * Constrains two bodies to be at a constant distance from each others center of mass.
 * @class DistanceConstraint
 * @constructor
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {Number} [distance] The distance to keep. If undefined, it will be set to the current distance between bodyA and bodyB
 * @param {Number} [maxForce=1e6]
 * @extends Constraint
 */
export class DistanceConstraint extends Constraint {
  constructor(bodyA, bodyB, distance, maxForce) {
    super(bodyA, bodyB)

    if (typeof distance === 'undefined') {
      distance = bodyA.position.distanceTo(bodyB.position)
    }

    if (typeof maxForce === 'undefined') {
      maxForce = 1e6
    }

    /**
     * @property {number} distance
     */
    this.distance = distance

    /**
     * @property {ContactEquation} distanceEquation
     */
    const eq = (this.distanceEquation = new ContactEquation(bodyA, bodyB))
    this.equations.push(eq)

    // Make it bidirectional
    eq.minForce = -maxForce
    eq.maxForce = maxForce
  }

  update() {
    const bodyA = this.bodyA
    const bodyB = this.bodyB
    const eq = this.distanceEquation
    const halfDist = this.distance * 0.5
    const normal = eq.ni

    bodyB.position.vsub(bodyA.position, normal)
    normal.normalize()
    normal.mult(halfDist, eq.ri)
    normal.mult(-halfDist, eq.rj)
  }
}
