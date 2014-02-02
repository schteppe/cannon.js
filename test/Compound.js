var Vec3 =       require("../src/math/Vec3")
,   Quaternion = require("../src/math/Quaternion")
,   Box =        require('../src/shapes/Box')
,   Compound =   require('../src/shapes/Compound')

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
    },

    calculateLocalInertia : function(test){
        // Box 2x2x4
        var boxShape = new Box(new Vec3(1, 1, 2));
        var boxInertia = boxShape.calculateLocalInertia(1);

        // Compound of two cubes, 2x2x4
        var compoundShape = new Compound();
        var part1Shape = new Box(new Vec3(1, 1, 1));
        var part2Shape = new Box(new Vec3(1, 1, 1));
        compoundShape.addChild(part1Shape, new Vec3(0, 0, 1));
        compoundShape.addChild(part2Shape, new Vec3(0, 0, -1));
        var compoundInertia = compoundShape.calculateLocalInertia(1);

        test.ok(boxInertia.almostEquals(compoundInertia));

        test.done();
    },
};
