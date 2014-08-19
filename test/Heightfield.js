var Vec3 = require("../src/math/Vec3");
var Quaternion = require("../src/math/Quaternion");
var Box = require('../src/shapes/Box');
var Heightfield = require('../src/shapes/Heightfield');
var ConvexPolyhedron = require('../src/shapes/ConvexPolyhedron');

module.exports = {

    calculateWorldAABB : function(test){
        var hfShape = createHeightfield();
        var min = new Vec3();
        var max = new Vec3();
        hfShape.calculateWorldAABB(
            new Vec3(),
            new Quaternion(),
            min,
            max
        );

        test.equal(min.x, -Number.MAX_VALUE);
        test.equal(max.x, Number.MAX_VALUE);
        test.equal(min.y, -Number.MAX_VALUE);
        test.equal(max.y, Number.MAX_VALUE);

        test.done();
    },

    getConvexTrianglePillar: function(test){
        var hfShape = createHeightfield();
        var offset = new Vec3();
        var convex = new ConvexPolyhedron();

        hfShape.getConvexTrianglePillar(0, 0, false, convex, offset);
        test.equal(convex.vertices.length, 6);
        test.deepEqual(offset, new Vec3(0.25, 0.25, 0.5));

        hfShape.getConvexTrianglePillar(0, 0, true, convex, offset);
        test.equal(convex.vertices.length, 6);
        test.deepEqual(offset, new Vec3(0.75, 0.75, 0.5));

        test.done();
    },

};

function createHeightfield(){
    var matrix = [];
    var size = 20;
    for (var i = 0; i < size; i++) {
        matrix.push([]);
        for (var j = 0; j < size; j++) {
            matrix[i].push(1);
        }
    }
    var hfShape = new Heightfield(matrix, {
        elementSize: 1,
    });

    return hfShape;
}