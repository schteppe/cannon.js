var Vec3 =     require("../src/math/Vec3")
,   Mat3 =     require("../src/math/Mat3")
,   Quaternion = require("../src/math/Quaternion")

module.exports = {
    creation : function(test) {
        test.expect(3);

        var v = new Vec3(1, 2, 3);
        test.equal(v.x, 1, "Creating a vec3 should set the first parameter to the x value");
        test.equal(v.y, 2, "Creating a vec3 should set the second parameter to the y value");
        test.equal(v.z, 3, "Creating a vec3 should set the third parameter to the z value");

        test.done();
    },

    cross : function(test) {
        test.expect(3);

        var v = new Vec3(1, 2, 3);
        var u = new Vec3(4, 5, 6);
        v = v.cross(u);

        test.equal(v.x, -3, "Calculating cross product x");
        test.equal(v.y, 6, "Calculating cross product x");
        test.equal(v.z, -3, "Calculating cross product x");

        test.done();
    },

    dot : function(test) {
        test.expect(2);

        var v = new Vec3(1, 2, 3);
        var u = new Vec3(4, 5, 6);
        var dot = v.dot(u);

        test.equal(dot, 4 + 10 + 18, "Calculating dot product x");

        v = new Vec3(3, 2, 1);
        u = new Vec3(4, 5, 6);
        dot = v.dot(u);

        test.equal(dot, 12 + 10 + 6, "Calculating dot product x");

        test.done();
    },

    set : function(test) {
        test.expect(3);

        var v = new Vec3(1, 2, 3);
        v.set(4, 5, 6);

        test.equal(v.x, 4, "Setting values from x, y, z");
        test.equal(v.y, 5, "Setting values from x, y, z");
        test.equal(v.z, 6, "Setting values from x, y, z");

        test.done();
    },

    vadd : function(test) {
        test.expect(3);

        var v = new Vec3(1, 2, 3);
        var u = new Vec3(4, 5, 6);
        v = v.vadd(u);

        test.equal(v.x, 5, "Adding a vector (x)");
        test.equal(v.y, 7, "Adding a vector (y)");
        test.equal(v.z, 9, "Adding a vector (z)");

        test.done();
    },

    isAntiparallelTo : function(test){
        test.ok(new Vec3(1,0,0).isAntiparallelTo(new Vec3(-1,0,0)));
        test.done();
    },

    almostEquals : function(test){
        test.ok(new Vec3(1,0,0).almostEquals(new Vec3(1,0,0)));
        test.done();
    },
};
