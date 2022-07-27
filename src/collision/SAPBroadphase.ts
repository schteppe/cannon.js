import { IEvent } from 'feng3d';
import { Box3 } from 'feng3d';
import { Body } from '../objects/Body';
import { World } from '../world/World';
import { Broadphase } from './Broadphase';

export class SAPBroadphase extends Broadphase
{
    /**
     * List of bodies currently in the broadphase.
     */
    axisList: Body[];
    /**
     * Axis to sort the bodies along. Set to 0 for x axis, and 1 for y axis. For best performance, choose an axis that the bodies are spread out more on.
     */
    axisIndex: number;

    private _addBodyHandler(event: IEvent<Body>)
    {
        this.axisList.push(event.data);
    }
    private _removeBodyHandler(event: IEvent<Body>)
    {
        const idx = this.axisList.indexOf(event.data);
        if (idx !== -1)
        {
            this.axisList.splice(idx, 1);
        }
    }

    /**
     * Sweep and prune broadphase along one axis.
     *
     * @param world
     */
    constructor(world: World)
    {
        super();

        this.axisList = [];

        this.world = null;

        this.axisIndex = 0;

        // const axisList = this.axisList;

        if (world)
        {
            this.setWorld(world);
        }
    }

    /**
     * Change the world
     * @param world
     */
    setWorld(world: World)
    {
        // Clear the old axis array
        this.axisList.length = 0;

        // Add all bodies from the new world
        for (let i = 0; i < world.bodies.length; i++)
        {
            this.axisList.push(world.bodies[i]);
        }

        // Remove old handlers, if any
        if (this.world)
        {
            this.world.off('addBody', this._addBodyHandler, this);
            this.world.off('removeBody', this._removeBodyHandler, this);
        }

        this.world = world;

        // Add handlers to update the list of bodies.
        if (this.world)
        {
            this.world.on('addBody', this._addBodyHandler, this);
            this.world.on('removeBody', this._removeBodyHandler, this);
        }

        this.dirty = true;
    }

    static insertionSortX(a: Body[])
    {
        for (let i = 1, l = a.length; i < l; i++)
        {
            const v = a[i];
            let j = i - 1;
            for (; j >= 0; j--)
            {
                if (a[j].aabb.min.x <= v.aabb.min.x)
                {
                    break;
                }
                a[j + 1] = a[j];
            }
            a[j + 1] = v;
        }

        return a;
    }

    static insertionSortY(a: Body[])
    {
        for (let i = 1, l = a.length; i < l; i++)
        {
            const v = a[i];
            let j = i - 1;
            for (; j >= 0; j--)
            {
                if (a[j].aabb.min.y <= v.aabb.min.y)
                {
                    break;
                }
                a[j + 1] = a[j];
            }
            a[j + 1] = v;
        }

        return a;
    }

    static insertionSortZ(a: Body[])
    {
        for (let i = 1, l = a.length; i < l; i++)
        {
            const v = a[i];
            let j = i - 1;
            for (; j >= 0; j--)
            {
                if (a[j].aabb.min.z <= v.aabb.min.z)
                {
                    break;
                }
                a[j + 1] = a[j];
            }
            a[j + 1] = v;
        }

        return a;
    }

    /**
     * Collect all collision pairs
     * @param _world
     * @param p1
     * @param p2
     */
    collisionPairs(_world: World, p1: Body[], p2: Body[])
    {
        const bodies = this.axisList;
        const N = bodies.length;
        const axisIndex = this.axisIndex;
        let i: number; let
            j: number;

        if (this.dirty)
        {
            this.sortList();
            this.dirty = false;
        }

        // Look through the list
        for (i = 0; i !== N; i++)
        {
            const bi = bodies[i];

            for (j = i + 1; j < N; j++)
            {
                const bj = bodies[j];

                if (!this.needBroadphaseCollision(bi, bj))
                {
                    continue;
                }

                if (!SAPBroadphase.checkBounds(bi, bj, axisIndex))
                {
                    break;
                }

                this.intersectionTest(bi, bj, p1, p2);
            }
        }
    }

    sortList()
    {
        const axisList = this.axisList;
        const axisIndex = this.axisIndex;
        const N = axisList.length;

        // Update AABBs
        for (let i = 0; i !== N; i++)
        {
            const bi = axisList[i];
            if (bi.aabbNeedsUpdate)
            {
                bi.computeAABB();
            }
        }

        // Sort the list
        if (axisIndex === 0)
        {
            SAPBroadphase.insertionSortX(axisList);
        }
        else if (axisIndex === 1)
        {
            SAPBroadphase.insertionSortY(axisList);
        }
        else if (axisIndex === 2)
        {
            SAPBroadphase.insertionSortZ(axisList);
        }
    }

    /**
     * Check if the bounds of two bodies overlap, along the given SAP axis.
     * @param bi
     * @param bj
     * @param axisIndex
     */
    static checkBounds(bi: Body, bj: Body, axisIndex: number)
    {
        let biPos: number;
        let bjPos: number;

        if (axisIndex === 0)
        {
            biPos = bi.position.x;
            bjPos = bj.position.x;
        }
        else if (axisIndex === 1)
        {
            biPos = bi.position.y;
            bjPos = bj.position.y;
        }
        else if (axisIndex === 2)
        {
            biPos = bi.position.z;
            bjPos = bj.position.z;
        }

        const ri = bi.boundingRadius;
        const rj = bj.boundingRadius;
        // const boundA1 = biPos - ri;
        const boundA2 = biPos + ri;
        const boundB1 = bjPos - rj;
        // const boundB2 = bjPos + rj;

        return boundB1 < boundA2;
    }

    /**
     * Computes the variance of the body positions and estimates the best
     * axis to use. Will automatically set property .axisIndex.
     */
    autoDetectAxis()
    {
        let sumX = 0;
        let sumX2 = 0;
        let sumY = 0;
        let sumY2 = 0;
        let sumZ = 0;
        let sumZ2 = 0;
        const bodies = this.axisList;
        const N = bodies.length;
        const invN = 1 / N;

        for (let i = 0; i !== N; i++)
        {
            const b = bodies[i];

            const centerX = b.position.x;
            sumX += centerX;
            sumX2 += centerX * centerX;

            const centerY = b.position.y;
            sumY += centerY;
            sumY2 += centerY * centerY;

            const centerZ = b.position.z;
            sumZ += centerZ;
            sumZ2 += centerZ * centerZ;
        }

        const varianceX = sumX2 - sumX * sumX * invN;
        const varianceY = sumY2 - sumY * sumY * invN;
        const varianceZ = sumZ2 - sumZ * sumZ * invN;

        if (varianceX > varianceY)
        {
            if (varianceX > varianceZ)
            {
                this.axisIndex = 0;
            }
            else
            {
                this.axisIndex = 2;
            }
        }
        else if (varianceY > varianceZ)
        {
            this.axisIndex = 1;
        }
        else
        {
            this.axisIndex = 2;
        }
    }

    /**
     * Returns all the bodies within an AABB.
     * @param _world
     * @param aabb
     * @param result An array to store resulting bodies in.
     */
    aabbQuery(_world: World, aabb: Box3, result: Body[])
    {
        result = result || [];

        if (this.dirty)
        {
            this.sortList();
            this.dirty = false;
        }

        // const axisIndex = this.axisIndex; let
        //     axis = 'x';
        // if (axisIndex === 1) { axis = 'y'; }
        // if (axisIndex === 2) { axis = 'z'; }

        const axisList = this.axisList;
        // const lower = aabb.min[axis];
        // const upper = aabb.max[axis];
        for (let i = 0; i < axisList.length; i++)
        {
            const b = axisList[i];

            if (b.aabbNeedsUpdate)
            {
                b.computeAABB();
            }

            if (b.aabb.overlaps(aabb))
            {
                result.push(b);
            }
        }

        return result;
    }
}
