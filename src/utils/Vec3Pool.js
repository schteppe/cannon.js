import { Vec3 } from '../math/Vec3'
import { Pool } from './Pool'

/**
 * @class Vec3Pool
 * @constructor
 * @extends Pool
 */
export class Vec3Pool extends Pool {
  constructor() {
    super()
    this.type = Vec3
  }

  /**
   * Construct a vector
   * @method constructObject
   * @return {Vec3}
   */
  constructObject() {
    return new Vec3()
  }
}
