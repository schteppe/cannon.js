var AABB = require('../src/collision/AABB');
var Vec3 = require('../src/math/Vec3');

exports.construct = function(test){
    new AABB();
    test.done();
};

exports.copy = function(test){
    var a = new AABB(),
        b = new AABB();
    a.upperBound.set(1, 2, 3);
    b.copy(a);
    test.deepEqual(a, b);
    test.done();
};

exports.extend = function(test){
    // STUB
    test.done();
};

exports.overlaps = function(test){
    var a = new AABB(),
        b = new AABB();

    // Same aabb
    a.lowerBound.set(-1, -1, 0);
    a.upperBound.set( 1,  1, 0);
    b.lowerBound.set(-1, -1, 0);
    b.upperBound.set( 1,  1, 0);
    test.ok(a.overlaps(b),'should detect overlap of self');

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
};

