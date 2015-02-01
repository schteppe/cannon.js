var Octree = require('../src/utils/Octree');
var AABB = require('../src/collision/AABB');
var Vec3 = require('../src/math/Vec3');
var Transform = require('../src/math/Transform');

module.exports = {
    construct: function(test){
        var tree = new Octree(new AABB());
        test.done();
    },

    insertRoot: function(test){
        var aabb = new AABB({
            lowerBound: new Vec3(-1, -1, -1),
            upperBound: new Vec3(1, 1, 1)
        });
        var tree = new Octree(aabb);

        var nodeAABB = new AABB({
            lowerBound: new Vec3(-1, -1, -1),
            upperBound: new Vec3(1, 1, 1)
        });
        var nodeData = 123;
        tree.insert(nodeAABB, nodeData);

        // Should end up in root node and not children
        test.equal(tree.data.length, 1);
        test.equal(tree.children.length, 0);
        test.done();
    },

    insertDeep: function(test){
        var aabb = new AABB({
            lowerBound: new Vec3(-1, -1, -1),
            upperBound: new Vec3(1, 1, 1)
        });
        var tree = new Octree(aabb,{
            maxDepth: 8
        });

        var nodeAABB = new AABB({
            lowerBound: new Vec3(-1, -1, -1),
            upperBound: new Vec3(-1, -1, -1)
        });
        var nodeData = 123;

        tree.insert(nodeAABB, nodeData);

        // Should be deep (maxDepth deep) in lower corner
        test.ok(
            tree // level 0
                .children[0] // 1
                .children[0] // 2
                .children[0] // 3
                .children[0] // 4
                .children[0] // 5
                .children[0] // 6
                .children[0] // 7
                .children[0] // 8
        );
        test.equal(tree.data.length, 0);

        test.done();
    },

    aabbQuery: function(test){
        var aabb = new AABB({
            lowerBound: new Vec3(-1, -1, -1),
            upperBound: new Vec3(1, 1, 1)
        });
        var tree = new Octree(aabb);

        var nodeAABB = new AABB({
            lowerBound: new Vec3(-1, -1, -1),
            upperBound: new Vec3(1, 1, 1)
        });
        var nodeData = 123;

        tree.insert(nodeAABB, nodeData);

        var result = [];
        tree.aabbQuery(aabb, result);

        test.deepEqual(result, [123]);


        var nodeAABB2 = new AABB({
            lowerBound: new Vec3(-1, -1, -1),
            upperBound: new Vec3(-1, -1, -1)
        });
        var nodeData2 = 456;
        tree.insert(nodeAABB2, nodeData2);

        result = [];
        tree.aabbQuery(aabb, result);
        test.deepEqual(result, [123, 456]);

        result = [];
        tree.aabbQuery(new AABB({ lowerBound: new Vec3(0,0,0), upperBound: new Vec3(1,1,1) }), result);
        test.deepEqual(result, [123]);

        test.done();
    }
};

