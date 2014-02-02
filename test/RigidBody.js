var Vec3 =     require("../src/math/Vec3")
,   Mat3 =     require("../src/math/Mat3")
,   Quaternion = require("../src/math/Quaternion")
,   Box =      require('../src/shapes/Box')
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
};
