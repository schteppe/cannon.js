/**
 * Demos of the RigidBody.motionstate types.
 */
var demo = new CANNON.Demo();
var size = 2;

// Sphere / box side
demo.addScene(function(app){
    var world = setupWorld(app);

    var boxShape = new CANNON.Box(new CANNON.Vec3(size,size,size));
    var sphereShape = new CANNON.Sphere(size);

    var mass = 5, boxMass = 0;

    // Kinematic Box
    // Does only collide with dynamic bodies, but does not respond to any force. Can be controlled by setting its velocity.
    var b1 = new CANNON.RigidBody(boxMass,boxShape);
    b1.motionstate = CANNON.RigidBody.KINEMATIC;
    b1.position.set(0,0,0.5*size);
    world.add(b1);
    app.addVisual(b1);

    // To control the box movement we must set its velocity
    b1.velocity.set(0,0,5);
    setInterval(function(){
	if(b1.velocity.z<0)
	  b1.velocity.set(0,0,5);
	else
	  b1.velocity.set(0,0,-5);
      },1000);

    // Dynamic Sphere
    // Dynamic bodies can collide with bodies of all other motionstates.
    var b2 = new CANNON.RigidBody(mass,sphereShape);
    b2.position.set(0,0,3*size);
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

  // Static ground plane
  // Static bodies only interacts with dynamic bodies. Velocity is always zero.
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
  var mass = 0; // mass=0 will produce a static body automatically
  var groundBody = new CANNON.RigidBody(mass,groundShape);
  world.add(groundBody);
  app.addVisual(groundBody);

  return world;
}