/**
 * Records what objects are colliding with each other
 * @class ObjectCollisionMatrix
 * @constructor
 */
export class ObjectCollisionMatrix {
  constructor() {
    super()

    /**
     * The matrix storage
     * @property matrix
     * @type {Object}
     */
    this.matrix = {}
  }

  /**
   * @method get
   * @param  {Number} i
   * @param  {Number} j
   * @return {Number}
   */
  get(i, j) {
    i = i.id
    j = j.id
    if (j > i) {
      const temp = j
      j = i
      i = temp
    }
    return `${i}-${j}` in this.matrix
  }

  /**
   * @method set
   * @param  {Number} i
   * @param  {Number} j
   * @param {Number} value
   */
  set(i, j, value) {
    i = i.id
    j = j.id
    if (j > i) {
      const temp = j
      j = i
      i = temp
    }
    if (value) {
      this.matrix[`${i}-${j}`] = true
    } else {
      delete this.matrix[`${i}-${j}`]
    }
  }

  /**
   * Empty the matrix
   * @method reset
   */
  reset() {
    this.matrix = {}
  }

  /**
   * Set max number of objects
   * @method setNumObjects
   * @param {Number} n
   */
  setNumObjects(n) {}
}
