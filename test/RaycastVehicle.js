var Vec3 = require("../src/math/Vec3");
var Quaternion = require("../src/math/Quaternion");
var Box = require('../src/shapes/Box');
var Plane = require('../src/shapes/Plane');
var Body = require('../src/objects/Body');
var RaycastVehicle = require('../src/objects/RaycastVehicle');
var World = require('../src/world/World');

module.exports = {

    construct: function(test) {
        var vehicle = new RaycastVehicle({
            chassisBody: new Body()
        });
        test.done();
    },

    addWheel: function(test) {
        var vehicle = new RaycastVehicle({
            chassisBody: new Body()
        });
        vehicle.addWheel({});
        test.equal(vehicle.wheelInfos.length, 1);
        test.done();
    },

    addWheel: function(test) {
        var vehicle = new RaycastVehicle({
            chassisBody: new Body()
        });
        vehicle.addWheel({});
        test.equal(vehicle.wheelInfos.length, 1);
        vehicle.addWheel({});
        test.equal(vehicle.wheelInfos.length, 2);
        test.done();
    },

    setSteeringValue: function(test){
        var vehicle = createVehicle();
        vehicle.setSteeringValue(Math.PI / 4, 0);
        test.done();
    },

    applyEngineForce: function(test){
        var vehicle = createVehicle();
        vehicle.applyEngineForce(1000, 0);
        test.done();
    },

    setBrake: function(test){
        var vehicle = createVehicle();
        vehicle.applyEngineForce(1000, 0);
        test.done();
    },

    updateSuspension: function(test){
        var vehicle = createVehicle();
        vehicle.updateSuspension(1 / 60);
        test.done();
    },

    updateFriction: function(test){
        var vehicle = createVehicle();
        vehicle.updateFriction(1 / 60);
        test.done();
    },

    updateWheelTransform: function(test){
        var vehicle = createVehicle();
        vehicle.updateWheelTransform(0);
        test.done();
    },

    updateVehicle: function(test){
        var vehicle = createVehicle();
        vehicle.updateVehicle(1 / 60);
        test.done();
    },

    getVehicleAxisWorld: function(test){
        var vehicle = createVehicle();
        var v = new Vec3();

        vehicle.getVehicleAxisWorld(0, v);
        test.deepEqual(v, new Vec3(1, 0, 0));

        vehicle.getVehicleAxisWorld(1, v);
        test.deepEqual(v, new Vec3(0, 1, 0));

        vehicle.getVehicleAxisWorld(2, v);
        test.deepEqual(v, new Vec3(0, 0, 1));

        test.done();
    },

    removeFromWorld: function(test){
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

        test.done();
    }
};


function createVehicle(){
    var vehicle = new RaycastVehicle({
        chassisBody: new Body({
            mass: 1
        })
    });
    var down = new Vec3(0, 0, -1);
    var info = {
        chassisConnectionPointLocal: new Vec3(-5, -1 / 2, 0),
        axleLocal: new Vec3(0, -1, 0),
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