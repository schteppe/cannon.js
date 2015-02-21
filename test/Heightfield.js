var Vec3 = require("../src/math/Vec3");
var Quaternion = require("../src/math/Quaternion");
var Box = require('../src/shapes/Box');
var Heightfield = require('../src/shapes/Heightfield');
var ConvexPolyhedron = require('../src/shapes/ConvexPolyhedron');

module.exports = {

    calculateWorldAABB : function(test){
        var hfShape = createHeightfield({
            elementSize: 1,
            minValue: 0
        });
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
        var hfShape = createHeightfield({
            elementSize: 1,
            minValue: 0,
            size: 2
        });

        hfShape.getConvexTrianglePillar(0, 0, false);
        test.equal(hfShape.pillarConvex.vertices.length, 6);
        test.deepEqual(hfShape.pillarConvex.vertices.slice(0,3), [
            new Vec3(-0.25, -0.25, 0.5),
            new Vec3(0.75, -0.25, 0.5),
            new Vec3(-0.25, 0.75, 0.5)
        ]);
        test.deepEqual(hfShape.pillarOffset, new Vec3(0.25, 0.25, 0.5));

        hfShape.getConvexTrianglePillar(0, 0, true);
        test.equal(hfShape.pillarConvex.vertices.length, 6);
        test.deepEqual(hfShape.pillarConvex.vertices.slice(0,3), [
            new Vec3(0.25, 0.25, 0.5),
            new Vec3(-0.75, 0.25, 0.5),
            new Vec3(0.25, -0.75, 0.5)
        ]);
        test.deepEqual(hfShape.pillarOffset, new Vec3(0.75, 0.75, 0.5));

        // Out of bounds
        test.throws(function () {
            hfShape.getConvexTrianglePillar(1, 1, true);
        }, Error);
        test.throws(function () {
            hfShape.getConvexTrianglePillar(1, 1, false);
        }, Error);
        test.throws(function () {
            hfShape.getConvexTrianglePillar(-1, 0, false);
        }, Error);

        test.done();
    },

    getRectMinMax: function(test){
        var hfShape = createHeightfield();
        var minMax = [];
        hfShape.getRectMinMax(0,0,1,1,minMax);
        test.deepEqual(minMax, [1,1]);
        test.done();
    },

    getHeightAt: function(test){
        var hfShape = createHeightfield();
        console.warn('add more tests here');
        hfShape.getHeightAt(0, 0);
        test.done();
    },

    update: function(test){
        var hfShape = createHeightfield();
        hfShape.update();
        test.done();
    },

    updateMaxValue: function(test){
        var hfShape = createHeightfield();
        hfShape.data[0][0] = 10;
        hfShape.updateMaxValue();
        test.equal(hfShape.maxValue, 10);
        test.done();
    },

    updateMinValue: function(test){
        var hfShape = createHeightfield();
        hfShape.data[0][0] = -10;
        hfShape.updateMinValue();
        test.equal(hfShape.minValue, -10);
        test.done();
    },

    setHeightValueAtIndex: function(test){
        var hfShape = createHeightfield();
        hfShape.setHeightValueAtIndex(0, 0, 10);
        test.equal(hfShape.data[0][0], 10);
        test.done();
    },

    getIndexOfPosition: function(test){
        var hfShape = createHeightfield();
        var result = [];
        hfShape.getIndexOfPosition(0, 0, result);
        test.deepEqual(result, [0,0]);
        test.done();
    },
};

function createHeightfield(options){
    options = options || {};
    var matrix = [];
    var size = options.size || 20;
    for (var i = 0; i < size; i++) {
        matrix.push([]);
        for (var j = 0; j < size; j++) {
            matrix[i].push(1);
        }
    }
    var hfShape = new Heightfield(matrix, options);

    return hfShape;
}