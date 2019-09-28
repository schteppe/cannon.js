namespace CANNON
{
    export class OctreeNode
    {
        /**
         * The root node
         */
        root: OctreeNode;

        /**
         * Boundary of this node
         */
        aabb: AABB;
        /**
         * Contained data at the current node level.
         * @property {Array} data
         */
        data: any[];

        /**
         * Children to this node
         */
        children: any[];
        maxDepth: number;

        /**
         * @class OctreeNode
         * @param {object} [options]
         * @param {Octree} [options.root]
         * @param {AABB} [options.aabb]
         */
        constructor(options)
        {
            options = options || {};

            this.root = options.root || null;
            this.aabb = options.aabb ? options.aabb.clone() : new AABB();
            this.data = [];
            this.children = [];
        }

    }

    export class Octree extends OctreeNode
    {
        /**
         * Maximum subdivision depth
         */
        maxDepth: number;


        /**
         * @class Octree
         * @param {AABB} aabb The total AABB of the tree
         * @param {object} [options]
         * @param {number} [options.maxDepth=8]
         * @extends OctreeNode
         */
        constructor(aabb?: AABB, options: { root?: any, aabb?: AABB, maxDepth?: number } = {})
        {
            super(options);
            options.root = null;
            options.aabb = aabb;

            this.maxDepth = typeof (options.maxDepth) !== 'undefined' ? options.maxDepth : 8;
        }

        reset(aabb?, options?)
        {
            this.children.length = this.data.length = 0;
        };

        /**
         * Insert data into this node
         * @method insert
         * @param  {AABB} aabb
         * @param  {object} elementData
         * @return {boolean} True if successful, otherwise false
         */
        insert(aabb, elementData, level)
        {
            var nodeData = this.data;
            level = level || 0;

            // Ignore objects that do not belong in this node
            if (!this.aabb.contains(aabb))
            {
                return false; // object cannot be added
            }

            var children = this.children;

            if (level < (this.maxDepth || this.root.maxDepth))
            {
                // Subdivide if there are no children yet
                var subdivided = false;
                if (!children.length)
                {
                    this.subdivide();
                    subdivided = true;
                }

                // add to whichever node will accept it
                for (var i = 0; i !== 8; i++)
                {
                    if (children[i].insert(aabb, elementData, level + 1))
                    {
                        return true;
                    }
                }

                if (subdivided)
                {
                    // No children accepted! Might as well just remove em since they contain none
                    children.length = 0;
                }
            }

            // Too deep, or children didnt want it. add it in current node
            nodeData.push(elementData);

            return true;
        };

        /**
         * Create 8 equally sized children nodes and put them in the .children array.
         */
        subdivide()
        {
            var aabb = this.aabb;
            var l = aabb.lowerBound;
            var u = aabb.upperBound;

            var children = this.children;

            children.push(
                new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(0, 0, 0) }) }),
                new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(1, 0, 0) }) }),
                new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(1, 1, 0) }) }),
                new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(1, 1, 1) }) }),
                new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(0, 1, 1) }) }),
                new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(0, 0, 1) }) }),
                new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(1, 0, 1) }) }),
                new OctreeNode({ aabb: new AABB({ lowerBound: new Vec3(0, 1, 0) }) })
            );

            u.vsub(l, halfDiagonal);
            halfDiagonal.scale(0.5, halfDiagonal);

            var root = this.root || this;

            for (var i = 0; i !== 8; i++)
            {
                var child = children[i];

                // Set current node as root
                child.root = root;

                // Compute bounds
                var lowerBound = child.aabb.lowerBound;
                lowerBound.x *= halfDiagonal.x;
                lowerBound.y *= halfDiagonal.y;
                lowerBound.z *= halfDiagonal.z;

                lowerBound.vadd(l, lowerBound);

                // Upper bound is always lower bound + halfDiagonal
                lowerBound.vadd(halfDiagonal, child.aabb.upperBound);
            }
        };

        /**
         * Get all data, potentially within an AABB
         * @method aabbQuery
         * @param  {AABB} aabb
         * @param  {array} result
         * @return {array} The "result" object
         */
        aabbQuery(aabb, result)
        {
            var nodeData = this.data;

            // abort if the range does not intersect this node
            // if (!this.aabb.overlaps(aabb)){
            //     return result;
            // }

            // Add objects at this level
            // Array.prototype.push.apply(result, nodeData);

            // Add child data
            // @todo unwrap recursion into a queue / loop, that's faster in JS
            var children = this.children;


            // for (var i = 0, N = this.children.length; i !== N; i++) {
            //     children[i].aabbQuery(aabb, result);
            // }

            var queue = [this];
            while (queue.length)
            {
                var node = queue.pop();
                if (node.aabb.overlaps(aabb))
                {
                    Array.prototype.push.apply(result, node.data);
                }
                Array.prototype.push.apply(queue, node.children);
            }

            return result;
        };

        /**
         * Get all data, potentially intersected by a ray.
         * @method rayQuery
         * @param  {Ray} ray
         * @param  {Transform} treeTransform
         * @param  {array} result
         * @return {array} The "result" object
         */
        rayQuery(ray, treeTransform, result)
        {

            // Use aabb query for now.
            // @todo implement real ray query which needs less lookups
            ray.getAABB(tmpAABB);
            tmpAABB.toLocalFrame(treeTransform, tmpAABB);
            this.aabbQuery(tmpAABB, result);

            return result;
        };

        removeEmptyNodes()
        {
            var queue = [this];
            while (queue.length)
            {
                var node = queue.pop();
                for (var i = node.children.length - 1; i >= 0; i--)
                {
                    if (!node.children[i].data.length)
                    {
                        node.children.splice(i, 1);
                    }
                }
                Array.prototype.push.apply(queue, node.children);
            }
        };
    }

    var halfDiagonal = new Vec3();

    var tmpAABB = new AABB();
}