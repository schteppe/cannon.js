module.exports = Ray;

var Vec3 = require('../math/Vec3');
var ConvexPolyhedron = require('../shapes/ConvexPolyhedron');
var Box = require('../shapes/Box');

/**
 * A line in 3D space that intersects bodies and return points.
 * @class Ray
 * @param {Vec3} from
 * @param {Vec3} to
 */
function Ray(from, to){
    /**
     * @property {Vec3} from
     */
    this.from = from ? from.clone() : new Vec3();

    /**
     * @property {Vec3} to
     */
    this.to = to ? to.clone() : new Vec3();

    this._direction = new Vec3();

    /**
     * The precision of the ray. Used when checking parallelity etc.
     * @property {Number} precision
     */
    this.precision = 0.0001;
}
Ray.prototype.constructor = Ray;

var v1 = new Vec3(),
    v2 = new Vec3();

/*
 * As per "Barycentric Technique" as named here http://www.blackpawn.com/texts/pointinpoly/default.html But without the division
 */
function pointInTriangle(p, a, b, c) {
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
Ray.prototype.intersectBody = function (body, direction) {
    if(!direction){
        this._updateDirection();
        direction = this._direction;
    }
    for (var i = 0; i < body.shapes.length; i++) {
        if(body.shapes[i] instanceof ConvexPolyhedron){
            return this.intersectShape(
                body.shapes[i],
                body.quaternion,
                body.position,
                body,
                direction
            );
        } else if(body.shapes[i] instanceof Box){
            return this.intersectShape(
                body.shapes[i].convexPolyhedronRepresentation,
                body.quaternion,
                body.position,
                body,
                direction
            );
        } else {
            console.warn("Ray intersection is this far only implemented for ConvexPolyhedron and Box shapes.");
        }
    }
};

function distanceSortFunc(a, b) {
    return a.distance - b.distance;
}

/**
 * @method intersectBodies
 * @param {Array} bodies An array of RigidBody objects.
 * @return {Array} See intersectBody
 */
Ray.prototype.intersectBodies = function (bodies) {
    var intersects = [];

    this._updateDirection();
    var direction = this._direction;

    for ( var i = 0, l = bodies.length; i < l; i ++ ) {
        var result = this.intersectBody(bodies[i], direction);
        Array.prototype.push.apply(intersects, result);
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

Ray.prototype._updateDirection = function(){
    this.to.vsub(this.from, this._direction);
    this._direction.normalize();
};

/**
 * @method intersectShape
 * @param {Shape} shape
 * @param {Quaternion} quat
 * @param {Vec3} position
 * @param {RigidBody} body
 * @return {Array} See intersectBody()
 */
Ray.prototype.intersectShape = function(shape, quat, position, body, direction){
    var intersect, intersects = [];

    if ( shape instanceof ConvexPolyhedron ) {
        // Checking boundingSphere

        var distance = distanceFromIntersection( this.from, direction, position );
        if ( distance > shape.boundingSphereRadius ) {
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

            // ...but make it relative to the ray from. We'll fix this later.
            vector.vsub(this.from,vector);

            // Get plane normal
            q.vmult(faceNormal,normal);

            // If this dot product is negative, we have something interesting
            dot = direction.dot(normal);

            // Bail out if ray and plane are parallel
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

                // Intersection point is from + direction * scalar
                direction.mult(scalar,intersectPoint);
                intersectPoint.vadd(this.from,intersectPoint);

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
                            distance: this.from.distanceTo( intersectPoint ),
                            point: intersectPoint.copy(),
                            face: face,
                            body: body
                        };

                        intersects.push(intersect);
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
function distanceFromIntersection(from, direction, position) {

    // v0 is vector from from to position
    position.vsub(from,v0);
    var dot = v0.dot( direction );

    // intersect = direction*dot + from
    direction.mult(dot,intersect);
    intersect.vadd(from,intersect);

    var distance = position.distanceTo(intersect);

    return distance;
}

