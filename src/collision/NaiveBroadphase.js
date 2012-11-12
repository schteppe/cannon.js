/*global CANNON:true */

/**
 * @class CANNON.NaiveBroadphase
 * @brief Naive broadphase implementation, used in lack of better ones.
 * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
 * @extends CANNON.Broadphase
 */
 CANNON.NaiveBroadphase = function(){
    this.temp = {
        r: new CANNON.Vec3(),
        normal: new CANNON.Vec3(),
        quat: new CANNON.Quaternion(),
        relpos : new CANNON.Vec3(),
    };
};
CANNON.NaiveBroadphase.prototype = new CANNON.Broadphase();
CANNON.NaiveBroadphase.prototype.constructor = CANNON.NaiveBroadphase;

/**
 * @method collisionPairs
 * @memberof CANNON.NaiveBroadphase
 * @brief Get all the collision pairs in the physics world
 * @param CANNON.World world
 * @return array An array containing two arrays of integers. The integers corresponds to the body indices.
 */
 CANNON.NaiveBroadphase.prototype.collisionPairs = function(world){
    var pairs1 = [], pairs2 = [];
    var n = world.numObjects(),
    bodies = world.bodies;

    // Local fast access
    var types = CANNON.Shape.types;
    var BOX_SPHERE_COMPOUND_CONVEX = types.SPHERE | types.BOX | types.COMPOUND | types.CONVEXPOLYHEDRON,
        PLANE = types.PLANE,
        STATIC_OR_KINEMATIC = CANNON.Body.STATIC | CANNON.Body.KINEMATIC;

    // Temp vecs
    var temp = this.temp;
    var r = temp.r,
    normal = temp.normal,
    quat = temp.quat,
    relpos = temp.relpos;

    // Naive N^2 ftw!
    for(var i=0; i<n; i++){
        for(var j=0; j<i; j++){
            var bi = bodies[i], bj = bodies[j];

            if(((bi.motionstate & STATIC_OR_KINEMATIC)!==0 || bi.isSleeping()) &&
               ((bj.motionstate & STATIC_OR_KINEMATIC)!==0 || bj.isSleeping())) {
                // Both bodies are static, kinematic or sleeping. Skip.
                continue;
            }

            var bishape = bi.shape, bjshape = bj.shape;
            if(bishape && bjshape){
                var ti = bishape.type, tj = bjshape.type;

                // --- Box / sphere / compound / convexpolyhedron collision ---
                if((ti & BOX_SPHERE_COMPOUND_CONVEX) && (tj & BOX_SPHERE_COMPOUND_CONVEX)){
                    // Rel. position
                    bj.position.vsub(bi.position,r);

                    var boundingRadiusSum = bishape.boundingSphereRadius() + bjshape.boundingSphereRadius();
                    if(r.norm2()<boundingRadiusSum*boundingRadiusSum){
                        pairs1.push(bi);
                        pairs2.push(bj);
                    }

                    // --- Sphere/box/compound/convexpoly versus plane ---
                } else if((ti & BOX_SPHERE_COMPOUND_CONVEX) && (tj & types.PLANE) || (tj & BOX_SPHERE_COMPOUND_CONVEX) && (ti & types.PLANE)){
                    var pi = (ti===PLANE) ? i : j, // Plane
                    oi = (ti!==PLANE) ? i : j; // Other
                    
                    // Rel. position
                    bodies[oi].position.vsub(bodies[pi].position,r);
                    normal.set(0,0,1);
                    bodies[pi].quaternion.vmult(normal,normal);
                    
                    var q = r.dot(normal) - bodies[oi].shape.boundingSphereRadius();
                    if(q<0.0){
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
                        // todo: particle vs box,sphere,compound,convex
                        if(type === types.SPHERE){
                            particle.position.vsub(other.position,relpos);
                            if(Math.pow(otherShape.radius,2) >= relpos.norm2()){
                                pairs1.push(particle);
                                pairs2.push(other);
                            }
                        }
                    } else if(type & types.PLANE){
                        // particle/plane
                        var plane = other;
                        plane.quaternion.vmult(normal,normal);
                        particle.position.vsub(plane.position,relpos);
                        if(normal.dot(relpos)<=0.0){
                            pairs1.push(particle);
                            pairs2.push(other);
                        }
                    }
                }
            }
        }
    }
    return [pairs1,pairs2];
};
