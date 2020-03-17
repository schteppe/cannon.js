import { Vec3 } from './Vec3'
import { Quaternion } from './Quaternion'

/**
 * @class Transform
 * @constructor
 * @param {Object} options Optional. An object containing 
 */
export class Transform {
  position: Vec3
  quaternion: Quaternion

  static pointToLocalFrame: (position: Vec3, quaternion: Quaternion, localPoint: Vec3, result?: Vec3) => Vec3
  static pointToWorldFrame: (position: Vec3, quaternion: Quaternion, worldPoint: Vec3, result?: Vec3) => Vec3
  static vectorToWorldFrame: (quaternion: Quaternion, localVector: Vec3, result: Vec3) => Vec3
  static vectorToLocalFrame: (position: Vec3, quaternion: Quaternion, worldVector: Vec3, result?: Vec3) => Vec3

  constructor(options: { position?: Vec3, quaternion?: Quaternion } = {}) {
    this.position = new Vec3()
    this.quaternion = new Quaternion()
  
    if (options.position) {
      this.position.copy(options.position)
    }

    if (options.quaternion) {
      this.quaternion.copy(options.quaternion)
    }
  }

  /**
   * Get a global point in local transform coordinates.
   * @method pointToLocal
   * @param  {Vec3} worldPoint
   * @param  {Vec3} result Optional.
   * @return {Vec3} The "result" vector object
   */
  pointToLocal(worldPoint: Vec3, result?: Vec3): Vec3 {
    return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result)
  }

  /**
   * Get a local point in global transform coordinates.
   * @method pointToWorld
   * @param  {Vec3} point
   * @param  {Vec3} result Optional.
   * @return {Vec3} The "result" vector object
   */
  pointToWorld(localPoint: Vec3, result?: Vec3): Vec3 {
    return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result)
  }

  vectorToWorldFrame(localVector: Vec3, result = new Vec3()): Vec3 {
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
Transform.pointToLocalFrame = (position: Vec3, quaternion: Quaternion, worldPoint: Vec3, result = new Vec3()): Vec3 => {
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
Transform.pointToWorldFrame = (position: Vec3, quaternion: Quaternion, localPoint: Vec3, result = new Vec3()): Vec3 => {
  quaternion.vmult(localPoint, result)
  result.vadd(position, result)
  return result
}

Transform.vectorToWorldFrame = (quaternion: Quaternion, localVector: Vec3, result = new Vec3()): Vec3 => {
  quaternion.vmult(localVector, result)
  return result
}

Transform.vectorToLocalFrame = (position: Vec3, quaternion: Quaternion, worldVector: Vec3, result = new Vec3()): Vec3 => {
  quaternion.w *= -1
  quaternion.vmult(worldVector, result)
  quaternion.w *= -1
  return result
}