import { Box3, Quaternion, Vector3 } from '@feng3d/math';
import { Transform } from '../math/Transform';
import { Octree } from '../utils/Octree';
import { Shape } from './Shape';

export class Trimesh extends Shape
{
    vertices: number[];
    /**
     * The normals data.
     */
    normals: number[];
    /**
     * The local AABB of the mesh.
     */
    aabb: Box3;
    /**
     * References to vertex pairs, making up all unique edges in the trimesh.
     */
    edges: number[];
    /**
     * Local scaling of the mesh. Use .setScale() to set it.
     */
    scale: Vector3;

    /**
     * The indexed triangles. Use .updateTree() to update it.
     */
    tree: Octree<number>;

    /**
     * @param vertices
     * @param indices
     *
     * @example
     *     // How to make a mesh with a single triangle
     *     let vertices = [
     *         0, 0, 0, // vertex 0
     *         1, 0, 0, // vertex 1
     *         0, 1, 0  // vertex 2
     *     ];
     *     let indices = [
     *         0, 1, 2  // triangle 0
     *     ];
     *     let trimeshShape = new Trimesh(vertices, indices);
     */
    constructor(vertices: number[], indices: number[])
    {
        super({
            type: Shape.types.TRIMESH
        });

        this.vertices = vertices.concat();

        /**
         * Array of integers, indicating which vertices each triangle consists of. The length of this array is thus 3 times the number of triangles.
         */
        this.indices = indices.concat();

        this.normals = [];

        this.aabb = new Box3();

        this.edges = null;

        this.scale = new Vector3(1, 1, 1);

        this.tree = new Octree();

        this.updateEdges();
        this.updateNormals();
        this.updateAABB();
        this.updateBoundingSphereRadius();
        this.updateTree();
    }

    updateTree()
    {
        const tree = this.tree;

        tree.reset();
        tree.aabb.copy(this.aabb);
        const scale = this.scale; // The local mesh AABB is scaled, but the octree AABB should be unscaled
        tree.aabb.min.x *= 1 / scale.x;
        tree.aabb.min.y *= 1 / scale.y;
        tree.aabb.min.z *= 1 / scale.z;
        tree.aabb.max.x *= 1 / scale.x;
        tree.aabb.max.y *= 1 / scale.y;
        tree.aabb.max.z *= 1 / scale.z;

        // Insert all triangles
        const triangleAABB = new Box3();
        const a = new Vector3();
        const b = new Vector3();
        const c = new Vector3();
        const points = [a, b, c];
        for (let i = 0; i < this.indices.length / 3; i++)
        {
            // this.getTriangleVertices(i, a, b, c);

            // Get unscaled triangle verts
            const i3 = i * 3;
            this._getUnscaledVertex(this.indices[i3], a);
            this._getUnscaledVertex(this.indices[i3 + 1], b);
            this._getUnscaledVertex(this.indices[i3 + 2], c);

            triangleAABB.fromPoints(points);
            tree.insert(triangleAABB, i);
        }
        tree.removeEmptyNodes();
    }

    /**
     * Get triangles in a local AABB from the trimesh.
     *
     * @param aabb
     * @param result An array of integers, referencing the queried triangles.
     */
    getTrianglesInAABB(aabb: Box3, result: number[])
    {
        unscaledAABB.copy(aabb);

        // Scale it to local
        const scale = this.scale;
        const isx = scale.x;
        const isy = scale.y;
        const isz = scale.z;
        const l = unscaledAABB.min;
        const u = unscaledAABB.max;
        l.x /= isx;
        l.y /= isy;
        l.z /= isz;
        u.x /= isx;
        u.y /= isy;
        u.z /= isz;

        return this.tree.aabbQuery(unscaledAABB, result);
    }

    /**
     * @param scale
     */
    setScale(scale: Vector3)
    {
        // let wasUniform = this.scale.x === this.scale.y === this.scale.z;// 等价下面代码?
        const wasUniform = this.scale.x === this.scale.y && this.scale.y === this.scale.z;// ?

        // let isUniform = scale.x === scale.y === scale.z;// 等价下面代码?
        const isUniform = scale.x === scale.y && scale.y === scale.z;// ?

        if (!(wasUniform && isUniform))
        {
            // Non-uniform scaling. Need to update normals.
            this.updateNormals();
        }
        this.scale.copy(scale);
        this.updateAABB();
        this.updateBoundingSphereRadius();
    }

    /**
     * Compute the normals of the faces. Will save in the .normals array.
     */
    updateNormals()
    {
        const n = computeNormalsN;

        // Generate normals
        const normals = this.normals;
        for (let i = 0; i < this.indices.length / 3; i++)
        {
            const i3 = i * 3;

            const a = this.indices[i3];
            const b = this.indices[i3 + 1];
            const c = this.indices[i3 + 2];

            this.getVertex(a, va);
            this.getVertex(b, vb);
            this.getVertex(c, vc);

            Trimesh.computeNormal(vb, va, vc, n);

            normals[i3] = n.x;
            normals[i3 + 1] = n.y;
            normals[i3 + 2] = n.z;
        }
    }

    /**
     * Update the .edges property
     */
    updateEdges()
    {
        const edges = {};
        // eslint-disable-next-line func-style
        const add = function (a: number, b: number)
        {
            const key = a < b ? `${a}_${b}` : `${b}_${a}`;
            edges[key] = true;
        };
        for (let i = 0; i < this.indices.length / 3; i++)
        {
            const i3 = i * 3;
            const a = this.indices[i3];
            const b = this.indices[i3 + 1];
            const c = this.indices[i3 + 2];
            add(a, b);
            add(b, c);
            add(c, a);
        }
        const keys = Object.keys(edges);
        this.edges = [];
        for (let i = 0; i < keys.length; i++)
        {
            const indices = keys[i].split('_');
            this.edges[2 * i] = parseInt(indices[0], 10);
            this.edges[2 * i + 1] = parseInt(indices[1], 10);
        }
    }

    /**
     * Get an edge vertex
     *
     * @param edgeIndex
     * @param firstOrSecond 0 or 1, depending on which one of the vertices you need.
     * @param vertexStore Where to store the result
     */
    getEdgeVertex(edgeIndex: number, firstOrSecond: number, vertexStore: Vector3)
    {
        const vertexIndex = this.edges[edgeIndex * 2 + (firstOrSecond ? 1 : 0)];
        this.getVertex(vertexIndex, vertexStore);
    }

    /**
     * Get a vector along an edge.
     *
     * @param edgeIndex
     * @param vectorStore
     */
    getEdgeVector(edgeIndex: number, vectorStore: Vector3)
    {
        const va = getEdgeVectorVa;
        const vb = getEdgeVectorVb;
        this.getEdgeVertex(edgeIndex, 0, va);
        this.getEdgeVertex(edgeIndex, 1, vb);
        vb.subTo(va, vectorStore);
    }

    /**
     * Get face normal given 3 vertices
     *
     * @param va
     * @param vb
     * @param vc
     * @param target
     */
    static computeNormal(va: Vector3, vb: Vector3, vc: Vector3, target: Vector3)
    {
        vb.subTo(va, ab);
        vc.subTo(vb, cb);
        cb.crossTo(ab, target);
        if (!target.isZero())
        {
            target.normalize();
        }
    }

    /**
     * Get vertex i.
     *
     * @param i
     * @param out
     * @return The "out" vector object
     */
    getVertex(i: number, out: Vector3)
    {
        const scale = this.scale;
        this._getUnscaledVertex(i, out);
        out.x *= scale.x;
        out.y *= scale.y;
        out.z *= scale.z;

        return out;
    }

    /**
     * Get raw vertex i
     *
     * @param i
     * @param out
     * @return The "out" vector object
     */
    private _getUnscaledVertex(i: number, out: Vector3)
    {
        const i3 = i * 3;
        const vertices = this.vertices;

        return out.set(
            vertices[i3],
            vertices[i3 + 1],
            vertices[i3 + 2]
        );
    }

    /**
     * Get a vertex from the trimesh,transformed by the given position and quaternion.
     *
     * @param i
     * @param pos
     * @param quat
     * @param out
     * @return The "out" vector object
     */
    getWorldVertex(i: number, pos: Vector3, quat: Quaternion, out: Vector3)
    {
        this.getVertex(i, out);
        Transform.pointToWorldFrame(pos, quat, out, out);

        return out;
    }

    /**
     * Get the three vertices for triangle i.
     *
     * @param i
     * @param a
     * @param b
     * @param c
     */
    getTriangleVertices(i: number, a: Vector3, b: Vector3, c: Vector3)
    {
        const i3 = i * 3;
        this.getVertex(this.indices[i3], a);
        this.getVertex(this.indices[i3 + 1], b);
        this.getVertex(this.indices[i3 + 2], c);
    }

    /**
     * Compute the normal of triangle i.
     *
     * @param i
     * @param target
     * @return The "target" vector object
     */
    getNormal(i: number, target: Vector3)
    {
        const i3 = i * 3;

        return target.set(
            this.normals[i3],
            this.normals[i3 + 1],
            this.normals[i3 + 2]
        );
    }

    /**
     *
     * @param mass
     * @param target
     * @return The "target" vector object
     */
    calculateLocalInertia(mass: number, target: Vector3)
    {
        // Approximate with box inertia
        // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
        this.computeLocalAABB(cliAabb);
        const x = cliAabb.max.x - cliAabb.min.x;
        const y = cliAabb.max.y - cliAabb.min.y;
        const z = cliAabb.max.z - cliAabb.min.z;

        return target.set(
            1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z),
            1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z),
            1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x)
        );
    }

    /**
     * Compute the local AABB for the trimesh
     *
     * @param aabb
     */
    computeLocalAABB(aabb: Box3)
    {
        const l = aabb.min;
        const u = aabb.max;
        const n = this.vertices.length;
        // const vertices = this.vertices;
        const v = computeLocalAABBWorldVert;

        this.getVertex(0, v);
        l.copy(v);
        u.copy(v);

        for (let i = 0; i !== n; i++)
        {
            this.getVertex(i, v);

            if (v.x < l.x)
            {
                l.x = v.x;
            }
            else if (v.x > u.x)
            {
                u.x = v.x;
            }

            if (v.y < l.y)
            {
                l.y = v.y;
            }
            else if (v.y > u.y)
            {
                u.y = v.y;
            }

            if (v.z < l.z)
            {
                l.z = v.z;
            }
            else if (v.z > u.z)
            {
                u.z = v.z;
            }
        }
    }

    /**
     * Update the .aabb property
     */
    updateAABB()
    {
        this.computeLocalAABB(this.aabb);
    }

    /**
     * Will update the .boundingSphereRadius property
     */
    updateBoundingSphereRadius()
    {
        // Assume points are distributed with local (0,0,0) as center
        let max2 = 0;
        const vertices = this.vertices;
        const v = new Vector3();
        for (let i = 0, N = vertices.length / 3; i !== N; i++)
        {
            this.getVertex(i, v);
            const norm2 = v.lengthSquared;
            if (norm2 > max2)
            {
                max2 = norm2;
            }
        }
        this.boundingSphereRadius = Math.sqrt(max2);
    }

    calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3)
    {
        /*
        let n = this.vertices.length / 3,
            verts = this.vertices;
        let minx,miny,minz,maxx,maxy,maxz;

        let v = tempWorldVertex;
        for(let i=0; i<n; i++){
            this.getVertex(i, v);
            quat.vmult(v, v);
            pos.addTo(v, v);
            if (v.x < minx || minx===undefined){
                minx = v.x;
            } else if(v.x > maxx || maxx===undefined){
                maxx = v.x;
            }

            if (v.y < miny || miny===undefined){
                miny = v.y;
            } else if(v.y > maxy || maxy===undefined){
                maxy = v.y;
            }

            if (v.z < minz || minz===undefined){
                minz = v.z;
            } else if(v.z > maxz || maxz===undefined){
                maxz = v.z;
            }
        }
        min.set(minx,miny,minz);
        max.set(maxx,maxy,maxz);
        */

        // Faster approximation using local AABB
        const frame = calculateWorldAABBFrame;
        const result = calculateWorldAABBAabb;
        frame.position = pos;
        frame.quaternion = quat;
        frame.toWorldFrameBox3(this.aabb, result);
        min.copy(result.min);
        max.copy(result.max);
    }

    /**
     * Get approximate volume
     */
    volume()
    {
        return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
    }

    /**
     * Create a Trimesh instance, shaped as a torus.
     *
     * @param radius
     * @param tube
     * @param radialSegments
     * @param tubularSegments
     * @param arc
     *
     * @return A torus
     */
    static createTorus(radius = 1, tube = 0.5, radialSegments = 8, tubularSegments = 6, arc = Math.PI * 2)
    {
        const vertices: number[] = [];
        const indices: number[] = [];

        for (let j = 0; j <= radialSegments; j++)
        {
            for (let i = 0; i <= tubularSegments; i++)
            {
                const u = i / tubularSegments * arc;
                const v = j / radialSegments * Math.PI * 2;

                const x = (radius + tube * Math.cos(v)) * Math.cos(u);
                const y = (radius + tube * Math.cos(v)) * Math.sin(u);
                const z = tube * Math.sin(v);

                vertices.push(x, y, z);
            }
        }

        for (let j = 1; j <= radialSegments; j++)
        {
            for (let i = 1; i <= tubularSegments; i++)
            {
                const a = (tubularSegments + 1) * j + i - 1;
                const b = (tubularSegments + 1) * (j - 1) + i - 1;
                const c = (tubularSegments + 1) * (j - 1) + i;
                const d = (tubularSegments + 1) * j + i;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        return new Trimesh(vertices, indices);
    }
}

const computeNormalsN = new Vector3();

const unscaledAABB = new Box3();

const getEdgeVectorVa = new Vector3();
const getEdgeVectorVb = new Vector3();

const cb = new Vector3();
const ab = new Vector3();

const va = new Vector3();
const vb = new Vector3();
const vc = new Vector3();

const cliAabb = new Box3();

const computeLocalAABBWorldVert = new Vector3();

// const tempWorldVertex = new Vector3();
const calculateWorldAABBFrame = new Transform();
const calculateWorldAABBAabb = new Box3();

