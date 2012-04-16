var cannon = require("../build/cannon");

exports.vec3 = {
    "creation" : function(test) {
        test.expect(3);

        var v = new cannon.Vec3(1, 2, 3);
        test.equal(v.x, 1, "Creating a vec3 should set the first parameter to the x value");
        test.equal(v.y, 2, "Creating a vec3 should set the second parameter to the y value");
        test.equal(v.z, 3, "Creating a vec3 should set the third parameter to the z value");

        test.done();
    }
};
