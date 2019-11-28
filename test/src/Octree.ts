namespace CANNON
{
    QUnit.module("Octree", () =>
    {

        QUnit.test("construct", (test) =>
        {
            var tree = new Octree(new AABB());
            test.ok(true);
        })

        QUnit.test("insertRoot", (test) =>
        {
            var aabb = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var tree = new Octree(aabb);

            var nodeAABB = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var nodeData = 123;
            tree.insert(nodeAABB, nodeData);

            // Should end up in root node and not children
            test.equal(tree.data.length, 1);
            test.equal(tree.children.length, 0);
        });

        QUnit.test("insertDeep", (test) =>
        {
            var aabb = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var tree = new Octree(aabb, {
                maxDepth: 8
            });

            var nodeAABB = new AABB(new Vector3(-1, -1, -1), new Vector3(-1, -1, -1));
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

        });

        QUnit.test("aabbQuery", (test) =>
        {
            var aabb = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var tree = new Octree<number>(aabb);

            var nodeAABB = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var nodeData = 123;

            tree.insert(nodeAABB, nodeData);

            var result: number[] = [];
            tree.aabbQuery(aabb, result);

            test.deepEqual(result, [123]);


            var nodeAABB2 = new AABB(new Vector3(-1, -1, -1), new Vector3(-1, -1, -1));
            var nodeData2 = 456;
            tree.insert(nodeAABB2, nodeData2);

            result = [];
            tree.aabbQuery(aabb, result);
            test.deepEqual(result, [123, 456]);

            result = [];
            tree.aabbQuery(new AABB(new Vector3(0, 0, 0), new Vector3(1, 1, 1)), result);
            test.deepEqual(result, [123]);

        });
    });
}
