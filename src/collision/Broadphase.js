/**
 * @class Broadphase
 * @author schteppe / https://github.com/schteppe
 * @todo Make it a base class for broadphase implementations, and rename this one to NaiveBroadphase
 */
CANNON.Broadphase = function(){
  /// The world to search for collisions in.
  this.world = null;
};

CANNON.Broadphase.prototype.constructor = CANNON.BroadPhase;

/**
 * Get the collision pairs from the world
 * @return array
 */
CANNON.Broadphase.prototype.collisionPairs = function(){
  throw "collisionPairs not implemented for this BroadPhase class!";
};

