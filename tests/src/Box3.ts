namespace CANNON
{
    QUnit.module("Box3", () =>
    {

        QUnit.test("construct", (test) =>
        {
            new Box3();
            test.ok(true);
        });

        QUnit.test("copy", (test) =>
        {
            var a = new Box3(),
                b = new Box3();
            a.max.set(1, 2, 3);
            b.copy(a);
            test.deepEqual(a, b);
        });

        QUnit.test("clone", (test) =>
        {
            var a = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
            var b = a.clone();

            test.deepEqual(a, b);

            test.equal(a === b, false);
        });

        QUnit.test("extend", (test) =>
        {
            var a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var b = new Box3(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
            a.union(b);
            test.deepEqual(a, b);

            a = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            b = new Box3(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
            b.union(a);
            test.deepEqual(b.min, new Vector3(-2, -2, -2));
            test.deepEqual(b.max, new Vector3(2, 2, 2));

            a = new Box3(new Vector3(-2, -1, -1), new Vector3(2, 1, 1));
            b = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            b.union(a);
            test.deepEqual(a.min, new Vector3(-2, -1, -1));
            test.deepEqual(a.max, new Vector3(2, 1, 1));
        });

        QUnit.test("extend", (test) =>
        {
            var a = new Box3(),
                b = new Box3();

            // Same aabb
            a.min.set(-1, -1, 0);
            a.max.set(1, 1, 0);
            b.min.set(-1, -1, 0);
            b.max.set(1, 1, 0);
            test.ok(a.overlaps(b), 'should detect overlap');

            // Corner overlaps
            b.min.set(1, 1, 0);
            b.max.set(2, 2, 0);
            test.ok(a.overlaps(b), 'should detect corner overlap');

            // Separate
            b.min.set(1.1, 1.1, 0);
            test.ok(!a.overlaps(b), 'should detect separated');

            // fully inside
            b.min.set(-0.5, -0.5, 0);
            b.max.set(0.5, 0.5, 0);
            test.ok(a.overlaps(b), 'should detect if aabb is fully inside other aabb');
            b.min.set(-1.5, -1.5, 0);
            b.max.set(1.5, 1.5, 0);
            test.ok(a.overlaps(b), 'should detect if aabb is fully inside other aabb');

            // Translated
            b.min.set(-3, -0.5, 0);
            b.max.set(-2, 0.5, 0);
            test.ok(!a.overlaps(b), 'should detect translated');

        });

        QUnit.test("contains", (test) =>
        {
            var a = new Box3(),
                b = new Box3();

            a.min.set(-1, -1, -1);
            a.max.set(1, 1, 1);
            b.min.set(-1, -1, -1);
            b.max.set(1, 1, 1);

            test.ok(a.contains(b));

            a.min.set(-2, -2, -2);
            a.max.set(2, 2, 2);

            test.ok(a.contains(b));

            b.min.set(-3, -3, -3);
            b.max.set(3, 3, 3);

            test.equal(a.contains(b), false);

            a.min.set(0, 0, 0);
            a.max.set(2, 2, 2);
            b.min.set(-1, -1, -1);
            b.max.set(1, 1, 1);

            test.equal(a.contains(b), false);
        });

        QUnit.test("toLocalFrame", (test) =>
        {
            var worldAABB = new Box3();
            var localAABB = new Box3();
            var frame = new Transform();

            worldAABB.min.set(-1, -1, -1);
            worldAABB.max.set(1, 1, 1);

            // No transform - should stay the same
            frame.toLocalFrameBox3(worldAABB, localAABB);
            test.deepEqual(localAABB, worldAABB);

            // Some translation
            frame.position.set(-1, 0, 0);
            frame.toLocalFrameBox3(worldAABB, localAABB);
            test.deepEqual(
                localAABB,
                new Box3(new Vector3(0, -1, -1), new Vector3(2, 1, 1))
            );

        });

        QUnit.test("toWorldFrame", (test) =>
        {
            var localAABB = new Box3();
            var worldAABB = new Box3();
            var frame = new Transform();

            localAABB.min.set(-1, -1, -1);
            localAABB.max.set(1, 1, 1);

            // No transform - should stay the same
            frame.toLocalFrameBox3(localAABB, worldAABB);
            test.deepEqual(localAABB, worldAABB);

            // Some translation on the frame
            frame.position.set(1, 0, 0);
            frame.toWorldFrameBox3(localAABB, worldAABB);
            test.deepEqual(
                worldAABB,
                new Box3(new Vector3(0, -1, -1), new Vector3(2, 1, 1))
            );

        });
    });
}