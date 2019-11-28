namespace CANNON
{
    QUnit.module("AABB", () =>
    {

        QUnit.test("construct", (test) =>
        {
            new AABB();
            test.ok(true);
        });

        QUnit.test("copy", (test) =>
        {
            var a = new AABB(),
                b = new AABB();
            a.upperBound.set(1, 2, 3);
            b.copy(a);
            test.deepEqual(a, b);
        });

        QUnit.test("clone", (test) =>
        {
            var a = new AABB(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
            var b = a.clone();

            test.deepEqual(a, b);

            test.equal(a === b, false);
        });

        QUnit.test("extend", (test) =>
        {
            var a = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var b = new AABB(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
            a.extend(b);
            test.deepEqual(a, b);

            a = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            b = new AABB(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
            b.extend(a);
            test.deepEqual(b.lowerBound, new Vector3(-2, -2, -2));
            test.deepEqual(b.upperBound, new Vector3(2, 2, 2));

            a = new AABB(new Vector3(-2, -1, -1), new Vector3(2, 1, 1));
            b = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            b.extend(a);
            test.deepEqual(a.lowerBound, new Vector3(-2, -1, -1));
            test.deepEqual(a.upperBound, new Vector3(2, 1, 1));
        });

        QUnit.test("extend", (test) =>
        {
            var a = new AABB(),
                b = new AABB();

            // Same aabb
            a.lowerBound.set(-1, -1, 0);
            a.upperBound.set(1, 1, 0);
            b.lowerBound.set(-1, -1, 0);
            b.upperBound.set(1, 1, 0);
            test.ok(a.overlaps(b), 'should detect overlap');

            // Corner overlaps
            b.lowerBound.set(1, 1, 0);
            b.upperBound.set(2, 2, 0);
            test.ok(a.overlaps(b), 'should detect corner overlap');

            // Separate
            b.lowerBound.set(1.1, 1.1, 0);
            test.ok(!a.overlaps(b), 'should detect separated');

            // fully inside
            b.lowerBound.set(-0.5, -0.5, 0);
            b.upperBound.set(0.5, 0.5, 0);
            test.ok(a.overlaps(b), 'should detect if aabb is fully inside other aabb');
            b.lowerBound.set(-1.5, -1.5, 0);
            b.upperBound.set(1.5, 1.5, 0);
            test.ok(a.overlaps(b), 'should detect if aabb is fully inside other aabb');

            // Translated
            b.lowerBound.set(-3, -0.5, 0);
            b.upperBound.set(-2, 0.5, 0);
            test.ok(!a.overlaps(b), 'should detect translated');

        });

        QUnit.test("contains", (test) =>
        {
            var a = new AABB(),
                b = new AABB();

            a.lowerBound.set(-1, -1, -1);
            a.upperBound.set(1, 1, 1);
            b.lowerBound.set(-1, -1, -1);
            b.upperBound.set(1, 1, 1);

            test.ok(a.contains(b));

            a.lowerBound.set(-2, -2, -2);
            a.upperBound.set(2, 2, 2);

            test.ok(a.contains(b));

            b.lowerBound.set(-3, -3, -3);
            b.upperBound.set(3, 3, 3);

            test.equal(a.contains(b), false);

            a.lowerBound.set(0, 0, 0);
            a.upperBound.set(2, 2, 2);
            b.lowerBound.set(-1, -1, -1);
            b.upperBound.set(1, 1, 1);

            test.equal(a.contains(b), false);
        });

        QUnit.test("toLocalFrame", (test) =>
        {
            var worldAABB = new AABB();
            var localAABB = new AABB();
            var frame = new Transform();

            worldAABB.lowerBound.set(-1, -1, -1);
            worldAABB.upperBound.set(1, 1, 1);

            // No transform - should stay the same
            worldAABB.toLocalFrame(frame, localAABB);
            test.deepEqual(localAABB, worldAABB);

            // Some translation
            frame.position.set(-1, 0, 0);
            worldAABB.toLocalFrame(frame, localAABB);
            test.deepEqual(
                localAABB,
                new AABB(new Vector3(0, -1, -1), new Vector3(2, 1, 1))
            );

        });

        QUnit.test("toWorldFrame", (test) =>
        {
            var localAABB = new AABB();
            var worldAABB = new AABB();
            var frame = new Transform();

            localAABB.lowerBound.set(-1, -1, -1);
            localAABB.upperBound.set(1, 1, 1);

            // No transform - should stay the same
            localAABB.toLocalFrame(frame, worldAABB);
            test.deepEqual(localAABB, worldAABB);

            // Some translation on the frame
            frame.position.set(1, 0, 0);
            localAABB.toWorldFrame(frame, worldAABB);
            test.deepEqual(
                worldAABB,
                new AABB(new Vector3(0, -1, -1), new Vector3(2, 1, 1))
            );

        });
    });
}