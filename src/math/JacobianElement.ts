import { Vec3 } from './Vec3'

/**
 * An element containing 6 entries, 3 spatial and 3 rotational degrees of freedom.
 * @class JacobianElement
 * @constructor
 */
export class JacobianElement {
  spatial: Vec3
  rotational: Vec3

  constructor() {
    this.spatial = new Vec3()
    this.rotational = new Vec3()
  }

  /**
   * Multiply with other JacobianElement
   * @method multiplyElement
   * @param  {JacobianElement} element
   * @return {Number}
   */
  multiplyElement({ spatial, rotational }: JacobianElement): number {
    return spatial.dot(this.spatial) + rotational.dot(this.rotational)
  }

  /**
   * Multiply with two vectors
   * @method multiplyVectors
   * @param  {Vec3} spatial
   * @param  {Vec3} rotational
   * @return {Number}
   */
  multiplyVectors(spatial: Vec3, rotational: Vec3): number {
    return spatial.dot(this.spatial) + rotational.dot(this.rotational)
  }
}
