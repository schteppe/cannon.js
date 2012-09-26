var C = require("../build/cannon");

exports.RigidBody = {
    calculateAABB : function(test){
	var body = new C.RigidBody(1,new C.Box(new C.Vec3(1,1,1)));
	body.calculateAABB();
	test.equal(body.aabbmin.x,-1);
	test.equal(body.aabbmin.y,-1);
	test.equal(body.aabbmin.z,-1);
	test.equal(body.aabbmax.x,1);
	test.equal(body.aabbmax.y,1);
	test.equal(body.aabbmax.z,1);

	body.position.x = 1;
	body.calculateAABB();

	test.equal(body.aabbmin.x,0);
	test.equal(body.aabbmax.x,2);

	test.done();
    },
};