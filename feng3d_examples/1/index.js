/// <reference path="../../libs/feng3d.d.ts" />

window.onload = function ()
{

    var engine = new feng3d.Engine();

    // init
    engine.camera.gameObject.transform.x = 10;
    engine.camera.gameObject.transform.y = 10;
    engine.camera.gameObject.transform.z = 10;

    engine.camera.gameObject.transform.lookAt(new feng3d.Vector3());
    engine.camera.gameObject.addComponent(feng3d.FPSController);

    var light = new feng3d.GameObject();
    var directionalLight = light.addComponent(feng3d.DirectionalLight);
    directionalLight.color = new feng3d.Color3(1);
    light.transform.rx = 30;
    engine.scene.gameObject.addChild(light);

    var plane = feng3d.gameObjectFactory.createPlane();
    engine.scene.gameObject.addChild(plane);

    var sphere = new feng3d.GameObject();
    var geometry = new feng3d.SphereGeometry();
    geometry.radius = 1;
    var meshModel = sphere.addComponent(feng3d.MeshModel);
    meshModel.geometry = geometry;
    engine.scene.gameObject.addChild(sphere);

    // Setup our world
    var world = new CANNON.World();
    world.gravity.set(0, 0, -9.82); // m/s²

    // Create a sphere
    var radius = 1; // m
    var sphereBody = new CANNON.Body({
        mass: 5, // kg
        position: new CANNON.Vec3(0, 0, 10), // m
        shape: new CANNON.Sphere(radius)
    });
    world.addBody(sphereBody);

    // Create a plane
    var groundBody = new CANNON.Body({
        mass: 0 // mass == 0 makes the body static
    });
    var groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    var fixedTimeStep = 1.0 / 60.0; // seconds
    var maxSubSteps = 3;

    // Start the simulation loop
    var lastTime;
    (function simloop(time)
    {
        requestAnimationFrame(simloop);
        if (lastTime !== undefined)
        {
            var dt = (time - lastTime) / 1000;
            world.step(fixedTimeStep, dt, maxSubSteps);
        }
        console.log("Sphere z position: " + sphereBody.position.z);

        sphere.transform.y = sphereBody.position.z;

        lastTime = time;
    })();

};