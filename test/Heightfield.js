var Vec3 = require("../src/math/Vec3");
var Quaternion = require("../src/math/Quaternion");
var Box = require('../src/shapes/Box');
var Heightfield = require('../src/shapes/heightfield');

module.exports = {
    calculateWorldAABB : function(test){
        var hfShape = createHeightfield();
        var min = new Vec3();
        var max = new Vec3();
        hfShape.calculateWorldAABB(
            new Vec3(1, 0, 0), // Translate 2 x in world
            new Quaternion(),
            min,
            max
        );
        /*
        test.equal(min.x,0);
        test.equal(max.x,2);
        test.equal(min.y,-1);
        test.equal(max.y, 1);
        */
        test.done();
    },
};

function createPolyBox(sx,sy,sz){
    var v = Vec3;
    var box = new Box(new Vec3(sx,sy,sz));
    return box.convexPolyhedronRepresentation;
}

function createHeightfield(){
    var matrix = [];
    var size = 20;
    for (var i = 0; i < size; i++) {
        matrix.push([]);
        for (var j = 0; j < size; j++) {
            matrix[i].push(Math.sin(i / size * Math.PI * 2));
        }
    }
    var hfShape = new Heightfield(matrix, {
        elementSize: 1,
    });

    return hfShape;
}