import { PointToPointConstraint } from './PointToPointConstraint'
import { ConeEquation } from '../equations/ConeEquation'
import { RotationalEquation } from '../equations/RotationalEquation'
import { Vec3 } from '../math/Vec3'

/**
 * @class ConeTwistConstraint
 * @constructor
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {object} [options]
 * @param {Vec3} [options.pivotA]
 * @param {Vec3} [options.pivotB]
 * @param {Vec3} [options.axisA]
 * @param {Vec3} [options.axisB]
 * @param {Number} [options.maxForce=1e6]
 * @extends PointToPointConstraint
 */
export class ConeTwistConstraint extends PointToPointConstraint {
  constructor(bodyA, bodyB, options = {}) {
    super()

    const maxForce = typeof options.maxForce !== 'undefined' ? options.maxForce : 1e6

    // Set pivot point in between
    const pivotA = options.pivotA ? options.pivotA.clone() : new Vec3()
    const pivotB = options.pivotB ? options.pivotB.clone() : new Vec3()
    this.axisA = options.axisA ? options.axisA.clone() : new Vec3()
    this.axisB = options.axisB ? options.axisB.clone() : new Vec3()

    super(bodyA, pivotA, bodyB, pivotB, maxForce)

    this.collideConnected = !!options.collideConnected

    this.angle = typeof options.angle !== 'undefined' ? options.angle : 0

    /**
     * @property {ConeEquation} coneEquation
     */
    const c = (this.coneEquation = new ConeEquation(bodyA, bodyB, options))

    /**
     * @property {RotationalEquation} twistEquation
     */
    const t = (this.twistEquation = new RotationalEquation(bodyA, bodyB, options))
    this.twistAngle = typeof options.twistAngle !== 'undefined' ? options.twistAngle : 0

    // Make the cone equation push the bodies toward the cone axis, not outward
    c.maxForce = 0
    c.minForce = -maxForce

    // Make the twist equation add torque toward the initial position
    t.maxForce = 0
    t.minForce = -maxForce

    this.equations.push(c, t)
  }

  update() {
    const bodyA = this.bodyA
    const bodyB = this.bodyB
    const cone = this.coneEquation
    const twist = this.twistEquation

    super.update()

    // Update the axes to the cone constraint
    bodyA.vectorToWorldFrame(this.axisA, cone.axisA)
    bodyB.vectorToWorldFrame(this.axisB, cone.axisB)

    // Update the world axes in the twist constraint
    this.axisA.tangents(twist.axisA, twist.axisA)
    bodyA.vectorToWorldFrame(twist.axisA, twist.axisA)

    this.axisB.tangents(twist.axisB, twist.axisB)
    bodyB.vectorToWorldFrame(twist.axisB, twist.axisB)

    cone.angle = this.angle
    twist.maxAngle = this.twistAngle
  }
}

const ConeTwistConstraint_update_tmpVec1 = new Vec3()
const ConeTwistConstraint_update_tmpVec2 = new Vec3()
