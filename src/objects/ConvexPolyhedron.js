/**
 * @class CANNON.ConvexPolyhedron
 * @extends CANNON.Shape
 * @brief A set of points in space describing a convex shape.
 * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
 * @author schteppe / https://github.com/schteppe
 * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
 * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
 * @todo move the clipping functions to ContactGenerator?
 * @param array points An array of CANNON.Vec3's
 * @param array faces
 * @param array normals
 */
CANNON.ConvexPolyhedron = function( points , faces , normals ) {
    var that = this;
    CANNON.Shape.call( this );
    this.type = CANNON.Shape.types.CONVEXPOLYHEDRON;

    /*
     * @brief Get face normal given 3 vertices
     * @param CANNON.Vec3 va
     * @param CANNON.Vec3 vb
     * @param CANNON.Vec3 vc
     * @param CANNON.Vec3 target
     * @todo unit test?
     */
    var cb = new CANNON.Vec3();
    var ab = new CANNON.Vec3();
    function normal( va, vb, vc, target ) {
        vb.vsub(va,ab);
        vc.vsub(vb,cb);
        cb.cross(ab,target);
        if ( !target.isZero() ) {
            target.normalize();
        }
    }

    /**
    * @property array vertices
    * @memberof CANNON.ConvexPolyhedron
    * @brief Array of CANNON.Vec3
    */
    this.vertices = points||[];

    this.worldVertices = []; // World transformed version of .vertices
    this.worldVerticesNeedsUpdate = true;

    /**
    * @property array faces
    * @memberof CANNON.ConvexPolyhedron
    * @brief Array of integer arrays, indicating which vertices each face consists of
    * @todo Needed?
    */
    this.faces = faces||[];

    /**
     * @property array faceNormals
     * @memberof CANNON.ConvexPolyhedron
     * @brief Array of CANNON.Vec3
     * @todo Needed?
     */
    this.faceNormals = [];//normals||[];
    /*
    for(var i=0; i<this.faceNormals.length; i++){
        this.faceNormals[i].normalize();
    }
     */
    // Generate normals
    for(var i=0; i<this.faces.length; i++){

        // Check so all vertices exists for this face
        for(var j=0; j<this.faces[i].length; j++){
            if(!this.vertices[this.faces[i][j]]){
                throw new Error("Vertex "+this.faces[i][j]+" not found!");
            }
        }

        var n = new CANNON.Vec3();
        normalOfFace(i,n);
        n.negate(n);
        this.faceNormals.push(n);
        //console.log(n.toString());
        var vertex = this.vertices[this.faces[i][0]];
        if(n.dot(vertex)<0){
            console.warn("Face normal "+i+" ("+n.toString()+") looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.");
            for(var j=0; j<this.faces[i].length; j++){
                console.warn("Vertex "+this.faces[i][j]+": ("+this.vertices[faces[i][j]].toString()+")");
            }
        }
    }

    this.worldFaceNormalsNeedsUpdate = true;
    this.worldFaceNormals = []; // World transformed version of .faceNormals

    /**
     * @property array uniqueEdges
     * @memberof CANNON.ConvexPolyhedron
     * @brief Array of CANNON.Vec3
     */
    this.uniqueEdges = [];
    var nv = this.vertices.length;
    for(var pi=0; pi<nv; pi++){
        var p = this.vertices[pi];
        if(!(p instanceof CANNON.Vec3)){
            throw "Argument 1 must be instance of CANNON.Vec3";
        }
        this.uniqueEdges.push(p);
    }

    for(var i=0; i<this.faces.length; i++){
        var numVertices = this.faces[i].length;
        var NbTris = numVertices;
        for(var j=0; j<NbTris; j++){
            var k = ( j+1 ) % numVertices;
            var edge = new CANNON.Vec3();
            this.vertices[this.faces[i][j]].vsub(this.vertices[this.faces[i][k]],edge);
            edge.normalize();
            var found = false;
            for(var p=0;p<this.uniqueEdges.length;p++){
                if (this.uniqueEdges[p].almostEquals(edge) || this.uniqueEdges[p].almostEquals(edge)){
                    found = true;
                    break;
                }
            }

            if (!found){
                this.uniqueEdges.push(edge);
            }

            if (edge) {
                edge.face1 = i;
            } else {
                /*
                var ed;
                ed.m_face0 = i;
                edges.insert(vp,ed);
                 */
            }
        }
    }

    /*
     * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis. Results are saved in the array maxmin.
     * @param CANNON.ConvexPolyhedron hull
     * @param CANNON.Vec3 axis
     * @param CANNON.Vec3 pos
     * @param CANNON.Quaternion quat
     * @param array maxmin maxmin[0] and maxmin[1] will be set to maximum and minimum, respectively.
     */
    var worldVertex = new CANNON.Vec3();
    function project(hull,axis,pos,quat,maxmin){
        var n = hull.vertices.length;
        var max = null;
        var min = null;
        var vs = hull.vertices;
        for(var i=0; i<n; i++){
            vs[i].copy(worldVertex);
            quat.vmult(worldVertex,worldVertex);
            worldVertex.vadd(pos,worldVertex);
            var val = worldVertex.dot(axis);
            if(max===null || val>max){
                max = val;
            }
            if(min===null || val<min){
                min = val;
            }
        }

        if(min>max){
            // Inconsistent - swap
            var temp = min;
            min = max;
            max = temp;
        }
        // Output
        maxmin[0] = max;
        maxmin[1] = min;
    }

    /**
     * @method testSepAxis
     * @memberof CANNON.ConvexPolyhedron
     * @brief Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
     * @param CANNON.Vec3 axis
     * @param CANNON.ConvexPolyhedron hullB
     * @param CANNON.Vec3 posA
     * @param CANNON.Quaternion quatA
     * @param CANNON.Vec3 posB
     * @param CANNON.Quaternion quatB
     * @return float The overlap depth, or FALSE if no penetration.
     */
    this.testSepAxis = function(axis, hullB, posA, quatA, posB, quatB){
        var maxminA=[], maxminB=[], hullA=this;
        project(hullA, axis, posA, quatA, maxminA);
        project(hullB, axis, posB, quatB, maxminB);
        var maxA = maxminA[0];
        var minA = maxminA[1];
        var maxB = maxminB[0];
        var minB = maxminB[1];
        if(maxA<minB || maxB<minA){
            //console.log(minA,maxA,minB,maxB);
            return false; // Separated
        }
        var d0 = maxA - minB;
        var d1 = maxB - minA;
        var depth = d0<d1 ? d0:d1;
        return depth;
    };

    /**
     * @method findSeparatingAxis
     * @memberof CANNON.ConvexPolyhedron
     * @brief Find the separating axis between this hull and another
     * @param CANNON.ConvexPolyhedron hullB
     * @param CANNON.Vec3 posA
     * @param CANNON.Quaternion quatA
     * @param CANNON.Vec3 posB
     * @param CANNON.Quaternion quatB
     * @param CANNON.Vec3 target The target vector to save the axis in
     * @return bool Returns false if a separation is found, else true
     */
    var faceANormalWS3 = new CANNON.Vec3();
    var Worldnormal1 = new CANNON.Vec3();
    var deltaC = new CANNON.Vec3();
    var worldEdge0 = new CANNON.Vec3();
    var worldEdge1 = new CANNON.Vec3();
    var Cross = new CANNON.Vec3();
    this.findSeparatingAxis = function(hullB,posA,quatA,posB,quatB,target){
        var dmin = Infinity;
        var hullA = this;
        var curPlaneTests=0;
        var numFacesA = hullA.faces.length;

        // Test normals from hullA
        for(var i=0; i<numFacesA; i++){
            // Get world face normal
            hullA.faceNormals[i].copy(faceANormalWS3);
            quatA.vmult(faceANormalWS3,faceANormalWS3);
            //posA.vadd(faceANormalWS3,faceANormalWS3); // Needed?
            //console.log("face normal:",hullA.faceNormals[i].toString(),"world face normal:",faceANormalWS3);
            var d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
            if(d===false){
                return false;
            }

            if(d<dmin){
                dmin = d;
                faceANormalWS3.copy(target);
            }
        }

        // Test normals from hullB
        var numFacesB = hullB.faces.length;
        for(var i=0;i<numFacesB;i++){
            hullB.faceNormals[i].copy(Worldnormal1);
            quatB.vmult(Worldnormal1,Worldnormal1);
            //posB.vadd(Worldnormal1,Worldnormal1);
            //console.log("facenormal",hullB.faceNormals[i].toString(),"world:",Worldnormal1.toString());
            curPlaneTests++;
            var d = hullA.testSepAxis(Worldnormal1, hullB,posA,quatA,posB,quatB);
            if(d===false){
                return false;
            }

            if(d<dmin){
                dmin = d;
                Worldnormal1.copy(target);
            }
        }

        var edgeAstart,edgeAend,edgeBstart,edgeBend;

        var curEdgeEdge = 0;
        // Test edges
        for(var e0=0; e0<hullA.uniqueEdges.length; e0++){
            // Get world edge
            hullA.uniqueEdges[e0].copy(worldEdge0);
            quatA.vmult(worldEdge0,worldEdge0);
            //posA.vadd(worldEdge0,worldEdge0); // needed?

            //console.log("edge0:",worldEdge0.toString());

            for(var e1=0; e1<hullB.uniqueEdges.length; e1++){
                hullB.uniqueEdges[e1].copy(worldEdge1);
                quatB.vmult(worldEdge1,worldEdge1);
                //posB.vadd(worldEdge1,worldEdge1); // needed?
                //console.log("edge1:",worldEdge1.toString());
                worldEdge0.cross(worldEdge1,Cross);
                curEdgeEdge++;
                if(!Cross.almostZero()){
                    Cross.normalize();
                    var dist = hullA.testSepAxis( Cross, hullB, posA,quatA,posB,quatB);
                    if(dist===false){
                        return false;
                    }
                    if(dist<dmin){
                        dmin = dist;
                        Cross.copy(target);
                    }
                }
            }
        }

        posB.vsub(posA,deltaC);
        if((deltaC.dot(target))>0.0){
            target.negate(target);
        }
        return true;
    };

    /**
     * @method clipAgainstHull
     * @memberof CANNON.ConvexPolyhedron
     * @brief Clip this hull against another hull
     * @param CANNON.Vec3 posA
     * @param CANNON.Quaternion quatA
     * @param CANNON.ConvexPolyhedron hullB
     * @param CANNON.Vec3 posB
     * @param CANNON.Quaternion quatB
     * @param CANNON.Vec3 separatingNormal
     * @param float minDist Clamp distance
     * @param float maxDist
     * @param array result The an array of contact point objects, see clipFaceAgainstHull
     * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
     */
    var WorldNormal = new CANNON.Vec3();
    this.clipAgainstHull = function(posA,quatA,hullB,posB,quatB,separatingNormal,minDist,maxDist,result){
        if(!(posA instanceof CANNON.Vec3)){
            throw new Error("posA must be Vec3");
        }
        if(!(quatA instanceof CANNON.Quaternion)){
            throw new Error("quatA must be Quaternion");
        }
        var hullA = this;
        var curMaxDist = maxDist;
        var closestFaceB = -1;
        var dmax = -Infinity;
        for(var face=0; face < hullB.faces.length; face++){
            hullB.faceNormals[face].copy(WorldNormal);
            quatB.vmult(WorldNormal,WorldNormal);
            //posB.vadd(WorldNormal,WorldNormal);
            var d = WorldNormal.dot(separatingNormal);
            if (d > dmax){
                dmax = d;
                closestFaceB = face;
            }
        }
        var worldVertsB1 = [];
        var polyB = hullB.faces[closestFaceB];
        var numVertices = polyB.length;
        for(var e0=0; e0<numVertices; e0++){
            var b = hullB.vertices[polyB[e0]];
            var worldb = new CANNON.Vec3();
            b.copy(worldb);
            quatB.vmult(worldb,worldb);
            posB.vadd(worldb,worldb);
            worldVertsB1.push(worldb);
        }

        if (closestFaceB>=0){
            this.clipFaceAgainstHull(separatingNormal,
                                     posA,
                                     quatA,
                                     worldVertsB1,
                                     minDist,
                                     maxDist,
                                     result);
        }
    };

    /**
     * @method clipFaceAgainstHull
     * @memberof CANNON.ConvexPolyhedron
     * @brief Clip a face against a hull.
     * @param CANNON.Vec3 separatingNormal
     * @param CANNON.Vec3 posA
     * @param CANNON.Quaternion quatA
     * @param Array worldVertsB1 An array of CANNON.Vec3 with vertices in the world frame.
     * @param float minDist Distance clamping
     * @param float maxDist
     * @param Array result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
     */
    var faceANormalWS = new CANNON.Vec3();
    var edge0 = new CANNON.Vec3();
    var WorldEdge0 = new CANNON.Vec3();
    var worldPlaneAnormal1 = new CANNON.Vec3();
    var planeNormalWS1 = new CANNON.Vec3();
    var worldA1 = new CANNON.Vec3();
    var localPlaneNormal = new CANNON.Vec3();
    var planeNormalWS = new CANNON.Vec3();
    this.clipFaceAgainstHull = function(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist,result){
        if(!(separatingNormal instanceof CANNON.Vec3)){
            throw new Error("sep normal must be vector");
        }
        if(!(worldVertsB1 instanceof Array)){
            throw new Error("world verts must be array");
        }
        minDist = Number(minDist);
        maxDist = Number(maxDist);
        var hullA = this;
        var worldVertsB2 = [];
        var pVtxIn = worldVertsB1;
        var pVtxOut = worldVertsB2;
        // Find the face with normal closest to the separating axis
        var closestFaceA = -1;
        var dmin = Infinity;
        for(var face=0; face<hullA.faces.length; face++){
            hullA.faceNormals[face].copy(faceANormalWS);
            quatA.vmult(faceANormalWS,faceANormalWS);
            //posA.vadd(faceANormalWS,faceANormalWS);
            var d = faceANormalWS.dot(separatingNormal);
            if (d < dmin){
                dmin = d;
                closestFaceA = face;
            }
        }
        if (closestFaceA<0){
            console.log("--- did not find any closest face... ---");
            return;
        }
        //console.log("closest A: ",closestFaceA);
        // Get the face and construct connected faces
        var polyA = hullA.faces[closestFaceA];
        polyA.connectedFaces = [];
        for(var i=0; i<hullA.faces.length; i++){
            for(var j=0; j<hullA.faces[i].length; j++){
                if(polyA.indexOf(hullA.faces[i][j])!==-1 /* Sharing a vertex*/ && i!==closestFaceA /* Not the one we are looking for connections from */ && polyA.connectedFaces.indexOf(i)===-1 /* Not already added */ ){
                    polyA.connectedFaces.push(i);
                }
            }
        }
        // Clip the polygon to the back of the planes of all faces of hull A, that are adjacent to the witness face
        var numContacts = pVtxIn.length;
        var numVerticesA = polyA.length;
        var res = [];
        for(var e0=0; e0<numVerticesA; e0++){
            var a = hullA.vertices[polyA[e0]];
            var b = hullA.vertices[polyA[(e0+1)%numVerticesA]];
            a.vsub(b,edge0);
            edge0.copy(WorldEdge0);
            quatA.vmult(WorldEdge0,WorldEdge0);
            posA.vadd(WorldEdge0,WorldEdge0);
            this.faceNormals[closestFaceA].copy(worldPlaneAnormal1);//transA.getBasis()* btVector3(polyA.m_plane[0],polyA.m_plane[1],polyA.m_plane[2]);
            quatA.vmult(worldPlaneAnormal1,worldPlaneAnormal1);
            posA.vadd(worldPlaneAnormal1,worldPlaneAnormal1);
            WorldEdge0.cross(worldPlaneAnormal1,planeNormalWS1);
            planeNormalWS1.negate(planeNormalWS1);
            a.copy(worldA1);
            quatA.vmult(worldA1,worldA1);
            posA.vadd(worldA1,worldA1);
            var planeEqWS1 = -worldA1.dot(planeNormalWS1);
            var planeEqWS;
            if(true){
                var otherFace = polyA.connectedFaces[e0];
                this.faceNormals[otherFace].copy(localPlaneNormal);
                var localPlaneEq = planeConstant(otherFace);

                localPlaneNormal.copy(planeNormalWS);
                quatA.vmult(planeNormalWS,planeNormalWS);
                //posA.vadd(planeNormalWS,planeNormalWS);
                var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
            } else  {
                planeNormalWS1.copy(planeNormalWS);
                planeEqWS = planeEqWS1;
            }

            // Clip face against our constructed plane
            //console.log("clipping polygon ",printFace(closestFaceA)," against plane ",planeNormalWS, planeEqWS);
            this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS);
            //console.log(" - clip result: ",pVtxOut);

            // Throw away all clipped points, but save the reamining until next clip
            while(pVtxIn.length){
                pVtxIn.shift();
            }
            while(pVtxOut.length){
                pVtxIn.push(pVtxOut.shift());
            }
        }

        //console.log("Resulting points after clip:",pVtxIn);

        // only keep contact points that are behind the witness face
        this.faceNormals[closestFaceA].copy(localPlaneNormal);

        var localPlaneEq = planeConstant(closestFaceA);
        localPlaneNormal.copy(planeNormalWS);
        quatA.vmult(planeNormalWS,planeNormalWS);

        var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
        for (var i=0; i<pVtxIn.length; i++){
            var depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS; //???
            /*console.log("depth calc from normal=",planeNormalWS.toString()," and constant "+planeEqWS+" and vertex ",pVtxIn[i].toString()," gives "+depth);*/
            if (depth <=minDist){
                console.log("clamped: depth="+depth+" to minDist="+(minDist+""));
                depth = minDist;
            }

            if (depth <=maxDist){
                var point = pVtxIn[i];
                if(depth<=0){
                    /*console.log("Got contact point ",point.toString(),
                      ", depth=",depth,
                      "contact normal=",separatingNormal.toString(),
                      "plane",planeNormalWS.toString(),
                      "planeConstant",planeEqWS);*/
                    var p = {
                        point:point,
                        normal:planeNormalWS,
                        depth: depth,
                    };
                    result.push(p);
                }
            }
        }
    };

    /**
     * @method clipFaceAgainstPlane
     * @memberof CANNON.ConvexPolyhedron
     * @brief Clip a face in a hull against the back of a plane.
     * @param Array inVertices
     * @param Array outVertices
     * @param CANNON.Vec3 planeNormal
     * @param float planeConstant The constant in the mathematical plane equation
     */
    this.clipFaceAgainstPlane = function(inVertices,outVertices, planeNormal, planeConstant){
        if(!(planeNormal instanceof CANNON.Vec3)){
            throw new Error("planeNormal must be Vec3, "+planeNormal+" given");
        }
        if(!(inVertices instanceof Array)) {
            throw new Error("invertices must be Array, "+inVertices+" given");
        }
        if(!(outVertices instanceof Array)){
            throw new Error("outvertices must be Array, "+outVertices+" given");
        }
        var n_dot_first, n_dot_last;
        var numVerts = inVertices.length;

        if(numVerts < 2){
            return outVertices;
        }

        var firstVertex = inVertices[inVertices.length-1];
        var lastVertex =   inVertices[0];

        n_dot_first = planeNormal.dot(firstVertex) + planeConstant;

        for(var vi = 0; vi < numVerts; vi++){
            lastVertex = inVertices[vi];
            n_dot_last = planeNormal.dot(lastVertex) + planeConstant;
            if(n_dot_first < 0){
                if(n_dot_last < 0){
                    // Start < 0, end < 0, so output lastVertex
                    var newv = new CANNON.Vec3();
                    lastVertex.copy(newv);
                    outVertices.push(newv);
                } else {
                    // Start < 0, end >= 0, so output intersection
                    var newv = new CANNON.Vec3();
                    firstVertex.lerp(lastVertex,
                                     n_dot_first / (n_dot_first - n_dot_last),
                                     newv);
                    outVertices.push(newv);
                }
            } else {
                if(n_dot_last<0){
                    // Start >= 0, end < 0 so output intersection and end
                    var newv = new CANNON.Vec3();
                    firstVertex.lerp(lastVertex,
                                     n_dot_first / (n_dot_first - n_dot_last),
                                     newv);
                    outVertices.push(newv);
                    outVertices.push(lastVertex);
                }
            }
            firstVertex = lastVertex;
            n_dot_first = n_dot_last;
        }
        return outVertices;
    };

    var that = this;
    function normalOfFace(i,target){
        var f = that.faces[i];
        var va = that.vertices[f[0]];
        var vb = that.vertices[f[1]];
        var vc = that.vertices[f[2]];
        return normal(va,vb,vc,target);
    }

    function planeConstant(face_i,target){
        var f = that.faces[face_i];
        var n = that.faceNormals[face_i];
        var v = that.vertices[f[0]];
        var c = -n.dot(v);
        return c;
    }


    function printFace(i){
        var f = that.faces[i], s = "";
        for(var j=0; j<f.length; j++){
            s += " ("+that.vertices[f[j]]+")";
        }
        return s;
    }

    /*
     * Detect whether two edges are equal.
     * Note that when constructing the convex hull, two same edges can only
     * be of the negative direction.
     * @return bool
     */
    function equalEdge( ea, eb ) {
        return ea[ 0 ] === eb[ 1 ] && ea[ 1 ] === eb[ 0 ];
    }

    /*
     * Create a random offset between -1e-6 and 1e-6.
     * @return float
     */
    function randomOffset() {
        return ( Math.random() - 0.5 ) * 2 * 1e-6;
    }

    this.calculateLocalInertia = function(mass,target){
        // Approximate with box inertia
        // Exact inertia calculation is overkill, but see http://geometrictools.com/Documentation/PolyhedralMassProperties.pdf for the correct way to do it
        that.computeAABB();
        var x = this.aabbmax.x - this.aabbmin.x,
            y = this.aabbmax.y - this.aabbmin.y,
            z = this.aabbmax.z - this.aabbmin.z;
        target.x = 1.0 / 12.0 * mass * ( 2*y*2*y + 2*z*2*z );
        target.y = 1.0 / 12.0 * mass * ( 2*x*2*x + 2*z*2*z );
        target.z = 1.0 / 12.0 * mass * ( 2*y*2*y + 2*x*2*x );
    };

    var worldVert = new CANNON.Vec3();
    this.computeAABB = function(){
        var n = this.vertices.length,
        aabbmin = this.aabbmin,
        aabbmax = this.aabbmax,
        vertices = this.vertices;
        aabbmin.set(Infinity,Infinity,Infinity);
        aabbmax.set(-Infinity,-Infinity,-Infinity);
        for(var i=0; i<n; i++){
            var v = vertices[i];
            if     (v.x < aabbmin.x){
                aabbmin.x = v.x;
            } else if(v.x > aabbmax.x){
                aabbmax.x = v.x;
            }
            if     (v.y < aabbmin.y){
                aabbmin.y = v.y;
            } else if(v.y > aabbmax.y){
                aabbmax.y = v.y;
            }
            if     (v.z < aabbmin.z){
                aabbmin.z = v.z;
            } else if(v.z > aabbmax.z){
                aabbmax.z = v.z;
            }
        }
    };

    //this.computeAABB();
};

CANNON.ConvexPolyhedron.prototype = new CANNON.Shape();
CANNON.ConvexPolyhedron.prototype.constructor = CANNON.ConvexPolyhedron;

// Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
CANNON.ConvexPolyhedron.prototype.computeWorldVertices = function(position,quat){
    var N = this.vertices.length;
    while(this.worldVertices.length < N){
        this.worldVertices.push( new CANNON.Vec3() );
    }

    var verts = this.vertices,
        worldVerts = this.worldVertices;
    for(var i=0; i!==N; i++){
        quat.vmult( verts[i] , worldVerts[i] );
        position.vadd( worldVerts[i] , worldVerts[i] );
    }

    this.worldVerticesNeedsUpdate = false;
};

// Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
CANNON.ConvexPolyhedron.prototype.computeWorldFaceNormals = function(quat){
    var N = this.faceNormals.length;
    while(this.worldFaceNormals.length < N){
        this.worldFaceNormals.push( new CANNON.Vec3() );
    }

    var normals = this.faceNormals,
        worldNormals = this.worldFaceNormals;
    for(var i=0; i!==N; i++){
        quat.vmult( normals[i] , worldNormals[i] );
    }

    this.worldFaceNormalsNeedsUpdate = false;
};

CANNON.ConvexPolyhedron.prototype.computeBoundingSphereRadius = function(){
    // Assume points are distributed with local (0,0,0) as center
    var max2 = 0;
    var verts = this.vertices;
    for(var i=0, N=verts.length; i!==N; i++) {
        var norm2 = verts[i].norm2();
        if(norm2 > max2){
            max2 = norm2;
        }
    }
    this.boundingSphereRadius = Math.sqrt(max2);
    this.boundingSphereRadiusNeedsUpdate = false;
};

var tempWorldVertex = new CANNON.Vec3();
CANNON.ConvexPolyhedron.prototype.calculateWorldAABB = function(pos,quat,min,max){
    var n = this.vertices.length, verts = this.vertices;
    var minx,miny,minz,maxx,maxy,maxz;
    for(var i=0; i<n; i++){
        verts[i].copy(tempWorldVertex);
        quat.vmult(tempWorldVertex,tempWorldVertex);
        pos.vadd(tempWorldVertex,tempWorldVertex);
        var v = tempWorldVertex;
        if     (v.x < minx || minx===undefined){
            minx = v.x;
        } else if(v.x > maxx || maxx===undefined){
            maxx = v.x;
        }

        if     (v.y < miny || miny===undefined){
            miny = v.y;
        } else if(v.y > maxy || maxy===undefined){
            maxy = v.y;
        }

        if     (v.z < minz || minz===undefined){
            minz = v.z;
        } else if(v.z > maxz || maxz===undefined){
            maxz = v.z;
        }
    }
    min.set(minx,miny,minz);
    max.set(maxx,maxy,maxz);
};

// Just approximate volume!
CANNON.ConvexPolyhedron.prototype.volume = function(){
    if(this.boundingSphereRadiusNeedsUpdate){
        this.computeBoundingSphereRadius();
    }
    return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
};

// Get an average of all the vertices
CANNON.ConvexPolyhedron.prototype.getAveragePointLocal = function(target){
    target = target || new CANNON.Vec3();
    var n = this.vertices.length,
        verts = this.vertices;
    for(var i=0; i<n; i++){
        target.vadd(verts[i],target);
    }
    target.mult(1/n,target);
    return target;
};

// Transforms all points
CANNON.ConvexPolyhedron.prototype.transformAllPoints = function(offset,quat){
    var n = this.vertices.length,
        verts = this.vertices;

    // Apply rotation
    if(quat){
        // Rotate vertices
        for(var i=0; i<n; i++){
            var v = verts[i];
            quat.vmult(v,v);
        }
        // Rotate face normals
        for(var i=0; i<this.faceNormals.length; i++){
            var v = this.faceNormals[i];
            quat.vmult(v,v);
        }
        /*
        // Rotate edges
        for(var i=0; i<this.uniqueEdges.length; i++){
            var v = this.uniqueEdges[i];
            quat.vmult(v,v);
        }*/
    }

    // Apply offset
    if(offset){
        for(var i=0; i<n; i++){
            var v = verts[i];
            v.vadd(offset,v);
        }
    }
};

// Checks whether p is inside the polyhedra. Must be in local coords.
// The point lies outside of the convex hull of the other points
// if and only if the direction of all the vectors from it to those
// other points are on less than one half of a sphere around it.
var ConvexPolyhedron_pointIsInside = new CANNON.Vec3();
var ConvexPolyhedron_vToP = new CANNON.Vec3();
var ConvexPolyhedron_vToPointInside = new CANNON.Vec3();
CANNON.ConvexPolyhedron.prototype.pointIsInside = function(p){
    var n = this.vertices.length,
        verts = this.vertices,
        faces = this.faces,
        normals = this.faceNormals;
    var positiveResult = null;
    var N = this.faces.length;
    var pointInside = ConvexPolyhedron_pointIsInside;
    this.getAveragePointLocal(pointInside);
    for(var i=0; i<N; i++){
        var numVertices = this.faces[i].length;
        var n = normals[i];
        var v = verts[faces[i][0]]; // We only need one point in the face

        // This dot product determines which side of the edge the point is
        var vToP = ConvexPolyhedron_vToP;
        p.vsub(v,vToP);
        var r1 = n.dot(vToP);

        var vToPointInside = ConvexPolyhedron_vToPointInside;
        pointInside.vsub(v,vToPointInside);
        var r2 = n.dot(vToPointInside);

        if((r1<0 && r2>0) || (r1>0 && r2<0)){
            return false; // Encountered some other sign. Exit.
        } else {
        }
    }

    // If we got here, all dot products were of the same sign.
    return positiveResult ? 1 : -1;
};


function pointInConvex(p){
}