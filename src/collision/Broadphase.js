var Body = require('../objects/Body')
,   Vec3 = require('../math/Vec3')
,   Quaternion = require('../math/Quaternion')
,   Shape = require('../objects/Shape')
,   Plane = require('../objects/Plane')

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
};

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

    // Check motionstate
    if(((bodyA.motionstate & Broadphase_needBroadphaseCollision_STATIC_OR_KINEMATIC)!==0 || bodyA.isSleeping()) &&
       ((bodyB.motionstate & Broadphase_needBroadphaseCollision_STATIC_OR_KINEMATIC)!==0 || bodyB.isSleeping())) {
        // Both bodies are static, kinematic or sleeping. Skip.
        return false;
    }

    // Two particles don't collide
    if(!bodyA.shape && !bodyB.shape){
        return false;
    }

    // Two planes don't collide
    if(bodyA.shape instanceof Plane && bodyB.shape instanceof Plane){
        return false;
    }

    return true;
};

/**
 * Check if a body pair needs to be intersection tested at all.
 * @method intersectionTest
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @return {Boolean}
 */
Broadphase.prototype.intersectionTest = function(bi,bj,pairs1,pairs2){
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

    // Local fast access
    var types = Shape.types,
        BOX_SPHERE_COMPOUND_CONVEX = types.SPHERE | types.BOX | types.COMPOUND | types.CONVEXPOLYHEDRON,
        PLANE = types.PLANE,
        STATIC_OR_KINEMATIC = Body.STATIC | Body.KINEMATIC;

    // Temp vecs
    var r = Broadphase_collisionPairs_r,
        normal = Broadphase_collisionPairs_normal,
        quat = Broadphase_collisionPairs_quat,
        relpos = Broadphase_collisionPairs_relpos;

    var bishape = bi.shape, bjshape = bj.shape;
    if(bishape && bjshape){
        var ti = bishape.type, tj = bjshape.type;

        // --- Box / sphere / compound / convexpolyhedron collision ---
        if((ti & BOX_SPHERE_COMPOUND_CONVEX) && (tj & BOX_SPHERE_COMPOUND_CONVEX)){
            // Rel. position
            bj.position.vsub(bi.position,r);

            // Update bounding spheres if needed
            if(bishape.boundingSphereRadiusNeedsUpdate){
                bishape.computeBoundingSphereRadius();
            }
            if(bjshape.boundingSphereRadiusNeedsUpdate){
                bjshape.computeBoundingSphereRadius();
            }

            var boundingRadiusSum = bishape.boundingSphereRadius + bjshape.boundingSphereRadius;
            if(r.norm2() < boundingRadiusSum*boundingRadiusSum){
                pairs1.push(bi);
                pairs2.push(bj);
            }

            // --- Sphere/box/compound/convexpoly versus plane ---
        } else if((ti & BOX_SPHERE_COMPOUND_CONVEX) && (tj & types.PLANE) || (tj & BOX_SPHERE_COMPOUND_CONVEX) && (ti & types.PLANE)){
            var planeBody = (ti===PLANE) ? bi : bj, // Plane
                otherBody = (ti!==PLANE) ? bi : bj; // Other

            var otherShape = otherBody.shape;
            var planeShape = planeBody.shape;

            // Rel. position
            otherBody.position.vsub(planeBody.position,r);

            if(planeShape.worldNormalNeedsUpdate){
                planeShape.computeWorldNormal(planeBody.quaternion);
            }

            normal = planeShape.worldNormal;

            if(otherShape.boundingSphereRadiusNeedsUpdate){
                otherShape.computeBoundingSphereRadius();
            }

            var q = r.dot(normal) - otherShape.boundingSphereRadius;
            if(q < 0.0){
                pairs1.push(bi);
                pairs2.push(bj);
            }
        }
    } else {
        // Particle without shape
        if(!bishape && !bjshape){
            // No collisions between 2 particles
        } else {
            var particle = bishape ? bj : bi;
            var other = bishape ? bi : bj;
            var otherShape = other.shape;
            var type = otherShape.type;

            if(type & BOX_SPHERE_COMPOUND_CONVEX){
                if(type === types.SPHERE){ // particle-sphere
                    particle.position.vsub(other.position,relpos);
                    if(otherShape.radius*otherShape.radius >= relpos.norm2()){
                        pairs1.push(particle);
                        pairs2.push(other);
                    }
                } else if(type===types.CONVEXPOLYHEDRON || type===types.BOX || type===types.COMPOUND){

                    if(otherShape.boundingSphereRadiusNeedsUpdate){
                        otherShape.computeBoundingSphereRadius();
                    }
                    var R = otherShape.boundingSphereRadius;
                    particle.position.vsub(other.position,relpos);
                    if(R*R >= relpos.norm2()){
                        pairs1.push(particle);
                        pairs2.push(other);
                    }
                }
            } else if(type === types.PLANE){
                // particle/plane
                var plane = other;
                normal.set(0,0,1);
                plane.quaternion.vmult(normal,normal);
                particle.position.vsub(plane.position,relpos);
                if(normal.dot(relpos)<=0.0){
                    pairs1.push(particle);
                    pairs2.push(other);
                }
            }
        }
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
    var bishape = bi.shape,
        bjshape = bj.shape;

    if(bi.aabbNeedsUpdate){
        bi.computeAABB();
    }
    if(bj.aabbNeedsUpdate){
        bj.computeAABB();
    }

    if(bishape && bjshape){
        // Check AABB / AABB
        if( !(  bi.aabbmax.x < bj.aabbmin.x ||
                bi.aabbmax.y < bj.aabbmin.y ||
                bi.aabbmax.z < bj.aabbmin.z ||
                bi.aabbmin.x > bj.aabbmax.x ||
                bi.aabbmin.y > bj.aabbmax.y ||
                bi.aabbmin.z > bj.aabbmax.z   ) ){
            pairs1.push(bi);
            pairs2.push(bj);
        }
    } else {
        // Particle without shape
        if(!bishape && !bjshape){
            // No collisions between 2 particles
        } else {
            // particle vs AABB
            var p =      !bishape ? bi : bj;
            var other =  !bishape ? bj : bi;

            if(other.shape instanceof Plane){
                //console.log(p.position.z+"<"+other.aabbmin.z+" = ",p.position.z < other.aabbmin.z);
            }

            if( !(  p.position.x < other.aabbmin.x ||
                    p.position.y < other.aabbmin.y ||
                    p.position.z < other.aabbmin.z ||
                    p.position.x > other.aabbmax.x ||
                    p.position.y > other.aabbmax.y ||
                    p.position.z > other.aabbmax.z   ) ){
                pairs1.push(bi);
                pairs2.push(bj);
            }
        }
    }
};

/**
 * Removes duplicate pairs from the pair arrays.
 * @method makePairsUnique
 * @param {Array} pairs1
 * @param {Array} pairs2
 */
var Broadphase_makePairsUnique_temp = {},
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
        var idx = id1 < id2 ? id1+","+id2 :  id2+","+id1;
        t[idx] = i;
    }

    for(var idx in t){
        var i = t[idx];
        pairs1.push(p1[i]);
        pairs2.push(p2[i]);
        delete t[idx];
    }
};
