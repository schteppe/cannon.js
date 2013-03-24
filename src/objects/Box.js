/**
 * @class CANNON.Box
 * @brief A 3d box shape.
 * @param CANNON.Vec3 halfExtents
 * @author schteppe
 * @extends CANNON.Shape
 */
CANNON.Box = function(halfExtents){
    CANNON.Shape.call(this);

    /**
    * @property CANNON.Vec3 halfExtents
    * @memberof CANNON.Box
    */
    this.halfExtents = halfExtents;
    this.type = CANNON.Shape.types.BOX;

    /**
    * @property CANNON.ConvexPolyhedron convexPolyhedronRepresentation
    * @brief Used by the contact generator to make contacts with other convex polyhedra for example
    * @memberof CANNON.Box
    */
    this.convexPolyhedronRepresentation = null;

    this.updateConvexPolyhedronRepresentation();
};
CANNON.Box.prototype = new CANNON.Shape();
CANNON.Box.prototype.constructor = CANNON.Box;

/**
 * @method updateConvexPolyhedronRepresentation
 * @memberof CANNON.Box
 * @brief Updates the local convex polyhedron representation used for some collisions.
 */
CANNON.Box.prototype.updateConvexPolyhedronRepresentation = function(){
    var sx = this.halfExtents[0];
    var sy = this.halfExtents[1];
    var sz = this.halfExtents[2];

    function createBoxPolyhedron(size){
        size = size || 1;
        var vertices = [vec3.fromValues(-size,-size,-size),
                        vec3.fromValues( size,-size,-size),
                        vec3.fromValues( size, size,-size),
                        vec3.fromValues(-size, size,-size),
                        vec3.fromValues(-size,-size, size),
                        vec3.fromValues( size,-size, size),
                        vec3.fromValues( size, size, size),
                        vec3.fromValues(-size, size, size)];
        var faces =[[3,2,1,0], // -z
                    [4,5,6,7], // +z
                    [5,4,1,0], // -y
                    [2,3,6,7], // +y
                    [0,4,7,3 /*0,3,4,7*/ ], // -x
                    [1,2,5,6], // +x
                    ];
        var faceNormals = [vec3.fromValues( 0, 0,-1),
                           vec3.fromValues( 0, 0, 1),
                           vec3.fromValues( 0,-1, 0),
                           vec3.fromValues( 0, 1, 0),
                           vec3.fromValues(-1, 0, 0),
                           vec3.fromValues( 1, 0, 0)];
        var boxShape = new CANNON.ConvexPolyhedron(vertices,
                                                 faces,
                                                 faceNormals);
        return boxShape;
    }

    var h = new CANNON.ConvexPolyhedron([vec3.fromValues(-sx,-sy,-sz),
                                         vec3.fromValues( sx,-sy,-sz),
                                         vec3.fromValues( sx, sy,-sz),
                                         vec3.fromValues(-sx, sy,-sz),
                                         vec3.fromValues(-sx,-sy, sz),
                                         vec3.fromValues( sx,-sy, sz),
                                         vec3.fromValues( sx, sy, sz),
                                         vec3.fromValues(-sx, sy, sz)],
                                         [[3,2,1,0], // -z
                                          [4,5,6,7], // +z
                                          [5,4,1,0], // -y
                                          [2,3,6,7], // +y
                                          [0,4,7,3], // -x
                                          [1,2,5,6], // +x
                                          ],
                                        [vec3.fromValues( 0, 0,-1),
                                         vec3.fromValues( 0, 0, 1),
                                         vec3.fromValues( 0,-1, 0),
                                         vec3.fromValues( 0, 1, 0),
                                         vec3.fromValues(-1, 0, 0),
                                         vec3.fromValues( 1, 0, 0)]);
    this.convexPolyhedronRepresentation = h;
};

CANNON.Box.prototype.calculateLocalInertia = function(mass,target){
    target = target || vec3.create();
    var e = this.halfExtents;
    vec3.set(target, 1.0 / 12.0 * mass * (   2*e[1]*2*e[1] + 2*e[2]*2*e[2] ),
                     1.0 / 12.0 * mass * (   2*e[0]*2*e[0] + 2*e[2]*2*e[2] ),
                     1.0 / 12.0 * mass * (   2*e[1]*2*e[1] + 2*e[0]*2*e[0] ) );
    return target;
};

/**
 * @method getSideNormals
 * @memberof CANNON.Box
 * @brief Get the box 6 side normals
 * @param bool includeNegative If true, this function returns 6 vectors. If false, it only returns 3 (but you get 6 by reversing those 3)
 * @param CANNON.Quaternion quat Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
 * @return array
 */
CANNON.Box.prototype.getSideNormals = function(sixTargetVectors,q){
    var sides = sixTargetVectors;
    var ex = this.halfExtents;
    vec3.set(sides[0],  ex[0],      0,      0);
    vec3.set(sides[1],      0,  ex[1],      0);
    vec3.set(sides[2],      0,      0,  ex[2]);
    vec3.set(sides[3], -ex[0],      0,      0);
    vec3.set(sides[4],      0, -ex[1],      0);
    vec3.set(sides[5],      0,      0, -ex[2]);

    if(q!==undefined){
        for(var i=0; i!==sides.length; i++){
            //q.vmult(sides[i],sides[i]);
            vec3.transformQuat(sides[i],sides[i],q);
        }
    }

    return sides;
};

CANNON.Box.prototype.volume = function(){
    return 8.0 * this.halfExtents[0] * this.halfExtents[1] * this.halfExtents[2];
};

CANNON.Box.prototype.computeBoundingSphereRadius = function(){
    this.boundingSphereRadius = vec3.length(this.halfExtents);
    this.boundingSphereRadiusNeedsUpdate = false;
};

var worldCornerTempPos = vec3.create();
var worldCornerTempNeg = vec3.create();
CANNON.Box.prototype.forEachWorldCorner = function(pos,quat,callback){

    var e = this.halfExtents;
    var corners = [[  e[0],  e[1],  e[2]],
                   [ -e[0],  e[1],  e[2]],
                   [ -e[0], -e[1],  e[2]],
                   [ -e[0], -e[1], -e[2]],
                   [  e[0], -e[1], -e[2]],
                   [  e[0],  e[1], -e[2]],
                   [ -e[0],  e[1], -e[2]],
                   [  e[0], -e[1],  e[2]]];
    for(var i=0; i<corners.length; i++){
        worldCornerTempPos.set(corners[i][0],corners[i][1],corners[i][2]);
        quat.vmult(worldCornerTempPos,worldCornerTempPos);
        pos.vadd(worldCornerTempPos,worldCornerTempPos);
        callback(worldCornerTempPos[0],
                 worldCornerTempPos[1],
                 worldCornerTempPos[2]);
    }
};

CANNON.Box.prototype.calculateWorldAABB = function(pos,quat,min,max){
    // Get each axis max
    min.set(Infinity,Infinity,Infinity);
    max.set(-Infinity,-Infinity,-Infinity);
    this.forEachWorldCorner(pos,quat,function(x,y,z){
        if(x > max[0]){
            max[0] = x;
        }
        if(y > max[1]){
            max[1] = y;
        }
        if(z > max[2]){
            max[2] = z;
        }

        if(x < min[0]){
            min[0] = x;
        }
        if(y < min[1]){
            min[1] = y;
        }
        if(z < min[2]){
            min[2] = z;
        }
    });
};