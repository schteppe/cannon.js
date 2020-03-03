/**
 * Collision "matrix". It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
 * @class ArrayCollisionMatrix
 * @constructor
 */
export class ArrayCollisionMatrix {
  constructor() {

    /**
     * The matrix storage
     * @property matrix
     * @type {Array}
     */
    this.matrix = []
  }

  /**
   * Get an element
   * @method get
   * @param  {Number} i
   * @param  {Number} j
   * @return {Number}
   */
  get(i, j) {
    i = i.index
    j = j.index
    if (j > i) {
      const temp = j
      j = i
      i = temp
    }
    return this.matrix[((i * (i + 1)) >> 1) + j - 1]
  }

  /**
   * Set an element
   * @method set
   * @param {Number} i
   * @param {Number} j
   * @param {Number} value
   */
  set(i, j, value) {
    i = i.index
    j = j.index
    if (j > i) {
      const temp = j
      j = i
      i = temp
    }
    this.matrix[((i * (i + 1)) >> 1) + j - 1] = value ? 1 : 0
  }

  /**
   * Sets all elements to zero
   * @method reset
   */
  reset() {
    for (let i = 0, l = this.matrix.length; i !== l; i++) {
      this.matrix[i] = 0
    }
  }

  /**
   * Sets the max number of objects
   * @method setNumObjects
   * @param {Number} n
   */
  setNumObjects(n) {
    this.matrix.length = (n * (n - 1)) >> 1
  }
}
