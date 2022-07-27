import { Box3, Vector3 } from 'feng3d';
import { Ray } from '../collision/Ray';
import { Transform } from '../math/Transform';

export class OctreeNode<T>
{
    /**
     * The root node
     */
    root: OctreeNode<T>;

    /**
     * Boundary of this node
     */
    aabb: Box3;
    /**
     * Contained data at the current node level.
     * @property {Array} data
     */
    data: T[];

    /**
     * Children to this node
     */
    children: OctreeNode<T>[];
    maxDepth: number;

    /**
     *
     * @param options
     */
    constructor(options: { root?: OctreeNode<T>, aabb?: Box3 } = {})
    {
        this.root = options.root || null;
        this.aabb = options.aabb ? options.aabb.clone() : new Box3();
        this.data = [];
        this.children = [];
    }

    reset()
    {
        this.children.length = this.data.length = 0;
    }

    /**
     * Insert data into this node
     *
     * @param aabb
     * @param elementData
     * @return True if successful, otherwise false
     */
    insert(aabb: Box3, elementData: T, level = 0)
    {
        const nodeData = this.data;

        // Ignore objects that do not belong in this node
        if (!this.aabb.contains(aabb))
        {
            return false; // object cannot be added
        }

        const children = this.children;

        if (level < (this.maxDepth || this.root.maxDepth))
        {
            // Subdivide if there are no children yet
            let subdivided = false;
            if (!children.length)
            {
                this.subdivide();
                subdivided = true;
            }

            // add to whichever node will accept it
            for (let i = 0; i !== 8; i++)
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
    }

    /**
     * Create 8 equally sized children nodes and put them in the .children array.
     */
    subdivide()
    {
        const aabb = this.aabb;
        const l = aabb.min;
        const u = aabb.max;

        const children = this.children;

        children.push(
            new OctreeNode({ aabb: new Box3(new Vector3(0, 0, 0)) }),
            new OctreeNode({ aabb: new Box3(new Vector3(1, 0, 0)) }),
            new OctreeNode({ aabb: new Box3(new Vector3(1, 1, 0)) }),
            new OctreeNode({ aabb: new Box3(new Vector3(1, 1, 1)) }),
            new OctreeNode({ aabb: new Box3(new Vector3(0, 1, 1)) }),
            new OctreeNode({ aabb: new Box3(new Vector3(0, 0, 1)) }),
            new OctreeNode({ aabb: new Box3(new Vector3(1, 0, 1)) }),
            new OctreeNode({ aabb: new Box3(new Vector3(0, 1, 0)) })
        );

        u.subTo(l, halfDiagonal);
        halfDiagonal.scaleNumberTo(0.5, halfDiagonal);

        const root = this.root || this;

        for (let i = 0; i !== 8; i++)
        {
            const child = children[i];

            // Set current node as root
            child.root = root;

            // Compute bounds
            const lowerBound = child.aabb.min;
            lowerBound.x *= halfDiagonal.x;
            lowerBound.y *= halfDiagonal.y;
            lowerBound.z *= halfDiagonal.z;

            lowerBound.addTo(l, lowerBound);

            // Upper bound is always lower bound + halfDiagonal
            lowerBound.addTo(halfDiagonal, child.aabb.max);
        }
    }

    /**
     * Get all data, potentially within an AABB
     *
     * @param aabb
     * @param result
     * @return The "result" object
     */
    aabbQuery(aabb: Box3, result: T[])
    {
        // const nodeData = this.data;

        // abort if the range does not intersect this node
        // if (!this.aabb.overlaps(aabb)){
        //     return result;
        // }

        // Add objects at this level
        // Array.prototype.push.apply(result, nodeData);

        // Add child data
        // @todo unwrap recursion into a queue / loop, that's faster in JS
        // const children = this.children;

        // for (var i = 0, N = this.children.length; i !== N; i++) {
        //     children[i].aabbQuery(aabb, result);
        // }

        const queue = [this];
        while (queue.length)
        {
            const node = queue.pop();
            if (node.aabb.overlaps(aabb))
            {
                Array.prototype.push.apply(result, node.data);
            }
            Array.prototype.push.apply(queue, node.children);
        }

        return result;
    }

    /**
     * Get all data, potentially intersected by a ray.
     *
     * @param ray
     * @param treeTransform
     * @param result
     * @return The "result" object
     */
    rayQuery(ray: Ray, treeTransform: Transform, result: T[])
    {
        // Use aabb query for now.
        // @todo implement real ray query which needs less lookups
        ray.getAABB(tmpAABB);
        treeTransform.toLocalFrameBox3(tmpAABB, tmpAABB);
        this.aabbQuery(tmpAABB, result);

        return result;
    }

    removeEmptyNodes()
    {
        const queue = [this];
        while (queue.length)
        {
            const node = queue.pop();
            for (let i = node.children.length - 1; i >= 0; i--)
            {
                if (!node.children[i].data.length)
                {
                    node.children.splice(i, 1);
                }
            }
            Array.prototype.push.apply(queue, node.children);
        }
    }
}

export class Octree<T> extends OctreeNode<T>
{
    /**
     * Maximum subdivision depth
     */
    declare maxDepth: number;

    /**
     * @class Octree
     * @param {Box3} aabb The total AABB of the tree
     * @param {object} [options]
     * @param {number} [options.maxDepth=8]
     * @extends OctreeNode
     */
    constructor(aabb?: Box3, options: { root?: OctreeNode<T>, aabb?: Box3, maxDepth?: number } = {})
    {
        options.root = null;
        options.aabb = aabb;
        super(options);

        this.maxDepth = typeof (options.maxDepth) !== 'undefined' ? options.maxDepth : 8;
    }
}

const halfDiagonal = new Vector3();

const tmpAABB = new Box3();
