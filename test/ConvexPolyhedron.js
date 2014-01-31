var C = require("../build/cannon");

exports.ConvexPolyhedron = {
    calculateWorldAABB : function(test){
	var poly = createPolyBox(1,1,1);
	var min = new C.Vec3();
	var max = new C.Vec3();
	poly.calculateWorldAABB(new C.Vec3(1,0,0), // Translate 2 x in world
				new C.Quaternion(0,0,0,1),
				min,
				max);
	test.equal(min.x,0);
	test.equal(max.x,2);
	test.equal(min.y,-1);
	test.equal(max.y, 1);
	test.done();
    }
};

function createPolyBox(sx,sy,sz){
    var v = C.Vec3;
    var box = new C.Box(new C.Vec3(sx,sy,sz));
    return box.convexPolyhedronRepresentation;
}
