var Vec3 =     require("../src/math/Vec3");
var Mat3 =     require("../src/math/Mat3");
var Quaternion = require("../src/math/Quaternion");
var Box =      require('../src/shapes/Box');
var Sphere =      require('../src/shapes/Sphere');
var Body =      require('../src/objects/Body');

module.exports = {
    computeAABB : function(test){
        var body = new Body({ mass: 1 });
        body.addShape(new Box(new Vec3(1,1,1)));
        body.computeAABB();
        test.equal(body.aabb.lowerBound.x,-1);
        test.equal(body.aabb.lowerBound.y,-1);
        test.equal(body.aabb.lowerBound.z,-1);
        test.equal(body.aabb.upperBound.x,1);
        test.equal(body.aabb.upperBound.y,1);
        test.equal(body.aabb.upperBound.z,1);

        body.position.x = 1;
        body.computeAABB();

        test.equal(body.aabb.lowerBound.x,0);
        test.equal(body.aabb.upperBound.x,2);

        test.done();
    },

    updateInertiaWorld : function(test){
        var body = new Body({ mass: 1 });
        body.addShape(new Box(new Vec3(1,1,1)));
        body.quaternion.setFromEuler(Math.PI/2,0,0);
        body.updateInertiaWorld();
        test.done();
    },

    pointToLocalFrame : function(test){
        var body = new Body({ mass: 1 });
        body.addShape(new Sphere(1));
        body.position.set(1,2,2);
        var localPoint = body.pointToLocalFrame(new Vec3(1,2,3));
        test.ok(localPoint.almostEquals(new Vec3(0,0,1)));
        test.done();
    },

    pointToWorldFrame : function(test){
        var body = new Body({ mass: 1 });
        body.addShape(new Sphere(1));
        body.position.set(1,2,2);
        var worldPoint = body.pointToWorldFrame(new Vec3(1,0,0));
        test.ok(worldPoint.almostEquals(new Vec3(2,2,2)));
        test.done();
    },
};
