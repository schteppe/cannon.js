var Vec3 =     require("../src/math/Vec3")
,   Mat3 =     require("../src/math/Mat3")
,   Quaternion = require("../src/math/Quaternion")
,   Box =      require('../src/shapes/Box')
,   Sphere =      require('../src/shapes/Sphere')
,   RigidBody =      require('../src/objects/RigidBody')

module.exports = {
    computeAABB : function(test){
        var body = new RigidBody(1,new Box(new Vec3(1,1,1)));
        body.computeAABB();
        test.equal(body.aabbmin.x,-1);
        test.equal(body.aabbmin.y,-1);
        test.equal(body.aabbmin.z,-1);
        test.equal(body.aabbmax.x,1);
        test.equal(body.aabbmax.y,1);
        test.equal(body.aabbmax.z,1);

        body.position.x = 1;
        body.computeAABB();

        test.equal(body.aabbmin.x,0);
        test.equal(body.aabbmax.x,2);

        test.done();
    },

    updateInertiaWorld : function(test){
        var body = new RigidBody(1,new Box(new Vec3(1,1,1)));
        body.quaternion.setFromEuler(Math.PI/2,0,0);
        body.updateInertiaWorld();
        test.done();
    },

    pointToLocalFrame : function(test){
        var body = new RigidBody(1,new Sphere(1));
        body.position.set(1,2,2);
        var localPoint = body.pointToLocalFrame(new Vec3(1,2,3));
        test.ok(localPoint.almostEquals(new Vec3(0,0,1)));
        test.done();
    },

    pointToWorldFrame : function(test){
        var body = new RigidBody(1,new Sphere(1));
        body.position.set(1,2,2);
        var worldPoint = body.pointToWorldFrame(new Vec3(1,0,0));
        test.ok(worldPoint.almostEquals(new Vec3(2,2,2)));
        test.done();
    },
};
