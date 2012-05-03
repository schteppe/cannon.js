var C = require("../build/cannon");

exports.convexHull = {
    "creation" : function(test) {
        test.expect(0);
	var h = new C.ConvexHull(); 
        test.done();
    },

    "addPoints" : function(test){
      var h = new C.ConvexHull(); 

      h.addPoints([new C.Vec3(0,0,0),
		   new C.Vec3(1,0,0),
		   new C.Vec3(0,1,0),
		   new C.Vec3(0,0,1)],
	
		  [
		   [0,3,2], // -x
		   [0,1,3], // -y
		   [0,1,2], // -z
		   [1,2,3], // +xyz
		   ],

		  [new C.Vec3(-1, 0, 0),
		   new C.Vec3( 0,-1, 0),
		   new C.Vec3( 0, 0,-1),
		   new C.Vec3( 1, 1, 1)]);
      test.done();
    }
};
