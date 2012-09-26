var C = require("../build/cannon");

exports.Box = {
    calculateWorldAABB : function(test){
	var box = new C.Box(new C.Vec3(1,1,1));
	var min = new C.Vec3();
	var max = new C.Vec3();
	box.calculateWorldAABB(new C.Vec3(3,0,0),
			       new C.Quaternion(0,0,0,1),
			       min,
			       max);
	test.equal(min.x,2);
	test.equal(max.x,4);
	test.equal(min.y,-1);
	test.equal(max.y, 1);
	test.done();
    }
};