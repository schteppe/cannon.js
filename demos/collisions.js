/**
 * For debugging different kinds of pair collisions
 */
var demo = new CANNON.Demo();

// Sphere / sphere
demo.addScene(function(app){
    var world = setupWorld(app);

    // Sphere 1
    var sphereShape = new CANNON.Sphere(1);
    var b1 = new CANNON.RigidBody(5,sphereShape);
    b1.position.set(5,0,0);
    b1.velocity.set(-5,0,0);
    world.add(b1);
    app.addVisual(b1);

    // Sphere 2
    var b2 = new CANNON.RigidBody(5,sphereShape);
    b2.position.set(-5,0,0);
    b2.velocity.set(5,0,0);
    world.add(b2);
    app.addVisual(b2);
  });

// Sphere / box side
demo.addScene(function(app){
    var world = setupWorld(app);

    var boxShape = new CANNON.Box(new CANNON.Vec3(1,1,1));
    var sphereShape = new CANNON.Sphere(1);

    // Box
    var b1 = new CANNON.RigidBody(5,boxShape);
    b1.position.set(5,0,0);
    b1.velocity.set(-5,0,0);
    world.add(b1);
    app.addVisual(b1);

    // Sphere
    var b2 = new CANNON.RigidBody(5,sphereShape);
    b2.position.set(-5,0,0);
    b2.velocity.set(5,0,0);
    world.add(b2);
    app.addVisual(b2);
  });

// Sphere / box edge
demo.addScene(function(app){
    var world = setupWorld(app);

    var boxShape = new CANNON.Box(new CANNON.Vec3(1,1,1));
    var sphereShape = new CANNON.Sphere(1);

    // Box
    var b1 = new CANNON.RigidBody(5,boxShape);
    b1.position.set(5,0,0);
    b1.velocity.set(-5,0,0);
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(0,0,1),Math.PI*0.25);
    b1.quaternion.set(q.x,q.y,q.z,q.w);
    world.add(b1);
    app.addVisual(b1);

    // Sphere
    var b2 = new CANNON.RigidBody(5,sphereShape);
    b2.position.set(-5,0,0);
    b2.velocity.set(5,0,0);
    world.add(b2);
    app.addVisual(b2);
  });

// Sphere / box corner
demo.addScene(function(app){
    var world = setupWorld(app);

    var boxShape = new CANNON.Box(new CANNON.Vec3(1,1,1));
    var sphereShape = new CANNON.Sphere(1);

    // Box
    var b1 = new CANNON.RigidBody(5,boxShape);
    b1.position.set(5,0,0);
    b1.velocity.set(-5,0,0);
    var q1 = new CANNON.Quaternion();
    q1.setFromAxisAngle(new CANNON.Vec3(0,0,1),Math.PI*0.25);
    var q2 = new CANNON.Quaternion();
    q2.setFromAxisAngle(new CANNON.Vec3(0,1,0),Math.PI*0.25);
    var q = q1.mult(q2);
    b1.quaternion.set(q.x,q.y,q.z,q.w);
    world.add(b1);
    app.addVisual(b1);

    // Sphere
    var b2 = new CANNON.RigidBody(5,sphereShape);
    b2.position.set(-5,0,0);
    b2.velocity.set(5,0,0);
    world.add(b2);
    app.addVisual(b2);
  });

demo.start();

function setupWorld(app){
  // Create world
  var world = new CANNON.World();
  app.setWorld(world);
  world.gravity.set(0,0,0); // no gravity
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 2;
  return world;
}