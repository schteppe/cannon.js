/// <reference path="../libs/feng3d.d.ts" />
window.onload = function ()
{
    // var engine = new feng3d.Engine();
    // var cube = feng3d.gameObjectFactory.createCube();
    // cube.transform.z = 4;
    // cube.transform.y = -1;
    // engine.scene.gameObject.addChild(cube);

    // feng3d.ticker.onframe(() =>
    // {
    //     cube.transform.ry++;
    // });
    // return;



    var engine = new feng3d.Engine();
    var camera = engine.camera;
    var scene = engine.scene;

    var sphereShape, sphereBody, world, physicsMaterial, walls = [], balls = [], ballMeshes = [], boxes = [], boxMeshes = [];

    var geometry, material, mesh;

    initCannon();
    init();
    animate();

    function initCannon()
    {
        // Setup our world
        world = new CANNON.World();
        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;

        var solver = new CANNON.GSSolver();

        world.defaultContactMaterial.contactEquationStiffness = 1e9;
        world.defaultContactMaterial.contactEquationRelaxation = 4;

        solver.iterations = 7;
        solver.tolerance = 0.1;
        var split = true;
        if (split)
            world.solver = new CANNON.SplitSolver(solver);
        else
            world.solver = solver;

        world.gravity.set(0, -20, 0);
        world.broadphase = new CANNON.NaiveBroadphase();

        // Create a slippery material (friction coefficient = 0.0)
        physicsMaterial = new CANNON.Material("slipperyMaterial");
        var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
            physicsMaterial,
            0.0, // friction coefficient
            0.3  // restitution
        );
        // We must add the contact materials to the world
        world.addContactMaterial(physicsContactMaterial);

        // Create a sphere
        var mass = 5, radius = 1.3;
        sphereShape = new CANNON.Sphere(radius);
        sphereBody = new CANNON.Body({ mass: mass });
        sphereBody.addShape(sphereShape);
        sphereBody.position.set(0, 5, 0);
        sphereBody.linearDamping = 0.9;
        world.addBody(sphereBody);

        // Create a plane
        var groundShape = new CANNON.Plane();
        var groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        world.addBody(groundBody);
    }

    function init()
    {

        camera.lens = new feng3d.PerspectiveLens(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // scene.fog = new THREE.Fog(0x000000, 0, 500);
        scene.ambientColor.fromUnit(0x111111);

        var lightobj = new feng3d.GameObject();
        var light = lightobj.addComponent(feng3d.SpotLight);
        light.color = feng3d.Color3.fromUnit(0xffffff);
        lightobj.transform.lookAt(new feng3d.Vector3(10, 30, 20).negate());
        scene.gameObject.addChild(lightobj);

        camera.gameObject.addComponent(feng3d.FPSController);
        scene.gameObject.addChild(camera.gameObject);


        // floor
        geometry = new feng3d.PlaneGeometry();
        geometry.width = 300;
        geometry.height = 300;
        geometry.segmentsW = 50;
        geometry.segmentsH = 50;
        geometry.applyTransformation(feng3d.Matrix4x4.fromAxisRotate(feng3d.Vector3.X_AXIS, - Math.PI / 2));

        material = new feng3d.Material();
        material.uniforms.u_diffuse = feng3d.Color4.fromUnit24(0xdddddd);

        mesh = new feng3d.GameObject();
        var meshModel = mesh.addComponent(feng3d.MeshModel);
        meshModel.geometry = geometry;
        meshModel.material = material;
        scene.gameObject.addChild(mesh);

        // Add boxes
        var halfExtents = new CANNON.Vec3(1, 1, 1);
        var boxShape = new CANNON.Box(halfExtents);
        var boxGeometry = new feng3d.CubeGeometry();
        boxGeometry.width = halfExtents.x * 2;
        boxGeometry.height = halfExtents.y * 2;
        boxGeometry.depth = halfExtents.z * 2;

        for (var i = 0; i < 7; i++)
        {
            var x = (Math.random() - 0.5) * 20;
            var y = 1 + (Math.random() - 0.5) * 1;
            var z = (Math.random() - 0.5) * 20;
            var boxBody = new CANNON.Body({ mass: 5 });
            boxBody.addShape(boxShape);
            var boxMesh = new feng3d.GameObject();
            var boxMeshModel = boxMesh.addComponent(feng3d.MeshModel);
            boxMeshModel.gameObject = boxGeometry;
            boxMeshModel.material = material;
            scene.gameObject.addChild(boxMesh);
            world.addBody(boxBody);

            boxBody.position.set(x, y, z);
            boxMesh.transform.x = x;
            boxMesh.transform.y = y;
            boxMesh.transform.z = z;

            boxes.push(boxBody);
            boxMeshes.push(boxMesh);
        }


        // Add linked boxes
        var size = 0.5;
        var he = new CANNON.Vec3(size, size, size * 0.1);
        var boxShape = new CANNON.Box(he);
        var mass = 0;
        var space = 0.1 * size;
        var N = 5, last;
        var boxGeometry = new feng3d.CubeGeometry();
        boxGeometry.width = he.x * 2;
        boxGeometry.height = he.y * 2;
        boxGeometry.depth = he.z * 2;

        for (var i = 0; i < N; i++)
        {
            var boxbody = new CANNON.Body({ mass: mass });
            boxbody.addShape(boxShape);

            var boxMesh = new feng3d.GameObject();
            var boxMeshModel = boxMesh.addComponent(feng3d.MeshModel);
            boxMeshModel.geometry = boxGeometry;
            boxMeshModel.material = material;

            boxbody.position.set(5, (N - i) * (size * 2 + 2 * space) + size * 2 + space, 0);
            boxbody.linearDamping = 0.01;
            boxbody.angularDamping = 0.01;
            world.addBody(boxbody);
            scene.gameObject.addChild(boxMesh);
            boxes.push(boxbody);
            boxMeshes.push(boxMesh);

            if (i != 0)
            {
                // Connect this body to the last one
                var c1 = new CANNON.PointToPointConstraint(boxbody, new CANNON.Vec3(-size, size + space, 0), last, new CANNON.Vec3(-size, -size - space, 0));
                var c2 = new CANNON.PointToPointConstraint(boxbody, new CANNON.Vec3(size, size + space, 0), last, new CANNON.Vec3(size, -size - space, 0));
                world.addConstraint(c1);
                world.addConstraint(c2);
            } else
            {
                mass = 0.3;
            }
            last = boxbody;
        }
    }

    function animate()
    {
        return;
        requestAnimationFrame(animate);
        world.step(1 / 60);

        // Update ball positions
        for (var i = 0; i < balls.length; i++)
        {
            ballMeshes[i].position.copy(balls[i].position);
            ballMeshes[i].quaternion.copy(balls[i].quaternion);
        }

        // Update box positions
        for (var i = 0; i < boxes.length; i++)
        {
            boxMeshes[i].transform.position.x = boxes[i].position.x;
            boxMeshes[i].transform.position.y = boxes[i].position.y;
            boxMeshes[i].transform.position.z = boxes[i].position.z;
            boxMeshes[i].transform.orientation = new feng3d.Quaternion(boxes[i].quaternion.x, boxes[i].quaternion.y, boxes[i].quaternion.z, boxes[i].quaternion.w);
        }

    }

    var ballShape = new CANNON.Sphere(0.2);
    var ballGeometry = new feng3d.SphereGeometry();
    ballGeometry.radius = ballShape.radius;
    ballGeometry.segmentsW = 32;
    ballGeometry.segmentsH = 32;

    var shootDirection = new feng3d.Vector3();
    var shootVelo = 15;

    window.addEventListener("click", function (e)
    {
        return;
        var x = sphereBody.position.x;
        var y = sphereBody.position.y;
        var z = sphereBody.position.z;
        var ballBody = new CANNON.Body({ mass: 1 });
        ballBody.addShape(ballShape);

        var ballMesh = new feng3d.GameObject();
        var ballMeshModel = ballMesh.addComponent(feng3d.MeshModel);
        ballMeshModel.geometry = ballGeometry;
        ballMeshModel.material = material;

        world.addBody(ballBody);
        scene.gameObject.addChild(ballMesh);
        balls.push(ballBody);
        ballMeshes.push(ballMesh);

        shootDirection = engine.getMouseRay3D().direction;

        ballBody.velocity.set(shootDirection.x * shootVelo,
            shootDirection.y * shootVelo,
            shootDirection.z * shootVelo);

        // Move the ball outside the player sphere
        x += shootDirection.x * (sphereShape.radius * 1.02 + ballShape.radius);
        y += shootDirection.y * (sphereShape.radius * 1.02 + ballShape.radius);
        z += shootDirection.z * (sphereShape.radius * 1.02 + ballShape.radius);
        ballBody.position.set(x, y, z);
        ballMesh.transform.x = x;
        ballMesh.transform.y = y;
        ballMesh.transform.z = z;
    });

}