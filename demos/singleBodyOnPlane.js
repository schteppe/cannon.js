var demo = new CANNON.Demo();
var size = 2;

demo.addScene(function(app){
    var sphereShape = new CANNON.Sphere(size);
    createBodyOnPlane(app,sphereShape);
  });

demo.addScene(function(app){
    var boxShape = new CANNON.Box(new CANNON.Vec3(size,size,size));
    createBodyOnPlane(app,boxShape);
  });

demo.start();

function createBodyOnPlane(app,shape){

  // Create world
  var world = new CANNON.World();
  app.setWorld(world);
  world.gravity.set(0,0,-40);
  var bp = 
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // Materials
  var stone = new CANNON.Material('stone');
  var stone_stone = new CANNON.ContactMaterial(stone,
					       stone,
					       0.3, // friction
					       0.3  // restitution
					       );
  world.addContactMaterial(stone_stone);

  // ground plane
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
  var groundBody = new CANNON.RigidBody(0,groundShape,stone);
  world.add(groundBody);
  app.addVisual(groundBody);

  // Shape on plane
  var shapeBody = new CANNON.RigidBody(30,shape,stone);
  var pos = new CANNON.Vec3(0,0,size);
  shapeBody.position.set(0,0,size);
  shapeBody.velocity.set(0,0,0);
  shapeBody.angularVelocity.set(0,0,0);
  world.add(shapeBody);
  app.addVisual(shapeBody);
}