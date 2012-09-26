var C = require("../build/cannon");

exports.Compound = {
    calculateWorldAABB : function(test){
	var box = new C.Box(new C.Vec3(1,1,1));
	var comp = new C.Compound();
	comp.addChild(box,new C.Vec3(1,0,0)); // Translate 1 x in compound
	var min = new C.Vec3();
	var max = new C.Vec3();
	comp.calculateWorldAABB(new C.Vec3(1,0,0), // Translate 1 x in world
				new C.Quaternion(0,0,0,1),
				min,
				max);
	test.equal(min.x,1,"Assumed box moved a total of 2 in x direction, but failed");
	test.equal(max.x,3);
	test.equal(min.y,-1);
	test.equal(max.y, 1);
	test.done();
    }
};