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
    var sx = this.halfExtents.x;
    var sy = this.halfExtents.y;
    var sz = this.halfExtents.z;
    var V = CANNON.Vec3;

    function createBoxPolyhedron(size){
        size = size || 1;
        var vertices = [new CANNON.Vec3(-size,-size,-size),
                        new CANNON.Vec3( size,-size,-size),
                        new CANNON.Vec3( size, size,-size),
                        new CANNON.Vec3(-size, size,-size),
                        new CANNON.Vec3(-size,-size, size),
                        new CANNON.Vec3( size,-size, size),
                        new CANNON.Vec3( size, size, size),
                        new CANNON.Vec3(-size, size, size)];
        var faces =[[3,2,1,0], // -z
                    [4,5,6,7], // +z
                    [5,4,1,0], // -y
                    [2,3,6,7], // +y
                    [0,4,7,3 /*0,3,4,7*/ ], // -x
                    [1,2,5,6], // +x
                    ];
        var faceNormals =   [new CANNON.Vec3( 0, 0,-1),
                           new CANNON.Vec3( 0, 0, 1),
                           new CANNON.Vec3( 0,-1, 0),
                           new CANNON.Vec3( 0, 1, 0),
                           new CANNON.Vec3(-1, 0, 0),
                           new CANNON.Vec3( 1, 0, 0)];
        var boxShape = new CANNON.ConvexPolyhedron(vertices,
                                                 faces,
                                                 faceNormals);
        return boxShape;
    }

    var h = new CANNON.ConvexPolyhedron([new V(-sx,-sy,-sz),
                                         new V( sx,-sy,-sz),
                                         new V( sx, sy,-sz),
                                         new V(-sx, sy,-sz),
                                         new V(-sx,-sy, sz),
                                         new V( sx,-sy, sz),
                                         new V( sx, sy, sz),
                                         new V(-sx, sy, sz)],
                                         [[3,2,1,0], // -z
                                          [4,5,6,7], // +z
                                          [5,4,1,0], // -y
                                          [2,3,6,7], // +y
                                          [0,4,7,3], // -x
                                          [1,2,5,6], // +x
                                          ],
                                        [new V( 0, 0,-1),
                                         new V( 0, 0, 1),
                                         new V( 0,-1, 0),
                                         new V( 0, 1, 0),
                                         new V(-1, 0, 0),
                                         new V( 1, 0, 0)]);
    this.convexPolyhedronRepresentation = h;
};

CANNON.Box.prototype.calculateLocalInertia = function(mass,target){
    target = target || new CANNON.Vec3();
    var e = this.halfExtents;
    target.x = 1.0 / 12.0 * mass * (   2*e.y*2*e.y + 2*e.z*2*e.z );
    target.y = 1.0 / 12.0 * mass * (   2*e.x*2*e.x + 2*e.z*2*e.z );
    target.z = 1.0 / 12.0 * mass * (   2*e.y*2*e.y + 2*e.x*2*e.x );
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
CANNON.Box.prototype.getSideNormals = function(sixTargetVectors,quat){
    var sides = sixTargetVectors;
    var ex = this.halfExtents;
    sides[0].set(  ex.x,     0,     0);
    sides[1].set(     0,  ex.y,     0);
    sides[2].set(     0,     0,  ex.z);
    sides[3].set( -ex.x,     0,     0);
    sides[4].set(     0, -ex.y,     0);
    sides[5].set(     0,     0, -ex.z);

    if(quat!==undefined){
        for(var i=0; i!==sides.length; i++){
            quat.vmult(sides[i],sides[i]);
        }
    }

    return sides;
};

CANNON.Box.prototype.volume = function(){
    return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
};

CANNON.Box.prototype.computeBoundingSphereRadius = function(){
    this.boundingSphereRadius = this.halfExtents.norm();
    this.boundingSphereRadiusNeedsUpdate = false;
};

var worldCornerTempPos = new CANNON.Vec3();
var worldCornerTempNeg = new CANNON.Vec3();
CANNON.Box.prototype.forEachWorldCorner = function(pos,quat,callback){

    var e = this.halfExtents;
    var corners = [[  e.x,  e.y,  e.z],
                   [ -e.x,  e.y,  e.z],
                   [ -e.x, -e.y,  e.z],
                   [ -e.x, -e.y, -e.z],
                   [  e.x, -e.y, -e.z],
                   [  e.x,  e.y, -e.z],
                   [ -e.x,  e.y, -e.z],
                   [  e.x, -e.y,  e.z]];
    for(var i=0; i<corners.length; i++){
        worldCornerTempPos.set(corners[i][0],corners[i][1],corners[i][2]);
        quat.vmult(worldCornerTempPos,worldCornerTempPos);
        pos.vadd(worldCornerTempPos,worldCornerTempPos);
        callback(worldCornerTempPos.x,
                 worldCornerTempPos.y,
                 worldCornerTempPos.z);
    }
};

CANNON.Box.prototype.calculateWorldAABB = function(pos,quat,min,max){
    // Get each axis max
    min.set(Infinity,Infinity,Infinity);
    max.set(-Infinity,-Infinity,-Infinity);
    this.forEachWorldCorner(pos,quat,function(x,y,z){
        if(x > max.x){
            max.x = x;
        }
        if(y > max.y){
            max.y = y;
        }
        if(z > max.z){
            max.z = z;
        }

        if(x < min.x){
            min.x = x;
        }
        if(y < min.y){
            min.y = y;
        }
        if(z < min.z){
            min.z = z;
        }
    });
};