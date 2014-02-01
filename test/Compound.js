var Vec3 =       require("../src/math/Vec3")
,   Quaternion = require("../src/math/Quaternion")
,   Box =        require('../src/objects/Box')
,   Compound =   require('../src/objects/Compound')

module.exports = {
    calculateWorldAABB : function(test){
        var box = new Box(new Vec3(1,1,1));
        var comp = new Compound();
        comp.addChild(box,new Vec3(1,0,0)); // Translate 1 x in compound
        var min = new Vec3();
        var max = new Vec3();
        comp.calculateWorldAABB(new Vec3(1,0,0), // Translate 1 x in world
                                new Quaternion(0,0,0,1),
                                min,
                                max);
        test.equal(min.x,1,"Assumed box moved a total of 2 in x direction, but failed");
        test.equal(max.x,3);
        test.equal(min.y,-1);
        test.equal(max.y, 1);
        test.done();
    }
};
