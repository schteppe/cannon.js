/**
 * Base class for objects that dispatches events.
 * @class EventTarget
 * @constructor
 */
export class EventTarget {
  /**
   * Add an event listener
   * @method addEventListener
   * @param  {String} type
   * @param  {Function} listener
   * @return {EventTarget} The self object, for chainability.
   */
  addEventListener(type, listener) {
    if (this._listeners === undefined) {
      this._listeners = {}
    }
    const listeners = this._listeners
    if (listeners[type] === undefined) {
      listeners[type] = []
    }
    if (!listeners[type].includes(listener)) {
      listeners[type].push(listener)
    }
    return this
  }

  /**
   * Check if an event listener is added
   * @method hasEventListener
   * @param  {String} type
   * @param  {Function} listener
   * @return {Boolean}
   */
  hasEventListener(type, listener) {
    if (this._listeners === undefined) {
      return false
    }
    const listeners = this._listeners
    if (listeners[type] !== undefined && listeners[type].includes(listener)) {
      return true
    }
    return false
  }

  /**
   * Check if any event listener of the given type is added
   * @method hasAnyEventListener
   * @param  {String} type
   * @return {Boolean}
   */
  hasAnyEventListener(type) {
    if (this._listeners === undefined) {
      return false
    }
    const listeners = this._listeners
    return listeners[type] !== undefined
  }

  /**
   * Remove an event listener
   * @method removeEventListener
   * @param  {String} type
   * @param  {Function} listener
   * @return {EventTarget} The self object, for chainability.
   */
  removeEventListener(type, listener) {
    if (this._listeners === undefined) {
      return this
    }
    const listeners = this._listeners
    if (listeners[type] === undefined) {
      return this
    }
    const index = listeners[type].indexOf(listener)
    if (index !== -1) {
      listeners[type].splice(index, 1)
    }
    return this
  }

  /**
   * Emit an event.
   * @method dispatchEvent
   * @param  {Object} event
   * @param  {String} event.type
   * @return {EventTarget} The self object, for chainability.
   */
  dispatchEvent(event) {
    if (this._listeners === undefined) {
      return this
    }
    const listeners = this._listeners
    const listenerArray = listeners[event.type]
    if (listenerArray !== undefined) {
      event.target = this
      for (let i = 0, l = listenerArray.length; i < l; i++) {
        listenerArray[i].call(this, event)
      }
    }
    return this
  }
}
