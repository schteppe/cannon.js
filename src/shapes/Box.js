import { Shape } from './Shape'
import { Vec3 } from '../math/Vec3'
import { ConvexPolyhedron } from './ConvexPolyhedron'

/**
 * A 3d box shape.
 * @class Box
 * @constructor
 * @param {Vec3} halfExtents
 * @author schteppe
 * @extends Shape
 */
export class Box extends Shape {
  constructor(halfExtents) {
    super({
      type: Shape.types.BOX,
    })

    /**
     * @property halfExtents
     * @type {Vec3}
     */
    this.halfExtents = halfExtents

    /**
     * Used by the contact generator to make contacts with other convex polyhedra for example
     * @property convexPolyhedronRepresentation
     * @type {ConvexPolyhedron}
     */
    this.convexPolyhedronRepresentation = null

    this.updateConvexPolyhedronRepresentation()
    this.updateBoundingSphereRadius()
  }

  /**
   * Updates the local convex polyhedron representation used for some collisions.
   * @method updateConvexPolyhedronRepresentation
   */
  updateConvexPolyhedronRepresentation() {
    const sx = this.halfExtents.x
    const sy = this.halfExtents.y
    const sz = this.halfExtents.z
    const V = Vec3

    const vertices = [
      new V(-sx, -sy, -sz),
      new V(sx, -sy, -sz),
      new V(sx, sy, -sz),
      new V(-sx, sy, -sz),
      new V(-sx, -sy, sz),
      new V(sx, -sy, sz),
      new V(sx, sy, sz),
      new V(-sx, sy, sz),
    ]

    const indices = [
      [3, 2, 1, 0], // -z
      [4, 5, 6, 7], // +z
      [5, 4, 0, 1], // -y
      [2, 3, 7, 6], // +y
      [0, 4, 7, 3], // -x
      [1, 2, 6, 5], // +x
    ]

    const axes = [new V(0, 0, 1), new V(0, 1, 0), new V(1, 0, 0)]

    const h = new ConvexPolyhedron(vertices, indices)
    this.convexPolyhedronRepresentation = h
    h.material = this.material
  }

  /**
   * @method calculateLocalInertia
   * @param  {Number} mass
   * @param  {Vec3} target
   * @return {Vec3}
   */
  calculateLocalInertia(mass, target = new Vec3()) {
    Box.calculateInertia(this.halfExtents, mass, target)
    return target
  }

  /**
   * Get the box 6 side normals
   * @method getSideNormals
   * @param {array}      sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
   * @param {Quaternion} quat             Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
   * @return {array}
   */
  getSideNormals(sixTargetVectors, quat) {
    const sides = sixTargetVectors
    const ex = this.halfExtents
    sides[0].set(ex.x, 0, 0)
    sides[1].set(0, ex.y, 0)
    sides[2].set(0, 0, ex.z)
    sides[3].set(-ex.x, 0, 0)
    sides[4].set(0, -ex.y, 0)
    sides[5].set(0, 0, -ex.z)

    if (quat !== undefined) {
      for (let i = 0; i !== sides.length; i++) {
        quat.vmult(sides[i], sides[i])
      }
    }

    return sides
  }

  volume() {
    return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z
  }

  updateBoundingSphereRadius() {
    this.boundingSphereRadius = this.halfExtents.norm()
  }

  forEachWorldCorner(pos, quat, callback) {
    const e = this.halfExtents
    const corners = [
      [e.x, e.y, e.z],
      [-e.x, e.y, e.z],
      [-e.x, -e.y, e.z],
      [-e.x, -e.y, -e.z],
      [e.x, -e.y, -e.z],
      [e.x, e.y, -e.z],
      [-e.x, e.y, -e.z],
      [e.x, -e.y, e.z],
    ]
    for (let i = 0; i < corners.length; i++) {
      worldCornerTempPos.set(corners[i][0], corners[i][1], corners[i][2])
      quat.vmult(worldCornerTempPos, worldCornerTempPos)
      pos.vadd(worldCornerTempPos, worldCornerTempPos)
      callback(worldCornerTempPos.x, worldCornerTempPos.y, worldCornerTempPos.z)
    }
  }

  calculateWorldAABB(pos, quat, min, max) {
    const e = this.halfExtents
    worldCornersTemp[0].set(e.x, e.y, e.z)
    worldCornersTemp[1].set(-e.x, e.y, e.z)
    worldCornersTemp[2].set(-e.x, -e.y, e.z)
    worldCornersTemp[3].set(-e.x, -e.y, -e.z)
    worldCornersTemp[4].set(e.x, -e.y, -e.z)
    worldCornersTemp[5].set(e.x, e.y, -e.z)
    worldCornersTemp[6].set(-e.x, e.y, -e.z)
    worldCornersTemp[7].set(e.x, -e.y, e.z)

    var wc = worldCornersTemp[0]
    quat.vmult(wc, wc)
    pos.vadd(wc, wc)
    max.copy(wc)
    min.copy(wc)
    for (let i = 1; i < 8; i++) {
      var wc = worldCornersTemp[i]
      quat.vmult(wc, wc)
      pos.vadd(wc, wc)
      const x = wc.x
      const y = wc.y
      const z = wc.z
      if (x > max.x) {
        max.x = x
      }
      if (y > max.y) {
        max.y = y
      }
      if (z > max.z) {
        max.z = z
      }

      if (x < min.x) {
        min.x = x
      }
      if (y < min.y) {
        min.y = y
      }
      if (z < min.z) {
        min.z = z
      }
    }

    // Get each axis max
    // min.set(Infinity,Infinity,Infinity);
    // max.set(-Infinity,-Infinity,-Infinity);
    // this.forEachWorldCorner(pos,quat,function(x,y,z){
    //     if(x > max.x){
    //         max.x = x;
    //     }
    //     if(y > max.y){
    //         max.y = y;
    //     }
    //     if(z > max.z){
    //         max.z = z;
    //     }

    //     if(x < min.x){
    //         min.x = x;
    //     }
    //     if(y < min.y){
    //         min.y = y;
    //     }
    //     if(z < min.z){
    //         min.z = z;
    //     }
    // });
  }
}

Box.calculateInertia = (halfExtents, mass, target) => {
  const e = halfExtents
  target.x = (1.0 / 12.0) * mass * (2 * e.y * 2 * e.y + 2 * e.z * 2 * e.z)
  target.y = (1.0 / 12.0) * mass * (2 * e.x * 2 * e.x + 2 * e.z * 2 * e.z)
  target.z = (1.0 / 12.0) * mass * (2 * e.y * 2 * e.y + 2 * e.x * 2 * e.x)
}

const worldCornerTempPos = new Vec3()

const worldCornersTemp = [
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
  new Vec3(),
]
