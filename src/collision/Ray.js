module.exports = Ray;

var Vec3 = require('../math/Vec3')
,   ConvexPolyhedron = require('../objects/ConvexPolyhedron')
,   Box = require('../objects/Box')

/**
 * A line in 3D space that intersects bodies and return points.
 * @class Ray
 * @author Originally written by mr.doob / http://mrdoob.com/ for Three.js. Cannon.js-ified by schteppe.
 * @param {Vec3} origin
 * @param {Vec3} direction
 */
function Ray(origin, direction){
    /**
     * @property {Vec3} origin
     */
    this.origin = origin || new Vec3();

    /**
     * @property {Vec3} direction
     */
    this.direction = direction || new Vec3();

    /**
     * The precision of the ray. Used when checking parallelity etc.
     * @property {Number} precision
     */
    this.precision = 0.0001;
};
Ray.prototype.constructor = Ray;

var v1 = new Vec3(),
    v2 = new Vec3();

/*
 * As per "Barycentric Technique" as named here http://www.blackpawn.com/texts/pointinpoly/default.html But without the division
 */
function pointInTriangle( p, a, b, c ) {
    c.vsub(a,v0);
    b.vsub(a,v1);
    p.vsub(a,v2);

    var dot00 = v0.dot( v0 );
    var dot01 = v0.dot( v1 );
    var dot02 = v0.dot( v2 );
    var dot11 = v1.dot( v1 );
    var dot12 = v1.dot( v2 );

    var u,v;

    return  ( (u = dot11 * dot02 - dot01 * dot12) >= 0 ) &&
            ( (v = dot00 * dot12 - dot01 * dot02) >= 0 ) &&
            ( u + v < ( dot00 * dot11 - dot01 * dot01 ) );
}

/**
 * Shoot a ray at a body, get back information about the hit.
 * @method intersectBody
 * @param {RigidBody} body
 * @return {Array} An array of results. The result objects has properties: distance (float), point (Vec3) and body (RigidBody).
 */
Ray.prototype.intersectBody = function ( body ) {
    if(body.shape instanceof ConvexPolyhedron){
        return this.intersectShape(body.shape,
                                   body.quaternion,
                                   body.position,
                                   body);
    } else if(body.shape instanceof Box){
        return this.intersectShape(body.shape.convexPolyhedronRepresentation,
                                   body.quaternion,
                                   body.position,
                                   body);
    } else {
        console.warn("Ray intersection is this far only implemented for ConvexPolyhedron and Box shapes.");
    }
};

function distanceSortFunc( a, b ) {
    return a.distance - b.distance;
}

/**
 * @method intersectBodies
 * @param {Array} bodies An array of RigidBody objects.
 * @return {Array} See intersectBody
 */
Ray.prototype.intersectBodies = function ( bodies ) {
    var intersects = [];

    for ( var i = 0, l = bodies.length; i < l; i ++ ) {
        var result = this.intersectBody( bodies[ i ] );
        Array.prototype.push.apply( intersects, result );
    }

    intersects.sort( distanceSortFunc );
    return intersects;
};


var vector = new Vec3();
var normal = new Vec3();
var intersectPoint = new Vec3();

    var a = new Vec3();
    var b = new Vec3();
    var c = new Vec3();
    var d = new Vec3();

    var directionCopy = new Vec3();

/**
 * @method intersectShape
 * @param {Shape} shape
 * @param {Quaternion} quat
 * @param {Vec3} position
 * @param {RigidBody} body
 * @return {Array} See intersectBody()
 */
Ray.prototype.intersectShape = function(shape,quat,position,body){
    var intersect, intersects = [];

    if ( shape instanceof ConvexPolyhedron ) {
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
            if ( Math.abs( dot ) < this.precision ){
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

var v0 = new Vec3(),
    intersect = new Vec3();
function distanceFromIntersection( origin, direction, position ) {

    // v0 is vector from origin to position
    position.vsub(origin,v0);
    var dot = v0.dot( direction );

    // intersect = direction*dot + origin
    direction.mult(dot,intersect);
    intersect.vadd(origin,intersect);

    var distance = position.distanceTo( intersect );

    return distance;
}

