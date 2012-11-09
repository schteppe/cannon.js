/*global CANNON:true */

/**
 * @class CANNON.Body
 * @brief Base class for all body types.
 * @param string type
 * @extends CANNON.EventTarget
 */
CANNON.Body = function(type){

    CANNON.EventTarget.apply(this);

    this.type = type;

    var that = this;

    /**
    * @property CANNON.World world
    * @memberof CANNON.Body
    * @brief Reference to the world the body is living in
    */
    this.world = null;

    /**
    * @property function preStep
    * @memberof CANNON.Body
    * @brief Callback function that is used BEFORE stepping the system. Use it to apply forces, for example. Inside the function, "this" will refer to this CANNON.Body object.
    * @todo dispatch an event from the World instead
    */
    this.preStep = null;

    /**
    * @property function postStep
    * @memberof CANNON.Body
    * @brief Callback function that is used AFTER stepping the system. Inside the function, "this" will refer to this CANNON.Body object.
    * @todo dispatch an event from the World instead
    */
    this.postStep = null;
};

/*
 * @brief A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
 */
CANNON.Body.DYNAMIC = 1;

/*
 * @brief A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
 */
CANNON.Body.STATIC = 2;

/*
 * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
 */
CANNON.Body.KINEMATIC = 4;