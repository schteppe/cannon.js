namespace CANNON
{
    QUnit.module("World", () =>
    {

        QUnit.test("clearForces", (test) =>
        {
            var world = new World();
            var body = new Body();
            world.addBody(body);
            body.force.set(1, 2, 3);
            body.torque.set(4, 5, 6);

            world.clearForces();

            test.ok(body.force.equals(new Vector3(0, 0, 0)));
            test.ok(body.torque.equals(new Vector3(0, 0, 0)));

        });

        QUnit.test("rayTestBox", (test) =>
        {
            var world = new World();

            var body = new Body();
            body.addShape(new Box(new Vector3(1, 1, 1)));
            world.addBody(body);

            var from = new Vector3(-10, 0, 0);
            var to = new Vector3(10, 0, 0);

            var result = new RaycastResult();
            world.raycastClosest(from, to, {}, result);

            test.equal(result.hasHit, true);

        });

        QUnit.test("rayTestSphere", (test) =>
        {
            var world = new World();

            var body = new Body();
            body.addShape(new Sphere(1));
            world.addBody(body);

            var from = new Vector3(-10, 0, 0);
            var to = new Vector3(10, 0, 0);

            var result = new RaycastResult();
            world.raycastClosest(from, to, {}, result);

            test.equal(result.hasHit, true);

        });

        QUnit.test("raycastClosest single", (test) =>
        {
            var world = new World();
            var body = new Body({
                shape: new Sphere(1)
            });
            world.addBody(body);

            var from = new Vector3(-10, 0, 0);
            var to = new Vector3(10, 0, 0);

            var result = new RaycastResult();
            world.raycastClosest(from, to, {}, result);

            test.equal(result.hasHit, true);
            test.equal(result.body, body);
            test.equal(result.shape, body.shapes[0]);
        });

        QUnit.test("raycastClosest order", (test) =>
        {
            var world = new World();
            var bodyA = new Body({ shape: new Sphere(1), position: new Vector3(-1, 0, 0) });
            var bodyB = new Body({ shape: new Sphere(1), position: new Vector3(1, 0, 0) });
            world.addBody(bodyA);
            world.addBody(bodyB);

            var from = new Vector3(-10, 0, 0);
            var to = new Vector3(10, 0, 0);

            var result = new RaycastResult();
            world.raycastClosest(from, to, {}, result);

            test.equal(result.hasHit, true);
            test.equal(result.body, bodyA);
            test.equal(result.shape, bodyA.shapes[0]);

            from.set(10, 0, 0);
            to.set(-10, 0, 0);

            result = new RaycastResult();
            world.raycastClosest(from, to, {}, result);

            test.equal(result.hasHit, true);
            test.equal(result.body, bodyB);
            test.equal(result.shape, bodyB.shapes[0]);

        });

        QUnit.test("raycastAll simple", (test) =>
        {
            var world = new World();
            var body = new Body({ shape: new Sphere(1) });
            world.addBody(body);

            var from = new Vector3(-10, 0, 0);
            var to = new Vector3(10, 0, 0);

            var hasHit;
            var numResults = 0;
            var resultBody;
            var resultShape;

            var returnVal = world.raycastAll(from, to, {}, function (result)
            {
                hasHit = result.hasHit;
                resultShape = result.shape;
                resultBody = result.body;
                numResults++;
            });

            test.equal(returnVal, true, 'should return true on hit');
            test.equal(hasHit, true);
            test.equal(resultBody, body);
            test.equal(numResults, 2);
            test.equal(resultShape, resultBody.shapes[0]);

        });

        QUnit.test("raycastAll twoSpheres", (test) =>
        {
            var world = new World();
            var body = new Body({ shape: new Sphere(1) });
            world.addBody(body);

            var body2 = new Body({ shape: new Sphere(1) });
            world.addBody(body2);

            var from = new Vector3(-10, 0, 0);
            var to = new Vector3(10, 0, 0);

            var hasHit = false;
            var numResults = 0;
            var resultBody;
            var resultShape;

            world.raycastAll(from, to, {}, function (result)
            {
                hasHit = result.hasHit;
                resultShape = result.shape;
                resultBody = result.body;
                numResults++;
            });

            test.equal(hasHit, true);
            test.equal(numResults, 4);

        });

        QUnit.test("raycastAll skipBackFaces", (test) =>
        {
            var world = new World();
            var body = new Body({ shape: new Sphere(1) });
            world.addBody(body);

            var hasHit = false;
            var numResults = 0;
            var resultBody;
            var resultShape;

            world.raycastAll(new Vector3(-10, 0, 0), new Vector3(10, 0, 0), { skipBackfaces: true }, function (result)
            {
                hasHit = result.hasHit;
                resultShape = result.shape;
                resultBody = result.body;
                numResults++;
            });

            test.equal(hasHit, true);
            test.equal(numResults, 1);

        });

        QUnit.test("raycastAll collisionFilters", (test) =>
        {
            var world = new World();
            var body = new Body({
                shape: new Sphere(1)
            });
            world.addBody(body);
            body.collisionFilterGroup = 2;
            body.collisionFilterMask = 2;

            var numResults = 0;

            world.raycastAll(new Vector3(-10, 0, 0), new Vector3(10, 0, 0), {
                collisionFilterGroup: 2,
                collisionFilterMask: 2
            }, function (result)
            {
                numResults++;
            });

            test.equal(numResults, 2);

            numResults = 0;

            world.raycastAll(new Vector3(-10, 0, 0), new Vector3(10, 0, 0), {
                collisionFilterGroup: 1,
                collisionFilterMask: 1
            }, function (result)
            {
                numResults++;
            });

            test.equal(numResults, 0, 'should use collision groups!');

        });

        QUnit.test("raycastAny", (test) =>
        {
            var world = new World();
            world.addBody(new Body({ shape: new Sphere(1) }));

            var from = new Vector3(-10, 0, 0);
            var to = new Vector3(10, 0, 0);

            var result = new RaycastResult();
            world.raycastAny(from, to, {}, result);

            test.ok(result.hasHit);

        });

    });
}