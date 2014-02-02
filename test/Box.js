var Vec3 =       require("../src/math/Vec3")
,   Quaternion = require("../src/math/Quaternion")
,   Box =        require('../src/shapes/Box')

module.exports = {
    forEachWOrldCorner : function(test){
        var box = new Box(new Vec3(1,1,1));
        var pos = new Vec3();
        var quat = new Quaternion();
        quat.setFromAxisAngle(new Vec3(0,0,1),Math.PI*0.25);
        var numCorners = 0;
        var unique = [];
        box.forEachWorldCorner(pos,quat,function(x,y,z){
            var corner = new Vec3(x,y,z);
            for(var i=0; i<unique.length; i++){
                test.ok(!corner.almostEquals(unique[i]),"Corners "+i+" and "+numCorners+" are almost equal: ("+unique[i].toString()+") == ("+corner.toString()+")");
            }
            unique.push(corner);
            numCorners++;
        });
        test.equal(numCorners,8);
        test.done();
    },

    calculateWorldAABB : function(test){
        var box = new Box(new Vec3(1,1,1));
        var min = new Vec3();
        var max = new Vec3();
        box.calculateWorldAABB(new Vec3(3,0,0),
                               new Quaternion(0,0,0,1),
                               min,
                               max);
        test.equal(min.x,2);
        test.equal(max.x,4);
        test.equal(min.y,-1);
        test.equal(max.y, 1);
        test.done();
    }
};
