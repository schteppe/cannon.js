namespace CANNON
{
    QUnit.module("Body", () =>
    {

        QUnit.test("computeAABB box", (test) =>
        {
            var body = new Body({ mass: 1 });
            body.addShape(new Box(new Vector3(1, 1, 1)));
            body.computeAABB();
            test.equal(body.aabb.min.x, -1);
            test.equal(body.aabb.min.y, -1);
            test.equal(body.aabb.min.z, -1);
            test.equal(body.aabb.max.x, 1);
            test.equal(body.aabb.max.y, 1);
            test.equal(body.aabb.max.z, 1);

            body.position.x = 1;
            body.computeAABB();

            test.equal(body.aabb.min.x, 0);
            test.equal(body.aabb.max.x, 2);
        });

        QUnit.test("computeAABB boxOffset", (test) =>
        {
            var quaternion = new Quaternion();
            quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
            var body = new Body({ mass: 1 });
            body.addShape(new Box(new Vector3(1, 1, 1)), new Vector3(1, 1, 1));
            body.computeAABB();
            test.equal(body.aabb.min.x, 0);
            test.equal(body.aabb.min.y, 0);
            test.equal(body.aabb.min.z, 0);
            test.equal(body.aabb.max.x, 2);
            test.equal(body.aabb.max.y, 2);
            test.equal(body.aabb.max.z, 2);

            body.position.x = 1;
            body.computeAABB();

            test.equal(body.aabb.min.x, 1);
            test.equal(body.aabb.max.x, 3);

        });

        QUnit.test("updateInertiaWorld", (test) =>
        {
            var body = new Body({ mass: 1 });
            body.addShape(new Box(new Vector3(1, 1, 1)));
            body.quaternion.fromEuler(Math.PI / 2, 0, 0);
            body.updateInertiaWorld();
            test.ok(true);
        });

        QUnit.test("pointToLocalFrame", (test) =>
        {
            var body = new Body({ mass: 1 });
            body.addShape(new Sphere(1));
            body.position.set(1, 2, 2);
            var localPoint = body.pointToLocalFrame(new Vector3(1, 2, 3));
            test.ok(localPoint.equals(new Vector3(0, 0, 1)));
        });

        QUnit.test("pointToWorldFrame", (test) =>
        {
            var body = new Body({ mass: 1 });
            body.addShape(new Sphere(1));
            body.position.set(1, 2, 2);
            var worldPoint = body.pointToWorldFrame(new Vector3(1, 0, 0));
            test.ok(worldPoint.equals(new Vector3(2, 2, 2)));
        });

        QUnit.test("addShape", (test) =>
        {
            var sphereShape = new Sphere(1);

            var bodyA = new Body({
                mass: 1,
                shape: sphereShape
            });
            var bodyB = new Body({
                mass: 1
            });
            bodyB.addShape(sphereShape);

            test.deepEqual(bodyA.shapes, bodyB.shapes, 'Adding shape via options did not work.');
            test.deepEqual(bodyA.inertia, bodyB.inertia);
        });

        QUnit.test("applyForce", (test) =>
        {
            var sphereShape = new Sphere(1);
            var body = new Body({
                mass: 1,
                shape: sphereShape
            });

            var worldPoint = new Vector3(1, 0, 0);
            var forceVector = new Vector3(0, 1, 0);
            body.applyForce(forceVector, worldPoint);
            test.deepEqual(body.force, forceVector);
            test.deepEqual(body.torque, new Vector3(0, 0, 1));

        });

        QUnit.test("applyLocalForce", (test) =>
        {
            var sphereShape = new Sphere(1);
            var body = new Body({
                mass: 1,
                shape: sphereShape
            });
            body.quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);

            var localPoint = new Vector3(1, 0, 0);
            var localForceVector = new Vector3(0, 1, 0);
            body.applyLocalForce(localForceVector, localPoint);
            test.ok(body.force.equals(new Vector3(0, 0, 1))); // The force is rotated to world space

        });

        QUnit.test("applyImpulse", (test) =>
        {
            var sphereShape = new Sphere(1);
            var body = new Body({
                mass: 1,
                shape: sphereShape
            });

            var f = 1000;
            var dt = 1 / 60;
            var worldPoint = new Vector3(0, 0, 0);
            var impulse = new Vector3(f * dt, 0, 0);
            body.applyImpulse(impulse, worldPoint);

            test.ok(body.velocity.equals(new Vector3(f * dt, 0, 0)));

        });

        QUnit.test("applyLocalImpulse", (test) =>
        {
            var sphereShape = new Sphere(1);
            var body = new Body({
                mass: 1,
                shape: sphereShape
            });
            body.quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);

            var f = 1000;
            var dt = 1 / 60;
            var localPoint = new Vector3(1, 0, 0);
            var localImpulseVector = new Vector3(0, f * dt, 0);
            body.applyLocalImpulse(localImpulseVector, localPoint);
            test.ok(body.velocity.equals(new Vector3(0, 0, f * dt))); // The force is rotated to world space

        });

    });
}