import { Box3, Vector3 } from 'feng3d';
import { Body } from '../objects/Body';
import { World } from '../world/World';

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
     *
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
     *
     * @param _world The world to search in
     * @param _p1 Empty array to be filled with body objects
     * @param _p2 Empty array to be filled with body objects
     */
    collisionPairs(_world: World, _p1: Body[], _p2: Body[])
    {
        throw new Error('collisionPairs not implemented for this BroadPhase class!');
    }

    /**
     * Check if a body pair needs to be intersection tested at all.
     *
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
        if (((bodyA.type & Body.STATIC) !== 0 || bodyA.sleepState === Body.SLEEPING)
            && ((bodyB.type & Body.STATIC) !== 0 || bodyB.sleepState === Body.SLEEPING))
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
    intersectionTest(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[])
    {
        if (this.useBoundingBoxes)
        {
            this.doBoundingBoxBroadphase(bodyA, bodyB, pairs1, pairs2);
        }
        else
        {
            this.doBoundingSphereBroadphase(bodyA, bodyB, pairs1, pairs2);
        }
    }

    /**
     * Check if the bounding spheres of two bodies are intersecting.
     * @param bodyA
     * @param bodyB
     * @param pairs1 bodyA is appended to this array if intersection
     * @param pairs2 bodyB is appended to this array if intersection
     */
    doBoundingSphereBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[])
    {
        const r = BroadphaseCollisionPairsR;
        bodyB.position.subTo(bodyA.position, r);
        const boundingRadiusSum2 = Math.pow(bodyA.boundingRadius + bodyB.boundingRadius, 2);
        const norm2 = r.lengthSquared;
        if (norm2 < boundingRadiusSum2)
        {
            pairs1.push(bodyA);
            pairs2.push(bodyB);
        }
    }

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
    }

    /**
     * Removes duplicate pairs from the pair arrays.
     * @param pairs1
     * @param pairs2
     */
    makePairsUnique(pairs1: Body[], pairs2: Body[])
    {
        const t = BroadphaseMakePairsUniqueTemp;
        const p1 = BroadphaseMakePairsUniqueP1;
        const p2 = BroadphaseMakePairsUniqueP2;
        const N = pairs1.length;

        for (let i = 0; i !== N; i++)
        {
            p1[i] = pairs1[i];
            p2[i] = pairs2[i];
        }

        pairs1.length = 0;
        pairs2.length = 0;

        for (let i = 0; i !== N; i++)
        {
            const id1 = p1[i].id;
            const id2 = p2[i].id;
            const key = id1 < id2 ? `${id1},${id2}` : `${id2},${id1}`;
            t[key] = i;
            t.keys.push(key);
        }

        for (let i = 0; i !== t.keys.length; i++)
        {
            const key = t.keys.pop();
            const pairIndex = t[key];
            pairs1.push(p1[pairIndex]);
            pairs2.push(p2[pairIndex]);
            delete t[key];
        }
    }

    /**
     * To be implemented by subcasses
     * @method setWorld
     * @param {World} _world
     */
    setWorld(_world: World)
    {
    }

    /**
     * Check if the bounding spheres of two bodies overlap.
     * @param bodyA
     * @param bodyB
     */
    static boundingSphereCheck(bodyA: Body, bodyB: Body)
    {
        const dist = bscDist;
        bodyA.position.subTo(bodyB.position, dist);

        return Math.pow(bodyA.shape.boundingSphereRadius + bodyB.shape.boundingSphereRadius, 2) > dist.lengthSquared;
    }

    /**
     * Returns all the bodies within the AABB.
     *
     * @param _world
     * @param _aabb
     * @param _result An array to store resulting bodies in.
     */
    aabbQuery(_world: World, _aabb: Box3, _result: Body[])
    {
        console.warn('.aabbQuery is not implemented in this Broadphase subclass.');

        return [];
    }
}

const BroadphaseCollisionPairsR = new Vector3();// Temp objects
// const Broadphase_collisionPairs_normal = new Vector3();
// const Broadphase_collisionPairs_quat = new Quaternion();
// const Broadphase_collisionPairs_relpos = new Vector3();

const BroadphaseMakePairsUniqueTemp: { keys: string[] } = { keys: [] };
const BroadphaseMakePairsUniqueP1: Body[] = [];
const BroadphaseMakePairsUniqueP2: Body[] = [];

const bscDist = new Vector3();
