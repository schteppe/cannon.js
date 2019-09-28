namespace CANNON
{
    export class Trimesh extends Shape
    {
        vertices: number[];
        /**
         * The normals data.
         */
        normals: Float32Array;
        /**
         * The local AABB of the mesh.
         */
        aabb: AABB;
        /**
         * References to vertex pairs, making up all unique edges in the trimesh.
         */
        edges: any[];
        /**
         * Local scaling of the mesh. Use .setScale() to set it.
         */
        scale: Vec3;

        /**
         * The indexed triangles. Use .updateTree() to update it.
         */
        tree: Octree;

        /**
         * @param vertices
         * @param indices
         * 
         * @example
         *     // How to make a mesh with a single triangle
         *     var vertices = [
         *         0, 0, 0, // vertex 0
         *         1, 0, 0, // vertex 1
         *         0, 1, 0  // vertex 2
         *     ];
         *     var indices = [
         *         0, 1, 2  // triangle 0
         *     ];
         *     var trimeshShape = new Trimesh(vertices, indices);
         */
        constructor(vertices: number[], indices: number[])
        {
            super({
                type: Shape.types.TRIMESH
            });

            this.vertices = <any>new Float32Array(vertices);

            /**
             * Array of integers, indicating which vertices each triangle consists of. The length of this array is thus 3 times the number of triangles.
             */
            this.indices = <any>new Int16Array(indices);

            this.normals = new Float32Array(indices.length);

            this.aabb = new AABB();

            this.edges = null;

            this.scale = new Vec3(1, 1, 1);

            this.tree = new Octree();

            this.updateEdges();
            this.updateNormals();
            this.updateAABB();
            this.updateBoundingSphereRadius();
            this.updateTree();
        }

        updateTree()
        {
            var tree = this.tree;

            tree.reset();
            tree.aabb.copy(this.aabb);
            var scale = this.scale; // The local mesh AABB is scaled, but the octree AABB should be unscaled
            tree.aabb.lowerBound.x *= 1 / scale.x;
            tree.aabb.lowerBound.y *= 1 / scale.y;
            tree.aabb.lowerBound.z *= 1 / scale.z;
            tree.aabb.upperBound.x *= 1 / scale.x;
            tree.aabb.upperBound.y *= 1 / scale.y;
            tree.aabb.upperBound.z *= 1 / scale.z;

            // Insert all triangles
            var triangleAABB = new AABB();
            var a = new Vec3();
            var b = new Vec3();
            var c = new Vec3();
            var points = [a, b, c];
            for (var i = 0; i < this.indices.length / 3; i++)
            {
                //this.getTriangleVertices(i, a, b, c);

                // Get unscaled triangle verts
                var i3 = i * 3;
                this._getUnscaledVertex(this.indices[i3], a);
                this._getUnscaledVertex(this.indices[i3 + 1], b);
                this._getUnscaledVertex(this.indices[i3 + 2], c);

                triangleAABB.setFromPoints(points);
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
        getTrianglesInAABB(aabb: AABB, result: number[])
        {
            unscaledAABB.copy(aabb);

            // Scale it to local
            var scale = this.scale;
            var isx = scale.x;
            var isy = scale.y;
            var isz = scale.z;
            var l = unscaledAABB.lowerBound;
            var u = unscaledAABB.upperBound;
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
        setScale(scale: Vec3)
        {
            // var wasUniform = this.scale.x === this.scale.y === this.scale.z;// 等价下面代码?
            var wasUniform = this.scale.x === this.scale.y && this.scale.y === this.scale.z;//?

            // var isUniform = scale.x === scale.y === scale.z;// 等价下面代码?
            var isUniform = scale.x === scale.y && scale.y === scale.z;//?

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
            var n = computeNormals_n;

            // Generate normals
            var normals = this.normals;
            for (var i = 0; i < this.indices.length / 3; i++)
            {
                var i3 = i * 3;

                var a = this.indices[i3],
                    b = this.indices[i3 + 1],
                    c = this.indices[i3 + 2];

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
            var edges = {};
            var add = function (indexA, indexB)
            {
                var key = a < b ? a + '_' + b : b + '_' + a;
                edges[key] = true;
            };
            for (var i = 0; i < this.indices.length / 3; i++)
            {
                var i3 = i * 3;
                var a = this.indices[i3],
                    b = this.indices[i3 + 1],
                    c = this.indices[i3 + 2];
                add(a, b);
                add(b, c);
                add(c, a);
            }
            var keys = Object.keys(edges);
            this.edges = <any>new Int16Array(keys.length * 2);
            for (var i = 0; i < keys.length; i++)
            {
                var indices = keys[i].split('_');
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
        getEdgeVertex(edgeIndex: number, firstOrSecond: number, vertexStore: Vec3)
        {
            var vertexIndex = this.edges[edgeIndex * 2 + (firstOrSecond ? 1 : 0)];
            this.getVertex(vertexIndex, vertexStore);
        }

        /**
         * Get a vector along an edge.
         * 
         * @param edgeIndex
         * @param vectorStore
         */
        getEdgeVector(edgeIndex: number, vectorStore: Vec3)
        {
            var va = getEdgeVector_va;
            var vb = getEdgeVector_vb;
            this.getEdgeVertex(edgeIndex, 0, va);
            this.getEdgeVertex(edgeIndex, 1, vb);
            vb.vsub(va, vectorStore);
        }

        /**
         * Get face normal given 3 vertices
         * 
         * @param va
         * @param vb
         * @param vc
         * @param target
         */
        static computeNormal(va: Vec3, vb: Vec3, vc: Vec3, target: Vec3)
        {
            vb.vsub(va, ab);
            vc.vsub(vb, cb);
            cb.cross(ab, target);
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
        getVertex(i: number, out: Vec3)
        {
            var scale = this.scale;
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
        private _getUnscaledVertex(i: number, out: Vec3)
        {
            var i3 = i * 3;
            var vertices = this.vertices;
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
        getWorldVertex(i: number, pos: Vec3, quat: Quaternion, out: Vec3)
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
        getTriangleVertices(i: number, a: Vec3, b: Vec3, c: Vec3)
        {
            var i3 = i * 3;
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
        getNormal(i: number, target: Vec3)
        {
            var i3 = i * 3;
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
        calculateLocalInertia(mass: number, target: Vec3)
        {
            // Approximate with box inertia
            // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
            this.computeLocalAABB(cli_aabb);
            var x = cli_aabb.upperBound.x - cli_aabb.lowerBound.x,
                y = cli_aabb.upperBound.y - cli_aabb.lowerBound.y,
                z = cli_aabb.upperBound.z - cli_aabb.lowerBound.z;
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
        computeLocalAABB(aabb: AABB)
        {
            var l = aabb.lowerBound,
                u = aabb.upperBound,
                n = this.vertices.length,
                vertices = this.vertices,
                v = computeLocalAABB_worldVert;

            this.getVertex(0, v);
            l.copy(v);
            u.copy(v);

            for (var i = 0; i !== n; i++)
            {
                this.getVertex(i, v);

                if (v.x < l.x)
                {
                    l.x = v.x;
                } else if (v.x > u.x)
                {
                    u.x = v.x;
                }

                if (v.y < l.y)
                {
                    l.y = v.y;
                } else if (v.y > u.y)
                {
                    u.y = v.y;
                }

                if (v.z < l.z)
                {
                    l.z = v.z;
                } else if (v.z > u.z)
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
            var max2 = 0;
            var vertices = this.vertices;
            var v = new Vec3();
            for (var i = 0, N = vertices.length / 3; i !== N; i++)
            {
                this.getVertex(i, v);
                var norm2 = v.norm2();
                if (norm2 > max2)
                {
                    max2 = norm2;
                }
            }
            this.boundingSphereRadius = Math.sqrt(max2);
        }

        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3)
        {
            /*
            var n = this.vertices.length / 3,
                verts = this.vertices;
            var minx,miny,minz,maxx,maxy,maxz;
        
            var v = tempWorldVertex;
            for(var i=0; i<n; i++){
                this.getVertex(i, v);
                quat.vmult(v, v);
                pos.vadd(v, v);
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
            var frame = calculateWorldAABB_frame;
            var result = calculateWorldAABB_aabb;
            frame.position = pos;
            frame.quaternion = quat;
            this.aabb.toWorldFrame(frame, result);
            min.copy(result.lowerBound);
            max.copy(result.upperBound);
        };

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
        static createTorus(radius: number, tube: number, radialSegments: number, tubularSegments: number, arc: number)
        {
            radius = radius || 1;
            tube = tube || 0.5;
            radialSegments = radialSegments || 8;
            tubularSegments = tubularSegments || 6;
            arc = arc || Math.PI * 2;

            var vertices: number[] = [];
            var indices: number[] = [];

            for (var j = 0; j <= radialSegments; j++)
            {
                for (var i = 0; i <= tubularSegments; i++)
                {
                    var u = i / tubularSegments * arc;
                    var v = j / radialSegments * Math.PI * 2;

                    var x = (radius + tube * Math.cos(v)) * Math.cos(u);
                    var y = (radius + tube * Math.cos(v)) * Math.sin(u);
                    var z = tube * Math.sin(v);

                    vertices.push(x, y, z);
                }
            }

            for (var j = 1; j <= radialSegments; j++)
            {
                for (var i = 1; i <= tubularSegments; i++)
                {
                    var a = (tubularSegments + 1) * j + i - 1;
                    var b = (tubularSegments + 1) * (j - 1) + i - 1;
                    var c = (tubularSegments + 1) * (j - 1) + i;
                    var d = (tubularSegments + 1) * j + i;

                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }

            return new Trimesh(<any>vertices, indices);
        };
    }

    var computeNormals_n = new Vec3();

    var unscaledAABB = new AABB();

    var getEdgeVector_va = new Vec3();
    var getEdgeVector_vb = new Vec3();

    var cb = new Vec3();
    var ab = new Vec3();

    var va = new Vec3();
    var vb = new Vec3();
    var vc = new Vec3();

    var cli_aabb = new AABB();

    var computeLocalAABB_worldVert = new Vec3();

    var tempWorldVertex = new Vec3();
    var calculateWorldAABB_frame = new Transform();
    var calculateWorldAABB_aabb = new AABB();

}