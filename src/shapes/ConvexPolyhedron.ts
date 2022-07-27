import { Quaternion, Vector3 } from 'feng3d';
import { Transform } from '../math/Transform';
import { Shape } from './Shape';

export class ConvexPolyhedron extends Shape
{
    declare vertices: Vector3[];

    worldVertices: Vector3[];
    worldVerticesNeedsUpdate: boolean;

    /**
     * Array of integer arrays, indicating which vertices each face consists of
     */
    declare faces: ({ connectedFaces: number[] } & (number[]))[];

    declare faceNormals: Vector3[];

    worldFaceNormalsNeedsUpdate: boolean;
    worldFaceNormals: Vector3[];

    uniqueEdges: Vector3[];

    /**
     * If given, these locally defined, normalized axes are the only ones being checked when doing separating axis check.
     */
    uniqueAxes: Vector3[];

    /**
     * A set of polygons describing a convex shape.
     * @class ConvexPolyhedron
     * @constructor
     * @extends Shape
     * @description The shape MUST be convex for the code to work properly. No polygons may be coplanar (contained
     * in the same 3D plane), instead these should be merged into one polygon.
     *
     * @param {array} points An array of Vec3's
     * @param {array} faces Array of integer arrays, describing which vertices that is included in each face.
     *
     * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
     * @author schteppe / https://github.com/schteppe
     * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
     * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
     *
     * @todo Move the clipping functions to ContactGenerator?
     * @todo Automatically merge coplanar polygons in constructor.
     */
    constructor(points?: Vector3[], faces?: number[][], uniqueAxes?: Vector3[])
    {
        super({
            type: Shape.types.CONVEXPOLYHEDRON
        });

        this.vertices = points || [];

        this.worldVertices = []; // World transformed version of .vertices
        this.worldVerticesNeedsUpdate = true;

        this.faces = <any>faces || [];

        this.faceNormals = [];
        this.computeNormals();

        this.worldFaceNormalsNeedsUpdate = true;
        this.worldFaceNormals = []; // World transformed version of .faceNormals

        this.uniqueEdges = [];

        this.uniqueAxes = uniqueAxes ? uniqueAxes.slice() : null;

        this.computeEdges();
        this.updateBoundingSphereRadius();
    }

    /**
     * Computes uniqueEdges
     */
    computeEdges()
    {
        const faces = this.faces;
        const vertices = this.vertices;
        // const nv = vertices.length;
        const edges = this.uniqueEdges;

        edges.length = 0;

        const edge = computeEdgesTmpEdge;

        for (let i = 0; i !== faces.length; i++)
        {
            const face = faces[i];
            const numVertices = face.length;
            for (let j = 0; j !== numVertices; j++)
            {
                const k = (j + 1) % numVertices;
                vertices[face[j]].subTo(vertices[face[k]], edge);
                edge.normalize();
                let found = false;
                for (let p = 0; p !== edges.length; p++)
                {
                    if (edges[p].equals(edge) || edges[p].equals(edge))
                    {
                        found = true;
                        break;
                    }
                }

                if (!found)
                {
                    edges.push(edge.clone());
                }
            }
        }
    }

    /**
     * Compute the normals of the faces. Will reuse existing Vec3 objects in the .faceNormals array if they exist.
     */
    computeNormals()
    {
        this.faceNormals.length = this.faces.length;

        // Generate normals
        for (let i = 0; i < this.faces.length; i++)
        {
            // Check so all vertices exists for this face
            for (let j = 0; j < this.faces[i].length; j++)
            {
                if (!this.vertices[this.faces[i][j]])
                {
                    throw new Error(`Vertex ${this.faces[i][j]} not found!`);
                }
            }

            const n = this.faceNormals[i] || new Vector3();
            this.getFaceNormal(i, n);
            n.negateTo(n);
            this.faceNormals[i] = n;
            const vertex = this.vertices[this.faces[i][0]];
            if (n.dot(vertex) < 0)
            {
                console.error(`.faceNormals[${i}] = Vec3(${n.toString()}) looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.`);
                for (let j = 0; j < this.faces[i].length; j++)
                {
                    console.warn(`.vertices[${this.faces[i][j]}] = Vec3(${this.vertices[this.faces[i][j]].toString()})`);
                }
            }
        }
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
     * Compute the normal of a face from its vertices
     *
     * @param i
     * @param target
     */
    getFaceNormal(i: number, target: Vector3)
    {
        const f = this.faces[i];
        const va = this.vertices[f[0]];
        const vb = this.vertices[f[1]];
        const vc = this.vertices[f[2]];

        return ConvexPolyhedron.computeNormal(va, vb, vc, target);
    }

    /**
     * @param posA
     * @param quatA
     * @param hullB
     * @param posB
     * @param quatB
     * @param separatingNormal
     * @param minDist Clamp distance
     * @param maxDist
     * @param result The an array of contact point objects, see clipFaceAgainstHull
     * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
     */
    clipAgainstHull(posA: Vector3, quatA: Quaternion, hullB: ConvexPolyhedron, posB: Vector3, quatB: Quaternion, separatingNormal: Vector3, minDist: number, maxDist: number, result: {
        point: Vector3;
        normal: Vector3;
        depth: number;
    }[])
    {
        const WorldNormal = cahWorldNormal;
        // const hullA = this;
        // const curMaxDist = maxDist;
        let closestFaceB = -1;
        let dmax = -Number.MAX_VALUE;
        for (let face = 0; face < hullB.faces.length; face++)
        {
            WorldNormal.copy(hullB.faceNormals[face]);
            quatB.vmult(WorldNormal, WorldNormal);
            // posB.addTo(WorldNormal,WorldNormal);
            const d = WorldNormal.dot(separatingNormal);
            if (d > dmax)
            {
                dmax = d;
                closestFaceB = face;
            }
        }
        const worldVertsB1 = [];
        const polyB = hullB.faces[closestFaceB];
        const numVertices = polyB.length;
        for (let e0 = 0; e0 < numVertices; e0++)
        {
            const b = hullB.vertices[polyB[e0]];
            const worldb = new Vector3();
            worldb.copy(b);
            quatB.vmult(worldb, worldb);
            posB.addTo(worldb, worldb);
            worldVertsB1.push(worldb);
        }

        if (closestFaceB >= 0)
        {
            this.clipFaceAgainstHull(separatingNormal,
                posA,
                quatA,
                worldVertsB1,
                minDist,
                maxDist,
                result);
        }
    }

    /**
     * Find the separating axis between this hull and another
     *
     * @param hullB
     * @param posA
     * @param quatA
     * @param posB
     * @param quatB
     * @param target The target vector to save the axis in
     * @param faceListA
     * @param faceListB
     * @returns Returns false if a separation is found, else true
     */
    findSeparatingAxis(hullB: ConvexPolyhedron, posA: Vector3, quatA: Quaternion, posB: Vector3, quatB: Quaternion, target: Vector3, faceListA?: number[], faceListB?: number[])
    {
        const faceANormalWS3 = fsaFaceANormalWS3;
        const Worldnormal1 = fsaWorldnormal1;
        const deltaC = fsaDeltaC;
        const worldEdge0 = fsaWorldEdge0;
        const worldEdge1 = fsaWorldEdge1;
        const Cross = fsaCross;

        let dmin = Number.MAX_VALUE;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const hullA = this;
        let curPlaneTests = 0;

        if (!hullA.uniqueAxes)
        {
            const numFacesA = faceListA ? faceListA.length : hullA.faces.length;

            // Test face normals from hullA
            for (let i = 0; i < numFacesA; i++)
            {
                const fi = faceListA ? faceListA[i] : i;

                // Get world face normal
                faceANormalWS3.copy(hullA.faceNormals[fi]);
                quatA.vmult(faceANormalWS3, faceANormalWS3);

                const d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
                if (d === false)
                {
                    return false;
                }

                if (d < dmin)
                {
                    dmin = d;
                    target.copy(faceANormalWS3);
                }
            }
        }
        else
        {
            // Test unique axes
            for (let i = 0; i !== hullA.uniqueAxes.length; i++)
            {
                // Get world axis
                quatA.vmult(hullA.uniqueAxes[i], faceANormalWS3);

                const d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
                if (d === false)
                {
                    return false;
                }

                if (d < dmin)
                {
                    dmin = d;
                    target.copy(faceANormalWS3);
                }
            }
        }

        if (!hullB.uniqueAxes)
        {
            // Test face normals from hullB
            const numFacesB = faceListB ? faceListB.length : hullB.faces.length;
            for (let i = 0; i < numFacesB; i++)
            {
                const fi = faceListB ? faceListB[i] : i;

                Worldnormal1.copy(hullB.faceNormals[fi]);
                quatB.vmult(Worldnormal1, Worldnormal1);
                curPlaneTests++;
                const d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB);
                if (d === false)
                {
                    return false;
                }

                if (d < dmin)
                {
                    dmin = d;
                    target.copy(Worldnormal1);
                }
            }
        }
        else
        {
            // Test unique axes in B
            for (let i = 0; i !== hullB.uniqueAxes.length; i++)
            {
                quatB.vmult(hullB.uniqueAxes[i], Worldnormal1);

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                curPlaneTests++;
                const d = hullA.testSepAxis(Worldnormal1, hullB, posA, quatA, posB, quatB);
                if (d === false)
                {
                    return false;
                }

                if (d < dmin)
                {
                    dmin = d;
                    target.copy(Worldnormal1);
                }
            }
        }

        // Test edges
        for (let e0 = 0; e0 !== hullA.uniqueEdges.length; e0++)
        {
            // Get world edge
            quatA.vmult(hullA.uniqueEdges[e0], worldEdge0);

            for (let e1 = 0; e1 !== hullB.uniqueEdges.length; e1++)
            {
                // Get world edge 2
                quatB.vmult(hullB.uniqueEdges[e1], worldEdge1);
                worldEdge0.crossTo(worldEdge1, Cross);

                if (!Cross.equals(Vector3.ZERO))
                {
                    Cross.normalize();
                    const dist = hullA.testSepAxis(Cross, hullB, posA, quatA, posB, quatB);
                    if (dist === false)
                    {
                        return false;
                    }
                    if (dist < dmin)
                    {
                        dmin = dist;
                        target.copy(Cross);
                    }
                }
            }
        }

        posB.subTo(posA, deltaC);
        if ((deltaC.dot(target)) > 0.0)
        {
            target.negateTo(target);
        }

        return true;
    }

    /**
     * Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
     *
     * @param axis
     * @param hullB
     * @param posA
     * @param quatA
     * @param posB
     * @param quatB
     * @return The overlap depth, or FALSE if no penetration.
     */
    testSepAxis(axis: Vector3, hullB: ConvexPolyhedron, posA: Vector3, quatA: Quaternion, posB: Vector3, quatB: Quaternion)
    {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const hullA = this;
        ConvexPolyhedron.project(hullA, axis, posA, quatA, maxminA);
        ConvexPolyhedron.project(hullB, axis, posB, quatB, maxminB);
        const maxA = maxminA[0];
        const minA = maxminA[1];
        const maxB = maxminB[0];
        const minB = maxminB[1];
        if (maxA < minB || maxB < minA)
        {
            return false; // Separated
        }
        const d0 = maxA - minB;
        const d1 = maxB - minA;
        const depth = d0 < d1 ? d0 : d1;

        return depth;
    }

    /**
     *
     * @param mass
     * @param target
     */
    calculateLocalInertia(mass: number, target: Vector3)
    {
        // Approximate with box inertia
        // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
        this.computeLocalAABB(cliAabbmin, cliAabbmax);
        const x = cliAabbmax.x - cliAabbmin.x;
        const y = cliAabbmax.y - cliAabbmin.y;
        const z = cliAabbmax.z - cliAabbmin.z;
        target.x = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * z * 2 * z);
        target.y = 1.0 / 12.0 * mass * (2 * x * 2 * x + 2 * z * 2 * z);
        target.z = 1.0 / 12.0 * mass * (2 * y * 2 * y + 2 * x * 2 * x);
    }

    /**
     *
     * @param faceI Index of the face
     */
    getPlaneConstantOfFace(faceI: number)
    {
        const f = this.faces[faceI];
        const n = this.faceNormals[faceI];
        const v = this.vertices[f[0]];
        const c = -n.dot(v);

        return c;
    }

    /**
     * Clip a face against a hull.
     *
     * @param separatingNormal
     * @param posA
     * @param quatA
     * @param worldVertsB1 An array of Vec3 with vertices in the world frame.
     * @param minDist Distance clamping
     * @param maxDist
     * @param result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
     */
    clipFaceAgainstHull(separatingNormal: Vector3, posA: Vector3, quatA: Quaternion, worldVertsB1: Vector3[], minDist: number, maxDist: number, result: {
        point: Vector3;
        normal: Vector3;
        depth: number;
    }[])
    {
        const faceANormalWS = cfahFaceANormalWS;
        const edge0 = cfahEdge0;
        const WorldEdge0 = cfahWorldEdge0;
        const worldPlaneAnormal1 = cfahWorldPlaneAnormal1;
        const planeNormalWS1 = cfahPlaneNormalWS1;
        const worldA1 = cfahWorldA1;
        const localPlaneNormal = cfahLocalPlaneNormal;
        const planeNormalWS = cfahPlaneNormalWS;

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const hullA = this;
        const worldVertsB2 = [];
        const pVtxIn = worldVertsB1;
        const pVtxOut = worldVertsB2;
        // Find the face with normal closest to the separating axis
        let closestFaceA = -1;
        let dmin = Number.MAX_VALUE;
        for (let face = 0; face < hullA.faces.length; face++)
        {
            faceANormalWS.copy(hullA.faceNormals[face]);
            quatA.vmult(faceANormalWS, faceANormalWS);
            // posA.addTo(faceANormalWS,faceANormalWS);
            const d = faceANormalWS.dot(separatingNormal);
            if (d < dmin)
            {
                dmin = d;
                closestFaceA = face;
            }
        }
        if (closestFaceA < 0)
        {
            // console.log("--- did not find any closest face... ---");
            return;
        }
        // console.log("closest A: ",closestFaceA);
        // Get the face and construct connected faces
        const polyA = hullA.faces[closestFaceA];
        polyA.connectedFaces = [];
        for (let i = 0; i < hullA.faces.length; i++)
        {
            for (let j = 0; j < hullA.faces[i].length; j++)
            {
                if (polyA.indexOf(hullA.faces[i][j]) !== -1 /* Sharing a vertex*/ && i !== closestFaceA /* Not the one we are looking for connections from */ && polyA.connectedFaces.indexOf(i) === -1 /* Not already added */)
                {
                    polyA.connectedFaces.push(i);
                }
            }
        }
        // Clip the polygon to the back of the planes of all faces of hull A, that are adjacent to the witness face
        // const numContacts = pVtxIn.length;
        const numVerticesA = polyA.length;
        // const res = [];
        for (let e0 = 0; e0 < numVerticesA; e0++)
        {
            const a = hullA.vertices[polyA[e0]];
            const b = hullA.vertices[polyA[(e0 + 1) % numVerticesA]];
            a.subTo(b, edge0);
            WorldEdge0.copy(edge0);
            quatA.vmult(WorldEdge0, WorldEdge0);
            posA.addTo(WorldEdge0, WorldEdge0);
            worldPlaneAnormal1.copy(this.faceNormals[closestFaceA]);// transA.getBasis()* btVector3(polyA.m_plane[0],polyA.m_plane[1],polyA.m_plane[2]);
            quatA.vmult(worldPlaneAnormal1, worldPlaneAnormal1);
            posA.addTo(worldPlaneAnormal1, worldPlaneAnormal1);
            WorldEdge0.crossTo(worldPlaneAnormal1, planeNormalWS1);
            planeNormalWS1.negateTo(planeNormalWS1);
            worldA1.copy(a);
            quatA.vmult(worldA1, worldA1);
            posA.addTo(worldA1, worldA1);
            const planeEqWS1 = -worldA1.dot(planeNormalWS1);
            let planeEqWS: number;
            // eslint-disable-next-line no-constant-condition
            if (true)
            {
                const otherFace = polyA.connectedFaces[e0];
                localPlaneNormal.copy(this.faceNormals[otherFace]);
                // const localPlaneEq = this.getPlaneConstantOfFace(otherFace);

                planeNormalWS.copy(localPlaneNormal);
                quatA.vmult(planeNormalWS, planeNormalWS);
                // posA.addTo(planeNormalWS,planeNormalWS);
                // const planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
            }
            else
            {
                planeNormalWS.copy(planeNormalWS1);
                planeEqWS = planeEqWS1;
            }

            // Clip face against our constructed plane
            this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS);

            // Throw away all clipped points, but save the reamining until next clip
            while (pVtxIn.length)
            {
                pVtxIn.shift();
            }
            while (pVtxOut.length)
            {
                pVtxIn.push(pVtxOut.shift());
            }
        }

        // console.log("Resulting points after clip:",pVtxIn);

        // only keep contact points that are behind the witness face
        localPlaneNormal.copy(this.faceNormals[closestFaceA]);

        const localPlaneEq = this.getPlaneConstantOfFace(closestFaceA);
        planeNormalWS.copy(localPlaneNormal);
        quatA.vmult(planeNormalWS, planeNormalWS);

        const planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
        for (let i = 0; i < pVtxIn.length; i++)
        {
            let depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS; // ???
            /* console.log("depth calc from normal=",planeNormalWS.toString()," and constant "+planeEqWS+" and vertex ",pVtxIn[i].toString()," gives "+depth);*/
            if (depth <= minDist)
            {
                console.log(`clamped: depth=${depth} to minDist=${String(minDist)}`);
                depth = minDist;
            }

            if (depth <= maxDist)
            {
                const point = pVtxIn[i];
                if (depth <= 0)
                {
                    /* console.log("Got contact point ",point.toString(),
                      ", depth=",depth,
                      "contact normal=",separatingNormal.toString(),
                      "plane",planeNormalWS.toString(),
                      "planeConstant",planeEqWS);*/
                    const p = {
                        point,
                        normal: planeNormalWS,
                        depth,
                    };
                    result.push(p);
                }
            }
        }
    }

    /**
     * Clip a face in a hull against the back of a plane.
     *
     * @param inVertices
     * @param outVertices
     * @param planeNormal
     * @param planeConstant The constant in the mathematical plane equation
     */
    clipFaceAgainstPlane(inVertices: Vector3[], outVertices: Vector3[], planeNormal: Vector3, planeConstant: number)
    {
        let nDotFirst: number; let nDotLast: number;
        const numVerts = inVertices.length;

        if (numVerts < 2)
        {
            return outVertices;
        }

        let firstVertex = inVertices[inVertices.length - 1];
        let lastVertex = inVertices[0];

        nDotFirst = planeNormal.dot(firstVertex) + planeConstant;

        for (let vi = 0; vi < numVerts; vi++)
        {
            lastVertex = inVertices[vi];
            nDotLast = planeNormal.dot(lastVertex) + planeConstant;
            if (nDotFirst < 0)
            {
                if (nDotLast < 0)
                {
                    // Start < 0, end < 0, so output lastVertex
                    const newv = new Vector3();
                    newv.copy(lastVertex);
                    outVertices.push(newv);
                }
                else
                {
                    // Start < 0, end >= 0, so output intersection
                    const newv = new Vector3();
                    firstVertex.lerpNumberTo(lastVertex,
                        nDotFirst / (nDotFirst - nDotLast),
                        newv);
                    outVertices.push(newv);
                }
            }
            else
                if (nDotLast < 0)
                {
                    // Start >= 0, end < 0 so output intersection and end
                    const newv = new Vector3();
                    firstVertex.lerpNumberTo(lastVertex,
                        nDotFirst / (nDotFirst - nDotLast),
                        newv);
                    outVertices.push(newv);
                    outVertices.push(lastVertex);
                }
            firstVertex = lastVertex;
            nDotFirst = nDotLast;
        }

        return outVertices;
    }

    // Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
    computeWorldVertices(position: Vector3, quat: Quaternion)
    {
        const N = this.vertices.length;
        while (this.worldVertices.length < N)
        {
            this.worldVertices.push(new Vector3());
        }

        const verts = this.vertices;
        const worldVerts = this.worldVertices;
        for (let i = 0; i !== N; i++)
        {
            quat.vmult(verts[i], worldVerts[i]);
            position.addTo(worldVerts[i], worldVerts[i]);
        }

        this.worldVerticesNeedsUpdate = false;
    }

    computeLocalAABB(aabbmin: Vector3, aabbmax: Vector3)
    {
        const n = this.vertices.length;
        const vertices = this.vertices;
        // const worldVert = computeLocalAABBWorldVert;

        aabbmin.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        aabbmax.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        for (let i = 0; i < n; i++)
        {
            const v = vertices[i];
            if (v.x < aabbmin.x)
            {
                aabbmin.x = v.x;
            }
            else if (v.x > aabbmax.x)
            {
                aabbmax.x = v.x;
            }
            if (v.y < aabbmin.y)
            {
                aabbmin.y = v.y;
            }
            else if (v.y > aabbmax.y)
            {
                aabbmax.y = v.y;
            }
            if (v.z < aabbmin.z)
            {
                aabbmin.z = v.z;
            }
            else if (v.z > aabbmax.z)
            {
                aabbmax.z = v.z;
            }
        }
    }

    /**
     * Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
     *
     * @param quat
     */
    computeWorldFaceNormals(quat: Quaternion)
    {
        const N = this.faceNormals.length;
        while (this.worldFaceNormals.length < N)
        {
            this.worldFaceNormals.push(new Vector3());
        }

        const normals = this.faceNormals;
        const worldNormals = this.worldFaceNormals;
        for (let i = 0; i !== N; i++)
        {
            quat.vmult(normals[i], worldNormals[i]);
        }

        this.worldFaceNormalsNeedsUpdate = false;
    }

    updateBoundingSphereRadius()
    {
        // Assume points are distributed with local (0,0,0) as center
        let max2 = 0;
        const verts = this.vertices;
        for (let i = 0, N = verts.length; i !== N; i++)
        {
            const norm2 = verts[i].lengthSquared;
            if (norm2 > max2)
            {
                max2 = norm2;
            }
        }
        this.boundingSphereRadius = Math.sqrt(max2);
    }

    /**
     *
     * @param  pos
     * @param quat
     * @param min
     * @param max
     */
    calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3)
    {
        const n = this.vertices.length; const
            verts = this.vertices;
        let minx: number; let miny: number; let minz: number; let maxx: number; let maxy: number; let
            maxz: number;
        for (let i = 0; i < n; i++)
        {
            tempWorldVertex.copy(verts[i]);
            quat.vmult(tempWorldVertex, tempWorldVertex);
            pos.addTo(tempWorldVertex, tempWorldVertex);
            const v = tempWorldVertex;
            if (v.x < minx || minx === undefined)
            {
                minx = v.x;
            }
            else if (v.x > maxx || maxx === undefined)
            {
                maxx = v.x;
            }

            if (v.y < miny || miny === undefined)
            {
                miny = v.y;
            }
            else if (v.y > maxy || maxy === undefined)
            {
                maxy = v.y;
            }

            if (v.z < minz || minz === undefined)
            {
                minz = v.z;
            }
            else if (v.z > maxz || maxz === undefined)
            {
                maxz = v.z;
            }
        }
        min.set(minx, miny, minz);
        max.set(maxx, maxy, maxz);
    }

    /**
     * Get approximate convex volume
     */
    volume()
    {
        return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
    }

    /**
     * Get an average of all the vertices positions
     *
     * @param target
     */
    getAveragePointLocal(target: Vector3)
    {
        target = target || new Vector3();
        const n = this.vertices.length;
        const verts = this.vertices;
        for (let i = 0; i < n; i++)
        {
            target.addTo(verts[i], target);
        }
        target.scaleNumberTo(1 / n, target);

        return target;
    }

    /**
     * Transform all local points. Will change the .vertices
     *
     * @param  offset
     * @param quat
     */
    transformAllPoints(offset: Vector3, quat: Quaternion)
    {
        const n = this.vertices.length;
        const verts = this.vertices;

        // Apply rotation
        if (quat)
        {
            // Rotate vertices
            for (let i = 0; i < n; i++)
            {
                const v = verts[i];
                quat.vmult(v, v);
            }
            // Rotate face normals
            for (let i = 0; i < this.faceNormals.length; i++)
            {
                const v = this.faceNormals[i];
                quat.vmult(v, v);
            }
            /*
            // Rotate edges
            for(let i=0; i<this.uniqueEdges.length; i++){
                let v = this.uniqueEdges[i];
                quat.vmult(v,v);
            }*/
        }

        // Apply offset
        if (offset)
        {
            for (let i = 0; i < n; i++)
            {
                const v = verts[i];
                v.addTo(offset, v);
            }
        }
    }

    /**
     * Checks whether p is inside the polyhedra. Must be in local coords. The point lies outside of the convex hull of the other points if and only if the direction of all the vectors from it to those other points are on less than one half of a sphere around it.
     *
     * @param p      A point given in local coordinates
     */
    pointIsInside(p: Vector3)
    {
        // const n = this.vertices.length;
        const verts = this.vertices;
        const faces = this.faces;
        const normals = this.faceNormals;
        const positiveResult = null;
        const N = this.faces.length;
        const pointInside = ConvexPolyhedronPointIsInside;
        this.getAveragePointLocal(pointInside);
        for (let i = 0; i < N; i++)
        {
            // const numVertices = this.faces[i].length;
            const n0 = normals[i];
            const v = verts[faces[i][0]]; // We only need one point in the face

            // This dot product determines which side of the edge the point is
            const vToP = ConvexPolyhedronVToP;
            p.subTo(v, vToP);
            const r1 = n0.dot(vToP);

            const vToPointInside = ConvexPolyhedronVToPointInside;
            pointInside.subTo(v, vToPointInside);
            const r2 = n0.dot(vToPointInside);

            if ((r1 < 0 && r2 > 0) || (r1 > 0 && r2 < 0))
            {
                return false; // Encountered some other sign. Exit.
            }
        }

        // If we got here, all dot products were of the same sign.
        return positiveResult ? 1 : -1;
    }

    /**
     * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis. Results are saved in the array maxmin.
     *
     * @param hull
     * @param axis
     * @param pos
     * @param quat
     * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
     */
    static project(hull: ConvexPolyhedron, axis: Vector3, pos: Vector3, quat: Quaternion, result: number[])
    {
        const n = hull.vertices.length;
        // const worldVertex = project_worldVertex;
        const localAxis = projectLocalAxis;
        let max = 0;
        let min = 0;
        const localOrigin = projectLocalOrigin;
        const vs = hull.vertices;

        localOrigin.setZero();

        // Transform the axis to local
        Transform.vectorToLocalFrame(pos, quat, axis, localAxis);
        Transform.pointToLocalFrame(pos, quat, localOrigin, localOrigin);
        const add = localOrigin.dot(localAxis);

        min = max = vs[0].dot(localAxis);

        for (let i = 1; i < n; i++)
        {
            const val = vs[i].dot(localAxis);

            if (val > max)
            {
                max = val;
            }

            if (val < min)
            {
                min = val;
            }
        }

        min -= add;
        max -= add;

        if (min > max)
        {
            // Inconsistent - swap
            const temp = min;
            min = max;
            max = temp;
        }
        // Output
        result[0] = max;
        result[1] = min;
    }
}

const computeEdgesTmpEdge = new Vector3();

const cb = new Vector3();
const ab = new Vector3();
const cahWorldNormal = new Vector3();

const fsaFaceANormalWS3 = new Vector3();
const fsaWorldnormal1 = new Vector3();
const fsaDeltaC = new Vector3();
const fsaWorldEdge0 = new Vector3();
const fsaWorldEdge1 = new Vector3();
const fsaCross = new Vector3();

const maxminA = []; const
    maxminB = [];

const cliAabbmin = new Vector3();
const cliAabbmax = new Vector3();

const cfahFaceANormalWS = new Vector3();
const cfahEdge0 = new Vector3();
const cfahWorldEdge0 = new Vector3();
const cfahWorldPlaneAnormal1 = new Vector3();
const cfahPlaneNormalWS1 = new Vector3();
const cfahWorldA1 = new Vector3();
const cfahLocalPlaneNormal = new Vector3();
const cfahPlaneNormalWS = new Vector3();

// const computeLocalAABBWorldVert = new Vector3();

const tempWorldVertex = new Vector3();

const ConvexPolyhedronPointIsInside = new Vector3();
const ConvexPolyhedronVToP = new Vector3();
const ConvexPolyhedronVToPointInside = new Vector3();
// const project_worldVertex = new Vector3();
const projectLocalAxis = new Vector3();
const projectLocalOrigin = new Vector3();
