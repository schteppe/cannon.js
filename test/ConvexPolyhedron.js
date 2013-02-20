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
    var h = new C.ConvexPolyhedron([new v(-sx,-sy,-sz),
				    new v( sx,-sy,-sz),
				    new v( sx, sy,-sz),
				    new v(-sx, sy,-sz),
				    new v(-sx,-sy, sz),
				    new v( sx,-sy, sz),
				    new v( sx, sy, sz),
				    new v(-sx, sy, sz)],
				   
				   [
				       [0,1,2,3], // -z
				       [4,5,6,7], // +z
				       [0,1,4,5], // -y
				       [2,3,6,7], // +y
				       [0,3,4,7], // -x
				       [1,2,5,6], // +x
				   ],
				   
				   [new v( 0, 0,-1),
				    new v( 0, 0, 1),
				    new v( 0,-1, 0),
				    new v( 0, 1, 0),
				    new v(-1, 0, 0),
				    new v( 1, 0, 0)]);
    return h;
}