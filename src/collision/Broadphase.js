/*global CANNON:true */

/**
 * @class CANNON.Broadphase
 * @author schteppe
 * @brief Base class for broadphase implementations
 */
CANNON.Broadphase = function(){
    /**
    * @property CANNON.World world
    * @brief The world to search for collisions in.
    * @memberof CANNON.Broadphase
    */
    this.world = null;
};
CANNON.Broadphase.prototype.constructor = CANNON.BroadPhase;

/**
 * @method collisionPairs
 * @memberof CANNON.Broadphase
 * @brief Get the collision pairs from the world
 * @param CANNON.World world The world to search in
 * @return array An array with two subarrays of body indices
 */
CANNON.Broadphase.prototype.collisionPairs = function(world){
    throw "collisionPairs not implemented for this BroadPhase class!";
};

