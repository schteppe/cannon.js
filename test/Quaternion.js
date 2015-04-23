var Vec3 =     require("../src/math/Vec3")
,   Mat3 =     require("../src/math/Mat3")
,   Quaternion = require("../src/math/Quaternion")

module.exports = {
    creation : function(test) {
        test.expect(4);

        var q = new Quaternion(1, 2, 3, 4);
        test.equal(q.x, 1, "Creating should set the first parameter to the x value");
        test.equal(q.y, 2, "Creating should set the second parameter to the y value");
        test.equal(q.z, 3, "Creating should set the third parameter to the z value");
        test.equal(q.w, 4, "Creating should set the third parameter to the z value");

        test.done();
    },

    conjugate : function(test) {
        test.expect(4);

        var q = new Quaternion(1, 2, 3, 4);
        q.conjugate(q);
        test.equal(q.x, -1, ".conjugate() should negate x");
        test.equal(q.y, -2, ".conjugate() should negate y");
        test.equal(q.z, -3, ".conjugate() should negate z");
        test.equal(q.w,  4, ".conjugate() should not touch w");

        test.done();
    },

    inverse : function(test) {
        test.expect(4);

        var q = new Quaternion(1, 2, 3, 4);
        var denominator = 1*1 + 2*2 + 3*3 + 4*4;
        q.inverse(q);

        // Quaternion inverse is conj(q) / ||q||^2
        test.equal(q.x, -1/denominator, ".inverse() should negate x and divide by length^2");
        test.equal(q.y, -2/denominator, ".inverse() should negate y and divide by length^2");
        test.equal(q.z, -3/denominator, ".inverse() should negate z and divide by length^2");
        test.equal(q.w,  4/denominator, ".inverse() should divide by length^2");

        test.done();
    } ,

    toEuler : function(test) {
        test.expect(3);

        var q = new Quaternion();
        q.setFromAxisAngle(new Vec3(0,0,1),Math.PI/4);
        var euler = new Vec3();
        q.toEuler(euler);

        // we should expect (0,0,pi/4)
        test.equal(euler.x, 0, "euler x should be zero, got "+euler.x);
        test.equal(euler.y, 0, "euler y should be yero, got "+euler.y);
        test.ok(Math.abs(euler.z-Math.PI/4)<0.001, "euler z should be "+(Math.PI/4)+", got "+euler.z);

        test.done();
    },

    setFromVectors : function(test){
        var q = new Quaternion();
        q.setFromVectors(new Vec3(1,0,0),new Vec3(-1,0,0));
        test.ok( q.vmult(new Vec3(1,0,0)).almostEquals(new Vec3(-1,0,0)) );

        q.setFromVectors(new Vec3(0,1,0),new Vec3(0,-1,0));
        test.ok( q.vmult(new Vec3(0,1,0)).almostEquals(new Vec3(0,-1,0)) );

        q.setFromVectors(new Vec3(0,0,1),new Vec3(0,0,-1));
        test.ok( q.vmult(new Vec3(0,0,1)).almostEquals(new Vec3(0,0,-1)) );

        test.done();
    },

    slerp: function(test){
        var qa = new Quaternion();
        var qb = new Quaternion();
        qa.slerp(qb, 0.5, qb);
        test.deepEqual(qa, qb);

        qa.setFromAxisAngle(new Vec3(0, 0, 1), Math.PI / 4);
        qb.setFromAxisAngle(new Vec3(0, 0, 1), -Math.PI / 4);
        qa.slerp(qb, 0.5, qb);
        test.deepEqual(qb, new Quaternion());

        test.done();
    }
};
