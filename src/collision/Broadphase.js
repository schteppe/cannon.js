var Body = require('../objects/Body');
var Vec3 = require('../math/Vec3');
var Quaternion = require('../math/Quaternion');
var Shape = require('../shapes/Shape');
var Plane = require('../shapes/Plane');

module.exports = Broadphase;

/**
 * Base class for broadphase implementations
 * @class Broadphase
 * @constructor
 * @author schteppe
 */
function Broadphase(){
    /**
    * The world to search for collisions in.
    * @property world
    * @type {World}
    */
    this.world = null;

    /**
     * If set to true, the broadphase uses bounding boxes for intersection test, else it uses bounding spheres.
     * @property useBoundingBoxes
     * @type {Boolean}
     */
    this.useBoundingBoxes = false;

    this.dirty = true;
}

/**
 * Get the collision pairs from the world
 * @method collisionPairs
 * @param {World} world The world to search in
 * @param Array p1 Empty array to be filled with body objects
 * @param Array p2 Empty array to be filled with body objects
 * @return array An array with two subarrays of body indices
 */
Broadphase.prototype.collisionPairs = function(world,p1,p2){
    throw new Error("collisionPairs not implemented for this BroadPhase class!");
};

/**
 * Check if a body pair needs to be intersection tested at all.
 * @method needBroadphaseCollision
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @return {bool}
 */
var Broadphase_needBroadphaseCollision_STATIC_OR_KINEMATIC = Body.STATIC | Body.KINEMATIC;
Broadphase.prototype.needBroadphaseCollision = function(bodyA,bodyB){

    // Check collision filter masks
    if( (bodyA.collisionFilterGroup & bodyB.collisionFilterMask)===0 || (bodyB.collisionFilterGroup & bodyA.collisionFilterMask)===0){
        return false;
    }

    // Check types
    if(((bodyA.type & Broadphase_needBroadphaseCollision_STATIC_OR_KINEMATIC)!==0 || bodyA.sleepState === Body.SLEEPING) &&
       ((bodyB.type & Broadphase_needBroadphaseCollision_STATIC_OR_KINEMATIC)!==0 || bodyB.sleepState === Body.SLEEPING)) {
        // Both bodies are static, kinematic or sleeping. Skip.
        return false;
    }

    // Two particles don't collide
    /*
    if(!bodyA.shape && !bodyB.shape){
        return false;
    }
    */

    // Two planes don't collide
    /*
    if(bodyA.shape instanceof Plane && bodyB.shape instanceof Plane){
        return false;
    }
    */

    return true;
};

/**
 * Check if the bounding volumes of two bodies intersect.
 * @method intersectionTest
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {array} pairs1
 * @param {array} pairs2
  */
Broadphase.prototype.intersectionTest = function(bi, bj, pairs1, pairs2){
    if(this.useBoundingBoxes){
        this.doBoundingBoxBroadphase(bi,bj,pairs1,pairs2);
    } else {
        this.doBoundingSphereBroadphase(bi,bj,pairs1,pairs2);
    }
};

/**
 * Check if the bounding spheres of two bodies are intersecting.
 * @method doBoundingSphereBroadphase
 * @param {Body} bi
 * @param {Body} bj
 * @param {Array} pairs1 bi is appended to this array if intersection
 * @param {Array} pairs2 bj is appended to this array if intersection
 */
var Broadphase_collisionPairs_r = new Vec3(), // Temp objects
    Broadphase_collisionPairs_normal =  new Vec3(),
    Broadphase_collisionPairs_quat =  new Quaternion(),
    Broadphase_collisionPairs_relpos  =  new Vec3();
Broadphase.prototype.doBoundingSphereBroadphase = function(bi,bj,pairs1,pairs2){
    var r = Broadphase_collisionPairs_r;
    bj.position.vsub(bi.position,r);
    var boundingRadiusSum2 = Math.pow(bi.boundingRadius + bj.boundingRadius, 2);
    var norm2 = r.norm2();
    if(norm2 < boundingRadiusSum2){
        pairs1.push(bi);
        pairs2.push(bj);
    }
};

/**
 * Check if the bounding boxes of two bodies are intersecting.
 * @method doBoundingBoxBroadphase
 * @param Body bi
 * @param Body bj
 * @param {Array} pairs1
 * @param {Array} pairs2
 */
Broadphase.prototype.doBoundingBoxBroadphase = function(bi,bj,pairs1,pairs2){
    if(bi.aabbNeedsUpdate){
        bi.computeAABB();
    }
    if(bj.aabbNeedsUpdate){
        bj.computeAABB();
    }

    // Check AABB / AABB
    if( !(  bi.aabb.upperBound.x < bj.aabb.lowerBound.x ||
            bi.aabb.upperBound.y < bj.aabb.lowerBound.y ||
            bi.aabb.upperBound.z < bj.aabb.lowerBound.z ||
            bi.aabb.lowerBound.x > bj.aabb.upperBound.x ||
            bi.aabb.lowerBound.y > bj.aabb.upperBound.y ||
            bi.aabb.lowerBound.z > bj.aabb.upperBound.z   ) ){
        pairs1.push(bi);
        pairs2.push(bj);
    }
};

/**
 * Removes duplicate pairs from the pair arrays.
 * @method makePairsUnique
 * @param {Array} pairs1
 * @param {Array} pairs2
 */
var Broadphase_makePairsUnique_temp = { keys:[] },
    Broadphase_makePairsUnique_p1 = [],
    Broadphase_makePairsUnique_p2 = [];
Broadphase.prototype.makePairsUnique = function(pairs1,pairs2){
    var t = Broadphase_makePairsUnique_temp,
        p1 = Broadphase_makePairsUnique_p1,
        p2 = Broadphase_makePairsUnique_p2,
        N = pairs1.length;

    for(var i=0; i!==N; i++){
        p1[i] = pairs1[i];
        p2[i] = pairs2[i];
    }

    pairs1.length = 0;
    pairs2.length = 0;

    for(var i=0; i!==N; i++){
        var id1 = p1[i].id,
            id2 = p2[i].id;
        var key = id1 < id2 ? id1+","+id2 :  id2+","+id1;
        t[key] = i;
        t.keys.push(key);
    }

    for(var i=0; i!==t.keys.length; i++){
        var key = t.keys.pop(),
            pairIndex = t[key];
        pairs1.push(p1[pairIndex]);
        pairs2.push(p2[pairIndex]);
        delete t[key];
    }
};

/**
 * To be implemented by subcasses
 * @method setWorld
 * @param {World} world
 */
Broadphase.prototype.setWorld = function(world){
};

var bsc_dist = new Vec3();
Broadphase.boundingSphereCheck = function(bi,bj){
    var dist = bsc_dist;
    bi.position.vsub(bj.position,dist);
    return Math.pow(bi.shape.boundingSphereRadius + bj.shape.boundingSphereRadius,2) > dist.norm2();
};

/**
 * Returns all the bodies within the AABB.
 * @method aabbQuery
 * @param  {World} world
 * @param  {AABB} aabb
 * @return {array}
 */
Broadphase.prototype.aabbQuery = function(world, aabb){
    console.warn('.aabbQuery is not implemented in this Broadphase subclass.');
    return [];
};