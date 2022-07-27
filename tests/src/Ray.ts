namespace CANNON
{
    QUnit.module("Ray", () =>
    {

        QUnit.test("construct", (test) =>
        {
            var r = new Ray(new Vector3(), new Vector3(1, 0, 0));
            test.ok(true);
        });

        QUnit.test("intersectBody", (test) =>
        {
            var r = new Ray(new Vector3(5, 0, 0), new Vector3(-5, 0, 0));
            r.skipBackfaces = true;
            var shape = createPolyhedron(0.5);
            var body = new Body({ mass: 1 });
            body.addShape(shape);

            var result = new RaycastResult();

            r.intersectBody(body, result);
            test.ok(result.hasHit);
            test.ok(result.hitPointWorld.equals(new Vector3(0.5, 0, 0)));

            // test rotating the body first
            result.reset();
            body.quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
            r.intersectBody(body, result);
            test.ok(result.hasHit);
            test.ok(result.hitPointWorld.equals(new Vector3(0.5, 0, 0)));

            // test shooting from other direction
            result.reset();
            r.to.set(0, 0, -5);
            r.from.set(0, 0, 5);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0, 0, 0.5)));

            // test miss
            result.reset();
            var r = new Ray(new Vector3(5, 1, 0), new Vector3(-5, 1, 0));
            r.intersectBody(body, result);
            test.equal(result.hasHit, false);

            test.ok(true);
        });

        QUnit.test("intersectBodies", (test) =>
        {
            var r = new Ray(new Vector3(5, 0, 0), new Vector3(-5, 0, 0));
            r.skipBackfaces = true;
            var shape = createPolyhedron(0.5);
            var body1 = new Body({ mass: 1 });
            body1.addShape(shape);
            var body2 = new Body({ mass: 1 });
            body2.addShape(shape);
            body2.position.x = -2;

            var result = new RaycastResult();
            r.intersectBodies([body1, body2], result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0.5, 0, 0)));
        });

        QUnit.test("box", (test) =>
        {
            var r = new Ray(new Vector3(5, 0, 0), new Vector3(-5, 0, 0));
            r.skipBackfaces = true;
            var shape = new Box(new Vector3(0.5, 0.5, 0.5));
            var body = new Body({ mass: 1 });
            body.addShape(shape);
            var result = new RaycastResult();

            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0.5, 0, 0)));

            result.reset();
            body.quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0.5, 0, 0)));

            result.reset();
            body.quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0.5, 0, 0)));

            result.reset();
            body.quaternion.fromAxisAngle(new Vector3(1, 0, 0), 3 * Math.PI / 2);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0.5, 0, 0)));

        });

        QUnit.test("sphere", (test) =>
        {
            var r = new Ray(new Vector3(5, 0, 0), new Vector3(-5, 0, 0));
            r.skipBackfaces = true;
            var shape = new Sphere(1);
            var body = new Body({ mass: 1 });
            body.addShape(shape);

            var result = new RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(1, 0, 0)));

            result.reset();
            body.position.set(1, 0, 0);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(2, 0, 0)));

            result.reset();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(2, 0, 0)));

            result.reset();
            var shape2 = new Sphere(1);
            var body2 = new Body({ mass: 1 });
            body2.addShape(shape2, new Vector3(1, 0, 0));
            r.intersectBody(body2, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(2, 0, 0)));

        });

        QUnit.test("heightfield", (test) =>
        {
            var r = new Ray(new Vector3(0, 0, 10), new Vector3(0, 0, -10));
            r.skipBackfaces = true;
            var data = [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ];
            var shape = new Heightfield(data, {
                elementSize: 1
            });
            var body = new Body({ mass: 1 });
            body.addShape(shape);

            // Hit
            var result = new RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.deepEqual(result.hitPointWorld, new Vector3(0, 0, 1));

            // Miss
            var result = new RaycastResult();
            r.from.set(-100, -100, 10);
            r.to.set(-100, -100, -10);
            r.intersectBody(body, result);
            test.equal(result.hasHit, false);

            // Hit all triangles!
            var result = new RaycastResult();
            for (var i = 0; i < data.length - 1; i++)
            { // 3x3 data points will have 2x2 rectangles in the field
                for (var j = 0; j < data[i].length - 1; j++)
                {
                    for (var k = 0; k < 2; k++)
                    {
                        result.reset();
                        r.from.set(i + 0.25, j + 0.25, 10);
                        r.to.set(i + 0.25, j + 0.25, -10);
                        if (k)
                        {
                            r.from.x += 0.5;
                            r.from.y += 0.5;
                            r.to.x += 0.5;
                            r.to.y += 0.5;
                        }
                        r.intersectBody(body, result);
                        test.ok(result.hasHit, 'missed triangle ' + [i, j].join(','));
                    }
                }
            }

            test.ok(true);
        });

        QUnit.test("plane", (test) =>
        {
            var r = new Ray(new Vector3(0, 0, 5), new Vector3(0, 0, -5));
            r.skipBackfaces = true;
            var shape = new Plane();
            var body = new Body({ mass: 1 });
            body.addShape(shape);

            var result = new RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0, 0, 0)));
            test.equal(result.distance, 5);

            result.reset();
            var body2 = new Body({ mass: 1 });
            body2.addShape(shape, new Vector3(0, 0, 1), new Quaternion());
            r.intersectBody(body2, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0, 0, 1)));

            result.reset();
            var body3 = new Body({ mass: 1 });
            var quat = new Quaternion();
            quat.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
            body3.addShape(shape, new Vector3(), quat);
            r.intersectBody(body3, result);
            test.equal(result.hasHit, false);

            result.reset();
            var body4 = new Body({ mass: 1 });
            body4.addShape(shape);
            var r = new Ray(new Vector3(1, 1, 5), new Vector3(1, 1, -5));
            r.intersectBody(body4, result);
            test.equal(result.hasHit, true);
            test.deepEqual(result.hitPointWorld, new Vector3(1, 1, 0));
            test.equal(result.distance, 5);

            var result = new RaycastResult();
            r.from.set(0, 1, 1);
            r.to.set(0, -1, -1);
            body.position.set(0, 0, 0);
            r.intersectBody(body, result);
            var distance1 = result.distance;
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0, 0, 0)));

            var result = new RaycastResult();
            r.from.set(0, 1 - 5, 1);
            r.to.set(0, -1 - 5, -1);
            body.position.set(0, 0, 0);
            r.intersectBody(body, result);
            var distance2 = result.distance;
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new Vector3(0, -5, 0)));
            test.equal(distance1, distance2);

            test.ok(true);
        });

        QUnit.test("trimesh", (test) =>
        {
            var r = new Ray(new Vector3(0.5, 0.5, 10), new Vector3(0.5, 0.5, -10));
            r.skipBackfaces = true;

            var vertices = [
                0, 0, 0,
                1, 0, 0,
                0, 1, 0
            ];
            var indices = [
                0, 1, 2
            ];

            var body = new Body({
                mass: 1,
                shape: new Trimesh(vertices, indices)
            });

            // Hit
            var result = new RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.deepEqual(result.hitPointWorld, new Vector3(0.5, 0.5, 0));

            // Miss
            result = new RaycastResult();
            r.from.set(-100, -100, 10);
            r.to.set(-100, -100, -10);
            r.intersectBody(body, result);
            test.equal(result.hasHit, false);

        });

    });

    function createPolyhedron(size)
    {
        size = (size === undefined ? 0.5 : size);
        var box = new Box(new Vector3(size, size, size));
        box.updateConvexPolyhedronRepresentation();
        return box.convexPolyhedronRepresentation;
    }
}