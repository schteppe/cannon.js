/**
 * @class CANNON.ContactGenerator
 * @brief Helper class for the World. Generates ContactEquations.
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
        } else {
            return new CANNON.ContactEquation(bi,bj);
        }
    }

    /*
     * Swaps the body references in the contact
     * @param object r
     */
    function swapResult(r){
        var temp;
        temp = r.ri;
        r.ri = r.rj;
        r.rj = temp;
        vec3.negate(r.ni,r.ni);
        temp = r.bi;
        r.bi = r.bj;
        r.bj = temp;
    }

    function sphereSphere(result,si,sj,xi,xj,qi,qj,bi,bj){
        // We will have only one contact in this case
        var r = makeResult(bi,bj);

        // Contact normal
        vec3.subtract( r.ni,bj.position,xi);
        vec3.normalize(r.ni,r.ni);//.normalize();

        // Contact point locations
        vec3.copy(r.ri,r.ni);
        vec3.copy(r.rj,r.ni);
        vec3.scale( r.ri,r.ri,si.radius);
        vec3.scale( r.rj,r.rj,-sj.radius);
        result.push(r);
    }

    var point_on_plane_to_sphere = vec3.create();
    var plane_to_sphere_ortho = vec3.create();
    function spherePlane(result,si,sj,xi,xj,qi,qj,bi,bj){
        // We will have one contact in this case
        var r = makeResult(bi,bj);

        // Contact normal
        vec3.set(r.ni,0,0,1);
        vec3.transformQuat(r.ni,r.ni,qj); //vec3.transformQuat(r.ni,r.ni,qj);
        vec3.scale(r.ni,r.ni,-1) //vec3.negate(r.ni,r.ni); // body i is the sphere, flip normal
        vec3.normalize(r.ni,r.ni); //vec3.normalize(r.ni,r.ni);

        // Vector from sphere center to contact point
        vec3.scale(r.ri, r.ni, si.radius); //vec3.scale(r.ri,r.r.ni,si.radius);

        // Project down sphere on plane
        vec3.subtract(point_on_plane_to_sphere,xi,xj);
        vec3.scale(plane_to_sphere_ortho, r.ni, vec3.dot(r.ni,point_on_plane_to_sphere));
        vec3.subtract(r.rj,point_on_plane_to_sphere,plane_to_sphere_ortho); // The sphere position projected to plane
        if(vec3.squaredLength(plane_to_sphere_ortho) <= si.radius * si.radius){
            result.push(r);
        }
    }

    // See http://bulletphysics.com/Bullet/BulletFull/SphereTriangleDetector_8cpp_source.html
    var pointInPolygon_edge = vec3.create();
    var pointInPolygon_edge_x_normal = vec3.create();
    var pointInPolygon_vtp = vec3.create();
    function pointInPolygon(verts, normal, p){
        var positiveResult = null;
        var N = verts.length;
        for(var i=0; i!==N; i++){
            var v = verts[i];

            // Get edge to the next vertex
            var edge = pointInPolygon_edge;
            vec3.subtract(edge,verts[(i+1)%N],v);

            // Get cross product between polygon normal and the edge
            var edge_x_normal = pointInPolygon_edge_x_normal;
            //var edge_x_normal = vec3.create();
            vec3.cross(edge_x_normal,edge,normal);

            // Get vector between point and current vertex
            var vertex_to_p = pointInPolygon_vtp;
            vec3.subtract(vertex_to_p,p,v);

            // This dot product determines which side of the edge the point is
            var r = vec3.dot(edge_x_normal,vertex_to_p);

            // If all such dot products have same sign, we are inside the polygon.
            if(positiveResult===null || (r>0 && positiveResult===true) || (r<=0 && positiveResult===false)){
                if(positiveResult===null){
                    positiveResult = r>0;
                }
                continue;
            } else {
                return false; // Encountered some other sign. Exit.
            }
        }

        // If we got here, all dot products were of the same sign.
        return true;
    }

    var box_to_sphere = vec3.create();
    var sphereBox_ns = vec3.create();
    var sphereBox_ns1 = vec3.create();
    var sphereBox_ns2 = vec3.create();
    var sphereBox_sides = [vec3.create(),vec3.create(),vec3.create(),vec3.create(),vec3.create(),vec3.create()];
    var sphereBox_sphere_to_corner = vec3.create();
    var sphereBox_side_ns = vec3.create();
    var sphereBox_side_ns1 = vec3.create();
    var sphereBox_side_ns2 = vec3.create();
    function sphereBox(result,si,sj,xi,xj,qi,qj,bi,bj){
        // we refer to the box as body j
        var sides = sphereBox_sides;
        vec3.subtract(box_to_sphere,xi,xj);
        sj.getSideNormals(sides,qj);
        var R =     si.radius;
        var penetrating_sides = [];

        // Check side (plane) intersections
        var found = false;

        // Store the resulting side penetration info
        var side_ns = sphereBox_side_ns;
        var side_ns1 = sphereBox_side_ns1;
        var side_ns2 = sphereBox_side_ns2;
        var side_h = null;
        var side_penetrations = 0;
        var side_dot1 = 0;
        var side_dot2 = 0;
        var side_distance = null;
        for(var idx=0,nsides=sides.length; idx!==nsides && found===false; idx++){
            // Get the plane side normal (ns)
            var ns = sphereBox_ns;
            vec3.copy(ns,sides[idx]);

            var h = vec3.length(ns);
            vec3.normalize(ns,ns);

            // The normal/distance dot product tells which side of the plane we are
            var dot = vec3.dot(box_to_sphere,ns);

            if(dot<h+R && dot>0){
                // Intersects plane. Now check the other two dimensions
                var ns1 = sphereBox_ns1;
                var ns2 = sphereBox_ns2;
                /*sides[(idx+1)%3].copy(ns1);
                sides[(idx+2)%3].copy(ns2);*/
                vec3.copy(ns1,sides[(idx+1)%3]);
                vec3.copy(ns2,sides[(idx+2)%3]);
                var h1 = vec3.length(ns1);
                var h2 = vec3.length(ns2);
                vec3.normalize(ns1,ns1);
                vec3.normalize(ns2,ns2);
                var dot1 = vec3.dot(box_to_sphere,ns1);
                var dot2 = vec3.dot(box_to_sphere,ns2);
                if(dot1<h1 && dot1>-h1 && dot2<h2 && dot2>-h2){
                    var dist = Math.abs(dot-h-R);
                    if(side_distance===null || dist < side_distance){
                        side_distance = dist;
                        side_dot1 = dot1;
                        side_dot2 = dot2;
                        side_h = h;
                        vec3.copy(side_ns,ns);
                        vec3.copy(side_ns1,ns1);
                        vec3.copy(side_ns2,ns2);
                        side_penetrations++;
                    }
                }
            }
        }
        if(side_penetrations){
            found = true;
            var r = makeResult(bi,bj);
            vec3.scale(r.ri,side_ns,-R); // Sphere r
            vec3.copy(r.ni,side_ns);
            vec3.negate(r.ni,r.ni); // Normal should be out of sphere
            vec3.scale(side_ns,side_ns,side_h);
            vec3.scale(side_ns1,side_ns1,side_dot1);
            vec3.add(side_ns,side_ns,side_ns1);
            vec3.scale(side_ns2,side_ns2,side_dot2);
            vec3.add(r.rj,side_ns,side_ns2);
            result.push(r);
        }

        // Check corners
        var rj = v3pool.get();
        var sphere_to_corner = sphereBox_sphere_to_corner;
        for(var j=0; j!==2 && !found; j++){
            for(var k=0; k!==2 && !found; k++){
                for(var l=0; l!==2 && !found; l++){
                    vec3.set(rj,0,0,0);
                    if(j){
                        vec3.add(rj,rj,sides[0]);
                    } else {
                        vec3.subtract(rj,rj,sides[0]);
                    }
                    if(k){
                        vec3.add(rj,rj,sides[1]);
                    } else {
                        vec3.subtract(rj,rj,sides[1]);
                    }
                    if(l){
                        vec3.add(rj,rj,sides[2]);
                    } else {
                        vec3.subtract(rj,rj,sides[2]);
                    }

                    // World position of corner
                    vec3.add(sphere_to_corner,xj,rj);
                    vec3.subtract(sphere_to_corner,sphere_to_corner,xi);

                    if(vec3.squaredLength(sphere_to_corner) < R*R){
                        found = true;
                        var r = makeResult(bi,bj);
                        vec3.copy(r.ri,sphere_to_corner);
                        vec3.normalize(r.ri,r.ri);
                        vec3.copy(r.ni,r.ri);
                        vec3.scale(r.ri,r.ri,R);
                        vec3.copy(r.rj,rj);
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
        var Nsides = sides.length;
        for(var j=0; j!==Nsides && !found; j++){
            for(var k=0; k!==Nsides && !found; k++){
                if(j%3 !== k%3){
                    // Get edge tangent
                    vec3.cross(edgeTangent,sides[k],sides[j]);
                    vec3.normalize(edgeTangent,edgeTangent);
                    vec3.add( edgeCenter,sides[j],sides[k]);
                    vec3.copy(r,xi);
                    vec3.subtract(r,r,edgeCenter);
                    vec3.subtract(r,r,xj);
                    var orthonorm = vec3.dot(r,edgeTangent); // distance from edge center to sphere center in the tangent direction
                    vec3.scale(orthogonal,edgeTangent,orthonorm); // Vector from edge center to sphere center in the tangent direction

                    // Find the third side orthogonal to this one
                    var l = 0;
                    while(l===j%3 || l===k%3){
                        l++;
                    }

                    // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
                    vec3.copy(dist,xi);
                    vec3.subtract(dist,dist,orthogonal);
                    vec3.subtract(dist,dist,edgeCenter);
                    vec3.subtract(dist,dist,xj);

                    // Distances in tangent direction and distance in the plane orthogonal to it
                    var tdist = Math.abs(orthonorm);
                    var ndist = vec3.length(dist);

                    if(tdist < vec3.length(sides[l]) && ndist<R){
                        found = true;
                        var res = makeResult(bi,bj);
                        vec3.add(res.rj,edgeCenter,orthogonal); // box rj
                        vec3.copy(res.rj,res.rj);
                        vec3.negate(res.ni,dist);
                        vec3.normalize(res.ni,res.ni);

                        vec3.copy(res.ri,res.rj);
                        vec3.add(res.ri,res.ri,xj);
                        vec3.subtract(res.ri,res.ri,xi);
                        vec3.normalize(res.ri,res.ri);
                        vec3.scale(res.ri,res.ri,R);

                        result.push(res);
                    }
                }
            }
        }
        v3pool.release(edgeTangent,edgeCenter,r,orthogonal,dist);
    }

    var convex_to_sphere = vec3.create();
    var sphereConvex_edge = vec3.create();
    var sphereConvex_edgeUnit = vec3.create();
    var sphereConvex_sphereToCorner = vec3.create();
    var sphereConvex_worldCorner = vec3.create();
    var sphereConvex_worldNormal = vec3.create();
    var sphereConvex_worldPoint = vec3.create();
    var sphereConvex_worldSpherePointClosestToPlane = vec3.create();
    var sphereConvex_penetrationVec = vec3.create();
    var sphereConvex_sphereToWorldPoint = vec3.create();
    function sphereConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        vec3.subtract(convex_to_sphere,xi,xj);
        var normals = sj.faceNormals;
        var faces = sj.faces;
        var verts = sj.vertices;
        var R =     si.radius;
        var penetrating_sides = [];

        // Check corners
        for(var i=0; i!==verts.length; i++){
            var v = verts[i];

            // World position of corner
            var worldCorner = sphereConvex_worldCorner;
            vec3.transformQuat(worldCorner,v,qj);
            vec3.add(worldCorner,xj,worldCorner);
            var sphere_to_corner = sphereConvex_sphereToCorner;
            vec3.subtract( sphere_to_corner,worldCorner,xi);
            if(vec3.squaredLength(sphere_to_corner)<R*R){
                found = true;
                var r = makeResult(bi,bj);
                vec3.copy(r.ri,sphere_to_corner);
                vec3.normalize(r.ri,r.ri);
                vec3.copy(r.ni,r.ri);
                vec3.scale(r.ri,r.ri,R);
                vec3.subtract(r.rj,worldCorner,xj);
                result.push(r);
                return;
            }
        }

        // Check side (plane) intersections
        var found = false;
        for(var i=0,nfaces=faces.length; i!==nfaces && found===false; i++){
            var normal = normals[i];
            var face = faces[i];

            var worldNormal = sphereConvex_worldNormal;
            vec3.transformQuat(worldNormal,normal,qj);

            var worldPoint = sphereConvex_worldPoint;
            vec3.transformQuat(worldPoint,verts[face[0]],qj);
            vec3.add(worldPoint,worldPoint,xj); // Arbitrary point in the face

            var worldSpherePointClosestToPlane = sphereConvex_worldSpherePointClosestToPlane;
            vec3.scale(worldSpherePointClosestToPlane,worldNormal,-R);
            vec3.add(worldSpherePointClosestToPlane,xi,worldSpherePointClosestToPlane);

            var penetrationVec = sphereConvex_penetrationVec;
            vec3.subtract(penetrationVec,worldSpherePointClosestToPlane,worldPoint);
            var penetration = vec3.dot(penetrationVec,worldNormal);

            var sphereToWorldPoint = sphereConvex_sphereToWorldPoint;
            vec3.subtract(sphereToWorldPoint,xi,worldPoint);

            if(penetration<0 && vec3.dot(sphereToWorldPoint,worldNormal)>0){
                // Intersects plane. Now check if the sphere is inside the face polygon
                var faceVerts = []; // Face vertices, in world coords
                for(var j=0, Nverts=face.length; j!==Nverts; j++){
                    var worldVertex = v3pool.get();
                    vec3.transformQuat( worldVertex,verts[face[j]],qj);
                    vec3.add(worldVertex,xj,worldVertex);
                    faceVerts.push(worldVertex);
                }

                if(pointInPolygon(faceVerts,worldNormal,xi)){ // Is the sphere center in the face polygon?
                    found = true;
                    var r = makeResult(bi,bj);
                    vec3.scale(r.ri,worldNormal,-R); // Sphere r
                    vec3.negate(r.ni,worldNormal); // Normal should be out of sphere

                    var penetrationVec2 = v3pool.get();
                    vec3.scale(penetrationVec2,worldNormal,-penetration);
                    var penetrationSpherePoint = v3pool.get();
                    vec3.scale(penetrationSpherePoint,worldNormal,-R);

                    //xi.vsub(xj).vadd(penetrationSpherePoint).vadd(penetrationVec2 , r.rj);
                    vec3.subtract(r.rj,xi,xj);
                    vec3.add(r.rj,r.rj,penetrationSpherePoint);
                    vec3.add( r.rj,r.rj,penetrationVec2 );

                    v3pool.release(penetrationVec2);
                    v3pool.release(penetrationSpherePoint);

                    result.push(r);

                    // Release world vertices
                    for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                        v3pool.release(faceVerts[j]);
                    }

                    return; // We only expect *one* face contact
                } else {
                    // Edge?
                    for(var j=0; j!==face.length; j++){

                        // Get two world transformed vertices
                        var v1 = v3pool.get();
                        var v2 = v3pool.get();
                        vec3.transformQuat( v1,verts[face[(j+1)%face.length]],qj);
                        vec3.transformQuat( v2,verts[face[(j+2)%face.length]],qj);
                        vec3.add( v1,xj,v1);
                        vec3.add( v2,xj,v2);

                        // Construct edge vector
                        var edge = sphereConvex_edge;
                        vec3.subtract(edge,v2,v1);

                        // Construct the same vector, but normalized
                        var edgeUnit = sphereConvex_edgeUnit;
                        vec3.normalize(edgeUnit,edge);

                        // p is xi projected onto the edge
                        var p = v3pool.get();
                        var v1_to_xi = v3pool.get();
                        vec3.subtract( v1_to_xi,xi,v1);
                        var dot = vec3.dot(v1_to_xi,edgeUnit);
                        vec3.scale( p,edgeUnit,dot);
                        vec3.add( p,p,v1);

                        // Compute a vector from p to the center of the sphere
                        var xi_to_p = v3pool.get();
                        vec3.subtract( xi_to_p,p,xi);

                        // Collision if the edge-sphere distance is less than the radius
                        // AND if p is in between v1 and v2
                        if(dot > 0 && dot*dot<vec3.squaredLength(edge) && vec3.squaredLength(xi_to_p) < R*R){ // Collision if the edge-sphere distance is less than the radius
                            // Edge contact!
                            var r = makeResult(bi,bj);
                            vec3.subtract(r.rj,p,xj);

                            vec3.subtract(r.ni,p,xi);
                            vec3.normalize(r.ni,r.ni);

                            vec3.scale(r.ri,r.ni,R);
                            result.push(r);

                            // Release world vertices
                            for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                                v3pool.release(faceVerts[j]);
                            }

                            v3pool.release(v1);
                            v3pool.release(v2);
                            v3pool.release(p);
                            v3pool.release(xi_to_p);
                            v3pool.release(v1_to_xi);

                            return;
                        }

                        v3pool.release(v1);
                        v3pool.release(v2);
                        v3pool.release(p);
                        v3pool.release(xi_to_p);
                        v3pool.release(v1_to_xi);
                    }
                }

                // Release world vertices
                for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                    v3pool.release(faceVerts[j]);
                }
            }
        }
    }

    var planeBox_normal = vec3.create();
    var plane_to_corner = vec3.create();
    function planeBox(result,si,sj,xi,xj,qi,qj,bi,bj){
        planeConvex(result,si,sj.convexPolyhedronRepresentation,xi,xj,qi,qj,bi,bj);
    }

    /*
     * Go recursive for compound shapes
     * @param Shape si
     * @param CompoundShape sj
     */
    var recurseCompound_v3pool = [];
    var recurseCompound_quatpool = [];
    function recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj){
        var v3pool = recurseCompound_v3pool;
        var quatPool = recurseCompound_quatpool;
        var nr = 0;
        for(var i=0, Nchildren=sj.childShapes.length; i!==Nchildren; i++){
            var r = [];
            var newQuat = quatPool.pop() || new CANNON.Quaternion();
            var newPos = v3pool.pop() || vec3.create();
            qj.mult(sj.childOrientations[i],newQuat); // Can't reuse these since nearPhase() may recurse
            vec3.normalize(newQuat,newQuat);
            //var newPos = xj.vadd(qj.vmult(sj.childOffsets[i]));
            vec3.transformQuat(newPos,sj.childOffsets[i],qj);
            vec3.add(newPos,xj,newPos);
            nearPhase(r,
                      si,
                      sj.childShapes[i],
                      xi,
                      newPos,//xj.vadd(qj.vmult(sj.childOffsets[i])), // Transform the shape to its local frame
                      qi,
                      newQuat, // Accumulate orientation
                      bi,
                      bj);
            // Release vector and quat
            quatPool.push(newQuat);

            var tempVec = newPos;

            if(!si){
                nr+= r.length;
            }
            for(var j=0; j!==r.length; j++){
                // The "rj" vector is in world coords, though we must add the world child offset vector.
                //r[j].rj.vadd(vec3.transformQuat(r[j].rj,sj.childOffsets[i]),qj);
                vec3.transformQuat(tempVec,sj.childOffsets[i],qj);
                vec3.add(r[j].rj,r[j].rj,tempVec);
                result.push(r[j]);
            }

            v3pool.push(newPos);
        }
    }

    var planeConvex_v = vec3.create();
    var planeConvex_normal = vec3.create();
    var planeConvex_relpos = vec3.create();
    var planeConvex_projected = vec3.create();
    function planeConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        // Simply return the points behind the plane.
        var v = planeConvex_v;
        var normal = planeConvex_normal;
        vec3.set(normal,0,0,1);
        vec3.transformQuat(normal,normal,qi); // Turn normal according to plane orientation
        var relpos = planeConvex_relpos;
        for(var i=0; i!==sj.vertices.length; i++){
            vec3.copy(v,sj.vertices[i]);
            // Transform to world coords
            vec3.transformQuat(v,v,qj);
            vec3.add(v,xj,v);
            vec3.subtract(relpos,v,xi);

            var dot = vec3.dot(normal,relpos);
            if(dot<=0.0){
                // Get vertex position projected on plane
                var projected = planeConvex_projected;
                normal.mult(vec3.dot(normal,v),projected);
                vec3.subtract(projected,v,projected);

                var r = makeResult(bi,bj);
                vec3.copy( r.ni ,normal); // Contact normal is the plane normal out from plane

                vec3.copy(r.ri,projected); // From plane to vertex projected on plane

                // rj is now just the vertex position
                vec3.subtract(r.rj,v,xj);

                result.push(r);
            }
        }
    }

    var convexConvex_sepAxis = vec3.create();
    var convexConvex_q = vec3.create();
    function convexConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        var sepAxis = convexConvex_sepAxis;
        if(si.findSeparatingAxis(sj,xi,qi,xj,qj,sepAxis)){
            var res = [];
            var q = convexConvex_q;
            si.clipAgainstHull(xi,qi,sj,xj,qj,sepAxis,-100,100,res);
            //console.log(res.length);
            for(var j=0; j!==res.length; j++){
                var r = makeResult(bi,bj);
                vec3.negate(r.ni,sepAxis);
                vec3.negate(q,res[j].normal);
                q.mult(res[j].depth,q);
                vec3.add(r.ri,res[j].point,q);
                vec3.copy(r.rj,res[j].point);
                // Contact points are in world coordinates. Transform back to relative
                vec3.subtract(r.rj,r.rj,xj);
                vec3.subtract(r.ri,r.ri,xi);
                result.push(r);
            }
        }
    }

    var particlePlane_normal = vec3.create();
    var particlePlane_relpos = vec3.create();
    var particlePlane_projected = vec3.create();
    function particlePlane(result,si,sj,xi,xj,qi,qj,bi,bj){
        var normal = particlePlane_normal;
        vec3.set(normal,0,0,1);
        bj.quaternion.vmult(normal,normal); // Turn normal according to plane orientation
        var relpos = particlePlane_relpos;
        vec3.subtract(relpos,xi,bj.position);
        var dot = vec3.dot(normal,relpos);
        if(dot<=0.0){
            var r = makeResult(bi,bj);
            vec3.copy( r.ni ,normal); // Contact normal is the plane normal
            vec3.negate(r.ni,r.ni);
            vec3.set(r.ri,0,0,0); // Center of particle

            // Get particle position projected on plane
            var projected = particlePlane_projected;
            normal.mult(vec3.dot(normal,xi),projected);
            vec3.subtract(projected,xi,projected);
            //vec3.add(projected,projected,bj.position);

            // rj is now the projected world position minus plane position
            vec3.copy(r.rj,projected);
            result.push(r);
        }
    }

    var particleSphere_normal = vec3.create();
    function particleSphere(result,si,sj,xi,xj,qi,qj,bi,bj){
        // The normal is the unit vector from sphere center to particle center
        var normal = particleSphere_normal;
        vec3.set(normal,0,0,1);
        vec3.subtract(normal,xi,xj);
        var lengthSquared = vec3.squaredLength(normal);

        if(lengthSquared <= sj.radius * sj.radius){
            var r = makeResult(bi,bj);
            vec3.normalize(normal,normal);
            vec3.copy(r.rj,normal);
            vec3.scale(r.rj,r.rj,sj.radius);
            vec3.copy( r.ni ,normal); // Contact normal
            vec3.negate(r.ni,r.ni);
            vec3.set(r.ri,0,0,0); // Center of particle
            result.push(r);
        }
    }

    // WIP
    var cqj = new CANNON.Quaternion();
    var particleConvex_local = vec3.create();
    var particleConvex_normal = vec3.create();
    var particleConvex_penetratedFaceNormal = vec3.create();
    var particleConvex_vertexToParticle = vec3.create();
    var particleConvex_worldPenetrationVec = vec3.create();
    function particleConvex(result,si,sj,xi,xj,qi,qj,bi,bj){
        var penetratedFaceIndex = -1;
        var penetratedFaceNormal = particleConvex_penetratedFaceNormal;
        var worldPenetrationVec = particleConvex_worldPenetrationVec;
        var minPenetration = null;
        var numDetectedFaces = 0;

        // Convert particle position xi to local coords in the convex
        var local = particleConvex_local;
        vec3.copy(local,xi);
        vec3.subtract(local,local,xj); // Convert position to relative the convex origin
        qj.conjugate(cqj);
        vec3.transformQuat(local,local,cqj);

        if(sj.pointIsInside(local)){

            if(sj.worldVerticesNeedsUpdate){
                sj.computeWorldVertices(xj,qj);
            }
            if(sj.worldFaceNormalsNeedsUpdate){
                sj.computeWorldFaceNormals(qj);
            }

            // For each world polygon in the polyhedra
            for(var i=0,nfaces=sj.faces.length; i!==nfaces; i++){

                // Construct world face vertices
                var verts = [ sj.worldVertices[ sj.faces[i][0] ] ];
                var normal = sj.worldFaceNormals[i];

                // Check how much the particle penetrates the polygon plane.
                vec3.subtract(particleConvex_vertexToParticle,xi,verts[0]);
                var penetration = -vec3.dot(normal,particleConvex_vertexToParticle);
                if(minPenetration===null || Math.abs(penetration)<Math.abs(minPenetration)){
                    minPenetration = penetration;
                    penetratedFaceIndex = i;
                    vec3.copy(penetratedFaceNormal,normal);
                    numDetectedFaces++;
                }
            }

            if(penetratedFaceIndex!==-1){
                // Setup contact
                var r = makeResult(bi,bj);
                vec3.scale( worldPenetrationVec,penetratedFaceNormal,minPenetration);

                // rj is the particle position projected to the face
                vec3.add(worldPenetrationVec,worldPenetrationVec,xi);
                vec3.subtract(worldPenetrationVec,worldPenetrationVec,xj);
                vec3.copy(r.rj,worldPenetrationVec);
                //var projectedToFace = xi.vsub(xj).vadd(worldPenetrationVec);
                //vec3.copy(r.rj,projectedToFace);

                //vec3.transformQuat(r.rj,r.rj,qj);
                vec3.negate( r.ni ,penetratedFaceNormal); // Contact normal
                vec3.set(r.ri,0,0,0); // Center of particle
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
        var swapped = false,
            types = CANNON.Shape.types,
            SPHERE = types.SPHERE,
            PLANE = types.PLANE,
            BOX = types.BOX,
            COMPOUND = types.COMPOUND,
            CONVEXPOLYHEDRON = types.CONVEXPOLYHEDRON;

        if(si && sj){
            if(si.type > sj.type){
                var temp;
                temp=sj;
                sj=si;
                si=temp;

                temp=xj;
                xj=xi;
                xi=temp;

                temp=qj;
                qj=qi;
                qi=temp;

                temp=bj;
                bj=bi;
                bi=temp;

                swapped = true;
            }
        } else {
            // Particle!
            if(si && !sj){
                var temp;
                temp=sj;
                sj=si;
                si=temp;

                temp=xj;
                xj=xi;
                xi=temp;

                temp=qj;
                qj=qi;
                qi=temp;

                temp=bj;
                bj=bi;
                bi=temp;

                swapped = true;
            }
        }

        if(si && sj){
            if(si.type === SPHERE){

                switch(sj.type){
                case SPHERE: // sphere-sphere
                    sphereSphere(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case PLANE: // sphere-plane
                    spherePlane(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case BOX: // sphere-box
                    sphereBox(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case COMPOUND: // sphere-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case CONVEXPOLYHEDRON: // sphere-convexpolyhedron
                    sphereConvex(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.SPHERE and "+sj.type+" not implemented yet.");
                    break;
                }

            } else if(si.type === types.PLANE){

                switch(sj.type){
                case types.PLANE: // plane-plane
                    throw new Error("Plane-plane collision... wait, you did WHAT?");
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

            } else if(si.type===types.BOX){

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

            } else if(si.type===types.COMPOUND){

                switch(sj.type){
                case types.COMPOUND: // compound-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    break;
                case types.CONVEXPOLYHEDRON: // compound-convex polyhedron
                    // Must swap
                    var r = [];
                    recurseCompound(r,sj,si,xj,xi,qj,qi,bj,bi);
                    for(var ri=0; ri!==r.length; ri++){
                        swapResult(r[ri]);
                        result.push(r[ri]);
                    }
                    break;
                default:
                    console.warn("Collision between CANNON.Shape.types.COMPOUND and "+sj.type+" not implemented yet.");
                    break;
                }

            } else if(si.type===types.CONVEXPOLYHEDRON){

                switch(sj.type){
                case types.CONVEXPOLYHEDRON: // convex polyhedron - convex polyhedron
                    convexConvex(result,si,sj,xi,xj,qi,qj,bi,bj);
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
            case types.COMPOUND: // particle-compound
                recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                break;
            default:
                console.warn("Collision between CANNON.Particle and "+sj.type+" not implemented yet.");
                break;
            }
        }

        // Swap back if we swapped bodies in the beginning
        for(var i=0, Nresults=result.length; swapped && i!==Nresults; i++){
            swapResult(result[i]);
        }
    }

    /**
     * @method reduceContacts
     * @memberof CANNON.ContactGenerator
     * @brief Removes unnecessary members of an array of CANNON.ContactPoint.
     */
    this.reduceContacts = function(contacts){

    };

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
        contactPointPool = oldcontacts;

        for(var k=0, N=p1.length; k!==N; k++){
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
    };
};