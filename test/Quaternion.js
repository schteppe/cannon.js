var C = require("../build/cannon");

exports.Quaternion = {
  "creation" : function(test) {
    test.expect(4);
    
    var q = new C.Quaternion(1, 2, 3, 4);
    test.equal(q.x, 1, "Creating should set the first parameter to the x value");
    test.equal(q.y, 2, "Creating should set the second parameter to the y value");
    test.equal(q.z, 3, "Creating should set the third parameter to the z value");
    test.equal(q.w, 4, "Creating should set the third parameter to the z value");
    
    test.done();
  },
  
  "conjugate" : function(test) {
    test.expect(4);
    
    var q = new C.Quaternion(1, 2, 3, 4);
    q.conjugate(q);
    test.equal(q.x, -1, ".conjugate() should negate x");
    test.equal(q.y, -2, ".conjugate() should negate y");
    test.equal(q.z, -3, ".conjugate() should negate z");
    test.equal(q.w,  4, ".conjugate() should not touch w");
    
    test.done();
  },
  
  "inverse" : function(test) {
    test.expect(4);
    
    var q = new C.Quaternion(1, 2, 3, 4);
    var denominator = 1*1 + 2*2 + 3*3 + 4*4;
    q.inverse(q);

    // Quaternion inverse is conj(q) / ||q||^2
    test.equal(q.x, -1/denominator, ".inverse() should negate x and divide by length^2");
    test.equal(q.y, -2/denominator, ".inverse() should negate y and divide by length^2");
    test.equal(q.z, -3/denominator, ".inverse() should negate z and divide by length^2");
    test.equal(q.w,  4/denominator, ".inverse() should divide by length^2");
    
    test.done();
  } ,
  
  "toEuler" : function(test) {
      test.expect(3);
      
      var q = new C.Quaternion();
      q.setFromAxisAngle(new C.Vec3(0,0,1),Math.PI/4);
      var euler = new C.Vec3();
      q.toEuler(euler);
      
      // we should expect (0,0,pi/4)
      test.equal(euler.x, 0, "euler x should be zero, got "+euler.x);
      test.equal(euler.y, 0, "euler y should be yero, got "+euler.y);
      test.ok(Math.abs(euler.z-Math.PI/4)<0.001, "euler z should be "+(Math.PI/4)+", got "+euler.z);
      
      test.done();
  }
};
