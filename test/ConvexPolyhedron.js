var Vec3 =     require("../src/math/Vec3")
,   Quaternion = require("../src/math/Quaternion")
,   Box =      require('../src/shapes/Box')

module.exports = {
    calculateWorldAABB : function(test){
        var poly = createPolyBox(1,1,1);
        var min = new Vec3();
        var max = new Vec3();
        poly.calculateWorldAABB(new Vec3(1,0,0), // Translate 2 x in world
                                new Quaternion(0,0,0,1),
                                min,
                                max);
        test.equal(min.x,0);
        test.equal(max.x,2);
        test.equal(min.y,-1);
        test.equal(max.y, 1);
        test.done();
    }
};

function createPolyBox(sx,sy,sz){
    var v = Vec3;
    var box = new Box(new Vec3(sx,sy,sz));
    return box.convexPolyhedronRepresentation;
}
