/**
 * @class CANNON.Ray
 * @author Originally written by mr.doob / http://mrdoob.com/ for Three.js. Cannon.js-ified by schteppe.
 * @brief A line in 3D space that intersects bodies and return points.
 * @param CANNON.Vec3 origin
 * @param CANNON.Vec3 direction
 */
CANNON.Ray = function(origin, direction){
    /**
    * @property CANNON.Vec3 origin
    * @memberof CANNON.Ray
    */
    this.origin = origin || new CANNON.Vec3();

    /**
    * @property CANNON.Vec3 direction
    * @memberof CANNON.Ray
    */
    this.direction = direction || new CANNON.Vec3();

    var precision = 0.0001;

    /**
     * @method setPrecision
     * @memberof CANNON.Ray
     * @param float value
     * @brief Sets the precision of the ray. Used when checking parallelity etc.
     */
    this.setPrecision = function ( value ) {
        precision = value;
    };

    var a = new CANNON.Vec3();
    var b = new CANNON.Vec3();
    var c = new CANNON.Vec3();
    var d = new CANNON.Vec3();

    var directionCopy = new CANNON.Vec3();

    var vector = new CANNON.Vec3();
    var normal = new CANNON.Vec3();
    var intersectPoint = new CANNON.Vec3();

    /**
     * @method intersectBody
     * @memberof CANNON.Ray
     * @param CANNON.RigidBody body
     * @brief Shoot a ray at a body, get back information about the hit.
     * @return Array An array of results. The result objects has properties: distance (float), point (CANNON.Vec3) and body (CANNON.RigidBody).
     */
    this.intersectBody = function ( body ) {
        if(body.shape instanceof CANNON.ConvexPolyhedron){
            return this.intersectShape(body.shape,
                                       body.quaternion,
                                       body.position,
                                       body);
        } else if(body.shape instanceof CANNON.Box){
            return this.intersectShape(body.shape.convexPolyhedronRepresentation,
                                       body.quaternion,
                                       body.position,
                                       body);
        } else {
            console.warn("Ray intersection is this far only implemented for ConvexPolyhedron and Box shapes.");
        }
    };

    /**
     * @method intersectShape
     * @memberof CANNON.Ray
     * @param CANNON.Shape shape
     * @param CANNON.Quaternion quat
     * @param CANNON.Vec3 position
     * @param CANNON.RigidBody body
     * @return Array See intersectBody()
     */
    this.intersectShape = function(shape,quat,position,body){

        var intersect, intersects = [];

        if ( shape instanceof CANNON.ConvexPolyhedron ) {
            // Checking boundingSphere

            var distance = distanceFromIntersection( this.origin, this.direction, position );
            if ( distance > shape.getBoundingSphereRadius() ) {
                return intersects;
            }

            // Checking faces
            var dot, scalar, faces = shape.faces, vertices = shape.vertices, normals = shape.faceNormals;


            for (var fi = 0; fi < faces.length; fi++ ) {

                var face = faces[ fi ];
                var faceNormal = normals[ fi ];
                var q = quat;
                var x = position;

                // determine if ray intersects the plane of the face
                // note: this works regardless of the direction of the face normal

                // Get plane point in world coordinates...
                vertices[face[0]].copy(vector);
                q.vmult(vector,vector);
                vector.vadd(x,vector);

                // ...but make it relative to the ray origin. We'll fix this later.
                vector.vsub(this.origin,vector);

                // Get plane normal
                q.vmult(faceNormal,normal);

                // If this dot product is negative, we have something interesting
                dot = this.direction.dot(normal);

                // bail if ray and plane are parallel
                if ( Math.abs( dot ) < precision ){
                    continue;
                }

                // calc distance to plane
                scalar = normal.dot( vector ) / dot;

                // if negative distance, then plane is behind ray
                if ( scalar < 0 ){
                    continue;
                }

                if (  dot < 0 ) {

                    // Intersection point is origin + direction * scalar
                    this.direction.mult(scalar,intersectPoint);
                    intersectPoint.vadd(this.origin,intersectPoint);

                    // a is the point we compare points b and c with.
                    vertices[ face[0] ].copy(a);
                    q.vmult(a,a);
                    x.vadd(a,a);

                    for(var i=1; i<face.length-1; i++){
                        // Transform 3 vertices to world coords
                        vertices[ face[i] ].copy(b);
                        vertices[ face[i+1] ].copy(c);
                        q.vmult(b,b);
                        q.vmult(c,c);
                        x.vadd(b,b);
                        x.vadd(c,c);

                        if ( pointInTriangle( intersectPoint, a, b, c ) ) {

                            intersect = {
                                distance: this.origin.distanceTo( intersectPoint ),
                                point: intersectPoint.copy(),
                                face: face,
                                body: body
                            };

                            intersects.push( intersect );
                            break;
                        }
                    }
                }
            }
        }
        return intersects;
    };

    /**
     * @method intersectBodies
     * @memberof CANNON.Ray
     * @param Array bodies An array of CANNON.RigidBody objects.
     * @return Array See intersectBody
     */
    this.intersectBodies = function ( bodies ) {

        var intersects = [];

        for ( var i = 0, l = bodies.length; i < l; i ++ ) {
            var result = this.intersectBody( bodies[ i ] );
            Array.prototype.push.apply( intersects, result );
        }

        intersects.sort( function ( a, b ) { return a.distance - b.distance; } );
        return intersects;
    };

    var v0 = new CANNON.Vec3(), intersect = new CANNON.Vec3();
    var dot, distance;

    function distanceFromIntersection( origin, direction, position ) {

        // v0 is vector from origin to position
        position.vsub(origin,v0);
        dot = v0.dot( direction );

        // intersect = direction*dot + origin
        direction.mult(dot,intersect);
        intersect.vadd(origin,intersect);

        distance = position.distanceTo( intersect );

        return distance;
    }

    // http://www.blackpawn.com/texts/pointinpoly/default.html

    var dot00, dot01, dot02, dot11, dot12, invDenom, u, v;
    var v1 = new CANNON.Vec3(), v2 = new CANNON.Vec3();

    function pointInTriangle( p, a, b, c ) {
        c.vsub(a,v0);
        b.vsub(a,v1);
        p.vsub(a,v2);

        dot00 = v0.dot( v0 );
        dot01 = v0.dot( v1 );
        dot02 = v0.dot( v2 );
        dot11 = v1.dot( v1 );
        dot12 = v1.dot( v2 );

        invDenom = 1 / ( dot00 * dot11 - dot01 * dot01 );
        u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
        v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

        return ( u >= 0 ) && ( v >= 0 ) && ( u + v < 1 );
    }
};
CANNON.Ray.prototype.constructor = CANNON.Ray;
