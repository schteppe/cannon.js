var C = require("../build/cannon");

exports.Box = {
    forEachWOrldCorner : function(test){
	var box = new C.Box(new C.Vec3(1,1,1));
	var pos = new C.Vec3();
	var quat = new C.Quaternion();
	quat.setFromAxisAngle(new C.Vec3(0,0,1),Math.PI*0.25);
	var numCorners = 0;
	var unique = [];
	box.forEachWorldCorner(pos,quat,function(x,y,z){
	    var corner = new C.Vec3(x,y,z);
	    for(var i=0; i<unique.length; i++){
		test.ok(!corner.almostEquals(unique[i]),"Corners "+i+" and "+numCorners+" are almost equal: ("+unique[i].toString()+") == ("+corner.toString()+")");
	    }
	    unique.push(corner);
	    numCorners++;
	});
	test.equal(numCorners,8);
	test.done();	
    },

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