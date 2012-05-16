/**
 * For debugging different kinds of stacks
 */
var demo = new CANNON.Demo();
var size = 2;

// Boxes
demo.addScene(function(app){
    var world = setupWorld(app);
    
    // Box 1
    var boxShape = new CANNON.Box(new CANNON.Vec3(size*0.5,size*0.5,size*0.5));
    var b1 = new CANNON.RigidBody(5,boxShape);
    b1.position.set(0,0,3*size);
    world.add(b1);
    app.addVisual(b1);

    // Box 2
    var b2 = new CANNON.RigidBody(5,boxShape);
    b2.position.set(0,0,1*size);
    world.add(b2);
    app.addVisual(b2);
  });


// Spheres
demo.addScene(function(app){
    var world = setupWorld(app);

    // Sphere 1
    var sphereShape = new CANNON.Sphere(size);
    var b1 = new CANNON.RigidBody(5,sphereShape);
    b1.position.set(0,0,3*size);
    world.add(b1);
    app.addVisual(b1);

    // Sphere 2
    var b2 = new CANNON.RigidBody(5,sphereShape);
    b2.position.set(0,0,1*size);
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
    b1.position.set(0,0,1*size);
    world.add(b1);
    app.addVisual(b1);

    // Sphere
    var b2 = new CANNON.RigidBody(5,sphereShape);
    b2.position.set(0,0,3*size);
    world.add(b2);
    app.addVisual(b2);
  });


// ConvexHull and compound
demo.addScene(function(app){
    var world = setupWorld(app);
    
    var tetraShape = new CANNON.ConvexHull();
    tetraShape.addPoints([new CANNON.Vec3(0,0,0),
			  new CANNON.Vec3(2,0,0),
			  new CANNON.Vec3(0,2,0),
			  new CANNON.Vec3(0,0,2)],
			 [
			  [0,3,2], // -x
			  [0,1,3], // -y
			  [0,1,2], // -z
			  [1,3,2], // +xyz
			  ],
			 [new CANNON.Vec3(-1, 0, 0),
			  new CANNON.Vec3( 0,-1, 0),
			  new CANNON.Vec3( 0, 0,-1),
			  new CANNON.Vec3( 1, 1, 1)]);
    var b1 = new CANNON.RigidBody(5,tetraShape);
    b1.position.set(0,0,3*size);
    world.add(b1);
    app.addVisual(b1);

    // Box 2
    var boxShape = new CANNON.Box(new CANNON.Vec3(size*0.5,size*0.5,size*0.5));
    var compoundShape = new CANNON.Compound();
    compoundShape.addChild(boxShape);
    var b2 = new CANNON.RigidBody(5,compoundShape);
    b2.position.set(0,0,1*size);
    world.add(b2);
    app.addVisual(b2);
  });

// ConvexHull and box
demo.addScene(function(app){
    var world = setupWorld(app);
    
    var tetraShape = new CANNON.ConvexHull();
    tetraShape.addPoints([new CANNON.Vec3(0,0,0),
			  new CANNON.Vec3(2,0,0),
			  new CANNON.Vec3(0,2,0),
			  new CANNON.Vec3(0,0,2)],
			 [
			  [0,3,2], // -x
			  [0,1,3], // -y
			  [0,1,2], // -z
			  [1,3,2], // +xyz
			  ],
			 [new CANNON.Vec3(-1, 0, 0),
			  new CANNON.Vec3( 0,-1, 0),
			  new CANNON.Vec3( 0, 0,-1),
			  new CANNON.Vec3( 1, 1, 1)]);
    var b1 = new CANNON.RigidBody(5,tetraShape);
    b1.position.set(0,0,3*size);
    world.add(b1);
    app.addVisual(b1);

    // Box 2
    var boxShape = new CANNON.Box(new CANNON.Vec3(size*0.5,size*0.5,size*0.5));
    var b2 = new CANNON.RigidBody(5,boxShape);
    b2.position.set(0,0,1*size);
    world.add(b2);
    app.addVisual(b2);
  });

demo.start();

function setupWorld(app){
  // Create world
  var world = new CANNON.World();
  app.setWorld(world);
  world.gravity.set(0,0,-50);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // ground plane
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
  var groundBody = new CANNON.RigidBody(0,groundShape);
  world.add(groundBody);
  app.addVisual(groundBody);

  return world;
}