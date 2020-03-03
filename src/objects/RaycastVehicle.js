import { Body } from './Body'
import { Vec3 } from '../math/Vec3'
import { Quaternion } from '../math/Quaternion'
import { Ray } from '../collision/Ray'
import { WheelInfo } from '../objects/WheelInfo'

/**
 * Vehicle helper class that casts rays from the wheel positions towards the ground and applies forces.
 * @class RaycastVehicle
 * @constructor
 * @param {object} [options]
 * @param {Body} [options.chassisBody] The car chassis body.
 * @param {integer} [options.indexRightAxis] Axis to use for right. x=0, y=1, z=2
 * @param {integer} [options.indexLeftAxis]
 * @param {integer} [options.indexUpAxis]
 */
export class RaycastVehicle {
  constructor({ chassisBody, indexRightAxis, indexForwardAxis, indexUpAxis }) {

    /**
     * @property {Body} chassisBody
     */
    this.chassisBody = chassisBody

    /**
     * An array of WheelInfo objects.
     * @property {array} wheelInfos
     */
    this.wheelInfos = []

    /**
     * Will be set to true if the car is sliding.
     * @property {boolean} sliding
     */
    this.sliding = false

    /**
     * @property {World} world
     */
    this.world = null

    /**
     * Index of the right axis, 0=x, 1=y, 2=z
     * @property {integer} indexRightAxis
     * @default 1
     */
    this.indexRightAxis = typeof indexRightAxis !== 'undefined' ? indexRightAxis : 1

    /**
     * Index of the forward axis, 0=x, 1=y, 2=z
     * @property {integer} indexForwardAxis
     * @default 0
     */
    this.indexForwardAxis = typeof indexForwardAxis !== 'undefined' ? indexForwardAxis : 0

    /**
     * Index of the up axis, 0=x, 1=y, 2=z
     * @property {integer} indexUpAxis
     * @default 2
     */
    this.indexUpAxis = typeof indexUpAxis !== 'undefined' ? indexUpAxis : 2
  }

  /**
   * Add a wheel. For information about the options, see WheelInfo.
   * @method addWheel
   * @param {object} [options]
   */
  addWheel(options = {}) {
    const info = new WheelInfo(options)
    const index = this.wheelInfos.length
    this.wheelInfos.push(info)

    return index
  }

  /**
   * Set the steering value of a wheel.
   * @method setSteeringValue
   * @param {number} value
   * @param {integer} wheelIndex
   */
  setSteeringValue(value, wheelIndex) {
    const wheel = this.wheelInfos[wheelIndex]
    wheel.steering = value
  }

  /**
   * Set the wheel force to apply on one of the wheels each time step
   * @method applyEngineForce
   * @param  {number} value
   * @param  {integer} wheelIndex
   */
  applyEngineForce(value, wheelIndex) {
    this.wheelInfos[wheelIndex].engineForce = value
  }

  /**
   * Set the braking force of a wheel
   * @method setBrake
   * @param {number} brake
   * @param {integer} wheelIndex
   */
  setBrake(brake, wheelIndex) {
    this.wheelInfos[wheelIndex].brake = brake
  }

  /**
   * Add the vehicle including its constraints to the world.
   * @method addToWorld
   * @param {World} world
   */
  addToWorld(world) {
    const constraints = this.constraints
    world.addBody(this.chassisBody)
    const that = this
    this.preStepCallback = () => {
      that.updateVehicle(world.dt)
    }
    world.addEventListener('preStep', this.preStepCallback)
    this.world = world
  }

  /**
   * Get one of the wheel axles, world-oriented.
   * @private
   * @method getVehicleAxisWorld
   * @param  {integer} axisIndex
   * @param  {Vec3} result
   */
  getVehicleAxisWorld(axisIndex, result) {
    result.set(axisIndex === 0 ? 1 : 0, axisIndex === 1 ? 1 : 0, axisIndex === 2 ? 1 : 0)
    this.chassisBody.vectorToWorldFrame(result, result)
  }

  updateVehicle(timeStep) {
    const wheelInfos = this.wheelInfos
    const numWheels = wheelInfos.length
    const chassisBody = this.chassisBody

    for (var i = 0; i < numWheels; i++) {
      this.updateWheelTransform(i)
    }

    this.currentVehicleSpeedKmHour = 3.6 * chassisBody.velocity.norm()

    const forwardWorld = new Vec3()
    this.getVehicleAxisWorld(this.indexForwardAxis, forwardWorld)

    if (forwardWorld.dot(chassisBody.velocity) < 0) {
      this.currentVehicleSpeedKmHour *= -1
    }

    // simulate suspension
    for (var i = 0; i < numWheels; i++) {
      this.castRay(wheelInfos[i])
    }

    this.updateSuspension(timeStep)

    const impulse = new Vec3()
    const relpos = new Vec3()
    for (var i = 0; i < numWheels; i++) {
      //apply suspension force
      var wheel = wheelInfos[i]
      let suspensionForce = wheel.suspensionForce
      if (suspensionForce > wheel.maxSuspensionForce) {
        suspensionForce = wheel.maxSuspensionForce
      }
      wheel.raycastResult.hitNormalWorld.scale(suspensionForce * timeStep, impulse)

      wheel.raycastResult.hitPointWorld.vsub(chassisBody.position, relpos)
      chassisBody.applyImpulse(impulse, relpos)
    }

    this.updateFriction(timeStep)

    const hitNormalWorldScaledWithProj = new Vec3()
    const fwd = new Vec3()
    const vel = new Vec3()
    for (i = 0; i < numWheels; i++) {
      var wheel = wheelInfos[i]
      //var relpos = new Vec3();
      //wheel.chassisConnectionPointWorld.vsub(chassisBody.position, relpos);
      chassisBody.getVelocityAtWorldPoint(wheel.chassisConnectionPointWorld, vel)

      // Hack to get the rotation in the correct direction
      let m = 1
      switch (this.indexUpAxis) {
        case 1:
          m = -1
          break
      }

      if (wheel.isInContact) {
        this.getVehicleAxisWorld(this.indexForwardAxis, fwd)
        const proj = fwd.dot(wheel.raycastResult.hitNormalWorld)
        wheel.raycastResult.hitNormalWorld.scale(proj, hitNormalWorldScaledWithProj)

        fwd.vsub(hitNormalWorldScaledWithProj, fwd)

        const proj2 = fwd.dot(vel)
        wheel.deltaRotation = (m * proj2 * timeStep) / wheel.radius
      }

      if ((wheel.sliding || !wheel.isInContact) && wheel.engineForce !== 0 && wheel.useCustomSlidingRotationalSpeed) {
        // Apply custom rotation when accelerating and sliding
        wheel.deltaRotation = (wheel.engineForce > 0 ? 1 : -1) * wheel.customSlidingRotationalSpeed * timeStep
      }

      // Lock wheels
      if (Math.abs(wheel.brake) > Math.abs(wheel.engineForce)) {
        wheel.deltaRotation = 0
      }

      wheel.rotation += wheel.deltaRotation // Use the old value
      wheel.deltaRotation *= 0.99 // damping of rotation when not in contact
    }
  }

  updateSuspension(deltaTime) {
    const chassisBody = this.chassisBody
    const chassisMass = chassisBody.mass
    const wheelInfos = this.wheelInfos
    const numWheels = wheelInfos.length

    for (let w_it = 0; w_it < numWheels; w_it++) {
      const wheel = wheelInfos[w_it]

      if (wheel.isInContact) {
        let force

        // Spring
        const susp_length = wheel.suspensionRestLength
        const current_length = wheel.suspensionLength
        const length_diff = susp_length - current_length

        force = wheel.suspensionStiffness * length_diff * wheel.clippedInvContactDotSuspension

        // Damper
        const projected_rel_vel = wheel.suspensionRelativeVelocity
        let susp_damping
        if (projected_rel_vel < 0) {
          susp_damping = wheel.dampingCompression
        } else {
          susp_damping = wheel.dampingRelaxation
        }
        force -= susp_damping * projected_rel_vel

        wheel.suspensionForce = force * chassisMass
        if (wheel.suspensionForce < 0) {
          wheel.suspensionForce = 0
        }
      } else {
        wheel.suspensionForce = 0
      }
    }
  }

  /**
   * Remove the vehicle including its constraints from the world.
   * @method removeFromWorld
   * @param {World} world
   */
  removeFromWorld(world) {
    const constraints = this.constraints
    world.remove(this.chassisBody)
    world.removeEventListener('preStep', this.preStepCallback)
    this.world = null
  }

  castRay(wheel) {
    const rayvector = castRay_rayvector
    const target = castRay_target

    this.updateWheelTransformWorld(wheel)
    const chassisBody = this.chassisBody

    let depth = -1

    const raylen = wheel.suspensionRestLength + wheel.radius

    wheel.directionWorld.scale(raylen, rayvector)
    const source = wheel.chassisConnectionPointWorld
    source.vadd(rayvector, target)
    const raycastResult = wheel.raycastResult

    const param = 0

    raycastResult.reset()
    // Turn off ray collision with the chassis temporarily
    const oldState = chassisBody.collisionResponse
    chassisBody.collisionResponse = false

    // Cast ray against world
    this.world.rayTest(source, target, raycastResult)
    chassisBody.collisionResponse = oldState

    const object = raycastResult.body

    wheel.raycastResult.groundObject = 0

    if (object) {
      depth = raycastResult.distance
      wheel.raycastResult.hitNormalWorld = raycastResult.hitNormalWorld
      wheel.isInContact = true

      const hitDistance = raycastResult.distance
      wheel.suspensionLength = hitDistance - wheel.radius

      // clamp on max suspension travel
      const minSuspensionLength = wheel.suspensionRestLength - wheel.maxSuspensionTravel
      const maxSuspensionLength = wheel.suspensionRestLength + wheel.maxSuspensionTravel
      if (wheel.suspensionLength < minSuspensionLength) {
        wheel.suspensionLength = minSuspensionLength
      }
      if (wheel.suspensionLength > maxSuspensionLength) {
        wheel.suspensionLength = maxSuspensionLength
        wheel.raycastResult.reset()
      }

      const denominator = wheel.raycastResult.hitNormalWorld.dot(wheel.directionWorld)

      const chassis_velocity_at_contactPoint = new Vec3()
      chassisBody.getVelocityAtWorldPoint(wheel.raycastResult.hitPointWorld, chassis_velocity_at_contactPoint)

      const projVel = wheel.raycastResult.hitNormalWorld.dot(chassis_velocity_at_contactPoint)

      if (denominator >= -0.1) {
        wheel.suspensionRelativeVelocity = 0
        wheel.clippedInvContactDotSuspension = 1 / 0.1
      } else {
        const inv = -1 / denominator
        wheel.suspensionRelativeVelocity = projVel * inv
        wheel.clippedInvContactDotSuspension = inv
      }
    } else {
      //put wheel info as in rest position
      wheel.suspensionLength = wheel.suspensionRestLength + 0 * wheel.maxSuspensionTravel
      wheel.suspensionRelativeVelocity = 0.0
      wheel.directionWorld.scale(-1, wheel.raycastResult.hitNormalWorld)
      wheel.clippedInvContactDotSuspension = 1.0
    }

    return depth
  }

  updateWheelTransformWorld(wheel) {
    wheel.isInContact = false
    const chassisBody = this.chassisBody
    chassisBody.pointToWorldFrame(wheel.chassisConnectionPointLocal, wheel.chassisConnectionPointWorld)
    chassisBody.vectorToWorldFrame(wheel.directionLocal, wheel.directionWorld)
    chassisBody.vectorToWorldFrame(wheel.axleLocal, wheel.axleWorld)
  }

  /**
   * Update one of the wheel transform.
   * Note when rendering wheels: during each step, wheel transforms are updated BEFORE the chassis; ie. their position becomes invalid after the step. Thus when you render wheels, you must update wheel transforms before rendering them. See raycastVehicle demo for an example.
   * @method updateWheelTransform
   * @param {integer} wheelIndex The wheel index to update.
   */
  updateWheelTransform(wheelIndex) {
    const up = tmpVec4
    const right = tmpVec5
    const fwd = tmpVec6

    const wheel = this.wheelInfos[wheelIndex]
    this.updateWheelTransformWorld(wheel)

    wheel.directionLocal.scale(-1, up)
    right.copy(wheel.axleLocal)
    up.cross(right, fwd)
    fwd.normalize()
    right.normalize()

    // Rotate around steering over the wheelAxle
    const steering = wheel.steering
    const steeringOrn = new Quaternion()
    steeringOrn.setFromAxisAngle(up, steering)

    const rotatingOrn = new Quaternion()
    rotatingOrn.setFromAxisAngle(right, wheel.rotation)

    // World rotation of the wheel
    const q = wheel.worldTransform.quaternion
    this.chassisBody.quaternion.mult(steeringOrn, q)
    q.mult(rotatingOrn, q)

    q.normalize()

    // world position of the wheel
    const p = wheel.worldTransform.position
    p.copy(wheel.directionWorld)
    p.scale(wheel.suspensionLength, p)
    p.vadd(wheel.chassisConnectionPointWorld, p)
  }

  /**
   * Get the world transform of one of the wheels
   * @method getWheelTransformWorld
   * @param  {integer} wheelIndex
   * @return {Transform}
   */
  getWheelTransformWorld(wheelIndex) {
    return this.wheelInfos[wheelIndex].worldTransform
  }

  updateFriction(timeStep) {
    const surfNormalWS_scaled_proj = updateFriction_surfNormalWS_scaled_proj

    //calculate the impulse, so that the wheels don't move sidewards
    const wheelInfos = this.wheelInfos
    const numWheels = wheelInfos.length
    const chassisBody = this.chassisBody
    const forwardWS = updateFriction_forwardWS
    const axle = updateFriction_axle

    let numWheelsOnGround = 0

    for (var i = 0; i < numWheels; i++) {
      var wheel = wheelInfos[i]

      var groundObject = wheel.raycastResult.body
      if (groundObject) {
        numWheelsOnGround++
      }

      wheel.sideImpulse = 0
      wheel.forwardImpulse = 0
      if (!forwardWS[i]) {
        forwardWS[i] = new Vec3()
      }
      if (!axle[i]) {
        axle[i] = new Vec3()
      }
    }

    for (var i = 0; i < numWheels; i++) {
      var wheel = wheelInfos[i]

      var groundObject = wheel.raycastResult.body

      if (groundObject) {
        const axlei = axle[i]
        const wheelTrans = this.getWheelTransformWorld(i)

        // Get world axle
        wheelTrans.vectorToWorldFrame(directions[this.indexRightAxis], axlei)

        const surfNormalWS = wheel.raycastResult.hitNormalWorld
        const proj = axlei.dot(surfNormalWS)
        surfNormalWS.scale(proj, surfNormalWS_scaled_proj)
        axlei.vsub(surfNormalWS_scaled_proj, axlei)
        axlei.normalize()

        surfNormalWS.cross(axlei, forwardWS[i])
        forwardWS[i].normalize()

        wheel.sideImpulse = resolveSingleBilateral(
          chassisBody,
          wheel.raycastResult.hitPointWorld,
          groundObject,
          wheel.raycastResult.hitPointWorld,
          axlei
        )

        wheel.sideImpulse *= sideFrictionStiffness2
      }
    }

    const sideFactor = 1
    const fwdFactor = 0.5

    this.sliding = false
    for (var i = 0; i < numWheels; i++) {
      var wheel = wheelInfos[i]
      var groundObject = wheel.raycastResult.body

      let rollingFriction = 0

      wheel.slipInfo = 1
      if (groundObject) {
        const defaultRollingFrictionImpulse = 0
        const maxImpulse = wheel.brake ? wheel.brake : defaultRollingFrictionImpulse

        // btWheelContactPoint contactPt(chassisBody,groundObject,wheelInfraycastInfo.hitPointWorld,forwardWS[wheel],maxImpulse);
        // rollingFriction = calcRollingFriction(contactPt);
        rollingFriction = calcRollingFriction(
          chassisBody,
          groundObject,
          wheel.raycastResult.hitPointWorld,
          forwardWS[i],
          maxImpulse
        )

        rollingFriction += wheel.engineForce * timeStep

        // rollingFriction = 0;
        var factor = maxImpulse / rollingFriction
        wheel.slipInfo *= factor
      }

      //switch between active rolling (throttle), braking and non-active rolling friction (nthrottle/break)

      wheel.forwardImpulse = 0
      wheel.skidInfo = 1

      if (groundObject) {
        wheel.skidInfo = 1

        const maximp = wheel.suspensionForce * timeStep * wheel.frictionSlip
        const maximpSide = maximp

        const maximpSquared = maximp * maximpSide

        wheel.forwardImpulse = rollingFriction //wheelInfo.engineForce* timeStep;

        const x = wheel.forwardImpulse * fwdFactor
        const y = wheel.sideImpulse * sideFactor

        const impulseSquared = x * x + y * y

        wheel.sliding = false
        if (impulseSquared > maximpSquared) {
          this.sliding = true
          wheel.sliding = true

          var factor = maximp / Math.sqrt(impulseSquared)

          wheel.skidInfo *= factor
        }
      }
    }

    if (this.sliding) {
      for (var i = 0; i < numWheels; i++) {
        var wheel = wheelInfos[i]
        if (wheel.sideImpulse !== 0) {
          if (wheel.skidInfo < 1) {
            wheel.forwardImpulse *= wheel.skidInfo
            wheel.sideImpulse *= wheel.skidInfo
          }
        }
      }
    }

    // apply the impulses
    for (var i = 0; i < numWheels; i++) {
      var wheel = wheelInfos[i]

      const rel_pos = new Vec3()
      wheel.raycastResult.hitPointWorld.vsub(chassisBody.position, rel_pos)
      // cannons applyimpulse is using world coord for the position
      //rel_pos.copy(wheel.raycastResult.hitPointWorld);

      if (wheel.forwardImpulse !== 0) {
        const impulse = new Vec3()
        forwardWS[i].scale(wheel.forwardImpulse, impulse)
        chassisBody.applyImpulse(impulse, rel_pos)
      }

      if (wheel.sideImpulse !== 0) {
        var groundObject = wheel.raycastResult.body

        const rel_pos2 = new Vec3()
        wheel.raycastResult.hitPointWorld.vsub(groundObject.position, rel_pos2)
        //rel_pos2.copy(wheel.raycastResult.hitPointWorld);
        const sideImp = new Vec3()
        axle[i].scale(wheel.sideImpulse, sideImp)

        // Scale the relative position in the up direction with rollInfluence.
        // If rollInfluence is 1, the impulse will be applied on the hitPoint (easy to roll over), if it is zero it will be applied in the same plane as the center of mass (not easy to roll over).
        chassisBody.vectorToLocalFrame(rel_pos, rel_pos)
        rel_pos['xyz'[this.indexUpAxis]] *= wheel.rollInfluence
        chassisBody.vectorToWorldFrame(rel_pos, rel_pos)
        chassisBody.applyImpulse(sideImp, rel_pos)

        //apply friction impulse on the ground
        sideImp.scale(-1, sideImp)
        groundObject.applyImpulse(sideImp, rel_pos2)
      }
    }
  }
}

const tmpVec1 = new Vec3()
const tmpVec2 = new Vec3()
const tmpVec3 = new Vec3()
const tmpVec4 = new Vec3()
const tmpVec5 = new Vec3()
const tmpVec6 = new Vec3()
const tmpRay = new Ray()

const torque = new Vec3()

const castRay_rayvector = new Vec3()
const castRay_target = new Vec3()

const directions = [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 1)]

const updateFriction_surfNormalWS_scaled_proj = new Vec3()
const updateFriction_axle = []
const updateFriction_forwardWS = []
const sideFrictionStiffness2 = 1

const calcRollingFriction_vel1 = new Vec3()
const calcRollingFriction_vel2 = new Vec3()
const calcRollingFriction_vel = new Vec3()

function calcRollingFriction(body0, body1, frictionPosWorld, frictionDirectionWorld, maxImpulse) {
  let j1 = 0
  const contactPosWorld = frictionPosWorld

  // var rel_pos1 = new Vec3();
  // var rel_pos2 = new Vec3();
  const vel1 = calcRollingFriction_vel1
  const vel2 = calcRollingFriction_vel2
  const vel = calcRollingFriction_vel
  // contactPosWorld.vsub(body0.position, rel_pos1);
  // contactPosWorld.vsub(body1.position, rel_pos2);

  body0.getVelocityAtWorldPoint(contactPosWorld, vel1)
  body1.getVelocityAtWorldPoint(contactPosWorld, vel2)
  vel1.vsub(vel2, vel)

  const vrel = frictionDirectionWorld.dot(vel)

  const denom0 = computeImpulseDenominator(body0, frictionPosWorld, frictionDirectionWorld)
  const denom1 = computeImpulseDenominator(body1, frictionPosWorld, frictionDirectionWorld)
  const relaxation = 1
  const jacDiagABInv = relaxation / (denom0 + denom1)

  // calculate j that moves us to zero relative velocity
  j1 = -vrel * jacDiagABInv

  if (maxImpulse < j1) {
    j1 = maxImpulse
  }
  if (j1 < -maxImpulse) {
    j1 = -maxImpulse
  }

  return j1
}

const computeImpulseDenominator_r0 = new Vec3()
const computeImpulseDenominator_c0 = new Vec3()
const computeImpulseDenominator_vec = new Vec3()
const computeImpulseDenominator_m = new Vec3()
function computeImpulseDenominator({ position, invInertiaWorld, invMass }, pos, normal) {
  const r0 = computeImpulseDenominator_r0
  const c0 = computeImpulseDenominator_c0
  const vec = computeImpulseDenominator_vec
  const m = computeImpulseDenominator_m

  pos.vsub(position, r0)
  r0.cross(normal, c0)
  invInertiaWorld.vmult(c0, m)
  m.cross(r0, vec)

  return invMass + normal.dot(vec)
}

const resolveSingleBilateral_vel1 = new Vec3()
const resolveSingleBilateral_vel2 = new Vec3()
const resolveSingleBilateral_vel = new Vec3()

//bilateral constraint between two dynamic objects
function resolveSingleBilateral(body1, pos1, body2, pos2, normal, impulse) {
  const normalLenSqr = normal.norm2()
  if (normalLenSqr > 1.1) {
    return 0 // no impulse
  }
  // var rel_pos1 = new Vec3();
  // var rel_pos2 = new Vec3();
  // pos1.vsub(body1.position, rel_pos1);
  // pos2.vsub(body2.position, rel_pos2);

  const vel1 = resolveSingleBilateral_vel1
  const vel2 = resolveSingleBilateral_vel2
  const vel = resolveSingleBilateral_vel
  body1.getVelocityAtWorldPoint(pos1, vel1)
  body2.getVelocityAtWorldPoint(pos2, vel2)

  vel1.vsub(vel2, vel)

  const rel_vel = normal.dot(vel)

  const contactDamping = 0.2
  const massTerm = 1 / (body1.invMass + body2.invMass)
  var impulse = -contactDamping * rel_vel * massTerm

  return impulse
}
