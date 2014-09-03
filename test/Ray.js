var Vec3 =     require("../src/math/Vec3");
var Mat3 =     require("../src/math/Mat3");
var Quaternion = require("../src/math/Quaternion");
var Box =      require('../src/shapes/Box');
var Ray =      require('../src/collision/Ray');
var Body =      require('../src/objects/Body');

module.exports = {

    construct : function(test) {
        test.expect(0);
        var r = new Ray(new Vec3(),new Vec3(1,0,0));
        test.done();
    },

    intersectBody : function(test) {
        var r = new Ray(new Vec3(5,0,0),new Vec3(-5, 0, 0));
        var shape = createPolyhedron(0.5);
        var body = new Body({ mass: 1 });
        body.addShape(shape);
        var result = r.intersectBody(body);
        test.equals(result.length,1,"Could not intersect body (got "+result.length+" intersections)");
        test.ok(result[0].point.almostEquals(new Vec3(0.5, 0, 0)));

        // test rotating the body first
        body.quaternion.setFromAxisAngle(new Vec3(1,0,0),Math.PI);
        var result = r.intersectBody(body);
        test.equals(result.length,1);
        test.ok(result[0].point.almostEquals(new Vec3(0.5,0,0)));

        // test shooting from other direction
        r.to.set(0,0,-5);
        r.from.set(0,0,5);
        var result = r.intersectBody(body);
        test.equals(result.length,1,"Did not get any intersection after changing ray from!");
        test.ok(result[0].point.almostEquals(new Vec3(0,0,0.5)));

        // test miss
        var r = new Ray(new Vec3(5, 1, 0), new Vec3(-5, 1, 0));
        var result = r.intersectBody(body);
        test.equals(result.length,0);

        test.done();
    },

    intersectBodies : function(test) {
        test.expect(3);
        var r = new Ray(new Vec3(5,0,0),new Vec3(-1,0,0));
        var shape = createPolyhedron(0.5);
        var body1 = new Body({ mass: 1 });
        body1.addShape(shape);
        var body2 = new Body({ mass: 1 });
        body2.addShape(shape);
        body2.position.x = -2;
        var result = r.intersectBodies([body1,body2]);
        test.equals(result.length,2);
        test.ok(result[0].point.almostEquals(new Vec3(0.5,0,0)));
        test.ok(result[1].point.almostEquals(new Vec3(-1.5,0,0)));
        test.done();
    },

    box: function(test){
        test.expect(2);
        var r = new Ray(new Vec3(5,0,0),new Vec3(-1,0,0));
        var shape = new Box(new Vec3(0.5,0.5,0.5));
        var body = new Body({ mass: 1 });
        body.addShape(shape);
        var result = r.intersectBody(body);
        test.equals(result.length,1,"Could not intersect box!");
        test.ok(result[0].point.almostEquals(new Vec3(0.5,0,0)));
        test.done();
    }
};

function createPolyhedron(size){
    size = (size===undefined ? 0.5 : size);
    var box = new Box(new Vec3(size,size,size));
    box.updateConvexPolyhedronRepresentation();
    return box.convexPolyhedronRepresentation;
}
