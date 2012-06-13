var C = require("../build/cannon");

function createBoxHull(size){
  size = (size===undefined ? 0.5 : size);
    var h = new C.ConvexPolyhedron([new C.Vec3(-size,-size,-size),
				   new C.Vec3( size,-size,-size),
				   new C.Vec3( size, size,-size),
				   new C.Vec3(-size, size,-size),
				   new C.Vec3(-size,-size, size),
				   new C.Vec3( size,-size, size),
				   new C.Vec3( size, size, size),
				   new C.Vec3(-size, size, size)],
				  
				  [
				      [0,1,2,3], // -z
				      [4,5,6,7], // +z
				      [0,1,4,5], // -y
				      [2,3,6,7], // +y
				      [0,3,4,7], // -x
				      [1,2,5,6], // +x
				  ],

				  [new C.Vec3( 0, 0,-1),
				   new C.Vec3( 0, 0, 1),
				   new C.Vec3( 0,-1, 0),
				   new C.Vec3( 0, 1, 0),
				   new C.Vec3(-1, 0, 0),
				   new C.Vec3( 1, 0, 0)]);
    return h;
}

exports.convexHull = {
    "clipFaceAgainstPlane":function(test){ 
      var h = createBoxHull();
      
      // Four points 1 unit below the plane z=0 - we assume to get back 4
      var inverts = [new C.Vec3(-0.2,-0.2,-1),
		     new C.Vec3(-0.2, 0.2,-1),
		     new C.Vec3( 0.2, 0.2,-1),
		     new C.Vec3( 0.2,-0.2,-1)];
      var outverts=[];
      h.clipFaceAgainstPlane(inverts,outverts,new C.Vec3(0,0,1), 0.0);
      test.equal(outverts.length,4,"did not get the assumed 4 vertices");
      inverts=[];
      outverts=[];

      // Lower the plane to z=-2, we assume no points back
      h.clipFaceAgainstPlane(inverts,outverts,new C.Vec3(0,0,1),2);
      test.equal(outverts.length,0,"got more than zero vertices left after clipping!");
	
      // two points below, two over. We get four points back, though 2 of them are clipped to 
      // the back of the  plane
      var inverts2 = [new C.Vec3(-2, -2,  1),
		      new C.Vec3(-2,  2,  1),
		      new C.Vec3( 2,  2, -1),
		      new C.Vec3( 2, -2, -1)];
	outverts = [];
      h.clipFaceAgainstPlane(inverts2,outverts,new C.Vec3(0,0,1),0.0);
      test.equal(outverts.length,4,"Expected 4 points back from clipping a quad with plane, got "+outverts.length);
      test.done();
    },

    "clipFaceAgainstHull":function(test){
      // Create box
      var hullA = createBoxHull(0.5);
      var res = [];
      var sepNormal = new C.Vec3(0,0,1);

      // Move the box 0.45 units up - only 0.05 units of the box will be below plane z=0
      var posA = new C.Vec3(0,0,0.45),
      quatA = new C.Quaternion();

      // All points from B is in the plane z=0
      var worldVertsB = [new C.Vec3(-1.0,-1.0,0),
			 new C.Vec3(-1.0, 1.0,0),
			 new C.Vec3( 1.0, 1.0,0),
			 new C.Vec3( 1.0,-1.0,0)];

      // We will now clip a face in hullA that is closest to the sepNormal
      // against the points in worldVertsB.
      // We can expect to get back the 4 corners of the box hullA penetrated 0.05 units
      // into the plane worldVertsB we constructed
      hullA.clipFaceAgainstHull(sepNormal,posA,quatA,worldVertsB,-100,100,res);
      test.done();
    },

    "clipAgainstHull":function(test){
      var hullA = createBoxHull(0.6),
      posA = new C.Vec3(-0.5,0,0),
      quatA = new C.Quaternion();

      var hullB = createBoxHull(0.5),
      posB = new C.Vec3(0.5,0,0),
      quatB = new C.Quaternion();

      var sepaxis = new C.Vec3();
      var found = hullA.findSeparatingAxis(hullB,posA,quatA,posB,quatB,sepaxis);
      var result = [];
	//hullA.clipAgainstHull(posA,quatA,hullB,posB,quatB,sepaxis,-100,100,result);
      quatB.setFromAxisAngle(new C.Vec3(0,0,1),Math.PI/4);
	//console.log("clipping....");
      hullA.clipAgainstHull(posA,quatA,hullB,posB,quatB,sepaxis,-100,100,result);
	//console.log("result:",result);
	//console.log("done....");
      test.done();
    },

    "testSepAxis":function(test){
	test.expect(3);
	var hullA = createBoxHull(0.5),
	posA = new C.Vec3(-0.2,0,0),
	quatA = new C.Quaternion();
	
	var hullB = createBoxHull(),
	posB = new C.Vec3(0.2,0,0),
	quatB = new C.Quaternion();
	
	var sepAxis = new C.Vec3(1,0,0);
	var found1 = hullA.testSepAxis(sepAxis,hullB,posA,quatA,posB,quatB);
	test.equal(found1,0.6,"didnt find sep axis depth");
	
	// Move away
	posA.x = -5;
	var found2 = hullA.testSepAxis(sepAxis,hullB,posA,quatA,posB,quatB);
	test.equal(found2,false,"found separating axis though there are none");
	
	// Inclined 45 degrees, what happens then?
	posA.x = 1;
	quatB.setFromAxisAngle(new C.Vec3(0,0,1),Math.PI/4);
	var found3 = hullA.testSepAxis(sepAxis,hullB,posA,quatA,posB,quatB);
	test.ok(typeof(found3),"number","Did not fetch");
		
	test.done();
    },

    "findSepAxis":function(test){
	var hullA = createBoxHull(),
	posA = new C.Vec3(-0.2,0,0),
	quatA = new C.Quaternion();
	
	var hullB = createBoxHull(),
	posB = new C.Vec3(0.2,0,0),
	quatB = new C.Quaternion();
	
	var sepaxis = new C.Vec3();
	var found = hullA.findSeparatingAxis(hullB,posA,quatA,posB,quatB,sepaxis);
	//console.log("SepAxis found:",found,", the axis:",sepaxis.toString());
	
	quatB.setFromAxisAngle(new C.Vec3(0,0,1),Math.PI/4);
	var found2 = hullA.findSeparatingAxis(hullB,posA,quatA,posB,quatB,sepaxis);
	//console.log("SepAxis found:",found2,", the axis:",sepaxis.toString());
	
	test.done();
    }
};
