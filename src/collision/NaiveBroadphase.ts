import { Box3 } from 'feng3d';
import { Body } from '../objects/Body';
import { World } from '../world/World';
import { Broadphase } from './Broadphase';

export class NaiveBroadphase extends Broadphase
{
    /**
     * Naive broadphase implementation, used in lack of better ones.
     * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
     */
    constructor()
    {
        super();
    }

    /**
     * Get all the collision pairs in the physics world
     * @param world
     * @param pairs1
     * @param pairs2
     */
    collisionPairs(world: World, pairs1: Body[], pairs2: Body[])
    {
        const bodies = world.bodies;
        const n = bodies.length;
        let i: number; let j: number; let bi: Body;
        let bj: Body;

        // Naive N^2 ftw!
        for (i = 0; i !== n; i++)
        {
            for (j = 0; j !== i; j++)
            {
                bi = bodies[i];
                bj = bodies[j];

                if (!this.needBroadphaseCollision(bi, bj))
                {
                    continue;
                }

                this.intersectionTest(bi, bj, pairs1, pairs2);
            }
        }
    }

    /**
     * Returns all the bodies within an AABB.
     * @param world
     * @param aabb
     * @param result An array to store resulting bodies in.
     */
    aabbQuery(world: World, aabb: Box3, result: Body[])
    {
        result = result || [];

        for (let i = 0; i < world.bodies.length; i++)
        {
            const b = world.bodies[i];

            if (b.aabbNeedsUpdate)
            {
                b.computeAABB();
            }

            // Ugly hack until Body gets aabb
            if (b.aabb.overlaps(aabb))
            {
                result.push(b);
            }
        }

        return result;
    }
}

// const tmpAABB = new Box3();
