import { PointToPointConstraint } from './PointToPointConstraint'
import { RotationalEquation } from '../equations/RotationalEquation'
import { RotationalMotorEquation } from '../equations/RotationalMotorEquation'
import { Vec3 } from '../math/Vec3'

/**
 * Hinge constraint. Think of it as a door hinge. It tries to keep the door in the correct place and with the correct orientation.
 * @class HingeConstraint
 * @constructor
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {object} [options]
 * @param {Vec3} [options.pivotA] A point defined locally in bodyA. This defines the offset of axisA.
 * @param {Vec3} [options.axisA] An axis that bodyA can rotate around, defined locally in bodyA.
 * @param {Vec3} [options.pivotB]
 * @param {Vec3} [options.axisB]
 * @param {Number} [options.maxForce=1e6]
 * @extends PointToPointConstraint
 */
export class HingeConstraint extends PointToPointConstraint {
  constructor(bodyA, bodyB, options = {}) {
    const maxForce = typeof options.maxForce !== 'undefined' ? options.maxForce : 1e6
    const pivotA = options.pivotA ? options.pivotA.clone() : new Vec3()
    const pivotB = options.pivotB ? options.pivotB.clone() : new Vec3()

    super(bodyA, pivotA, bodyB, pivotB, maxForce)

    /**
     * Rotation axis, defined locally in bodyA.
     * @property {Vec3} axisA
     */
    const axisA = (this.axisA = options.axisA ? options.axisA.clone() : new Vec3(1, 0, 0))
    axisA.normalize()

    /**
     * Rotation axis, defined locally in bodyB.
     * @property {Vec3} axisB
     */
    const axisB = (this.axisB = options.axisB ? options.axisB.clone() : new Vec3(1, 0, 0))
    axisB.normalize()

    /**
     * @property {RotationalEquation} rotationalEquation1
     */
    const r1 = (this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, options))

    /**
     * @property {RotationalEquation} rotationalEquation2
     */
    const r2 = (this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, options))

    /**
     * @property {RotationalMotorEquation} motorEquation
     */
    const motor = (this.motorEquation = new RotationalMotorEquation(bodyA, bodyB, maxForce))
    motor.enabled = false // Not enabled by default

    // Equations to be fed to the solver
    this.equations.push(
      r1, // rotational1
      r2, // rotational2
      motor
    )
  }

  /**
   * @method enableMotor
   */
  enableMotor() {
    this.motorEquation.enabled = true
  }

  /**
   * @method disableMotor
   */
  disableMotor() {
    this.motorEquation.enabled = false
  }

  /**
   * @method setMotorSpeed
   * @param {number} speed
   */
  setMotorSpeed(speed) {
    this.motorEquation.targetVelocity = speed
  }

  /**
   * @method setMotorMaxForce
   * @param {number} maxForce
   */
  setMotorMaxForce(maxForce) {
    this.motorEquation.maxForce = maxForce
    this.motorEquation.minForce = -maxForce
  }

  update() {
    const bodyA = this.bodyA
    const bodyB = this.bodyB
    const motor = this.motorEquation
    const r1 = this.rotationalEquation1
    const r2 = this.rotationalEquation2
    const worldAxisA = HingeConstraint_update_tmpVec1
    const worldAxisB = HingeConstraint_update_tmpVec2

    const axisA = this.axisA
    const axisB = this.axisB

    super.update()

    // Get world axes
    bodyA.quaternion.vmult(axisA, worldAxisA)
    bodyB.quaternion.vmult(axisB, worldAxisB)

    worldAxisA.tangents(r1.axisA, r2.axisA)
    r1.axisB.copy(worldAxisB)
    r2.axisB.copy(worldAxisB)

    if (this.motorEquation.enabled) {
      bodyA.quaternion.vmult(this.axisA, motor.axisA)
      bodyB.quaternion.vmult(this.axisB, motor.axisB)
    }
  }
}

const HingeConstraint_update_tmpVec1 = new Vec3()
const HingeConstraint_update_tmpVec2 = new Vec3()
