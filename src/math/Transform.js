import { Vec3 } from './Vec3'
import { Quaternion } from './Quaternion'

/**
 * @class Transform
 * @constructor
 */
export class Transform {
  constructor(options = {}) {
    /**
     * @property {Vec3} position
     */
    this.position = new Vec3()
    if (options.position) {
      this.position.copy(options.position)
    }

    /**
     * @property {Quaternion} quaternion
     */
    this.quaternion = new Quaternion()
    if (options.quaternion) {
      this.quaternion.copy(options.quaternion)
    }
  }

  /**
   * Get a global point in local transform coordinates.
   * @method pointToLocal
   * @param  {Vec3} point
   * @param  {Vec3} result
   * @return {Vec3} The "result" vector object
   */
  pointToLocal(worldPoint, result) {
    return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result)
  }

  /**
   * Get a local point in global transform coordinates.
   * @method pointToWorld
   * @param  {Vec3} point
   * @param  {Vec3} result
   * @return {Vec3} The "result" vector object
   */
  pointToWorld(localPoint, result) {
    return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result)
  }

  vectorToWorldFrame(localVector, result) {
    var result = result || new Vec3()
    this.quaternion.vmult(localVector, result)
    return result
  }
}

const tmpQuat = new Quaternion()

/**
 * @static
 * @method pointToLocaFrame
 * @param {Vec3} position
 * @param {Quaternion} quaternion
 * @param {Vec3} worldPoint
 * @param {Vec3} result
 */
Transform.pointToLocalFrame = (position, quaternion, worldPoint, result) => {
  var result = result || new Vec3()
  worldPoint.vsub(position, result)
  quaternion.conjugate(tmpQuat)
  tmpQuat.vmult(result, result)
  return result
}

/**
 * @static
 * @method pointToWorldFrame
 * @param {Vec3} position
 * @param {Vec3} quaternion
 * @param {Vec3} localPoint
 * @param {Vec3} result
 */
Transform.pointToWorldFrame = (position, quaternion, localPoint, result) => {
  var result = result || new Vec3()
  quaternion.vmult(localPoint, result)
  result.vadd(position, result)
  return result
}

Transform.vectorToWorldFrame = (quaternion, localVector, result) => {
  quaternion.vmult(localVector, result)
  return result
}

Transform.vectorToLocalFrame = (position, quaternion, worldVector, result) => {
  var result = result || new Vec3()
  quaternion.w *= -1
  quaternion.vmult(worldVector, result)
  quaternion.w *= -1
  return result
}
