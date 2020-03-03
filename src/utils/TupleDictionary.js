/**
 * @class TupleDictionary
 * @constructor
 */
export class TupleDictionary {
  constructor() {
    super()
    
    /**
     * The data storage
     * @property data
     * @type {Object}
     */
    this.data = { keys: [] }
  }

  /**
   * @method get
   * @param  {Number} i
   * @param  {Number} j
   * @return {Number}
   */
  get(i, j) {
    if (i > j) {
      // swap
      const temp = j
      j = i
      i = temp
    }
    return this.data[`${i}-${j}`]
  }

  /**
   * @method set
   * @param  {Number} i
   * @param  {Number} j
   * @param {Number} value
   */
  set(i, j, value) {
    if (i > j) {
      const temp = j
      j = i
      i = temp
    }
    const key = `${i}-${j}`

    // Check if key already exists
    if (!this.get(i, j)) {
      this.data.keys.push(key)
    }

    this.data[key] = value
  }

  /**
   * @method reset
   */
  reset() {
    const data = this.data
    const keys = data.keys
    while (keys.length > 0) {
      const key = keys.pop()
      delete data[key]
    }
  }
}
