import { Body } from './Body'
import { Sphere } from '../shapes/Sphere'
import { Box } from '../shapes/Box'
import { Vec3 } from '../math/Vec3'
import { HingeConstraint } from '../constraints/HingeConstraint'

/**
 * Simple vehicle helper class with spherical rigid body wheels.
 * @class RigidVehicle
 * @constructor
 * @param {Body} [options.chassisBody]
 */
export class RigidVehicle {
  constructor({ coordinateSystem, chassisBody }) {
    this.wheelBodies = []

    /**
     * @property coordinateSystem
     * @type {Vec3}
     */
    this.coordinateSystem = typeof coordinateSystem === 'undefined' ? new Vec3(1, 2, 3) : coordinateSystem.clone()

    /**
     * @property {Body} chassisBody
     */
    this.chassisBody = chassisBody

    if (!this.chassisBody) {
      // No chassis body given. Create it!
      const chassisShape = new Box(new Vec3(5, 2, 0.5))
      this.chassisBody = new Body(1, chassisShape)
    }

    /**
     * @property constraints
     * @type {Array}
     */
    this.constraints = []

    this.wheelAxes = []
    this.wheelForces = []
  }

  /**
   * Add a wheel
   * @method addWheel
   * @param {object} options
   * @param {boolean} [options.isFrontWheel]
   * @param {Vec3} [options.position] Position of the wheel, locally in the chassis body.
   * @param {Vec3} [options.direction] Slide direction of the wheel along the suspension.
   * @param {Vec3} [options.axis] Axis of rotation of the wheel, locally defined in the chassis.
   * @param {Body} [options.body] The wheel body.
   */
  addWheel(options = {}) {
    let wheelBody = options.body
    if (!wheelBody) {
      wheelBody = new Body(1, new Sphere(1.2))
    }
    this.wheelBodies.push(wheelBody)
    this.wheelForces.push(0)

    // Position constrain wheels
    const zero = new Vec3()
    const position = typeof options.position !== 'undefined' ? options.position.clone() : new Vec3()

    // Set position locally to the chassis
    const worldPosition = new Vec3()
    this.chassisBody.pointToWorldFrame(position, worldPosition)
    wheelBody.position.set(worldPosition.x, worldPosition.y, worldPosition.z)

    // Constrain wheel
    const axis = typeof options.axis !== 'undefined' ? options.axis.clone() : new Vec3(0, 1, 0)
    this.wheelAxes.push(axis)

    const hingeConstraint = new HingeConstraint(this.chassisBody, wheelBody, {
      pivotA: position,
      axisA: axis,
      pivotB: Vec3.ZERO,
      axisB: axis,
      collideConnected: false,
    })
    this.constraints.push(hingeConstraint)

    return this.wheelBodies.length - 1
  }

  /**
   * Set the steering value of a wheel.
   * @method setSteeringValue
   * @param {number} value
   * @param {integer} wheelIndex
   * @todo check coordinateSystem
   */
  setSteeringValue(value, wheelIndex) {
    // Set angle of the hinge axis
    const axis = this.wheelAxes[wheelIndex]

    const c = Math.cos(value)
    const s = Math.sin(value)
    const x = axis.x
    const y = axis.y
    this.constraints[wheelIndex].axisA.set(c * x - s * y, s * x + c * y, 0)
  }

  /**
   * Set the target rotational speed of the hinge constraint.
   * @method setMotorSpeed
   * @param {number} value
   * @param {integer} wheelIndex
   */
  setMotorSpeed(value, wheelIndex) {
    const hingeConstraint = this.constraints[wheelIndex]
    hingeConstraint.enableMotor()
    hingeConstraint.motorTargetVelocity = value
  }

  /**
   * Set the target rotational speed of the hinge constraint.
   * @method disableMotor
   * @param {number} value
   * @param {integer} wheelIndex
   */
  disableMotor(wheelIndex) {
    const hingeConstraint = this.constraints[wheelIndex]
    hingeConstraint.disableMotor()
  }

  /**
   * Set the wheel force to apply on one of the wheels each time step
   * @method setWheelForce
   * @param  {number} value
   * @param  {integer} wheelIndex
   */
  setWheelForce(value, wheelIndex) {
    this.wheelForces[wheelIndex] = value
  }

  /**
   * Apply a torque on one of the wheels.
   * @method applyWheelForce
   * @param  {number} value
   * @param  {integer} wheelIndex
   */
  applyWheelForce(value, wheelIndex) {
    const axis = this.wheelAxes[wheelIndex]
    const wheelBody = this.wheelBodies[wheelIndex]
    const bodyTorque = wheelBody.torque

    axis.scale(value, torque)
    wheelBody.vectorToWorldFrame(torque, torque)
    bodyTorque.vadd(torque, bodyTorque)
  }

  /**
   * Add the vehicle including its constraints to the world.
   * @method addToWorld
   * @param {World} world
   */
  addToWorld(world) {
    const constraints = this.constraints
    const bodies = this.wheelBodies.concat([this.chassisBody])

    for (var i = 0; i < bodies.length; i++) {
      world.addBody(bodies[i])
    }

    for (var i = 0; i < constraints.length; i++) {
      world.addConstraint(constraints[i])
    }

    world.addEventListener('preStep', this._update.bind(this))
  }

  _update() {
    const wheelForces = this.wheelForces
    for (let i = 0; i < wheelForces.length; i++) {
      this.applyWheelForce(wheelForces[i], i)
    }
  }

  /**
   * Remove the vehicle including its constraints from the world.
   * @method removeFromWorld
   * @param {World} world
   */
  removeFromWorld(world) {
    const constraints = this.constraints
    const bodies = this.wheelBodies.concat([this.chassisBody])

    for (var i = 0; i < bodies.length; i++) {
      world.remove(bodies[i])
    }

    for (var i = 0; i < constraints.length; i++) {
      world.removeConstraint(constraints[i])
    }
  }

  /**
   * Get current rotational velocity of a wheel
   * @method getWheelSpeed
   * @param {integer} wheelIndex
   */
  getWheelSpeed(wheelIndex) {
    const axis = this.wheelAxes[wheelIndex]
    const wheelBody = this.wheelBodies[wheelIndex]
    const w = wheelBody.angularVelocity
    this.chassisBody.vectorToWorldFrame(axis, worldAxis)
    return w.dot(worldAxis)
  }
}

const torque = new Vec3()

const worldAxis = new Vec3()
