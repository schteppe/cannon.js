var AABB = require('../src/collision/AABB');
var Vec3 = require('../src/math/Vec3');
var Transform = require('../src/math/Transform');

module.exports = {
    construct: function(test){
        new AABB();
        test.done();
    },

    copy: function(test){
        var a = new AABB(),
            b = new AABB();
        a.upperBound.set(1, 2, 3);
        b.copy(a);
        test.deepEqual(a, b);
        test.done();
    },

    clone: function(test){
        var a = new AABB({
            lowerBound: new Vec3(-1,-2,-3),
            upperBound: new Vec3(1,2,3)
        });
        var b = a.clone();

        test.deepEqual(a,b);

        test.equal(a === b, false);

        test.done();
    },

    extend: function(test){
        var a = new AABB({
            lowerBound: new Vec3(-1,-1,-1),
            upperBound: new Vec3(1,1,1)
        });
        var b = new AABB({
            lowerBound: new Vec3(-2,-2,-2),
            upperBound: new Vec3(2,2,2)
        });
        a.extend(b);
        test.deepEqual(a,b);

        a = new AABB({
            lowerBound: new Vec3(-1,-1,-1),
            upperBound: new Vec3(1,1,1)
        });
        b = new AABB({
            lowerBound: new Vec3(-2,-2,-2),
            upperBound: new Vec3(2,2,2)
        });
        b.extend(a);
        test.deepEqual(b.lowerBound, new Vec3(-2,-2,-2));
        test.deepEqual(b.upperBound, new Vec3(2,2,2));

        a = new AABB({
            lowerBound: new Vec3(-2,-1,-1),
            upperBound: new Vec3(2,1,1)
        });
        b = new AABB({
            lowerBound: new Vec3(-1,-1,-1),
            upperBound: new Vec3(1,1,1)
        });
        b.extend(a);
        test.deepEqual(a.lowerBound, new Vec3(-2,-1,-1));
        test.deepEqual(a.upperBound, new Vec3(2,1,1));

        test.done();
    },

    overlaps: function(test){
        var a = new AABB(),
            b = new AABB();

        // Same aabb
        a.lowerBound.set(-1, -1, 0);
        a.upperBound.set( 1,  1, 0);
        b.lowerBound.set(-1, -1, 0);
        b.upperBound.set( 1,  1, 0);
        test.ok(a.overlaps(b),'should detect overlap');

        // Corner overlaps
        b.lowerBound.set( 1,  1, 0);
        b.upperBound.set( 2,  2, 0);
        test.ok(a.overlaps(b),'should detect corner overlap');

        // Separate
        b.lowerBound.set( 1.1,  1.1, 0);
        test.ok(!a.overlaps(b),'should detect separated');

        // fully inside
        b.lowerBound.set(-0.5, -0.5, 0);
        b.upperBound.set( 0.5,  0.5, 0);
        test.ok(a.overlaps(b),'should detect if aabb is fully inside other aabb');
        b.lowerBound.set(-1.5, -1.5, 0);
        b.upperBound.set( 1.5,  1.5, 0);
        test.ok(a.overlaps(b),'should detect if aabb is fully inside other aabb');

        // Translated
        b.lowerBound.set(-3, -0.5, 0);
        b.upperBound.set(-2,  0.5, 0);
        test.ok(!a.overlaps(b),'should detect translated');

        test.done();
    },

    contains: function(test){
        var a = new AABB(),
            b = new AABB();

        a.lowerBound.set(-1, -1, -1);
        a.upperBound.set( 1,  1, 1);
        b.lowerBound.set(-1, -1, -1);
        b.upperBound.set( 1,  1, 1);

        test.ok(a.contains(b));

        a.lowerBound.set(-2, -2, -2);
        a.upperBound.set( 2,  2, 2);

        test.ok(a.contains(b));

        b.lowerBound.set(-3, -3, -3);
        b.upperBound.set( 3,  3, 3);

        test.equal(a.contains(b), false);

        a.lowerBound.set(0, 0, 0);
        a.upperBound.set( 2,  2, 2);
        b.lowerBound.set(-1, -1, -1);
        b.upperBound.set( 1,  1, 1);

        test.equal(a.contains(b), false);

        test.done();
    },

    toLocalFrame: function(test){
        var worldAABB = new AABB();
        var localAABB = new AABB();
        var frame = new Transform();

        worldAABB.lowerBound.set(-1, -1, -1);
        worldAABB.upperBound.set(1, 1, 1);

        // No transform - should stay the same
        worldAABB.toLocalFrame(frame, localAABB);
        test.deepEqual(localAABB, worldAABB);

        // Some translation
        frame.position.set(-1,0,0);
        worldAABB.toLocalFrame(frame, localAABB);
        test.deepEqual(
            localAABB,
            new AABB({
                lowerBound: new Vec3(0, -1, -1),
                upperBound: new Vec3(2, 1, 1)
            })
        );

        test.done();
    },

    toWorldFrame: function(test){
        var localAABB = new AABB();
        var worldAABB = new AABB();
        var frame = new Transform();

        localAABB.lowerBound.set(-1, -1, -1);
        localAABB.upperBound.set(1, 1, 1);

        // No transform - should stay the same
        localAABB.toLocalFrame(frame, worldAABB);
        test.deepEqual(localAABB, worldAABB);

        // Some translation on the frame
        frame.position.set(1,0,0);
        localAABB.toWorldFrame(frame, worldAABB);
        test.deepEqual(
            worldAABB,
            new AABB({
                lowerBound: new Vec3(0, -1, -1),
                upperBound: new Vec3(2, 1, 1)
            })
        );

        test.done();
    },
};

