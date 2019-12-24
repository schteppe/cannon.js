var CANNON;
(function (CANNON) {
    QUnit.module("Body", function () {
        QUnit.test("computeAABB box", function (test) {
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(new CANNON.Box(new CANNON.Vector3(1, 1, 1)));
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
        QUnit.test("computeAABB boxOffset", function (test) {
            var quaternion = new CANNON.Quaternion();
            quaternion.fromAxisAngle(new CANNON.Vector3(0, 0, 1), Math.PI / 2);
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(new CANNON.Box(new CANNON.Vector3(1, 1, 1)), new CANNON.Vector3(1, 1, 1));
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
        QUnit.test("updateInertiaWorld", function (test) {
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(new CANNON.Box(new CANNON.Vector3(1, 1, 1)));
            body.quaternion.setFromEuler(Math.PI / 2, 0, 0);
            body.updateInertiaWorld();
            test.ok(true);
        });
        QUnit.test("pointToLocalFrame", function (test) {
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(new CANNON.Sphere(1));
            body.position.set(1, 2, 2);
            var localPoint = body.pointToLocalFrame(new CANNON.Vector3(1, 2, 3));
            test.ok(localPoint.equals(new CANNON.Vector3(0, 0, 1)));
        });
        QUnit.test("pointToWorldFrame", function (test) {
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(new CANNON.Sphere(1));
            body.position.set(1, 2, 2);
            var worldPoint = body.pointToWorldFrame(new CANNON.Vector3(1, 0, 0));
            test.ok(worldPoint.equals(new CANNON.Vector3(2, 2, 2)));
        });
        QUnit.test("addShape", function (test) {
            var sphereShape = new CANNON.Sphere(1);
            var bodyA = new CANNON.Body({
                mass: 1,
                shape: sphereShape
            });
            var bodyB = new CANNON.Body({
                mass: 1
            });
            bodyB.addShape(sphereShape);
            test.deepEqual(bodyA.shapes, bodyB.shapes, 'Adding shape via options did not work.');
            test.deepEqual(bodyA.inertia, bodyB.inertia);
        });
        QUnit.test("applyForce", function (test) {
            var sphereShape = new CANNON.Sphere(1);
            var body = new CANNON.Body({
                mass: 1,
                shape: sphereShape
            });
            var worldPoint = new CANNON.Vector3(1, 0, 0);
            var forceVector = new CANNON.Vector3(0, 1, 0);
            body.applyForce(forceVector, worldPoint);
            test.deepEqual(body.force, forceVector);
            test.deepEqual(body.torque, new CANNON.Vector3(0, 0, 1));
        });
        QUnit.test("applyLocalForce", function (test) {
            var sphereShape = new CANNON.Sphere(1);
            var body = new CANNON.Body({
                mass: 1,
                shape: sphereShape
            });
            body.quaternion.fromAxisAngle(new CANNON.Vector3(1, 0, 0), Math.PI / 2);
            var localPoint = new CANNON.Vector3(1, 0, 0);
            var localForceVector = new CANNON.Vector3(0, 1, 0);
            body.applyLocalForce(localForceVector, localPoint);
            test.ok(body.force.equals(new CANNON.Vector3(0, 0, 1))); // The force is rotated to world space
        });
        QUnit.test("applyImpulse", function (test) {
            var sphereShape = new CANNON.Sphere(1);
            var body = new CANNON.Body({
                mass: 1,
                shape: sphereShape
            });
            var f = 1000;
            var dt = 1 / 60;
            var worldPoint = new CANNON.Vector3(0, 0, 0);
            var impulse = new CANNON.Vector3(f * dt, 0, 0);
            body.applyImpulse(impulse, worldPoint);
            test.ok(body.velocity.equals(new CANNON.Vector3(f * dt, 0, 0)));
        });
        QUnit.test("applyLocalImpulse", function (test) {
            var sphereShape = new CANNON.Sphere(1);
            var body = new CANNON.Body({
                mass: 1,
                shape: sphereShape
            });
            body.quaternion.fromAxisAngle(new CANNON.Vector3(1, 0, 0), Math.PI / 2);
            var f = 1000;
            var dt = 1 / 60;
            var localPoint = new CANNON.Vector3(1, 0, 0);
            var localImpulseVector = new CANNON.Vector3(0, f * dt, 0);
            body.applyLocalImpulse(localImpulseVector, localPoint);
            test.ok(body.velocity.equals(new CANNON.Vector3(0, 0, f * dt))); // The force is rotated to world space
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Box", function () {
        QUnit.test("forEachWOrldCorner", function (test) {
            var box = new CANNON.Box(new CANNON.Vector3(1, 1, 1));
            var pos = new CANNON.Vector3();
            var quat = new CANNON.Quaternion();
            quat.fromAxisAngle(new CANNON.Vector3(0, 0, 1), Math.PI * 0.25);
            var numCorners = 0;
            var unique = [];
            box.forEachWorldCorner(pos, quat, function (x, y, z) {
                var corner = new CANNON.Vector3(x, y, z);
                for (var i = 0; i < unique.length; i++) {
                    test.ok(!corner.equals(unique[i]), "Corners " + i + " and " + numCorners + " are almost equal: (" + unique[i].toString() + ") == (" + corner.toString() + ")");
                }
                unique.push(corner);
                numCorners++;
            });
            test.equal(numCorners, 8);
        });
        QUnit.test("calculateWorldAABB", function (test) {
            var box = new CANNON.Box(new CANNON.Vector3(1, 1, 1));
            var min = new CANNON.Vector3();
            var max = new CANNON.Vector3();
            box.calculateWorldAABB(new CANNON.Vector3(3, 0, 0), new CANNON.Quaternion(0, 0, 0, 1), min, max);
            test.equal(min.x, 2);
            test.equal(max.x, 4);
            test.equal(min.y, -1);
            test.equal(max.y, 1);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Box3", function () {
        QUnit.test("construct", function (test) {
            new CANNON.Box3();
            test.ok(true);
        });
        QUnit.test("copy", function (test) {
            var a = new CANNON.Box3(), b = new CANNON.Box3();
            a.max.set(1, 2, 3);
            b.copy(a);
            test.deepEqual(a, b);
        });
        QUnit.test("clone", function (test) {
            var a = new CANNON.Box3(new CANNON.Vector3(-1, -2, -3), new CANNON.Vector3(1, 2, 3));
            var b = a.clone();
            test.deepEqual(a, b);
            test.equal(a === b, false);
        });
        QUnit.test("extend", function (test) {
            var a = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(1, 1, 1));
            var b = new CANNON.Box3(new CANNON.Vector3(-2, -2, -2), new CANNON.Vector3(2, 2, 2));
            a.union(b);
            test.deepEqual(a, b);
            a = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(1, 1, 1));
            b = new CANNON.Box3(new CANNON.Vector3(-2, -2, -2), new CANNON.Vector3(2, 2, 2));
            b.union(a);
            test.deepEqual(b.min, new CANNON.Vector3(-2, -2, -2));
            test.deepEqual(b.max, new CANNON.Vector3(2, 2, 2));
            a = new CANNON.Box3(new CANNON.Vector3(-2, -1, -1), new CANNON.Vector3(2, 1, 1));
            b = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(1, 1, 1));
            b.union(a);
            test.deepEqual(a.min, new CANNON.Vector3(-2, -1, -1));
            test.deepEqual(a.max, new CANNON.Vector3(2, 1, 1));
        });
        QUnit.test("extend", function (test) {
            var a = new CANNON.Box3(), b = new CANNON.Box3();
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
        QUnit.test("contains", function (test) {
            var a = new CANNON.Box3(), b = new CANNON.Box3();
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
        QUnit.test("toLocalFrame", function (test) {
            var worldAABB = new CANNON.Box3();
            var localAABB = new CANNON.Box3();
            var frame = new CANNON.Transform();
            worldAABB.min.set(-1, -1, -1);
            worldAABB.max.set(1, 1, 1);
            // No transform - should stay the same
            frame.toLocalFrameBox3(worldAABB, localAABB);
            test.deepEqual(localAABB, worldAABB);
            // Some translation
            frame.position.set(-1, 0, 0);
            frame.toLocalFrameBox3(worldAABB, localAABB);
            test.deepEqual(localAABB, new CANNON.Box3(new CANNON.Vector3(0, -1, -1), new CANNON.Vector3(2, 1, 1)));
        });
        QUnit.test("toWorldFrame", function (test) {
            var localAABB = new CANNON.Box3();
            var worldAABB = new CANNON.Box3();
            var frame = new CANNON.Transform();
            localAABB.min.set(-1, -1, -1);
            localAABB.max.set(1, 1, 1);
            // No transform - should stay the same
            frame.toLocalFrameBox3(localAABB, worldAABB);
            test.deepEqual(localAABB, worldAABB);
            // Some translation on the frame
            frame.position.set(1, 0, 0);
            frame.toWorldFrameBox3(localAABB, worldAABB);
            test.deepEqual(worldAABB, new CANNON.Box3(new CANNON.Vector3(0, -1, -1), new CANNON.Vector3(2, 1, 1)));
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Constraint", function () {
        QUnit.test("construct", function (test) {
            var bodyA = new CANNON.Body();
            var bodyB = new CANNON.Body();
            new CANNON.Constraint(bodyA, bodyB);
            test.ok(true);
        });
        QUnit.test("enable", function (test) {
            var bodyA = new CANNON.Body();
            var bodyB = new CANNON.Body();
            var c = new CANNON.Constraint(bodyA, bodyB);
            var eq = new CANNON.Equation(bodyA, bodyB);
            c.equations.push(eq);
            c.enable();
            test.ok(eq.enabled);
            c.disable();
            test.ok(!eq.enabled);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("ContactEquation", function () {
        QUnit.test("construct", function (test) {
            var bodyA = new CANNON.Body();
            var bodyB = new CANNON.Body();
            new CANNON.ContactEquation(bodyA, bodyB);
            test.ok(true);
        });
        QUnit.test("getImpactVelocityAlongNormal", function (test) {
            var bodyA = new CANNON.Body({
                position: new CANNON.Vector3(1, 0, 0),
                velocity: new CANNON.Vector3(-10, 0, 0)
            });
            var bodyB = new CANNON.Body({
                position: new CANNON.Vector3(-1, 0, 0),
                velocity: new CANNON.Vector3(1, 0, 0)
            });
            var contact = new CANNON.ContactEquation(bodyA, bodyB);
            contact.ni.set(1, 0, 0);
            contact.ri.set(-1, 0, 0);
            contact.rj.set(1, 0, 0);
            var v = contact.getImpactVelocityAlongNormal();
            test.equal(v, -11);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    function createBoxHull(size) {
        size = (size === undefined ? 0.5 : size);
        var box = new CANNON.Box(new CANNON.Vector3(size, size, size));
        return box.convexPolyhedronRepresentation;
    }
    function createPolyBox(sx, sy, sz) {
        var v = CANNON.Vector3;
        var box = new CANNON.Box(new CANNON.Vector3(sx, sy, sz));
        return box.convexPolyhedronRepresentation;
    }
    QUnit.module("ConvexPolyhedron", function () {
        QUnit.test("calculateWorldAABB", function (test) {
            var poly = createPolyBox(1, 1, 1);
            var min = new CANNON.Vector3();
            var max = new CANNON.Vector3();
            poly.calculateWorldAABB(new CANNON.Vector3(1, 0, 0), // Translate 2 x in world
            new CANNON.Quaternion(0, 0, 0, 1), min, max);
            test.equal(min.x, 0);
            test.equal(max.x, 2);
            test.equal(min.y, -1);
            test.equal(max.y, 1);
        });
        QUnit.test("clipFaceAgainstPlane", function (test) {
            var h = createBoxHull();
            // Four points 1 unit below the plane z=0 - we assume to get back 4
            var inverts = [new CANNON.Vector3(-0.2, -0.2, -1),
                new CANNON.Vector3(-0.2, 0.2, -1),
                new CANNON.Vector3(0.2, 0.2, -1),
                new CANNON.Vector3(0.2, -0.2, -1)];
            var outverts = [];
            h.clipFaceAgainstPlane(inverts, outverts, new CANNON.Vector3(0, 0, 1), 0.0);
            test.equal(outverts.length, 4, "did not get the assumed 4 vertices");
            inverts = [];
            outverts = [];
            // Lower the plane to z=-2, we assume no points back
            h.clipFaceAgainstPlane(inverts, outverts, new CANNON.Vector3(0, 0, 1), 2);
            test.equal(outverts.length, 0, "got more than zero vertices left after clipping!");
            // two points below, two over. We get four points back, though 2 of them are clipped to
            // the back of the  plane
            var inverts2 = [new CANNON.Vector3(-2, -2, 1),
                new CANNON.Vector3(-2, 2, 1),
                new CANNON.Vector3(2, 2, -1),
                new CANNON.Vector3(2, -2, -1)];
            outverts = [];
            h.clipFaceAgainstPlane(inverts2, outverts, new CANNON.Vector3(0, 0, 1), 0.0);
            test.equal(outverts.length, 4, "Expected 4 points back from clipping a quad with plane, got " + outverts.length);
        });
        QUnit.test("clipFaceAgainstHull", function (test) {
            // Create box
            var hullA = createBoxHull(0.5);
            var res = [];
            var sepNormal = new CANNON.Vector3(0, 0, 1);
            // Move the box 0.45 units up - only 0.05 units of the box will be below plane z=0
            var posA = new CANNON.Vector3(0, 0, 0.45), quatA = new CANNON.Quaternion();
            // All points from B is in the plane z=0
            var worldVertsB = [new CANNON.Vector3(-1.0, -1.0, 0),
                new CANNON.Vector3(-1.0, 1.0, 0),
                new CANNON.Vector3(1.0, 1.0, 0),
                new CANNON.Vector3(1.0, -1.0, 0)];
            // We will now clip a face in hullA that is closest to the sepNormal
            // against the points in worldVertsB.
            // We can expect to get back the 4 corners of the box hullA penetrated 0.05 units
            // into the plane worldVertsB we constructed
            hullA.clipFaceAgainstHull(sepNormal, posA, quatA, worldVertsB, -100, 100, res);
            test.ok(true);
        });
        QUnit.test("clipAgainstHull", function (test) {
            var hullA = createBoxHull(0.6), posA = new CANNON.Vector3(-0.5, 0, 0), quatA = new CANNON.Quaternion();
            var hullB = createBoxHull(0.5), posB = new CANNON.Vector3(0.5, 0, 0), quatB = new CANNON.Quaternion();
            var sepaxis = new CANNON.Vector3();
            var found = hullA.findSeparatingAxis(hullB, posA, quatA, posB, quatB, sepaxis);
            var result = [];
            //hullA.clipAgainstHull(posA,quatA,hullB,posB,quatB,sepaxis,-100,100,result);
            quatB.fromAxisAngle(new CANNON.Vector3(0, 0, 1), Math.PI / 4);
            //console.log("clipping....");
            hullA.clipAgainstHull(posA, quatA, hullB, posB, quatB, sepaxis, -100, 100, result);
            //console.log("result:",result);
            //console.log("done....");
            test.ok(true);
        });
        QUnit.test("testSepAxis", function (test) {
            test.expect(3);
            var hullA = createBoxHull(0.5), posA = new CANNON.Vector3(-0.2, 0, 0), quatA = new CANNON.Quaternion();
            var hullB = createBoxHull(), posB = new CANNON.Vector3(0.2, 0, 0), quatB = new CANNON.Quaternion();
            var sepAxis = new CANNON.Vector3(1, 0, 0);
            var found1 = hullA.testSepAxis(sepAxis, hullB, posA, quatA, posB, quatB);
            test.equal(found1, 0.6, "didnt find sep axis depth");
            // Move away
            posA.x = -5;
            var found2 = hullA.testSepAxis(sepAxis, hullB, posA, quatA, posB, quatB);
            test.equal(found2, false, "found separating axis though there are none");
            // Inclined 45 degrees, what happens then?
            posA.x = 1;
            quatB.fromAxisAngle(new CANNON.Vector3(0, 0, 1), Math.PI / 4);
            var found3 = hullA.testSepAxis(sepAxis, hullB, posA, quatA, posB, quatB);
            test.ok(typeof (found3), "number" + " Did not fetch");
        });
        QUnit.test("findSepAxis", function (test) {
            var hullA = createBoxHull(), posA = new CANNON.Vector3(-0.2, 0, 0), quatA = new CANNON.Quaternion();
            var hullB = createBoxHull(), posB = new CANNON.Vector3(0.2, 0, 0), quatB = new CANNON.Quaternion();
            var sepaxis = new CANNON.Vector3();
            var found = hullA.findSeparatingAxis(hullB, posA, quatA, posB, quatB, sepaxis);
            //console.log("SepAxis found:",found,", the axis:",sepaxis.toString());
            quatB.fromAxisAngle(new CANNON.Vector3(0, 0, 1), Math.PI / 4);
            var found2 = hullA.findSeparatingAxis(hullB, posA, quatA, posB, quatB, sepaxis);
            //console.log("SepAxis found:",found2,", the axis:",sepaxis.toString());
            test.ok(true);
        });
        QUnit.test("project", function (test) {
            var convex = createBoxHull(0.5), pos = new CANNON.Vector3(0, 0, 0), quat = new CANNON.Quaternion();
            var axis = new CANNON.Vector3(1, 0, 0);
            var result = [];
            CANNON.ConvexPolyhedron.project(convex, axis, pos, quat, result);
            test.deepEqual(result, [0.5, -0.5]);
            axis.set(-1, 0, 0);
            CANNON.ConvexPolyhedron.project(convex, axis, pos, quat, result);
            test.deepEqual(result, [0.5, -0.5]);
            axis.set(0, 1, 0);
            CANNON.ConvexPolyhedron.project(convex, axis, pos, quat, result);
            test.deepEqual(result, [0.5, -0.5]);
            pos.set(0, 1, 0);
            axis.set(0, 1, 0);
            CANNON.ConvexPolyhedron.project(convex, axis, pos, quat, result);
            test.deepEqual(result, [1.5, 0.5]);
            // Test to rotate
            quat.fromAxisAngle(new CANNON.Vector3(1, 0, 0), Math.PI / 2);
            pos.set(0, 1, 0);
            axis.set(0, 1, 0);
            CANNON.ConvexPolyhedron.project(convex, axis, pos, quat, result);
            test.ok(Math.abs(result[0] - 1.5) < 0.01);
            test.ok(Math.abs(result[1] - 0.5) < 0.01);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Heightfield", function () {
        QUnit.test("calculateWorldAABB", function (test) {
            var hfShape = createHeightfield({
                elementSize: 1,
                minValue: 0
            });
            var min = new CANNON.Vector3();
            var max = new CANNON.Vector3();
            hfShape.calculateWorldAABB(new CANNON.Vector3(), new CANNON.Quaternion(), min, max);
            test.equal(min.x, -Number.MAX_VALUE);
            test.equal(max.x, Number.MAX_VALUE);
            test.equal(min.y, -Number.MAX_VALUE);
            test.equal(max.y, Number.MAX_VALUE);
        });
        QUnit.test("getConvexTrianglePillar", function (test) {
            var hfShape = createHeightfield({
                elementSize: 1,
                minValue: 0,
                size: 2
            });
            hfShape.getConvexTrianglePillar(0, 0, false);
            test.equal(hfShape.pillarConvex.vertices.length, 6);
            test.deepEqual(hfShape.pillarConvex.vertices.slice(0, 3), [
                new CANNON.Vector3(-0.25, -0.25, 0.5),
                new CANNON.Vector3(0.75, -0.25, 0.5),
                new CANNON.Vector3(-0.25, 0.75, 0.5)
            ]);
            test.deepEqual(hfShape.pillarOffset, new CANNON.Vector3(0.25, 0.25, 0.5));
            hfShape.getConvexTrianglePillar(0, 0, true);
            test.equal(hfShape.pillarConvex.vertices.length, 6);
            test.deepEqual(hfShape.pillarConvex.vertices.slice(0, 3), [
                new CANNON.Vector3(0.25, 0.25, 0.5),
                new CANNON.Vector3(-0.75, 0.25, 0.5),
                new CANNON.Vector3(0.25, -0.75, 0.5)
            ]);
            test.deepEqual(hfShape.pillarOffset, new CANNON.Vector3(0.75, 0.75, 0.5));
            // Out of bounds
            test.throws(function () {
                hfShape.getConvexTrianglePillar(1, 1, true);
            }, Error);
            test.throws(function () {
                hfShape.getConvexTrianglePillar(1, 1, false);
            }, Error);
            test.throws(function () {
                hfShape.getConvexTrianglePillar(-1, 0, false);
            }, Error);
        });
        QUnit.test("getTriangle", function (test) {
            var hfShape = createHeightfield({
                elementSize: 1,
                minValue: 0,
                size: 2
            });
            var a = new CANNON.Vector3();
            var b = new CANNON.Vector3();
            var c = new CANNON.Vector3();
            hfShape.getTriangle(0, 0, false, a, b, c);
            test.deepEqual(a, new CANNON.Vector3(0, 0, 1));
            test.deepEqual(b, new CANNON.Vector3(1, 0, 1));
            test.deepEqual(c, new CANNON.Vector3(0, 1, 1));
            hfShape.getTriangle(0, 0, true, a, b, c);
            test.deepEqual(a, new CANNON.Vector3(1, 1, 1));
            test.deepEqual(b, new CANNON.Vector3(0, 1, 1));
            test.deepEqual(c, new CANNON.Vector3(1, 0, 1));
        });
        QUnit.test("getRectMinMax", function (test) {
            var hfShape = createHeightfield();
            var minMax = [];
            hfShape.getRectMinMax(0, 0, 1, 1, minMax);
            test.deepEqual(minMax, [1, 1]);
        });
        QUnit.test("getHeightAt", function (test) {
            var hfShape = createHeightfield({
                size: 2,
                elementSize: 1,
                linear: true
            });
            var h0 = hfShape.getHeightAt(0, 0);
            var h1 = hfShape.getHeightAt(0.25, 0.25);
            var h2 = hfShape.getHeightAt(0.75, 0.75);
            var h3 = hfShape.getHeightAt(0.99, 0.99);
            test.equal(h0, 0);
            test.ok(h0 < h1);
            test.ok(h1 < h2);
            test.ok(h2 < h3);
        });
        QUnit.test("update", function (test) {
            var hfShape = createHeightfield();
            hfShape.update();
            test.ok(true);
        });
        QUnit.test("updateMaxValue", function (test) {
            var hfShape = createHeightfield();
            hfShape.data[0][0] = 10;
            hfShape.updateMaxValue();
            test.equal(hfShape.maxValue, 10);
        });
        QUnit.test("updateMinValue", function (test) {
            var hfShape = createHeightfield();
            hfShape.data[0][0] = -10;
            hfShape.updateMinValue();
            test.equal(hfShape.minValue, -10);
        });
        QUnit.test("setHeightValueAtIndex", function (test) {
            var hfShape = createHeightfield();
            hfShape.setHeightValueAtIndex(0, 0, 10);
            test.equal(hfShape.data[0][0], 10);
        });
        QUnit.test("getIndexOfPosition", function (test) {
            var hfShape = createHeightfield();
            var result = [];
            hfShape.getIndexOfPosition(0, 0, result);
            test.deepEqual(result, [0, 0]);
        });
    });
    function createHeightfield(options) {
        options = options || {};
        var matrix = [];
        var size = options.size || 20;
        for (var i = 0; i < size; i++) {
            matrix.push([]);
            for (var j = 0; j < size; j++) {
                if (options.linear) {
                    matrix[i].push(i + j);
                }
                else {
                    matrix[i].push(1);
                }
            }
        }
        var hfShape = new CANNON.Heightfield(matrix, options);
        return hfShape;
    }
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("HingeConstraint", function () {
        QUnit.test("construct", function (test) {
            var bodyA = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(1, 0, 0) });
            var bodyB = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(-1, 0, 0) });
            var c = new CANNON.HingeConstraint(bodyA, bodyB, { maxForce: 123 });
            test.equal(c.equations.length, 6); // 5 actually, and 1 for the motor
            test.equal(c.equations[0].maxForce, 123);
            test.equal(c.equations[1].maxForce, 123);
            test.equal(c.equations[2].maxForce, 123);
            test.equal(c.equations[3].maxForce, 123);
            test.equal(c.equations[4].maxForce, 123);
            test.equal(c.equations[5].maxForce, 123);
            test.equal(c.equations[0].minForce, -123);
            test.equal(c.equations[1].minForce, -123);
            test.equal(c.equations[2].minForce, -123);
            test.equal(c.equations[3].minForce, -123);
            test.equal(c.equations[4].minForce, -123);
            test.equal(c.equations[5].minForce, -123);
        });
        QUnit.test("update", function (test) {
            var bodyA = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(1, 0, 0) });
            var bodyB = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(-1, 0, 0) });
            var c = new CANNON.HingeConstraint(bodyA, bodyB, { maxForce: 123 });
            c.update();
            test.ok(true);
        });
        QUnit.test("enableDisableMotor", function (test) {
            var bodyA = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(1, 0, 0) });
            var bodyB = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(-1, 0, 0) });
            var c = new CANNON.HingeConstraint(bodyA, bodyB);
            c.enableMotor();
            test.ok(c.motorEquation.enabled);
            c.disableMotor();
            test.equal(c.motorEquation.enabled, false);
        });
        QUnit.test("setMotorSpeed", function (test) {
            var bodyA = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(1, 0, 0) });
            var bodyB = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(-1, 0, 0) });
            var c = new CANNON.HingeConstraint(bodyA, bodyB);
            c.setMotorSpeed(5);
            test.equal(c.motorEquation.targetVelocity, 5);
        });
        QUnit.test("setMotorMaxForce", function (test) {
            var bodyA = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(1, 0, 0) });
            var bodyB = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(-1, 0, 0) });
            var c = new CANNON.HingeConstraint(bodyA, bodyB);
            c.setMotorMaxForce(100);
            test.equal(c.motorEquation.maxForce, 100);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("LockConstraint", function () {
        QUnit.test("construct", function (test) {
            var bodyA = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(1, 0, 0) });
            var bodyB = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(-1, 0, 0) });
            var c = new CANNON.LockConstraint(bodyA, bodyB, { maxForce: 123 });
            test.equal(c.equations.length, 6);
            test.equal(c.equations[0].maxForce, 123);
            test.equal(c.equations[1].maxForce, 123);
            test.equal(c.equations[2].maxForce, 123);
            test.equal(c.equations[3].maxForce, 123);
            test.equal(c.equations[4].maxForce, 123);
            test.equal(c.equations[5].maxForce, 123);
            test.equal(c.equations[0].minForce, -123);
            test.equal(c.equations[1].minForce, -123);
            test.equal(c.equations[2].minForce, -123);
            test.equal(c.equations[3].minForce, -123);
            test.equal(c.equations[4].minForce, -123);
            test.equal(c.equations[5].minForce, -123);
        });
        QUnit.test("update", function (test) {
            var bodyA = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(1, 0, 0) });
            var bodyB = new CANNON.Body({ mass: 1, position: new CANNON.Vector3(-1, 0, 0) });
            var c = new CANNON.LockConstraint(bodyA, bodyB, { maxForce: 123 });
            c.update();
            test.ok(true);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Narrowphase", function () {
        QUnit.test("sphereSphere", function (test) {
            var world = new CANNON.World();
            var cg = new CANNON.Narrowphase(world);
            var result = [];
            var sphereShape = new CANNON.Sphere(1);
            var bodyA = new CANNON.Body({ mass: 1 });
            bodyA.addShape(sphereShape);
            var bodyB = new CANNON.Body({ mass: 1 });
            bodyB.addShape(sphereShape);
            cg.currentContactMaterial = new CANNON.ContactMaterial();
            cg.result = result;
            cg.sphereSphere(sphereShape, sphereShape, new CANNON.Vector3(0.5, 0, 0), new CANNON.Vector3(-0.5, 0, 0), new CANNON.Quaternion(), new CANNON.Quaternion(), bodyA, bodyB);
            test.equal(result.length, 1);
        });
        QUnit.test("sphereHeightfield", function (test) {
            var world = new CANNON.World();
            var cg = new CANNON.Narrowphase(world);
            var result = [];
            var hfShape = createHeightfield();
            var sphereShape = new CANNON.Sphere(0.1);
            cg.currentContactMaterial = new CANNON.ContactMaterial();
            cg.result = result;
            cg.sphereHeightfield(sphereShape, hfShape, new CANNON.Vector3(0.25, 0.25, 0.05), // hit the first triangle in the field
            new CANNON.Vector3(0, 0, 0), new CANNON.Quaternion(), new CANNON.Quaternion(), new CANNON.Body(), new CANNON.Body());
            test.equal(result.length, 1);
        });
    });
    function createHeightfield() {
        var matrix = [];
        var size = 20;
        for (var i = 0; i < size; i++) {
            matrix.push([]);
            for (var j = 0; j < size; j++) {
                matrix[i].push(0);
            }
        }
        var hfShape = new CANNON.Heightfield(matrix, {
            elementSize: 1,
        });
        return hfShape;
    }
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Octree", function () {
        QUnit.test("construct", function (test) {
            var tree = new CANNON.Octree(new CANNON.Box3());
            test.ok(true);
        });
        QUnit.test("insertRoot", function (test) {
            var aabb = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(1, 1, 1));
            var tree = new CANNON.Octree(aabb);
            var nodeAABB = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(1, 1, 1));
            var nodeData = 123;
            tree.insert(nodeAABB, nodeData);
            // Should end up in root node and not children
            test.equal(tree.data.length, 1);
            test.equal(tree.children.length, 0);
        });
        QUnit.test("insertDeep", function (test) {
            var aabb = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(1, 1, 1));
            var tree = new CANNON.Octree(aabb, {
                maxDepth: 8
            });
            var nodeAABB = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(-1, -1, -1));
            var nodeData = 123;
            tree.insert(nodeAABB, nodeData);
            // Should be deep (maxDepth deep) in lower corner
            test.ok(tree // level 0
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
        QUnit.test("aabbQuery", function (test) {
            var aabb = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(1, 1, 1));
            var tree = new CANNON.Octree(aabb);
            var nodeAABB = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(1, 1, 1));
            var nodeData = 123;
            tree.insert(nodeAABB, nodeData);
            var result = [];
            tree.aabbQuery(aabb, result);
            test.deepEqual(result, [123]);
            var nodeAABB2 = new CANNON.Box3(new CANNON.Vector3(-1, -1, -1), new CANNON.Vector3(-1, -1, -1));
            var nodeData2 = 456;
            tree.insert(nodeAABB2, nodeData2);
            result = [];
            tree.aabbQuery(aabb, result);
            test.deepEqual(result, [123, 456]);
            result = [];
            tree.aabbQuery(new CANNON.Box3(new CANNON.Vector3(0, 0, 0), new CANNON.Vector3(1, 1, 1)), result);
            test.deepEqual(result, [123]);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("OverlapKeeper", function () {
        QUnit.test("construct", function (test) {
            new CANNON.OverlapKeeper();
            test.ok(true);
        });
        QUnit.test("set", function (test) {
            var keeper = new CANNON.OverlapKeeper();
            keeper.set(1, 2);
            test.deepEqual(keeper.current, [keeper.getKey(1, 2)]);
            keeper.set(3, 2);
            test.deepEqual(keeper.current, [keeper.getKey(1, 2), keeper.getKey(3, 2)]);
            keeper.set(3, 1);
            test.deepEqual(keeper.current, [keeper.getKey(1, 2), keeper.getKey(1, 3), keeper.getKey(3, 2)]);
        });
        QUnit.test("getDiff", function (test) {
            var keeper = new CANNON.OverlapKeeper();
            keeper.set(1, 2);
            keeper.set(3, 2);
            keeper.set(3, 1);
            keeper.tick();
            keeper.set(1, 2);
            keeper.set(3, 2);
            keeper.set(3, 1);
            var additions = [];
            var removals = [];
            keeper.getDiff(additions, removals);
            test.equal(additions.length, 0);
            test.equal(removals.length, 0);
            keeper.tick();
            keeper.set(1, 2);
            keeper.getDiff(additions, removals);
            test.equal(additions.length, 0);
            test.deepEqual(removals, [1, 3, 2, 3]);
            keeper.tick();
            keeper.set(1, 2);
            keeper.set(1, 2);
            additions = [];
            removals = [];
            keeper.getDiff(additions, removals);
            test.equal(additions.length, 0, 'should handle duplicate entries');
            test.equal(removals.length, 0, 'should handle duplicate entries');
            keeper.set(3, 2);
            keeper.set(3, 1);
            additions = [];
            removals = [];
            keeper.getDiff(additions, removals);
            test.deepEqual(additions, [1, 3, 2, 3]);
            keeper.tick();
            keeper.set(4, 2);
            keeper.set(4, 1);
            additions = [];
            removals = [];
            keeper.getDiff(additions, removals);
            test.deepEqual(additions, [1, 4, 2, 4]);
            test.deepEqual(removals, [1, 2, 1, 3, 2, 3]);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Ray", function () {
        QUnit.test("construct", function (test) {
            var r = new CANNON.Ray(new CANNON.Vector3(), new CANNON.Vector3(1, 0, 0));
            test.ok(true);
        });
        QUnit.test("intersectBody", function (test) {
            var r = new CANNON.Ray(new CANNON.Vector3(5, 0, 0), new CANNON.Vector3(-5, 0, 0));
            r.skipBackfaces = true;
            var shape = createPolyhedron(0.5);
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(shape);
            var result = new CANNON.RaycastResult();
            r.intersectBody(body, result);
            test.ok(result.hasHit);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0.5, 0, 0)));
            // test rotating the body first
            result.reset();
            body.quaternion.fromAxisAngle(new CANNON.Vector3(1, 0, 0), Math.PI);
            r.intersectBody(body, result);
            test.ok(result.hasHit);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0.5, 0, 0)));
            // test shooting from other direction
            result.reset();
            r.to.set(0, 0, -5);
            r.from.set(0, 0, 5);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0, 0, 0.5)));
            // test miss
            result.reset();
            var r = new CANNON.Ray(new CANNON.Vector3(5, 1, 0), new CANNON.Vector3(-5, 1, 0));
            r.intersectBody(body, result);
            test.equal(result.hasHit, false);
            test.ok(true);
        });
        QUnit.test("intersectBodies", function (test) {
            var r = new CANNON.Ray(new CANNON.Vector3(5, 0, 0), new CANNON.Vector3(-5, 0, 0));
            r.skipBackfaces = true;
            var shape = createPolyhedron(0.5);
            var body1 = new CANNON.Body({ mass: 1 });
            body1.addShape(shape);
            var body2 = new CANNON.Body({ mass: 1 });
            body2.addShape(shape);
            body2.position.x = -2;
            var result = new CANNON.RaycastResult();
            r.intersectBodies([body1, body2], result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0.5, 0, 0)));
        });
        QUnit.test("box", function (test) {
            var r = new CANNON.Ray(new CANNON.Vector3(5, 0, 0), new CANNON.Vector3(-5, 0, 0));
            r.skipBackfaces = true;
            var shape = new CANNON.Box(new CANNON.Vector3(0.5, 0.5, 0.5));
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(shape);
            var result = new CANNON.RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0.5, 0, 0)));
            result.reset();
            body.quaternion.fromAxisAngle(new CANNON.Vector3(1, 0, 0), Math.PI / 2);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0.5, 0, 0)));
            result.reset();
            body.quaternion.fromAxisAngle(new CANNON.Vector3(1, 0, 0), Math.PI);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0.5, 0, 0)));
            result.reset();
            body.quaternion.fromAxisAngle(new CANNON.Vector3(1, 0, 0), 3 * Math.PI / 2);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0.5, 0, 0)));
        });
        QUnit.test("sphere", function (test) {
            var r = new CANNON.Ray(new CANNON.Vector3(5, 0, 0), new CANNON.Vector3(-5, 0, 0));
            r.skipBackfaces = true;
            var shape = new CANNON.Sphere(1);
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(shape);
            var result = new CANNON.RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(1, 0, 0)));
            result.reset();
            body.position.set(1, 0, 0);
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(2, 0, 0)));
            result.reset();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(2, 0, 0)));
            result.reset();
            var shape2 = new CANNON.Sphere(1);
            var body2 = new CANNON.Body({ mass: 1 });
            body2.addShape(shape2, new CANNON.Vector3(1, 0, 0));
            r.intersectBody(body2, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(2, 0, 0)));
        });
        QUnit.test("heightfield", function (test) {
            var r = new CANNON.Ray(new CANNON.Vector3(0, 0, 10), new CANNON.Vector3(0, 0, -10));
            r.skipBackfaces = true;
            var data = [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ];
            var shape = new CANNON.Heightfield(data, {
                elementSize: 1
            });
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(shape);
            // Hit
            var result = new CANNON.RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.deepEqual(result.hitPointWorld, new CANNON.Vector3(0, 0, 1));
            // Miss
            var result = new CANNON.RaycastResult();
            r.from.set(-100, -100, 10);
            r.to.set(-100, -100, -10);
            r.intersectBody(body, result);
            test.equal(result.hasHit, false);
            // Hit all triangles!
            var result = new CANNON.RaycastResult();
            for (var i = 0; i < data.length - 1; i++) { // 3x3 data points will have 2x2 rectangles in the field
                for (var j = 0; j < data[i].length - 1; j++) {
                    for (var k = 0; k < 2; k++) {
                        result.reset();
                        r.from.set(i + 0.25, j + 0.25, 10);
                        r.to.set(i + 0.25, j + 0.25, -10);
                        if (k) {
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
        QUnit.test("plane", function (test) {
            var r = new CANNON.Ray(new CANNON.Vector3(0, 0, 5), new CANNON.Vector3(0, 0, -5));
            r.skipBackfaces = true;
            var shape = new CANNON.Plane();
            var body = new CANNON.Body({ mass: 1 });
            body.addShape(shape);
            var result = new CANNON.RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0, 0, 0)));
            test.equal(result.distance, 5);
            result.reset();
            var body2 = new CANNON.Body({ mass: 1 });
            body2.addShape(shape, new CANNON.Vector3(0, 0, 1), new CANNON.Quaternion());
            r.intersectBody(body2, result);
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0, 0, 1)));
            result.reset();
            var body3 = new CANNON.Body({ mass: 1 });
            var quat = new CANNON.Quaternion();
            quat.fromAxisAngle(new CANNON.Vector3(1, 0, 0), Math.PI / 2);
            body3.addShape(shape, new CANNON.Vector3(), quat);
            r.intersectBody(body3, result);
            test.equal(result.hasHit, false);
            result.reset();
            var body4 = new CANNON.Body({ mass: 1 });
            body4.addShape(shape);
            var r = new CANNON.Ray(new CANNON.Vector3(1, 1, 5), new CANNON.Vector3(1, 1, -5));
            r.intersectBody(body4, result);
            test.equal(result.hasHit, true);
            test.deepEqual(result.hitPointWorld, new CANNON.Vector3(1, 1, 0));
            test.equal(result.distance, 5);
            var result = new CANNON.RaycastResult();
            r.from.set(0, 1, 1);
            r.to.set(0, -1, -1);
            body.position.set(0, 0, 0);
            r.intersectBody(body, result);
            var distance1 = result.distance;
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0, 0, 0)));
            var result = new CANNON.RaycastResult();
            r.from.set(0, 1 - 5, 1);
            r.to.set(0, -1 - 5, -1);
            body.position.set(0, 0, 0);
            r.intersectBody(body, result);
            var distance2 = result.distance;
            test.equal(result.hasHit, true);
            test.ok(result.hitPointWorld.equals(new CANNON.Vector3(0, -5, 0)));
            test.equal(distance1, distance2);
            test.ok(true);
        });
        QUnit.test("trimesh", function (test) {
            var r = new CANNON.Ray(new CANNON.Vector3(0.5, 0.5, 10), new CANNON.Vector3(0.5, 0.5, -10));
            r.skipBackfaces = true;
            var vertices = [
                0, 0, 0,
                1, 0, 0,
                0, 1, 0
            ];
            var indices = [
                0, 1, 2
            ];
            var body = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Trimesh(vertices, indices)
            });
            // Hit
            var result = new CANNON.RaycastResult();
            r.intersectBody(body, result);
            test.equal(result.hasHit, true);
            test.deepEqual(result.hitPointWorld, new CANNON.Vector3(0.5, 0.5, 0));
            // Miss
            result = new CANNON.RaycastResult();
            r.from.set(-100, -100, 10);
            r.to.set(-100, -100, -10);
            r.intersectBody(body, result);
            test.equal(result.hasHit, false);
        });
    });
    function createPolyhedron(size) {
        size = (size === undefined ? 0.5 : size);
        var box = new CANNON.Box(new CANNON.Vector3(size, size, size));
        box.updateConvexPolyhedronRepresentation();
        return box.convexPolyhedronRepresentation;
    }
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("RaycastVehicle", function () {
        QUnit.test("construct", function (test) {
            var vehicle = new CANNON.RaycastVehicle({
                chassisBody: new CANNON.Body()
            });
            test.ok(true);
        });
        QUnit.test("addWheel", function (test) {
            var vehicle = new CANNON.RaycastVehicle({
                chassisBody: new CANNON.Body()
            });
            vehicle.addWheel({});
            test.equal(vehicle.wheelInfos.length, 1);
        });
        QUnit.test("addWheel1", function (test) {
            var vehicle = new CANNON.RaycastVehicle({
                chassisBody: new CANNON.Body()
            });
            vehicle.addWheel({});
            test.equal(vehicle.wheelInfos.length, 1);
            vehicle.addWheel({});
            test.equal(vehicle.wheelInfos.length, 2);
        });
        QUnit.test("setSteeringValue", function (test) {
            var vehicle = createVehicle();
            vehicle.setSteeringValue(Math.PI / 4, 0);
            test.ok(true);
        });
        QUnit.test("applyEngineForce", function (test) {
            var vehicle = createVehicle();
            vehicle.applyEngineForce(1000, 0);
            test.ok(true);
        });
        QUnit.test("setBrake", function (test) {
            var vehicle = createVehicle();
            vehicle.applyEngineForce(1000, 0);
            test.ok(true);
        });
        QUnit.test("updateSuspension", function (test) {
            var vehicle = createVehicle();
            vehicle.updateSuspension(1 / 60);
            test.ok(true);
        });
        QUnit.test("updateFriction", function (test) {
            var vehicle = createVehicle();
            vehicle.updateFriction(1 / 60);
            test.ok(true);
        });
        QUnit.test("updateWheelTransform", function (test) {
            var vehicle = createVehicle();
            vehicle.updateWheelTransform(0);
            test.ok(true);
        });
        QUnit.test("updateVehicle", function (test) {
            var vehicle = createVehicle();
            vehicle.updateVehicle(1 / 60);
            test.ok(true);
        });
        QUnit.test("getVehicleAxisWorld", function (test) {
            var vehicle = createVehicle();
            var v = new CANNON.Vector3();
            vehicle.getVehicleAxisWorld(0, v);
            test.deepEqual(v, new CANNON.Vector3(1, 0, 0));
            vehicle.getVehicleAxisWorld(1, v);
            test.deepEqual(v, new CANNON.Vector3(0, 1, 0));
            vehicle.getVehicleAxisWorld(2, v);
            test.deepEqual(v, new CANNON.Vector3(0, 0, 1));
            test.ok(true);
        });
        QUnit.test("removeFromWorld", function (test) {
            var world = new CANNON.World();
            var vehicle = new CANNON.RaycastVehicle({
                chassisBody: new CANNON.Body({ mass: 1 })
            });
            vehicle.addToWorld(world);
            test.ok(world.bodies.indexOf(vehicle.chassisBody) !== -1);
            test.ok(world.has('preStep'));
            vehicle.removeFromWorld(world);
            test.ok(world.bodies.indexOf(vehicle.chassisBody) === -1);
            test.ok(!world.has('preStep'));
        });
    });
    function createVehicle() {
        var vehicle = new CANNON.RaycastVehicle({
            chassisBody: new CANNON.Body({
                mass: 1
            })
        });
        var down = new CANNON.Vector3(0, 0, -1);
        var info = {
            chassisConnectionPointLocal: new CANNON.Vector3(-5, -1 / 2, 0),
            axleLocal: new CANNON.Vector3(0, -1, 0),
            directionLocal: down,
            suspensionStiffness: 1000,
            suspensionRestLength: 2,
        };
        vehicle.addWheel(info);
        var world = new CANNON.World();
        var planeBody = new CANNON.Body();
        planeBody.position.z = -1;
        planeBody.addShape(new CANNON.Plane());
        world.addBody(planeBody);
        vehicle.addToWorld(world);
        return vehicle;
    }
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Sphere", function () {
        QUnit.test("throwOnWrongRadius", function (test) {
            // These should be all right
            new CANNON.Sphere(1);
            new CANNON.Sphere(0);
            test.throws(function () {
                new CANNON.Sphere(-1);
            }, Error, 'Should throw on negative radius');
            test.ok(true);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("Trimesh", function () {
        QUnit.test("updateNormals", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            mesh.normals[0] = 1;
            mesh.updateNormals();
            test.ok(mesh.normals[0] !== 1);
        });
        QUnit.test("updateAABB", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            mesh.aabb.min.set(1, 2, 3);
            mesh.updateAABB();
            test.ok(mesh.aabb.min.y !== 2);
        });
        QUnit.test("updateTree scaled", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            mesh.updateTree();
            var bigMesh = CANNON.Trimesh.createTorus();
            bigMesh.setScale(new CANNON.Vector3(2, 2, 2));
            test.equal(bigMesh.aabb.max.x, mesh.aabb.max.x * 2, 'AABB does not scale with the mesh!');
            test.equal(bigMesh.tree.aabb.max.x, mesh.tree.aabb.max.x, 'Octree AABB scales with the mesh, which is wrong!');
        });
        QUnit.test("getTrianglesInAABB unscaled", function (test) {
            var mesh = CANNON.Trimesh.createTorus(1, 1, 32, 32);
            var result = [];
            // Should get all triangles if we use the full AABB
            var aabb = mesh.aabb.clone();
            mesh.getTrianglesInAABB(aabb, result);
            test.equal(result.length, mesh.indices.length / 3);
            // Should get less triangles if we use the half AABB
            result.length = 0;
            aabb.min.scaleNumberTo(0.1, aabb.max);
            aabb.max.scaleNumberTo(0.1, aabb.max);
            mesh.getTrianglesInAABB(aabb, result);
            console.log(result.length, mesh.indices.length / 3);
            test.ok(result.length < mesh.indices.length / 3);
        });
        // scaled: function(test){
        //     var mesh = Trimesh.createTorus(1,1,16,16);
        //     var result = [];
        //     // Should get all triangles if we use the full AABB
        //     var aabb = mesh.aabb.clone();
        //     mesh.getTrianglesInAABB(aabb, result);
        //     test.equal(result.length, mesh.indices.length / 3);
        //     // Should get less triangles if we use the half AABB
        //     result.length = 0;
        //     aabb.min.scaleNumberTo(0.5, aabb.lowerBound);
        //     aabb.max.scaleNumberTo(0.5, aabb.upperBound);
        //     mesh.getTrianglesInAABB(aabb, result);
        //     test.ok(result.length < mesh.indices.length / 3);
        //     test.done();
        // }
        QUnit.test("getVertex unscaled", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            var vertex = new CANNON.Vector3();
            mesh.getVertex(0, vertex);
            test.deepEqual(vertex, new CANNON.Vector3(mesh.vertices[0], mesh.vertices[1], mesh.vertices[2]));
        });
        QUnit.test("getVertex scaled", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            mesh.setScale(new CANNON.Vector3(1, 2, 3));
            var vertex = new CANNON.Vector3();
            mesh.getVertex(0, vertex);
            test.deepEqual(vertex, new CANNON.Vector3(1 * mesh.vertices[0], 2 * mesh.vertices[1], 3 * mesh.vertices[2]));
        });
        QUnit.test("getWorldVertex", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            var vertex = new CANNON.Vector3();
            mesh.getWorldVertex(0, new CANNON.Vector3(), new CANNON.Quaternion(), vertex);
            test.deepEqual(vertex, new CANNON.Vector3(mesh.vertices[0], mesh.vertices[1], mesh.vertices[2]));
        });
        QUnit.test("getTriangleVertices", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            var va = new CANNON.Vector3();
            var vb = new CANNON.Vector3();
            var vc = new CANNON.Vector3();
            var va1 = new CANNON.Vector3();
            var vb1 = new CANNON.Vector3();
            var vc1 = new CANNON.Vector3();
            mesh.getVertex(mesh.indices[0], va);
            mesh.getVertex(mesh.indices[1], vb);
            mesh.getVertex(mesh.indices[2], vc);
            mesh.getTriangleVertices(0, va1, vb1, vc1);
            test.deepEqual(va, va1);
            test.deepEqual(vb, vb1);
            test.deepEqual(vc, vc1);
        });
        QUnit.test("getNormal", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            var normal = new CANNON.Vector3();
            mesh.getNormal(0, normal);
            test.deepEqual(new CANNON.Vector3(mesh.normals[0], mesh.normals[1], mesh.normals[2]), normal);
        });
        QUnit.test("calculateLocalInertia", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            var inertia = new CANNON.Vector3();
            mesh.calculateLocalInertia(1, inertia);
            test.ok(true);
        });
        QUnit.test("computeLocalAABB", function (test) {
            console.log('Trimesh::computeLocalAABB is todo');
            test.ok(true);
        });
        QUnit.test("updateBoundingSphereRadius", function (test) {
            console.log('Trimesh::updateBoundingSphereRadius is todo');
            test.ok(true);
        });
        QUnit.test("calculateWorldAABB", function (test) {
            var poly = CANNON.Trimesh.createTorus();
            var min = new CANNON.Vector3();
            var max = new CANNON.Vector3();
            poly.calculateWorldAABB(new CANNON.Vector3(1, 0, 0), // Translate 2 x in world
            new CANNON.Quaternion(0, 0, 0, 1), min, max);
            test.ok(!isNaN(min.x));
            test.ok(!isNaN(max.x));
        });
        QUnit.test("volume", function (test) {
            var mesh = CANNON.Trimesh.createTorus();
            test.ok(mesh.volume() > 0);
        });
        QUnit.test("narrowphaseAgainstPlane", function (test) {
            var world = new CANNON.World();
            var torusShape = CANNON.Trimesh.createTorus();
            var torusBody = new CANNON.Body({
                mass: 1
            });
            torusBody.addShape(torusShape);
            var planeBody = new CANNON.Body({
                mass: 1
            });
            planeBody.addShape(new CANNON.Plane());
            world.addBody(torusBody);
            world.addBody(planeBody);
            world.step(1 / 60);
            test.ok(true);
        });
    });
})(CANNON || (CANNON = {}));
var CANNON;
(function (CANNON) {
    QUnit.module("World", function () {
        QUnit.test("clearForces", function (test) {
            var world = new CANNON.World();
            var body = new CANNON.Body();
            world.addBody(body);
            body.force.set(1, 2, 3);
            body.torque.set(4, 5, 6);
            world.clearForces();
            test.ok(body.force.equals(new CANNON.Vector3(0, 0, 0)));
            test.ok(body.torque.equals(new CANNON.Vector3(0, 0, 0)));
        });
        QUnit.test("rayTestBox", function (test) {
            var world = new CANNON.World();
            var body = new CANNON.Body();
            body.addShape(new CANNON.Box(new CANNON.Vector3(1, 1, 1)));
            world.addBody(body);
            var from = new CANNON.Vector3(-10, 0, 0);
            var to = new CANNON.Vector3(10, 0, 0);
            var result = new CANNON.RaycastResult();
            world.raycastClosest(from, to, {}, result);
            test.equal(result.hasHit, true);
        });
        QUnit.test("rayTestSphere", function (test) {
            var world = new CANNON.World();
            var body = new CANNON.Body();
            body.addShape(new CANNON.Sphere(1));
            world.addBody(body);
            var from = new CANNON.Vector3(-10, 0, 0);
            var to = new CANNON.Vector3(10, 0, 0);
            var result = new CANNON.RaycastResult();
            world.raycastClosest(from, to, {}, result);
            test.equal(result.hasHit, true);
        });
        QUnit.test("raycastClosest single", function (test) {
            var world = new CANNON.World();
            var body = new CANNON.Body({
                shape: new CANNON.Sphere(1)
            });
            world.addBody(body);
            var from = new CANNON.Vector3(-10, 0, 0);
            var to = new CANNON.Vector3(10, 0, 0);
            var result = new CANNON.RaycastResult();
            world.raycastClosest(from, to, {}, result);
            test.equal(result.hasHit, true);
            test.equal(result.body, body);
            test.equal(result.shape, body.shapes[0]);
        });
        QUnit.test("raycastClosest order", function (test) {
            var world = new CANNON.World();
            var bodyA = new CANNON.Body({ shape: new CANNON.Sphere(1), position: new CANNON.Vector3(-1, 0, 0) });
            var bodyB = new CANNON.Body({ shape: new CANNON.Sphere(1), position: new CANNON.Vector3(1, 0, 0) });
            world.addBody(bodyA);
            world.addBody(bodyB);
            var from = new CANNON.Vector3(-10, 0, 0);
            var to = new CANNON.Vector3(10, 0, 0);
            var result = new CANNON.RaycastResult();
            world.raycastClosest(from, to, {}, result);
            test.equal(result.hasHit, true);
            test.equal(result.body, bodyA);
            test.equal(result.shape, bodyA.shapes[0]);
            from.set(10, 0, 0);
            to.set(-10, 0, 0);
            result = new CANNON.RaycastResult();
            world.raycastClosest(from, to, {}, result);
            test.equal(result.hasHit, true);
            test.equal(result.body, bodyB);
            test.equal(result.shape, bodyB.shapes[0]);
        });
        QUnit.test("raycastAll simple", function (test) {
            var world = new CANNON.World();
            var body = new CANNON.Body({ shape: new CANNON.Sphere(1) });
            world.addBody(body);
            var from = new CANNON.Vector3(-10, 0, 0);
            var to = new CANNON.Vector3(10, 0, 0);
            var hasHit;
            var numResults = 0;
            var resultBody;
            var resultShape;
            var returnVal = world.raycastAll(from, to, {}, function (result) {
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
        QUnit.test("raycastAll twoSpheres", function (test) {
            var world = new CANNON.World();
            var body = new CANNON.Body({ shape: new CANNON.Sphere(1) });
            world.addBody(body);
            var body2 = new CANNON.Body({ shape: new CANNON.Sphere(1) });
            world.addBody(body2);
            var from = new CANNON.Vector3(-10, 0, 0);
            var to = new CANNON.Vector3(10, 0, 0);
            var hasHit = false;
            var numResults = 0;
            var resultBody;
            var resultShape;
            world.raycastAll(from, to, {}, function (result) {
                hasHit = result.hasHit;
                resultShape = result.shape;
                resultBody = result.body;
                numResults++;
            });
            test.equal(hasHit, true);
            test.equal(numResults, 4);
        });
        QUnit.test("raycastAll skipBackFaces", function (test) {
            var world = new CANNON.World();
            var body = new CANNON.Body({ shape: new CANNON.Sphere(1) });
            world.addBody(body);
            var hasHit = false;
            var numResults = 0;
            var resultBody;
            var resultShape;
            world.raycastAll(new CANNON.Vector3(-10, 0, 0), new CANNON.Vector3(10, 0, 0), { skipBackfaces: true }, function (result) {
                hasHit = result.hasHit;
                resultShape = result.shape;
                resultBody = result.body;
                numResults++;
            });
            test.equal(hasHit, true);
            test.equal(numResults, 1);
        });
        QUnit.test("raycastAll collisionFilters", function (test) {
            var world = new CANNON.World();
            var body = new CANNON.Body({
                shape: new CANNON.Sphere(1)
            });
            world.addBody(body);
            body.collisionFilterGroup = 2;
            body.collisionFilterMask = 2;
            var numResults = 0;
            world.raycastAll(new CANNON.Vector3(-10, 0, 0), new CANNON.Vector3(10, 0, 0), {
                collisionFilterGroup: 2,
                collisionFilterMask: 2
            }, function (result) {
                numResults++;
            });
            test.equal(numResults, 2);
            numResults = 0;
            world.raycastAll(new CANNON.Vector3(-10, 0, 0), new CANNON.Vector3(10, 0, 0), {
                collisionFilterGroup: 1,
                collisionFilterMask: 1
            }, function (result) {
                numResults++;
            });
            test.equal(numResults, 0, 'should use collision groups!');
        });
        QUnit.test("raycastAny", function (test) {
            var world = new CANNON.World();
            world.addBody(new CANNON.Body({ shape: new CANNON.Sphere(1) }));
            var from = new CANNON.Vector3(-10, 0, 0);
            var to = new CANNON.Vector3(10, 0, 0);
            var result = new CANNON.RaycastResult();
            world.raycastAny(from, to, {}, result);
            test.ok(result.hasHit);
        });
    });
})(CANNON || (CANNON = {}));
//# sourceMappingURL=tests.js.map