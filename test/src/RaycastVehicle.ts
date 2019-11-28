namespace CANNON
{
    QUnit.module("RaycastVehicle", () =>
    {

        QUnit.test("construct", (test) =>
        {
            var vehicle = new RaycastVehicle({
                chassisBody: new Body()
            });
            test.ok(true);
        });

        QUnit.test("addWheel", (test) =>
        {
            var vehicle = new RaycastVehicle({
                chassisBody: new Body()
            });
            vehicle.addWheel({});
            test.equal(vehicle.wheelInfos.length, 1);
        });

        QUnit.test("addWheel1", (test) =>
        {
            var vehicle = new RaycastVehicle({
                chassisBody: new Body()
            });
            vehicle.addWheel({});
            test.equal(vehicle.wheelInfos.length, 1);
            vehicle.addWheel({});
            test.equal(vehicle.wheelInfos.length, 2);
        });

        QUnit.test("setSteeringValue", (test) =>
        {
            var vehicle = createVehicle();
            vehicle.setSteeringValue(Math.PI / 4, 0);
            test.ok(true);
        });

        QUnit.test("applyEngineForce", (test) =>
        {
            var vehicle = createVehicle();
            vehicle.applyEngineForce(1000, 0);
            test.ok(true);
        });

        QUnit.test("setBrake", (test) =>
        {
            var vehicle = createVehicle();
            vehicle.applyEngineForce(1000, 0);
            test.ok(true);
        });

        QUnit.test("updateSuspension", (test) =>
        {
            var vehicle = createVehicle();
            vehicle.updateSuspension(1 / 60);
            test.ok(true);
        });

        QUnit.test("updateFriction", (test) =>
        {
            var vehicle = createVehicle();
            vehicle.updateFriction(1 / 60);
            test.ok(true);
        });

        QUnit.test("updateWheelTransform", (test) =>
        {
            var vehicle = createVehicle();
            vehicle.updateWheelTransform(0);
            test.ok(true);
        });

        QUnit.test("updateVehicle", (test) =>
        {
            var vehicle = createVehicle();
            vehicle.updateVehicle(1 / 60);
            test.ok(true);
        });

        QUnit.test("getVehicleAxisWorld", (test) =>
        {
            var vehicle = createVehicle();
            var v = new Vector3();

            vehicle.getVehicleAxisWorld(0, v);
            test.deepEqual(v, new Vector3(1, 0, 0));

            vehicle.getVehicleAxisWorld(1, v);
            test.deepEqual(v, new Vector3(0, 1, 0));

            vehicle.getVehicleAxisWorld(2, v);
            test.deepEqual(v, new Vector3(0, 0, 1));

            test.ok(true);
        });

        QUnit.test("removeFromWorld", (test) =>
        {
            var world = new World();
            var vehicle = new RaycastVehicle({
                chassisBody: new Body({ mass: 1 })
            });

            vehicle.addToWorld(world);
            test.ok(world.bodies.indexOf(vehicle.chassisBody) !== -1);
            test.ok(world.hasEventListener('preStep', vehicle.preStepCallback));

            vehicle.removeFromWorld(world);
            test.ok(world.bodies.indexOf(vehicle.chassisBody) === -1);
            test.ok(!world.hasEventListener('preStep', vehicle.preStepCallback));

        });
    });

    function createVehicle()
    {
        var vehicle = new RaycastVehicle({
            chassisBody: new Body({
                mass: 1
            })
        });
        var down = new Vector3(0, 0, -1);
        var info = {
            chassisConnectionPointLocal: new Vector3(-5, -1 / 2, 0),
            axleLocal: new Vector3(0, -1, 0),
            directionLocal: down,
            suspensionStiffness: 1000,
            suspensionRestLength: 2,
        };
        vehicle.addWheel(info);

        var world = new World();
        var planeBody = new Body();
        planeBody.position.z = -1;
        planeBody.addShape(new Plane());
        world.addBody(planeBody);

        vehicle.addToWorld(world);

        return vehicle;
    }
}