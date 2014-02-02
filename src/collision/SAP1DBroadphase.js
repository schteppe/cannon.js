var Shape = require('../shapes/Shape')
,   Broadphase = require('../collision/Broadphase')

module.exports = SAP1DBroadphase;

/**
 * Sweep and prune broadphase along one axis.
 *
 * @class SAP1DBroadphase
 * @constructor
 * @extends Broadphase
 */
function SAP1DBroadphase(world){
    Broadphase.apply(this);

    /**
     * List of bodies currently in the broadphase.
     * @property axisList
     * @type {Array}
     */
    this.axisList = [];

    /**
     * The world to search in.
     * @property world
     * @type {World}
     */
    this.world = null;

    /**
     * Axis to sort the bodies along. Set to 0 for x axis, and 1 for y axis. For best performance, choose an axis that the bodies are spread out more on.
     * @property axisIndex
     * @type {Number}
     */
    this.axisIndex = 0;

    var axisList = this.axisList;

    this._addBodyHandler = function(e){
        axisList.push(e.body);
    };

    this._removeBodyHandler = function(e){
        var idx = axisList.indexOf(e.body);
        if(idx !== -1)
            axisList.splice(idx,1);
    }

    if(world) this.setWorld(world);
};
SAP1DBroadphase.prototype = new Broadphase();

/**
 * Change the world
 * @method setWorld
 * @param  {World} world
 */
SAP1DBroadphase.prototype.setWorld = function(world){
    // Clear the old axis array
    this.axisList.length = 0;

    // Add all bodies from the new world
    for(var i=0; i<world.bodies.length; i++)
        this.axisList.push(world.bodies[i]);

    // Remove old handlers, if any
    world.removeEventListener("addBody",this._addBodyHandler);
    world.removeEventListener("removeBody",this._removeBodyHandler);

    // Add handlers to update the list of bodies.
    world.addEventListener("addBody",this._addBodyHandler);
    world.addEventListener("removeBody",this._removeBodyHandler);

    this.world = world;
};

/**
 * Function for sorting bodies along the X axis. To be passed to array.sort()
 * @method sortAxisListX
 * @param  {Body} bodyA
 * @param  {Body} bodyB
 * @return {Number}
 */
SAP1DBroadphase.sortAxisListX = function(bodyA,bodyB){
    return (bodyA.position.x-bodyA.shape.boundingSphereRadius) - (bodyB.position.x-bodyB.shape.boundingSphereRadius);
};

/**
 * Function for sorting bodies along the Y axis. To be passed to array.sort()
 * @method sortAxisListY
 * @param  {Body} bodyA
 * @param  {Body} bodyB
 * @return {Number}
 */
SAP1DBroadphase.sortAxisListY = function(bodyA,bodyB){
    return (bodyA.position.y-bodyA.shape.boundingSphereRadius) - (bodyB.position.y-bodyB.shape.boundingSphereRadius);
};

/**
 * Function for sorting bodies along the Y axis. To be passed to array.sort()
 * @method sortAxisListY
 * @param  {Body} bodyA
 * @param  {Body} bodyB
 * @return {Number}
 */
SAP1DBroadphase.sortAxisListZ = function(bodyA,bodyB){
    return (bodyA.position.z-bodyA.shape.boundingSphereRadius) - (bodyB.position.z-bodyB.shape.boundingSphereRadius);
};

SAP1DBroadphase.prototype.collisionPairs = function(world,p1,p2){
    var bodies = this.axisList,
        axisIndex = this.axisIndex,
        i,j;

    // Sort the list
    var sortFunc;
    if(axisIndex === 0)
        sortFunc = SAP1DBroadphase.sortAxisListX;
    else if(axisIndex === 1)
        sortFunc = SAP1DBroadphase.sortAxisListY;
    else if(axisIndex === 2)
        sortFunc = SAP1DBroadphase.sortAxisListZ;
    bodies.sort(sortFunc);

    // Look through the list
    for(i=0, N=bodies.length; i!==N; i++){
        var bi = bodies[i];

        for(j=i+1; j<N; j++){
            var bj = bodies[j];

            if(!SAP1DBroadphase.checkBounds(bi,bj,axisIndex))
                break;

            this.doBoundingSphereBroadphase(bi,bj,p1,p2);
        }
    }
};

/**
 * Check if the bounds of two bodies overlap, along the given SAP axis.
 * @static
 * @method checkBounds
 * @param  {Body} bi
 * @param  {Body} bj
 * @param  {Number} axisIndex
 * @return {Boolean}
 */
SAP1DBroadphase.checkBounds = function(bi,bj,axisIndex){
    var axis;
    if(axisIndex==0) axis = 'x';
    if(axisIndex==1) axis = 'y';
    if(axisIndex==2) axis = 'z';

    var biPos = bi.position[axis],
        ri = bi.shape.boundingSphereRadius,
        bjPos = bj.position[axis],
        rj = bj.shape.boundingSphereRadius,
        boundA1 = biPos-ri,
        boundA2 = biPos+ri,
        boundB1 = bjPos-rj,
        boundB2 = bjPos+rj;

    return boundB1 < boundA2;
};
