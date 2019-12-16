namespace CANNON
{
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

        private _addBodyHandler: (e: { body: Body }) => void;
        private _removeBodyHandler: (e: { body: Body }) => void;

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

            var axisList = this.axisList;

            this._addBodyHandler = function (e)
            {
                axisList.push(e.body);
            };

            this._removeBodyHandler = function (e)
            {
                var idx = axisList.indexOf(e.body);
                if (idx !== -1)
                {
                    axisList.splice(idx, 1);
                }
            };

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
            for (var i = 0; i < world.bodies.length; i++)
            {
                this.axisList.push(world.bodies[i]);
            }

            // Remove old handlers, if any
            world.removeEventListener("addBody", this._addBodyHandler);
            world.removeEventListener("removeBody", this._removeBodyHandler);

            // Add handlers to update the list of bodies.
            world.addEventListener("addBody", this._addBodyHandler);
            world.addEventListener("removeBody", this._removeBodyHandler);

            this.world = world;
            this.dirty = true;
        }

        static insertionSortX(a: Body[])
        {
            for (var i = 1, l = a.length; i < l; i++)
            {
                var v = a[i];
                for (var j = i - 1; j >= 0; j--)
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
            for (var i = 1, l = a.length; i < l; i++)
            {
                var v = a[i];
                for (var j = i - 1; j >= 0; j--)
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
            for (var i = 1, l = a.length; i < l; i++)
            {
                var v = a[i];
                for (var j = i - 1; j >= 0; j--)
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
         * @param world
         * @param p1
         * @param p2
         */
        collisionPairs(world: World, p1: Body[], p2: Body[])
        {
            var bodies = this.axisList,
                N = bodies.length,
                axisIndex = this.axisIndex,
                i: number, j: number;

            if (this.dirty)
            {
                this.sortList();
                this.dirty = false;
            }

            // Look through the list
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];

                for (j = i + 1; j < N; j++)
                {
                    var bj = bodies[j];

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
            var axisList = this.axisList;
            var axisIndex = this.axisIndex;
            var N = axisList.length;

            // Update AABBs
            for (var i = 0; i !== N; i++)
            {
                var bi = axisList[i];
                if (bi.aabbNeedsUpdate)
                {
                    bi.computeAABB();
                }
            }

            // Sort the list
            if (axisIndex === 0)
            {
                SAPBroadphase.insertionSortX(axisList);
            } else if (axisIndex === 1)
            {
                SAPBroadphase.insertionSortY(axisList);
            } else if (axisIndex === 2)
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
            var biPos: number;
            var bjPos: number;

            if (axisIndex === 0)
            {
                biPos = bi.position.x;
                bjPos = bj.position.x;
            } else if (axisIndex === 1)
            {
                biPos = bi.position.y;
                bjPos = bj.position.y;
            } else if (axisIndex === 2)
            {
                biPos = bi.position.z;
                bjPos = bj.position.z;
            }

            var ri = bi.boundingRadius,
                rj = bj.boundingRadius,
                boundA1 = biPos - ri,
                boundA2 = biPos + ri,
                boundB1 = bjPos - rj,
                boundB2 = bjPos + rj;

            return boundB1 < boundA2;
        }

        /**
         * Computes the variance of the body positions and estimates the best
         * axis to use. Will automatically set property .axisIndex.
         */
        autoDetectAxis()
        {
            var sumX = 0,
                sumX2 = 0,
                sumY = 0,
                sumY2 = 0,
                sumZ = 0,
                sumZ2 = 0,
                bodies = this.axisList,
                N = bodies.length,
                invN = 1 / N;

            for (var i = 0; i !== N; i++)
            {
                var b = bodies[i];

                var centerX = b.position.x;
                sumX += centerX;
                sumX2 += centerX * centerX;

                var centerY = b.position.y;
                sumY += centerY;
                sumY2 += centerY * centerY;

                var centerZ = b.position.z;
                sumZ += centerZ;
                sumZ2 += centerZ * centerZ;
            }

            var varianceX = sumX2 - sumX * sumX * invN,
                varianceY = sumY2 - sumY * sumY * invN,
                varianceZ = sumZ2 - sumZ * sumZ * invN;

            if (varianceX > varianceY)
            {
                if (varianceX > varianceZ)
                {
                    this.axisIndex = 0;
                } else
                {
                    this.axisIndex = 2;
                }
            } else if (varianceY > varianceZ)
            {
                this.axisIndex = 1;
            } else
            {
                this.axisIndex = 2;
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

            if (this.dirty)
            {
                this.sortList();
                this.dirty = false;
            }

            var axisIndex = this.axisIndex, axis = 'x';
            if (axisIndex === 1) { axis = 'y'; }
            if (axisIndex === 2) { axis = 'z'; }

            var axisList = this.axisList;
            var lower = aabb.min[axis];
            var upper = aabb.max[axis];
            for (var i = 0; i < axisList.length; i++)
            {
                var b = axisList[i];

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
}