module.exports = Body;

var EventTarget = require('../utils/EventTarget')
,   Vec3 = require('../math/Vec3')

/**
 * Base class for all body types.
 * @class Body
 * @constructor
 * @param {string} type
 * @extends EventTarget
 * @event collide The body object dispatches a "collide" event whenever it collides with another body. Event parameters are "with" (the body it collides with) and "contact" (the contact equation that is generated).
 */
function Body(type){
    EventTarget.apply(this);

    this.type = type;

    /**
     * Reference to the world the body is living in
     * @property world
     * @type {World}
     */
    this.world = null;

    /**
     * Callback function that is used BEFORE stepping the system. Use it to apply forces, for example. Inside the function, "this" will refer to this Body object.
     * @property preStep
     * @type {Function}
     * @deprecated Use World events instead
     */
    this.preStep = null;

    /**
     * Callback function that is used AFTER stepping the system. Inside the function, "this" will refer to this Body object.
     * @property postStep
     * @type {Function}
     * @deprecated Use World events instead
     */
    this.postStep = null;

    this.vlambda = new Vec3();

    /**
     * @property {Number} collisionFilterGroup
     */
    this.collisionFilterGroup = 1;

    /**
     * @property {Number} collisionFilterMask
     */
    this.collisionFilterMask = 1;

    /**
     * Whether to produce contact forces
     * @property {Number} collisionResponse
     */
	this.collisionResponse = true;
};
Body.prototype = new EventTarget();

/**
 * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
 * @static
 * @property DYNAMIC
 * @type {Number}
 */
Body.DYNAMIC = 1;

/**
 * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
 * @static
 * @property DYNAMIC
 * @type {Number}
 */
Body.STATIC = 2;

/**
 * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
 * @static
 * @property DYNAMIC
 * @type {Number}
 */
Body.KINEMATIC = 4;
