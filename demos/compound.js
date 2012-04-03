var demo = new CANNON.Demo();

demo.addScene(function(app){
    var world = setupWorld(app);

    // Compound shape
    var compoundShape = new CANNON.Compound();
    var s = 1.5;
    var shape = new CANNON.Box(new CANNON.Vec3(0.5*s,0.5*s,0.5*s));
    compoundShape.addChild(shape,new CANNON.Vec3( s, 0,-s));
    compoundShape.addChild(shape,new CANNON.Vec3( s, 0, s));
    compoundShape.addChild(shape,new CANNON.Vec3(-s, 0,-s));
    compoundShape.addChild(shape,new CANNON.Vec3(-s, 0, s));

    compoundShape.addChild(shape,new CANNON.Vec3(-s, 0, 0));
    compoundShape.addChild(shape,new CANNON.Vec3( 0, 0,-s));
    compoundShape.addChild(shape,new CANNON.Vec3( 0, 0, s));

    var mass = 10;
    var body = new CANNON.RigidBody(mass,compoundShape);
    body.setPosition(0,0,6);
    body.setOrientation(0,1,0,0.1);
    world.add(body);
    app.addVisual(body);

  });

demo.addScene(function(app){
    var world = setupWorld(app);

    // Compound shape
    var compoundShape = new CANNON.Compound();
    var sphereShape = new CANNON.Sphere(1);
    compoundShape.addChild(sphereShape,new CANNON.Vec3( 1, 0,-1));
    compoundShape.addChild(sphereShape,new CANNON.Vec3( 1, 0, 1));
    compoundShape.addChild(sphereShape,new CANNON.Vec3(-1, 0,-1));
    compoundShape.addChild(sphereShape,new CANNON.Vec3(-1, 0, 1));

    var mass = 10;
    var body = new CANNON.RigidBody(mass,compoundShape);
    body.setPosition(0,0,6);
    body.setOrientation(0,1,0,0.1);
    world.add(body);
    app.addVisual(body);

  });

function setupWorld(app){
  // Create world
  var world = new CANNON.World();
  app.setWorld(world);
  world.gravity(new CANNON.Vec3(0,0,-40));
  var bp = new CANNON.NaiveBroadphase();
  world.broadphase(bp);
  world.iterations(10);

  // ground plane
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
  var groundBody = new CANNON.RigidBody(0,groundShape);
  world.add(groundBody);
  app.addVisual(groundBody);

  return world;
};

demo.start();