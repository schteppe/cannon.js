module.exports = NaiveBroadphase;

var Broadphase = require('./Broadphase');
var AABB = require('./AABB');

/**
 * Naive broadphase implementation, used in lack of better ones.
 * @class NaiveBroadphase
 * @constructor
 * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
 * @extends {Broadphase}
 */
function NaiveBroadphase(){
    Broadphase.apply(this);
}
NaiveBroadphase.prototype = new Broadphase();
NaiveBroadphase.prototype.constructor = NaiveBroadphase;

/**
 * Get all the collision pairs in the physics world
 * @method collisionPairs
 * @param {World} world
 * @param {Array} pairs1
 * @param {Array} pairs2
 */
NaiveBroadphase.prototype.collisionPairs = function(world,pairs1,pairs2){
    var bodies = world.bodies,
        n = bodies.length,
        i,j,bi,bj;

    // Naive N^2 ftw!
    for(i=0; i!==n; i++){
        for(j=0; j!==i; j++){

            bi = bodies[i];
            bj = bodies[j];

            if(!this.needBroadphaseCollision(bi,bj)){
                continue;
            }

            this.intersectionTest(bi,bj,pairs1,pairs2);
        }
    }
};

var tmpAABB = new AABB();

/**
 * Returns all the bodies within an AABB.
 * @method aabbQuery
 * @param  {World} world
 * @param  {AABB} aabb
 * @return {array} A list of bodies
 */
NaiveBroadphase.prototype.aabbQuery = function(world, aabb){
    var result = [];

    // Naive loop
    for(var i = 0; i < world.bodies.length; i++){
        var b = world.bodies[i];

        // Ugly hack until RigidBody gets aabb
        tmpAABB.lowerBound = b.aabbmin;
        tmpAABB.upperBound = b.aabbmax;
        if(b.aabb.overlaps(aabb)){
            result.push(b);
        }
    }

    return result;
};