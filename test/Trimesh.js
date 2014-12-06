var Vec3 =     require("../src/math/Vec3")
,   Quaternion = require("../src/math/Quaternion")
,   Box =      require('../src/shapes/Box')
,   Plane =      require('../src/shapes/Plane')
,   Trimesh =      require('../src/shapes/Trimesh')
,   World =      require('../src/world/World')
,   Body =      require('../src/objects/Body')

function createBoxHull(size){
    size = (size===undefined ? 0.5 : size);

    var box = new Box(new Vec3(size,size,size));
    return box.convexPolyhedronRepresentation;
}

module.exports = {
    calculateWorldAABB : function(test){
        var poly = makeTorus();
        var min = new Vec3();
        var max = new Vec3();
        poly.calculateWorldAABB(new Vec3(1,0,0), // Translate 2 x in world
                                new Quaternion(0,0,0,1),
                                min,
                                max);
        test.ok(!isNaN(min.x));
        test.ok(!isNaN(max.x));
        test.done();
    },

    againstPlane: function(test){
        var world = new World();

        var torusShape = makeTorus();
        var torusBody = new Body({
            mass: 1
        });
        torusBody.addShape(torusShape);

        var planeBody = new Body({
            mass: 1
        });
        planeBody.addShape(new Plane());

        world.addBody(torusBody);
        world.addBody(planeBody);

        world.step(1 / 60);

        test.done();
    }
};

/**
 *
 */
function makeTorus(radius, tube, radialSegments, tubularSegments, arc) {
    radius = radius || 100;
    tube = tube || 40;
    radialSegments = radialSegments || 8;
    tubularSegments = tubularSegments || 6;
    arc = arc || Math.PI * 2;

    var vertices = [];
    var indices = [];

    for ( var j = 0; j <= radialSegments; j ++ ) {
        for ( var i = 0; i <= tubularSegments; i ++ ) {
            var u = i / tubularSegments * arc;
            var v = j / radialSegments * Math.PI * 2;

            var x = ( radius + tube * Math.cos( v ) ) * Math.cos( u );
            var y = ( radius + tube * Math.cos( v ) ) * Math.sin( u );
            var z = tube * Math.sin( v );

            vertices.push( x, y, z );
        }
    }

    for ( var j = 1; j <= radialSegments; j ++ ) {
        for ( var i = 1; i <= tubularSegments; i ++ ) {
            var a = ( tubularSegments + 1 ) * j + i - 1;
            var b = ( tubularSegments + 1 ) * ( j - 1 ) + i - 1;
            var c = ( tubularSegments + 1 ) * ( j - 1 ) + i;
            var d = ( tubularSegments + 1 ) * j + i;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    return new Trimesh(vertices, indices);
};