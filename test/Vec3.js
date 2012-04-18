var cannon = require("../build/cannon");

exports.vec3 = {
    "creation" : function(test) {
        test.expect(3);

        var v = new cannon.Vec3(1, 2, 3);
        test.equal(v.x, 1, "Creating a vec3 should set the first parameter to the x value");
        test.equal(v.y, 2, "Creating a vec3 should set the second parameter to the y value");
        test.equal(v.z, 3, "Creating a vec3 should set the third parameter to the z value");

        test.done();
    },

    "cross" : function(test) {
        test.expect(3);

        var v = new cannon.Vec3(1, 2, 3);
        var u = new cannon.Vec3(4, 5, 6);
        v = v.cross(u);

        test.equal(v.x, -3, "Calculating cross product x");
        test.equal(v.y, 6, "Calculating cross product x");
        test.equal(v.z, -3, "Calculating cross product x");

        test.done();
    },

    "dot" : function(test) {
        test.expect(2);

        var v = new cannon.Vec3(1, 2, 3);
        var u = new cannon.Vec3(4, 5, 6);
        var dot = v.dot(u);

        test.equal(dot, 4 + 10 + 18, "Calculating dot product x");

        v = new cannon.Vec3(3, 2, 1);
        u = new cannon.Vec3(4, 5, 6);
        dot = v.dot(u);

        test.equal(dot, 12 + 10 + 6, "Calculating dot product x");

        test.done();
    },

    "set" : function(test) {
        test.expect(3);

        var v = new cannon.Vec3(1, 2, 3);
        v.set(4, 5, 6);

        test.equal(v.x, 4, "Setting values from x, y, z");
        test.equal(v.y, 5, "Setting values from x, y, z");
        test.equal(v.z, 6, "Setting values from x, y, z");

        test.done();
    },

    "vadd" : function(test) {
        test.expect(3);

        var v = new cannon.Vec3(1, 2, 3);
        var u = new cannon.Vec3(4, 5, 6);
        v = v.vadd(u);

        test.equal(v.x, 5, "Adding a vector (x)");
        test.equal(v.y, 7, "Adding a vector (y)");
        test.equal(v.z, 9, "Adding a vector (z)");

        test.done();
    }
};
