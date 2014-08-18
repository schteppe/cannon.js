var Vec3 = require("../src/math/Vec3");
var Quaternion = require("../src/math/Quaternion");
var Box = require('../src/shapes/Box');
var Heightfield = require('../src/shapes/heightfield');
var ContactGenerator = require('../src/world/ContactGenerator');
var Sphere = require('../src/shapes/Sphere');
var RigidBody = require('../src/objects/RigidBody');

module.exports = {

    sphereSphere : function(test){
        var cg = new ContactGenerator();
        var result = [];
        var sphereShape = new Sphere(1);
        cg.sphereSphere(
            result,
            sphereShape,
            sphereShape,
            new Vec3(0.5, 0, 0),
            new Vec3(-0.5, 0, 0),
            new Quaternion(),
            new Quaternion(),
            new RigidBody(1, sphereShape),
            new RigidBody(1, sphereShape)
        );

        test.equal(result.length, 1);

        test.done();
    },

    sphereHeightfield : function(test){
        var cg = new ContactGenerator();
        var result = [];
        var hfShape = createHeightfield();
        var sphereShape = new Sphere(1);
        cg.sphereHeightfield(
            result,
            sphereShape,
            hfShape,
            new Vec3(0.5, 0, 0),
            new Vec3(-0.5, 0, 0),
            new Quaternion(),
            new Quaternion(),
            new RigidBody(1, sphereShape),
            new RigidBody(1, hfShape)
        );

        console.warn('sphereHeightfield is todo');
        // test.equal(result.length, 1);

        test.done();
    },


};

function createHeightfield(){
    var matrix = [];
    var size = 20;
    for (var i = 0; i < size; i++) {
        matrix.push([]);
        for (var j = 0; j < size; j++) {
            matrix[i].push(0);
        }
    }
    var hfShape = new Heightfield(matrix, {
        elementSize: 1,
    });

    return hfShape;
}