import { PointToPointConstraint } from './PointToPointConstraint'
import { RotationalEquation } from '../equations/RotationalEquation'
import { Vec3 } from '../math/Vec3'

/**
 * Lock constraint. Will remove all degrees of freedom between the bodies.
 * @class LockConstraint
 * @constructor
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {object} [options]
 * @param {Number} [options.maxForce=1e6]
 * @extends PointToPointConstraint
 */
export class LockConstraint extends PointToPointConstraint {
  constructor(bodyA, bodyB, options = {}) {
    const maxForce = typeof options.maxForce !== 'undefined' ? options.maxForce : 1e6

    // Set pivot point in between
    const pivotA = new Vec3()
    const pivotB = new Vec3()
    const halfWay = new Vec3()
    bodyA.position.vadd(bodyB.position, halfWay)
    halfWay.scale(0.5, halfWay)
    bodyB.pointToLocalFrame(halfWay, pivotB)
    bodyA.pointToLocalFrame(halfWay, pivotA)

    // The point-to-point constraint will keep a point shared between the bodies
    super(bodyA, pivotA, bodyB, pivotB, maxForce)

    // Store initial rotation of the bodies as unit vectors in the local body spaces
    this.xA = bodyA.vectorToLocalFrame(Vec3.UNIT_X)
    this.xB = bodyB.vectorToLocalFrame(Vec3.UNIT_X)
    this.yA = bodyA.vectorToLocalFrame(Vec3.UNIT_Y)
    this.yB = bodyB.vectorToLocalFrame(Vec3.UNIT_Y)
    this.zA = bodyA.vectorToLocalFrame(Vec3.UNIT_Z)
    this.zB = bodyB.vectorToLocalFrame(Vec3.UNIT_Z)

    // ...and the following rotational equations will keep all rotational DOF's in place

    /**
     * @property {RotationalEquation} rotationalEquation1
     */
    const r1 = (this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, options))

    /**
     * @property {RotationalEquation} rotationalEquation2
     */
    const r2 = (this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, options))

    /**
     * @property {RotationalEquation} rotationalEquation3
     */
    const r3 = (this.rotationalEquation3 = new RotationalEquation(bodyA, bodyB, options))

    this.equations.push(r1, r2, r3)
  }

  update() {
    const bodyA = this.bodyA
    const bodyB = this.bodyB
    const motor = this.motorEquation
    const r1 = this.rotationalEquation1
    const r2 = this.rotationalEquation2
    const r3 = this.rotationalEquation3
    const worldAxisA = LockConstraint_update_tmpVec1
    const worldAxisB = LockConstraint_update_tmpVec2

    super.update()

    // These vector pairs must be orthogonal
    bodyA.vectorToWorldFrame(this.xA, r1.axisA)
    bodyB.vectorToWorldFrame(this.yB, r1.axisB)

    bodyA.vectorToWorldFrame(this.yA, r2.axisA)
    bodyB.vectorToWorldFrame(this.zB, r2.axisB)

    bodyA.vectorToWorldFrame(this.zA, r3.axisA)
    bodyB.vectorToWorldFrame(this.xB, r3.axisB)
  }
}

const LockConstraint_update_tmpVec1 = new Vec3()
const LockConstraint_update_tmpVec2 = new Vec3()
