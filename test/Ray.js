var C = require("../build/cannon");

exports.convexHull = {

    "construct" : function(test) {
        test.expect(0);
	var r = new C.Ray(new C.Vec3(),new C.Vec3(1,0,0));
        test.done();
    },

    "intersectBody" : function(test) {
	var r = new C.Ray(new C.Vec3(5,0,0),new C.Vec3(-1,0,0));
	var shape = createPolyhedron(0.5);
	var body = new C.RigidBody(1,shape);
	var result = r.intersectBody(body);
	test.equals(result.length,1,"Could not intersect body (got "+result.length+" intersections)");
	test.ok(result[0].point.almostEquals(new C.Vec3(0.5,0,0)));

	// test rotating the body first
	body.quaternion.setFromAxisAngle(new C.Vec3(1,0,0),Math.PI);
	var result = r.intersectBody(body);
	test.equals(result.length,1);
	test.ok(result[0].point.almostEquals(new C.Vec3(0.5,0,0)));

	// test shooting from other direction
	r.direction.set(0,0,-1);
	r.origin.set(0,0,5);
	var result = r.intersectBody(body);
	test.equals(result.length,1,"Did not get any intersection after changing ray origin!");
	test.ok(result[0].point.almostEquals(new C.Vec3(0,0,0.5)));

	//test with a very slight rotation
	body.quaternion.setFromAxisAngle(new C.Vec3(0.3,0.4,0.5), 0.1);
	r.origin.set(0.1, 0.1, 5.1);
	r.direction.set(-0.01, -0.01, -1).normalize();
	var result = r.intersectBody(body);
	test.equals(result.length,1,"Should have got intersection with slight rotation!");

	// test miss
	var r = new C.Ray(new C.Vec3(5,1,0),new C.Vec3(-1,0,0));
	var result = r.intersectBody(body);
	test.equals(result.length,0);
	
	//Test really close to the edges of the cube
	body.quaternion.set(0,0,0,1);
	r.direction.set(1, 1, 0).normalize();
	
	function assertHit(ox, oz) {
		r.origin.set(ox, -1.5, oz);
		test.equals(r.intersectBody(body).length, 1, "Should have hit, but missed");
	}
	function assertMiss(ox, oz) {
		r.origin.set(ox, -1.5, oz);
		test.equals(r.intersectBody(body).length, 0, "Should have missed, but hit");
	}
	
	assertMiss(-0.501, 0.5001);
	assertHit(-0.501, 0.4999);
	assertHit(-0.5001, 0.499);
	assertMiss(-0.4999, 0.4999);
	
	assertMiss(-0.4999, -0.4999);
	assertHit(-0.5001, -0.499);
	assertHit(-0.501, -0.4999);
	assertMiss(-0.501, -0.5001);
	
        test.done();
    },

    "intersectBodies" : function(test) {
        test.expect(3);
	var r = new C.Ray(new C.Vec3(5,0,0),new C.Vec3(-1,0,0));
	var shape = createPolyhedron(0.5);
	var body1 = new C.RigidBody(1,shape);
	var body2 = new C.RigidBody(1,shape);
	body2.position.x = -2;
	var result = r.intersectBodies([body1,body2]);
	test.equals(result.length,2);
	test.ok(result[0].point.almostEquals(new C.Vec3(0.5,0,0)));
	test.ok(result[1].point.almostEquals(new C.Vec3(-1.5,0,0)));
        test.done();
    },

    "box": function(test){
	test.expect(2);
	var r = new C.Ray(new C.Vec3(5,0,0),new C.Vec3(-1,0,0));
	var shape = new C.Box(new C.Vec3(0.5,0.5,0.5));
	var body = new C.RigidBody(1,shape);
	var result = r.intersectBody(body);
	test.equals(result.length,1,"Could not intersect box!");
	test.ok(result[0].point.almostEquals(new C.Vec3(0.5,0,0)));
        test.done();
    }

};

function createPolyhedron(size){
  size = (size===undefined ? 0.5 : size);
  var box = new C.Box(new C.Vec3(size,size,size));
  box.updateConvexPolyhedronRepresentation();
  return box.convexPolyhedronRepresentation;
}
