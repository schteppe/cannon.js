/**
 * For debugging different kinds of stacks
 */
var demo = new CANNON.Demo();
var size = 2;

// Spheres
demo.addScene(function(app){
    var world = setupWorld(app);

    // Sphere 1
    var sphereShape = new CANNON.Sphere(size);
    var b1 = new CANNON.RigidBody(5,sphereShape);
    b1.setPosition(0,0,3*size);
    world.add(b1);
    app.addVisual(b1);

    // Sphere 2
    var b2 = new CANNON.RigidBody(5,sphereShape);
    b2.setPosition(0,0,1*size);
    world.add(b2);
    app.addVisual(b2);
  });

// Sphere / box side
demo.addScene(function(app){
    var world = setupWorld(app);

    var boxShape = new CANNON.Box(new CANNON.Vec3(size,size,size));
    var sphereShape = new CANNON.Sphere(size);

    // Box
    var b1 = new CANNON.RigidBody(5,boxShape);
    b1.setPosition(0,0,1*size);
    world.add(b1);
    app.addVisual(b1);

    // Sphere
    var b2 = new CANNON.RigidBody(5,sphereShape);
    b2.setPosition(0,0,3*size);
    world.add(b2);
    app.addVisual(b2);
  });

demo.start();

function setupWorld(app){
  // Create world
  var world = new CANNON.World();
  app.setWorld(world);
  world.gravity(new CANNON.Vec3(0,0,-50));
  var bp = new CANNON.NaiveBroadphase();
  world.broadphase(bp);
  world.iterations(2);

  // ground plane
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
  var groundBody = new CANNON.RigidBody(0,groundShape);
  world.add(groundBody);
  app.addVisual(groundBody);

  return world;
}