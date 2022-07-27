namespace CANNON
{
    QUnit.module("Box", () =>
    {

        QUnit.test("forEachWOrldCorner", (test) =>
        {
            var box = new Box(new Vector3(1, 1, 1));
            var pos = new Vector3();
            var quat = new Quaternion();
            quat.fromAxisAngle(new Vector3(0, 0, 1), Math.PI * 0.25);
            var numCorners = 0;
            var unique = [];
            box.forEachWorldCorner(pos, quat, function (x, y, z)
            {
                var corner = new Vector3(x, y, z);
                for (var i = 0; i < unique.length; i++)
                {
                    test.ok(!corner.equals(unique[i]), "Corners " + i + " and " + numCorners + " are almost equal: (" + unique[i].toString() + ") == (" + corner.toString() + ")");
                }
                unique.push(corner);
                numCorners++;
            });
            test.equal(numCorners, 8);
        });

        QUnit.test("calculateWorldAABB", (test) =>
        {
            var box = new Box(new Vector3(1, 1, 1));
            var min = new Vector3();
            var max = new Vector3();
            box.calculateWorldAABB(new Vector3(3, 0, 0),
                new Quaternion(0, 0, 0, 1),
                min,
                max);
            test.equal(min.x, 2);
            test.equal(max.x, 4);
            test.equal(min.y, -1);
            test.equal(max.y, 1);
        });
    });
}
