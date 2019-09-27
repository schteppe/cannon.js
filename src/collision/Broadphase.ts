namespace cannon
{
    export class Broadphase
    {

        /**
        * The world to search for collisions in.
        */
        world: World;

        /**
         * If set to true, the broadphase uses bounding boxes for intersection test, else it uses bounding spheres.
         */
        useBoundingBoxes: boolean;

        /**
         * Set to true if the objects in the world moved.
         */
        dirty: boolean;

        /**
         * Base class for broadphase implementations
         * @author schteppe
         */
        constructor()
        {
            this.world = null;
            this.useBoundingBoxes = false;
            this.dirty = true;
        }

        /**
         * Get the collision pairs from the world
         * @param world The world to search in
         * @param p1 Empty array to be filled with body objects
         * @param p2 Empty array to be filled with body objects
         */
        collisionPairs(world: World, p1: any[], p2: any[])
        {
            throw new Error("collisionPairs not implemented for this BroadPhase class!");
        };

        /**
         * Check if a body pair needs to be intersection tested at all.
         * @param bodyA
         * @param bodyB
         */
        needBroadphaseCollision(bodyA: Body, bodyB: Body)
        {
            // Check collision filter masks
            if ((bodyA.collisionFilterGroup & bodyB.collisionFilterMask) === 0 || (bodyB.collisionFilterGroup & bodyA.collisionFilterMask) === 0)
            {
                return false;
            }

            // Check types
            if (((bodyA.type & Body.STATIC) !== 0 || bodyA.sleepState === Body.SLEEPING) &&
                ((bodyB.type & Body.STATIC) !== 0 || bodyB.sleepState === Body.SLEEPING))
            {
                // Both bodies are static or sleeping. Skip.
                return false;
            }

            return true;
        }

        /**
         * Check if the bounding volumes of two bodies intersect.
          * 
          * @param bodyA 
          * @param bodyB 
          * @param pairs1 
          * @param pairs2 
          */
        intersectionTest(bodyA: Body, bodyB: Body, pairs1: any[], pairs2: any[])
        {
            if (this.useBoundingBoxes)
            {
                this.doBoundingBoxBroadphase(bodyA, bodyB, pairs1, pairs2);
            } else
            {
                this.doBoundingSphereBroadphase(bodyA, bodyB, pairs1, pairs2);
            }
        };

        /**
         * Check if the bounding spheres of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1 bodyA is appended to this array if intersection
         * @param pairs2 bodyB is appended to this array if intersection
         */
        doBoundingSphereBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[])
        {
            var r = Broadphase_collisionPairs_r;
            bodyB.position.vsub(bodyA.position, r);
            var boundingRadiusSum2 = Math.pow(bodyA.boundingRadius + bodyB.boundingRadius, 2);
            var norm2 = r.norm2();
            if (norm2 < boundingRadiusSum2)
            {
                pairs1.push(bodyA);
                pairs2.push(bodyB);
            }
        };

        /**
         * Check if the bounding boxes of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1
         * @param pairs2
         */
        doBoundingBoxBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[])
        {
            if (bodyA.aabbNeedsUpdate)
            {
                bodyA.computeAABB();
            }
            if (bodyB.aabbNeedsUpdate)
            {
                bodyB.computeAABB();
            }

            // Check AABB / AABB
            if (bodyA.aabb.overlaps(bodyB.aabb))
            {
                pairs1.push(bodyA);
                pairs2.push(bodyB);
            }
        };

        /**
         * Removes duplicate pairs from the pair arrays.
         * @param pairs1
         * @param pairs2
         */
        makePairsUnique(pairs1: any[], pairs2: any[])
        {
            var t = Broadphase_makePairsUnique_temp,
                p1 = Broadphase_makePairsUnique_p1,
                p2 = Broadphase_makePairsUnique_p2,
                N = pairs1.length;

            for (var i = 0; i !== N; i++)
            {
                p1[i] = pairs1[i];
                p2[i] = pairs2[i];
            }

            pairs1.length = 0;
            pairs2.length = 0;

            for (var i = 0; i !== N; i++)
            {
                var id1 = p1[i].id,
                    id2 = p2[i].id;
                var key = id1 < id2 ? id1 + "," + id2 : id2 + "," + id1;
                t[key] = i;
                t.keys.push(key);
            }

            for (var i = 0; i !== t.keys.length; i++)
            {
                var key = t.keys.pop();
                var pairIndex = t[key];
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
        setWorld(world: World)
        {
        };

        /**
         * Check if the bounding spheres of two bodies overlap.
         * @param bodyA
         * @param bodyB
         */
        static boundingSphereCheck(bodyA: Body, bodyB: Body)
        {
            var dist = bsc_dist;
            bodyA.position.vsub(bodyB.position, dist);
            return Math.pow(bodyA.shape.boundingSphereRadius + bodyB.shape.boundingSphereRadius, 2) > dist.norm2();
        };

        /**
         * Returns all the bodies within the AABB.
         * 
         * @param world 
         * @param aabb 
         * @param result An array to store resulting bodies in.
         */
        aabbQuery(world: World, aabb: AABB, result: [])
        {
            console.warn('.aabbQuery is not implemented in this Broadphase subclass.');
            return [];
        };

    }

    var Broadphase_collisionPairs_r = new Vec3();// Temp objects
    var Broadphase_collisionPairs_normal = new Vec3();
    var Broadphase_collisionPairs_quat = new Quaternion();
    var Broadphase_collisionPairs_relpos = new Vec3();


    var Broadphase_makePairsUnique_temp: { keys: string[] } = { keys: [] };
    var Broadphase_makePairsUnique_p1: any[] = [];
    var Broadphase_makePairsUnique_p2: any[] = [];

    var bsc_dist = new Vec3();
}