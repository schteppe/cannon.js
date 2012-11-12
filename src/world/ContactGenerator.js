/*global CANNON:true */

/**
 * @class CANNON.ContactGenerator
 * @brief Helper class for the World. Generates ContactPoints.
 */
CANNON.ContactGenerator = function(){

    /**
     * @property bool contactReduction
     * @memberof CANNON.ContactGenerator
     * @brief Turns on or off contact reduction. Can be handy to turn off when debugging new collision types.
     */
    this.contactReduction = true;

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
        var swapped = false;
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
        }

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
                return new CANNON.ContactPoint(bi,bj);
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

        if(si && sj){
            if(si.type==CANNON.Shape.types.SPHERE){
                if(sj.type==CANNON.Shape.types.SPHERE){ // sphere-sphere

                    // We will have one contact in this case
                    var r = makeResult(bi,bj);

                    // Contact normal
                    xj.vsub(xi,r.ni);
                    r.ni.normalize();

                    // Contact point locations
                    r.ni.copy(r.ri);
                    r.ni.copy(r.rj);
                    r.ri.mult(si.radius,r.ri);
                    r.rj.mult(-sj.radius,r.rj);
                    result.push(r);

                } else if(sj.type==CANNON.Shape.types.PLANE){ // sphere-plane

                    // We will have one contact in this case
                    var r = makeResult(bi,bj);

                    // Contact normal
                    //sj.normal.copy(r.ni);
                    r.ni.set(0,0,1);
                    qj.vmult(r.ni,r.ni);
                    r.ni.negate(r.ni); // body i is the sphere, flip normal
                    r.ni.normalize();

                    // Vector from sphere center to contact point
                    r.ni.mult(si.radius,r.ri);

                    // Project down sphere on plane
                    var point_on_plane_to_sphere = xi.vsub(xj);
                    var plane_to_sphere_ortho = r.ni.mult(r.ni.dot(point_on_plane_to_sphere));
                    r.rj = point_on_plane_to_sphere.vsub(plane_to_sphere_ortho); // The sphere position projected to plane
                    if(plane_to_sphere_ortho.norm() <= si.radius)
                    result.push(r);
                    
                } else if(sj.type==CANNON.Shape.types.BOX){ // sphere-box

                    // we refer to the box as body j
                    var box_to_sphere =  xi.vsub(xj);
                    var sides = sj.getSideNormals(true,qj);
                    var R =     si.radius;
                    var penetrating_sides = [];

                    // Check side (plane) intersections
                    var found = false;
                    for(var idx=0; idx<sides.length && !found; idx++){ // Max 3 penetrating sides
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

                } else if(sj.type==CANNON.Shape.types.COMPOUND){ // sphere-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);

                } else if(sj.type==CANNON.Shape.types.CONVEXPOLYHEDRON){ // sphere-convexpolyhedron
                    throw new Error("sphere/convexpolyhedron contacts not implemented yet.");
                }
            
            } else if(si.type==CANNON.Shape.types.PLANE){
                
                if(sj.type==CANNON.Shape.types.PLANE){ // plane-plane
                    throw "Plane-plane collision... wait, you did WHAT?";
                    
                } else if(sj.type==CANNON.Shape.types.BOX){ // plane-box

                    // Collision normal
                    var n = new CANNON.Vec3(0,0,1); //si.normal.copy();
                    qi.vmult(n,n);

                    // Loop over corners
                    var numcontacts = 0;
                    var corners = sj.getCorners(qj);
                    for(var idx=0; idx<corners.length && numcontacts<=4; idx++){ // max 4 corners against plane
                        var r = makeResult(bi,bj);
                        var worldCorner = corners[idx].vadd(xj);
                        corners[idx].copy(r.rj);

                        // Project down corner to plane to get xj
                        var point_on_plane_to_corner = worldCorner.vsub(xi);
                        var d = n.dot(point_on_plane_to_corner);
                        if(d<=0){
                            numcontacts++;
                            var plane_to_corner = n.mult(d);
                            point_on_plane_to_corner.vsub(plane_to_corner,r.ri);
                            
                            // Set contact normal
                            n.copy(r.ni);
                            
                            // Add contact
                            result.push(r);
                        }
                    }
                    
                } else if(sj.type==CANNON.Shape.types.COMPOUND){ // plane-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);

                } else if(sj.type==CANNON.Shape.types.CONVEXPOLYHEDRON){ // plane-convex polyhedron
                    // Separating axis is the plane normal
                    // Create a virtual box polyhedron for the plane
                    var t1 = v3pool.get();
                    var t2 = v3pool.get();
                    //si.normal.tangents(t1,t2);
                    t1.set(1,0,0);
                    t2.set(0,1,0);
                    qi.vmult(t1,t1); // Rotate the tangents
                    qi.vmult(t2,t2);
                    t1.mult(100000,t1);
                    t2.mult(100000,t2);
                    var n = v3pool.get();
                    n.set(0,0,1);
                    qi.vmult(n,n);

                    planehull.vertices[0].set(-t1.x -t2.x -n.x, -t1.y -t2.y -n.y, -t1.z -t2.z -n.z); //---
                    planehull.vertices[1].set( t1.x -t2.x +0*n.x,  t1.y -t2.y +0*n.y,  t1.z -t2.z +0*n.z); // +-+
                    planehull.vertices[2].set( t1.x +t2.x -n.x,  t1.y +t2.y -n.y,  t1.z +t2.z -n.z); // ++- 
                    planehull.vertices[3].set(-t1.x +t2.x -n.x, -t1.y +t2.y -n.y, -t1.z +t2.z -n.z); // -+-
                    planehull.vertices[4].set(-t1.x -t2.x +0*n.x, -t1.y -t2.y +0*n.y, -t1.z -t2.z +0*n.z); // --+
                    planehull.vertices[5].set(+t1.x -t2.x +0*n.x,  t1.y -t2.y +0*n.y,  t1.z -t2.z +0*n.z); // +-+
                    planehull.vertices[6].set(+t1.x +t2.x +0*n.x, +t1.y +t2.y +0*n.y,  t1.z +t2.z +0*n.z); // +++
                    planehull.vertices[7].set(-t1.x +t2.x +0*n.x, -t1.y +t2.y +0*n.y, -t1.z +t2.z +0*n.z); // -++
                    t1.normalize();
                    t2.normalize();
                    planehull.faceNormals[0].set( -n.x, -n.y, -n.z);
                    planehull.faceNormals[1].set(  n.x,  n.y,  n.z);
                    planehull.faceNormals[2].set(-t2.x,-t2.y,-t2.z);
                    planehull.faceNormals[3].set( t2.x, t2.y, t2.z);
                    planehull.faceNormals[4].set(-t1.x,-t1.y,-t1.z);
                    planehull.faceNormals[5].set( t1.x, t1.y, t1.z);
                    
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

            } else if(si.type==CANNON.Shape.types.BOX){
                
                if(sj.type==CANNON.Shape.types.BOX){ // box-box
                    // Do convex polyhedron instead
                    nearPhase(result,
                              si.convexPolyhedronRepresentation,
                              sj.convexPolyhedronRepresentation,
                              xi,xj,qi,qj,bi,bj);

                } else if(sj.type==CANNON.Shape.types.COMPOUND){ // box-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    
                } else if(sj.type==CANNON.Shape.types.CONVEXPOLYHEDRON){ // box-convexpolyhedron
                    nearPhase(result,
                              si.convexPolyhedronRepresentation,
                              sj,xi,xj,qi,qj,bi,bj);
                }
            
            } else if(si.type==CANNON.Shape.types.COMPOUND){
                
                if(sj.type==CANNON.Shape.types.COMPOUND){ // compound-compound
                    recurseCompound(result,si,sj,xi,xj,qi,qj,bi,bj);
                    
                } else if(sj.type==CANNON.Shape.types.CONVEXPOLYHEDRON){ // compound-convex polyhedron
                    recurseCompound(result,sj,si,xj,xi,qj,qi,bj,bi);    
                }

            } else if(si.type==CANNON.Shape.types.CONVEXPOLYHEDRON){

                if(sj.type==CANNON.Shape.types.CONVEXPOLYHEDRON){ // convex polyhedron - convex polyhedron
                    var sepAxis = new CANNON.Vec3();
                    if(si.findSeparatingAxis(sj,xi,qi,xj,qj,sepAxis)){
                        var res = [];
                        var q = new CANNON.Vec3();
                        si.clipAgainstHull(xi,qi,sj,xj,qj,sepAxis,-100,100,res);
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
                }
            }
        } else {
            // Particle!
            var particle = si ? bj : bi;
            var other = si ? bi : bj;
            var otherShape = other.shape;
            var type = otherShape.type;

            if(type == CANNON.Shape.types.PLANE){ // Particle vs plane
                var normal = new CANNON.Vec3(0,0,1); // todo: cache
                other.quaternion.vmult(normal,normal); // Turn normal according to plane orientation
                var relpos = new CANNON.Vec3(); // todo: cache
                particle.position.vsub(other.position,relpos);
                var dot = normal.dot(relpos);
                if(dot<=0.0){
                    var r = makeResult(particle,other);
                    normal.copy( r.ni ); // Contact normal is the plane normal
                    r.ni.negate(r.ni);
                    r.ri.set(0,0,0); // Center of particle

                    // Get particle position projected on plane
                    var projected = new CANNON.Vec3(); // todo: cache
                    normal.mult(normal.dot(particle.position),projected);
                    particle.position.vsub(projected,projected);
                    //projected.vadd(other.position,projected);

                    // rj is now the projected world position minus plane position
                    projected.copy(r.rj);
                    result.push(r);
                }
            } else if(type == CANNON.Shape.types.SPHERE){ // Particle vs sphere

                // The normal is the unit vector from sphere center to particle center
                var normal = new CANNON.Vec3(0,0,1); // todo: cache
                particle.position.vsub(other.position,normal);
                var lengthSquared = normal.norm2();

                if(lengthSquared <= Math.pow(otherShape.radius,2)){
                    var r = makeResult(particle,other);
                    normal.normalize();
                    normal.copy(r.rj);
                    r.rj.mult(otherShape.radius,r.rj);
                    normal.copy( r.ni ); // Contact normal
                    r.ni.negate(r.ni);
                    r.ri.set(0,0,0); // Center of particle
                    result.push(r);
                }
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