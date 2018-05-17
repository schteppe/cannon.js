var Vec3 = require("../src/math/Vec3");
var Quaternion = require("../src/math/Quaternion");
var Box = require('../src/shapes/Box');
var Heightfield = require('../src/shapes/heightfield');
var Narrowphase = require('../src/world/Narrowphase');
var Sphere = require('../src/shapes/Sphere');
var Body = require('../src/objects/Body');
var ContactMaterial = require('../src/material/ContactMaterial');
var World = require('../src/world/World');

module.exports = {

    sphereSphere : function(test){
        var world = new World();
        var cg = new Narrowphase(world);
        var result = [];
        var sphereShape = new Sphere(1);

        var bodyA = new Body({ mass: 1 });
        bodyA.addShape(sphereShape);
        var bodyB = new Body({ mass: 1 });
        bodyB.addShape(sphereShape);

        cg.currentContactMaterial = new ContactMaterial();
        cg.result = result;
        cg.sphereSphere(
            sphereShape,
            sphereShape,
            new Vec3(0.5, 0, 0),
            new Vec3(-0.5, 0, 0),
            new Quaternion(),
            new Quaternion(),
            bodyA,
            bodyB
        );

        test.equal(result.length, 1);

        test.done();
    },

    sphereHeightfield : function(test){
        var world = new World();
        var cg = new Narrowphase(world);
        var result = [];
        var hfShape = createHeightfield();
        var sphereShape = new Sphere(0.1);
        cg.currentContactMaterial = new ContactMaterial();
        cg.result = result;
        cg.sphereHeightfield(
            sphereShape,
            hfShape,
            new Vec3(0.25, 0.25, 0.05), // hit the first triangle in the field
            new Vec3(0, 0, 0),
            new Quaternion(),
            new Quaternion(),
            new Body(1, sphereShape),
            new Body(1, hfShape)
        );

        test.equal(result.length, 1);

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