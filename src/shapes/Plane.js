import { Shape } from './Shape'
import { Vec3 } from '../math/Vec3'

/**
 * A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a Body and rotate that body. See the demos.
 * @class Plane
 * @constructor
 * @extends Shape
 * @author schteppe
 */
export class Plane extends Shape {
  constructor() {
    super({
      type: Shape.types.PLANE,
    })

    // World oriented normal
    this.worldNormal = new Vec3()
    this.worldNormalNeedsUpdate = true

    this.boundingSphereRadius = Number.MAX_VALUE
  }

  computeWorldNormal(quat) {
    const n = this.worldNormal
    n.set(0, 0, 1)
    quat.vmult(n, n)
    this.worldNormalNeedsUpdate = false
  }

  calculateLocalInertia(mass, target = new Vec3()) {
    return target
  }

  volume() {
    return (
      // The plane is infinite...
      Number.MAX_VALUE
    )
  }

  calculateWorldAABB({ x, y, z }, quat, min, max) {
    // The plane AABB is infinite, except if the normal is pointing along any axis
    tempNormal.set(0, 0, 1) // Default plane normal is z
    quat.vmult(tempNormal, tempNormal)
    const maxVal = Number.MAX_VALUE
    min.set(-maxVal, -maxVal, -maxVal)
    max.set(maxVal, maxVal, maxVal)

    if (tempNormal.x === 1) {
      max.x = x
    }
    if (tempNormal.y === 1) {
      max.y = y
    }
    if (tempNormal.z === 1) {
      max.z = z
    }

    if (tempNormal.x === -1) {
      min.x = x
    }
    if (tempNormal.y === -1) {
      min.y = y
    }
    if (tempNormal.z === -1) {
      min.z = z
    }
  }

  updateBoundingSphereRadius() {
    this.boundingSphereRadius = Number.MAX_VALUE
  }
}

const tempNormal = new Vec3()
