module.exports = EventTarget;

/**
 * @class EventTarget
 * @constructor
 * @see https://github.com/mrdoob/eventtarget.js/
 */
function EventTarget() {
    var listeners = {};

    /**
     * Add an event listener
     * @method addEventListener
     * @param {String} type
     * @param {Function} listener
     */
    this.addEventListener = function ( type, listener ) {
        if ( listeners[ type ] === undefined ) {
            listeners[ type ] = [];
        }
        if ( listeners[ type ].indexOf( listener ) === - 1 ) {
            listeners[ type ].push( listener );
        }
    };

    /**
     * Dispatch an event
     * @method dispatchEvent
     * @param {Object} event
     */
    this.dispatchEvent = function ( event ) {
        for ( var listener in listeners[ event.type ] ) {
            listeners[ event.type ][ listener ]( event );
        }
    };

    /**
     * Remove an event listener
     * @method removeEventListener
     * @param {String} type
     * @param {Function} listener
     */
    this.removeEventListener = function ( type, listener ) {
        var index = listeners[ type ].indexOf( listener );
        if ( index !== - 1 ) {
            listeners[ type ].splice( index, 1 );
        }
    };
};
