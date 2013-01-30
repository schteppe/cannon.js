/*global CANNON:true */

/**
 * @class CANNON.ContactGenerator
 * @brief Helper class for the World. Generates ContactPoints.
 * @todo Sphere-ConvexPolyhedron contacts
 * @todo Contact reduction
 */
CANNON.ContactGenerator = function(){

    /**
     * @property bool contactReduction
     * @memberof CANNON.ContactGenerator
     * @brief Turns on or off contact reduction. Can be handy to turn off when debugging new collision types.
     */
    this.contactReduction = false;

    // Contact point objects that can be reused
    var contactPointPool = [];

    var v3pool = new CANNON.Vec3Pool();

    // temp vertices for plane/polyhedron collision tests
    var tempverts = [new CANNON.Vec3(),
                     new CANNON.Vec3(),
                     new CANNON.Vec3(),
                     new CANNON.Vec3(),
                     new CANNON.Vec3(),
                     new CANNON.Vec3(),
                     new CANNON.Vec3(),
                     new CANNON.Vec3()];
    // temp normals for plane/polyhedron
    var tempnormals = [new CANNON.Vec3(),
                       new CANNON.Vec3(),
                       new CANNON.Vec3(),
                       new CANNON.Vec3(),
                       new CANNON.Vec3(),
                       new CANNON.Vec3()];

    var planehull = new CANNON.ConvexPolyhedron(tempverts,
                                                [
                                                    [0,1,2,3], // -z
                                                    [4,5,6,7], // +z
                                                    [0,1,4,5], // -y
                                                    [2,3,6,7], // +y
                                                    [0,3,4,7], // -x
                                                    [1,2,5,6], // +x
                                                ],
                                                tempnormals);
    
    /*
     * Make a contact object.
     * @return object
     * @todo reuse old contact point objects
     */
    function makeResult(bi,bj){
        if(contactPointPool.length){
            var c = contactPointPool.pop();
            c.bi = bi;
            c.bj = bj;
            return c;
        } else
            return new CANNON.ContactEquation(bi,bj);
    }

    /*
     * Swaps the body references in the contact
     * @param object r
     */
    function swapResult(r){
        var temp;
        temp = r.ri; r.ri = r.rj; r.rj = temp;
        r.ni.negate(r.ni);
        temp = r.bi; r.bi = r.bj; r.bj = temp;
    }

    function sphereSphere(result,si,sj,xi,xj,qi,qj,bi,bj){
        // We will have only one contact in this case
        var r = makeResult(bi,bj);

        // Contact normal
        bj.position.vsub(xi, r.ni);
        r.ni.normalize();

        // Contact point locations
        r.ni.copy(r.ri);
        r.ni.copy(r.rj);
        r.ri.mult(si.radius, r.ri);
        r.rj.mult(-sj.radius, r.rj);
        result.push(r);
    }

    var point_on_plane_to_sphere = new CANNON.Vec3();
    var plane_to_sphere_ortho = new CANNON.Vec3();
    function spherePlane(result,si,sj,xi,xj,qi,qj,bi,bj){
        // We will have one contact in this case
        var r = makeResult(bi,bj);

        // Contact normal
        r.ni.set(0,0,1);
        qj.vmult(r.ni,r.ni);
        r.ni.negate(r.ni); // body i is the sphere, flip normal
        r.ni.normalize();

        // Vector from sphere center to contact point
        r.ni.mult(si.radius,r.ri);

        // Project down sphere on plane
        xi.vsub(xj,point_on_plane_to_sphere);
        r.ni.mult(r.ni.dot(point_on_plane_to_sphere),plane_to_sphere_ortho);
        point_on_plane_to_sphere.vsub(plane_to_sphere_ortho,r.rj); // The sphere position projected to plane
        if(plane_to_sphere_ortho.norm2() <= si.radius*si.radius)
            result.push(r);
    }

    // See http://bulletphysics.com/Bullet/BulletFull/SphereTriangleDetector_8cpp_source.html
    function pointInPolygon(verts, normal, p){
        var positiveResult = null;
        var N = verts.length;
        for(var i=0; i<N; i++){
            var v = verts[i];

            // Get edge to the next vertex
            var edge = new CANNON.Vec3();
            verts[(i+1) % (N-1)].vsub(v,edge);

            // Get cross product between polygon normal and the edge
            var edge_x_normal = new CANNON.Vec3();
            edge.cross(normal,edge_x_normal);

            // Get vector between point and current vertex
            var vertex_to_p = new CANNON.Vec3();
            p.vsub(v,vertex_to_p);

            // This dot product determines which side of the edge the point is
            var r = edge_x_normal.dot(vertex_to_p);

            // If all such dot products have same sign, we are inside the polygon.
            if(positiveResult===null || (r>0 && positiveResult===true) || (r<=0 && positiveResult===false))
                continue;
            else
                return false; // Encountered some other sign. Exit.
        }

        // If we got here, all dot products were of the same sign.
        return positiveResult ? 1 : -1;
    }

    var box_to_sphere = new CANNON.Vec3();
    function sphereBox(result,si,sj,xi,xj,qi,qj,bi,bj){
        // we refer to the box as body j
        xi.vsub(xj,box_to_sphere);
        var sides = sj.getSideNormals(true,qj);
        var R =     si.radius;
        var penetrating_sides = [];

        // Check side (plane) intersections
        var found = false;
        for(var idx=0,nsides=sides.length; idx!==nsides && found===false; idx++){ // Max 3 penetrating sides
            var ns = sides[idx].copy();
            var h = ns.norm();
            ns.normalize();
            var dot = box_to_sphere.dot(ns);
            if(dot<h+R && dot>0){
                // Intersects plane. Now check the other two dimensions
                var ns1 = sides[(idx+1)%3].copy();
                var ns2 = sides[(idx+2)%3].copy();
                var h1 = ns1.norm();
                var h2 = ns2.norm();
                ns1.normalize();
                ns2.normalize();
                var dot1 = box_to_sphere.dot(ns1);
                var dot2 = box_to_sphere.dot(ns2);
                if(dot1<h1 && dot1>-h1 && dot2<h2 && dot2>-h2){
                    found = true;
                    var r = makeResult(bi,bj);
                    ns.mult(-R,r.ri); // Sphere r
                    ns.copy(r.ni);
                    r.ni.negate(r.ni); // Normal should be out of sphere
                    ns.mult(h).vadd(ns1.mult(dot1)).vadd(ns2.mult(dot2),r.rj); // box
                    result.push(r);
                }
            }
        }

        // Check corners
        var rj = v3pool.get();
        for(var j=0; j<2 && !found; j++){
            for(var k=0; k<2 && !found; k++){
                for(var l=0; l<2 && !found; l++){
                    rj.set(0,0,0);
                    if(j) rj.vadd(sides[0],rj);
                    else  rj.vsub(sides[0],rj);
                    if(k) rj.vadd(sides[1],rj);
                    else  rj.vsub(sides[1],rj);
                    if(l) rj.vadd(sides[2],rj);
                    else  rj.vsub(sides[2],rj);

                    // World position of corner
                    var sphere_to_corner = xj.vadd(rj).vsub(xi);
                    if(sphere_to_corner.norm()<R){
                        found = true;
                        var r = makeResult(bi,bj);
                        sphere_to_corner.copy(r.ri);
                        r.ri.normalize();
                        r.ri.copy(r.ni);
                        r.ri.mult(R,r.ri);
                        rj.copy(r.rj);
                        result.push(r);
                    }
                }
            }
        }
        v3pool.release(rj);
        rj = null;

        // Check edges
        var edgeTangent = v3pool.get();
        var edgeCenter = v3pool.get();
        var r = v3pool.get(); // r = edge center to sphere center
        var orthogonal = v3pool.get();
        var dist = v3pool.get();
        for(var j=0; j<sides.length && !found; j++){
            for(var k=0; k<sides.length && !found; k++){
                if(j%3!=k%3){
                    // Get edge tangent
                    sides[k].cross(sides[j],edgeTangent);
                    edgeTangent.normalize();
                    sides[j].vadd(sides[k], edgeCenter);
                    xi.copy(r);
                    r.vsub(edgeCenter,r);
                    r.vsub(xj,r);
                    var orthonorm = r.dot(edgeTangent); // distance from edge center to sphere center in the tangent direction
                    edgeTangent.mult(orthonorm,orthogonal); // Vector from edge center to sphere center in the tangent direction
                    
                    // Find the third side orthogonal to this one
                    var l = 0;
                    while(l==j%3 || l==k%3) l++;

                    // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
                    xi.copy(dist);
                    dist.vsub(orthogonal,dist);
                    dist.vsub(edgeCenter,dist);
                    dist.vsub(xj,dist);

                    // Distances in tangent direction and distance in the plane orthogonal to it
                    var tdist = Math.abs(orthonorm);
                    var ndist = dist.norm();
                    
                    if(tdist < sides[l].norm() && ndist<R){
                        found = true;
                        var res = makeResult(bi,bj);
                        edgeCenter.vadd(orthogonal,res.rj); // box rj
                        res.rj.copy(res.rj);
                        dist.negate(res.ni);
                        res.ni.normalize();

                        res.rj.copy(res.ri);
                        res.ri.vadd(xj,res.ri);
                        res.ri.vsub(xi,res.ri);
                        res.ri.normalize();
                        res.ri.mult(R,res.ri);

                        result.push(res);
                    }
                }
            }
        }
        v3pool.release(edgeTangent,edgeCenter,r,orthogonal,dist);
    }

    var planeBox_normal = new CANNON.Vec3();
    var plane_to_corner = new CANNON.Vec3();
    function planeBox(result,si,sj,xi,xj,qi,qj,bi,bj){
        // Collision normal
        var n = planeBox_normal;
        n.set(0,0,1);
        qi.vmult(n,n);

        // Loop over corners
        var numcontacts = 0;
        var corners = sj.getCorners(qj);
        for(var idx=0, ncorners=corners.length; idx!==ncorners && numcontacts<=4; idx++){ // max 4 corners against plane
            var r = makeResult(bi,bj);
            var worldCorner = corners[idx].vadd(xj);
            corners[idx].copy(r.rj);

            // Project down corner to plane to get xj
            var point_on_plane_to_corner = worldCorner.vsub(xi);
            var d = n.dot(point_on_plane_to_corner);
            if(d<=0){
                numcontacts++;
                n.mult(d,plane_to_corner);
                point_on_plane_to_corner.vsub(plane_to_corner,r.ri);
                
                // Set contact normal
                n.copy(r.ni);
                
                // Add contact
                result.push(r);
            }
        }
    }

    /*
     * Go recursive for compound shapes
     * @param Shape si
     * @param CompoundShape sj
     */
    function recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj){
        for(var i=0; i<sj.childShapes.length; i++){
            var r = [];
            nearPhase(r,
                      si,
                      sj.childShapes[i],
                      xi,
                      xj.vadd(qj.vmult(sj.childOffsets[i])), // Transform the shape to its local frame
                      qi,
                      qj.mult(sj.childOrientations[i]),
                      bi,
                      bj);
            // Transform back
            for(var j=0; j<r.length; j++){
                r[j].rj.vadd(qj.vmult(sj.childOffsets[i]),r[j].rj);
                result.push(r[j]);
            }
        }
    }

    function planeConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        // Separating axis is the plane normal
        // Create a virtual box polyhedron for the plane
        var t1 = v3pool.get();
        var t2 = v3pool.get();
        t1.set(1,0,0);
        t2.set(0,1,0);
        qi.vmult(t1,t1); // Rotate the tangents
        qi.vmult(t2,t2);
        t1.mult(100000,t1);
        t2.mult(100000,t2);
        var n = v3pool.get();
        n.set(0,0,1);
        qi.vmult(n,n);

        var v = planehull.vertices,
            f = planehull.faceNormals;

        v[0].set(-t1.x -t2.x   -n.x,   -t1.y -t2.y   -n.y,  -t1.z -t2.z   -n.z); // ---
        v[1].set( t1.x -t2.x +0*n.x,    t1.y -t2.y +0*n.y,   t1.z -t2.z +0*n.z); // +-+
        v[2].set( t1.x +t2.x   -n.x,    t1.y +t2.y   -n.y,   t1.z +t2.z   -n.z); // ++- 
        v[3].set(-t1.x +t2.x   -n.x,   -t1.y +t2.y   -n.y,  -t1.z +t2.z   -n.z); // -+-
        v[4].set(-t1.x -t2.x +0*n.x,   -t1.y -t2.y +0*n.y,  -t1.z -t2.z +0*n.z); // --+
        v[5].set(+t1.x -t2.x +0*n.x,    t1.y -t2.y +0*n.y,   t1.z -t2.z +0*n.z); // +-+
        v[6].set(+t1.x +t2.x +0*n.x,   +t1.y +t2.y +0*n.y,   t1.z +t2.z +0*n.z); // +++
        v[7].set(-t1.x +t2.x +0*n.x,   -t1.y +t2.y +0*n.y,  -t1.z +t2.z +0*n.z); // -++
        t1.normalize();
        t2.normalize();
        f[0].set( -n.x, -n.y, -n.z);
        f[1].set(  n.x,  n.y,  n.z);
        f[2].set(-t2.x,-t2.y,-t2.z);
        f[3].set( t2.x, t2.y, t2.z);
        f[4].set(-t1.x,-t1.y,-t1.z);
        f[5].set( t1.x, t1.y, t1.z);

        var sepAxis = v3pool.get();
        n.negate(sepAxis);
        var q = v3pool.get();
        if(sj.testSepAxis(sepAxis,planehull,xj,qj,xi,qi)!==false){
            var res = [];
            planehull.clipAgainstHull(xi,qi,sj,xj,qj,sepAxis,-100,100,res);
            for(var j=0; j<res.length; j++){
                var r = makeResult(bi,bj);
                sepAxis.negate(r.ni);
                res[j].normal.negate(q);
                q.mult(res[j].depth,q);
                r.ri.set(res[j].point.x + q.x,
                         res[j].point.y + q.y,
                         res[j].point.z + q.z);
                r.rj.set(res[j].point.x,
                         res[j].point.y,
                         res[j].point.z);
                // Contact points are in world coordinates. Transform back to relative
                r.rj.vsub(xj,r.rj);
                r.ri.vsub(xi,r.ri);
                result.push(r);
            }
        }
        v3pool.release(q,t1,t2,sepAxis,n);
    }

    var convexConvex_sepAxis = new CANNON.Vec3();
    var convexConvex_q = new CANNON.Vec3();
    function convexConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        var sepAxis = convexConvex_sepAxis;
        if(si.findSeparatingAxis(sj,xi,qi,xj,qj,sepAxis)){
            var res = [];
            var q = convexConvex_q;
            si.clipAgainstHull(xi,qi,sj,xj,qj,sepAxis,-100,100,res);
            for(var j=0; j<res.length; j++){
                var r = makeResult(bi,bj);
                sepAxis.negate(r.ni);
                res[j].normal.negate(q);
                q.mult(res[j].depth,q);
                res[j].point.vadd(q,r.ri);
                res[j].point.copy(r.rj);
                // Contact points are in world coordinates. Transform back to relative
                r.rj.vsub(xj,r.rj);
                r.ri.vsub(xi,r.ri);
                result.push(r);
            }
        }
    }

    var particlePlane_normal = new CANNON.Vec3();
    var particlePlane_relpos = new CANNON.Vec3();
    var particlePlane_projected = new CANNON.Vec3();
    function particlePlane(result,si,sj,xi,xj,qi,qj,bi,bj){
        var normal = particlePlane_normal;
        normal.set(0,0,1);
        bj.quaternion.vmult(normal,normal); // Turn normal according to plane orientation
        var relpos = particlePlane_relpos;
        xi.vsub(bj.position,relpos);
        var dot = normal.dot(relpos);
        if(dot<=0.0){
            var r = makeResult(bi,bj);
            normal.copy( r.ni ); // Contact normal is the plane normal
            r.ni.negate(r.ni);
            r.ri.set(0,0,0); // Center of particle

            // Get particle position projected on plane
            var projected = particlePlane_projected;
            normal.mult(normal.dot(xi),projected);
            xi.vsub(projected,projected);
            //projected.vadd(bj.position,projected);

            // rj is now the projected world position minus plane position
            projected.copy(r.rj);
            result.push(r);
        }
    }

    var particleSphere_normal = new CANNON.Vec3();
    function particleSphere(result,si,sj,xi,xj,qi,qj,bi,bj){
        // The normal is the unit vector from sphere center to particle center
        var normal = particleSphere_normal;
        normal.set(0,0,1);
        xi.vsub(xj,normal);
        var lengthSquared = normal.norm2();

        if(lengthSquared <= sj.radius * sj.radius){
            var r = makeResult(bi,bj);
            normal.normalize();
            normal.copy(r.rj);
            r.rj.mult(sj.radius,r.rj);
            normal.copy( r.ni ); // Contact normal
            r.ni.negate(r.ni);
            r.ri.set(0,0,0); // Center of particle
            result.push(r);
        }
    }

    // WIP
    function particleConvex(result,si,sj,xi,xj,qi,qj,bi,bj){

        var penetratedFaceIndex = -1;
        var minPenetration = null;
        var numDetectedFaces = 0;

        // Convert particle position xi to local coords in the convex
        var local = xi.copy();
        local = local.vsub(xj); // Convert position to relative the convex origin
        var cqj = qj.conjugate();
        cqj.vmult(local,local);

        //console.log("from the box perspective",local.toString());

        if(sj.pointIsInside(local)){

            // For each world polygon in the polyhedra
            for(var i=0,nfaces=sj.faces.length; i!==nfaces; i++){

                // Construct world face vertices
                var verts = [];
                for(var j=0,nverts=sj.faces[i].length; j!==nverts; j++){
                    var worldVertex = new CANNON.Vec3();
                    sj.vertices[sj.faces[i][j]].copy(worldVertex);
                    qj.vmult(worldVertex,worldVertex);
                    worldVertex.vadd(xj,worldVertex);
                    verts.push(worldVertex);
                }

                var normal = sj.faceNormals[i].copy();
                normal.normalize();
                qj.vmult(normal,normal);

                // Check if the particle is in the polygon
                /*var inside = pointInPolygon(verts,normal,xi);
                if(inside){*/
                    // Check how much the particle penetrates the polygon plane.
                    var penetration = -normal.dot(xi.vsub(verts[0]));
                    if(minPenetration===null || Math.abs(penetration)<Math.abs(minPenetration)){
                        minPenetration = penetration;
                        penetratedFaceIndex = i;
                        penetratedFaceNormal = normal;
                        numDetectedFaces++;
                    }
                /*}*/
            }

            if(penetratedFaceIndex!==-1){
                // Setup contact
                var r = makeResult(bi,bj);
                // rj is the particle position projected to the face
                var worldPenetrationVec = penetratedFaceNormal.mult(minPenetration);
                //console.log("pen vec:",worldPenetrationVec.toString());
                var projectedToFace = xi.vsub(xj).vadd(worldPenetrationVec);
                projectedToFace.copy(r.rj);
                //qj.vmult(r.rj,r.rj);
                penetratedFaceNormal.negate( r.ni ); // Contact normal
                r.ri.set(0,0,0); // Center of particle
                result.push(r);
            } else {
                console.warn("Point found inside convex, but did not find penetrating face!");
            }
        }
    }

    /*
     * Near phase calculation, get the contact point, normal, etc.
     * @param array result The result one will get back with all the contact point information
     * @param Shape si Colliding shape. If not given, particle is assumed.
     * @param Shape sj
     * @param Vec3 xi Position of the center of mass
     * @param Vec3 xj
     * @param Quaternion qi Rotation around the center of mass
     * @param Quaternion qj
     * @todo All collision cases
     */
    function nearPhase(result,si,sj,xi,xj,qi,qj,bi,bj){
        var swapped = false, types = CANNON.Shape.types;
        if(si && sj){
            if(si.type>sj.type){
                var temp;
                temp=sj;   sj=si;   si=temp;
                temp=xj;   xj=xi;   xi=temp;
                temp=qj;   qj=qi;   qi=temp;
                temp=bj;   bj=bi;   bi=temp;
                swapped = true;
            }
        } else {
            // Particle!
            if(si && !sj){
                var temp;
                temp=sj;   sj=si;   si=temp;
                temp=xj;   xj=xi;   xi=temp;
                temp=qj;   qj=qi;   qi=temp;
                temp=bj;   bj=bi;   bi=temp;
                swapped = true;
            }
        }

        if(si && sj){
            if(si.type==types.SPHERE){

                switch(sj.type){
                case types.SPHERE: // sphere-sphere
                    sphereSphere(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.PLANE: // sphere-plane
                    spherePlane(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.BOX: // sphere-box
                    sphereBox(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.COMPOUND: // sphere-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.CONVEXPOLYHEDRON: // sphere-convexpolyhedron
                    console.warn("sphere/convexpolyhedron contacts not implemented yet.");
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.SPHERE and "+sj.type+" not implemented yet.");
                    break;
                }
            
            } else if(si.type==types.PLANE){
                
                switch(sj.type){
                case types.PLANE: // plane-plane
                    throw new Error("Plane-plane collision... wait, you did WHAT?");
                    break;
                case types.BOX: // plane-box
                    planeBox(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.COMPOUND: // plane-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.CONVEXPOLYHEDRON: // plane-convex polyhedron
                    planeConvex(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.PLANE and "+sj.type+" not implemented yet.");
                    break;
                }

            } else if(si.type==types.BOX){
                
                switch(sj.type){
                case types.BOX: // box-box
                    // Do convex/convex instead
                    nearPhase(result,si.convexPolyhedronRepresentation,sj.convexPolyhedronRepresentation,xi,xj,qi,qj,bi,bj);
                    break;
                case types.COMPOUND: // box-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.CONVEXPOLYHEDRON: // box-convexpolyhedron
                    // Do convex/convex instead
                    nearPhase(result,si.convexPolyhedronRepresentation,sj,xi,xj,qi,qj,bi,bj);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.BOX and "+sj.type+" not implemented yet.");
                    break;
                }
            
            } else if(si.type==types.COMPOUND){
                
                switch(sj.type){
                case types.COMPOUND: // compound-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.CONVEXPOLYHEDRON: // compound-convex polyhedron
                    recurseCompound(result,sj,si,xj,xi,qj,qi,bj,bi);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.COMPOUND and "+sj.type+" not implemented yet.");
                    break;
                }

            } else if(si.type==types.CONVEXPOLYHEDRON){

                switch(sj.type){
                case types.CONVEXPOLYHEDRON: // convex polyhedron - convex polyhedron
                    convexConvex(result,sj,si,xj,xi,qj,qi,bj,bi);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.CONVEXPOLYHEDRON and "+sj.type+" not implemented yet.");
                    break;
                }

            }

        } else {

            // Particle!
            switch(sj.type){
            case types.PLANE: // Particle vs plane
                particlePlane(result,si,sj,xi,xj,qi,qj,bi,bj);
                break;
            case types.SPHERE: // Particle vs sphere
                particleSphere(result,si,sj,xi,xj,qi,qj,bi,bj);
                break;
            case types.BOX: // Particle vs box
                particleConvex(result,si,sj.convexPolyhedronRepresentation,xi,xj,qi,qj,bi,bj);
                break;
            case types.CONVEXPOLYHEDRON: // particle-convex
                particleConvex(result,si,sj,xi,xj,qi,qj,bi,bj);
                break;
            default:
                console.warn("Collision between CANNON.Particle and "+sj.type+" not implemented yet.");
                break;
            }
        }
    
        // Swap back if we swapped bodies in the beginning
        for(var i=0; swapped && i<result.length; i++)
            swapResult(result[i]);
    }

    /**
     * @method reduceContacts
     * @memberof CANNON.ContactGenerator
     * @brief Removes unnecessary members of an array of CANNON.ContactPoint.
     */
    this.reduceContacts = function(contacts){
    
    }

    /**
     * @method getContacts
     * @memberof CANNON.ContactGenerator
     * @param array p1 Array of body indices
     * @param array p2 Array of body indices
     * @param CANNON.World world
     * @param array result Array to store generated contacts
     * @param array oldcontacts Optional. Array of reusable contact objects
     */
    this.getContacts = function(p1,p2,world,result,oldcontacts){
    
        // Save old contact objects
        for(var i=0; oldcontacts && i<oldcontacts.length; i++)
            contactPointPool.push(oldcontacts[i]);

        for(var k=0; k<p1.length; k++){
            // Get current collision indeces
            var bi = p1[k],
            bj = p2[k];

            // Get contacts
            nearPhase(  result,
                        bi.shape,
                        bj.shape,
                        bi.position,
                        bj.position,
                        bi.quaternion,
                        bj.quaternion,
                        bi,
                        bj
                        );
        }
    }
};