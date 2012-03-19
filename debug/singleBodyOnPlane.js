var demo = new CANNON.Demo();
demo.addScene(function(app){
    var sphereShape = new CANNON.Sphere(1);
    createBodyOnPlane(app,sphereShape);
  });

demo.addScene(function(app){
    var boxShape = new CANNON.Box(new CANNON.Vec3(1,1,1));
    createBodyOnPlane(app,boxShape);
  });

demo.start();

function createBodyOnPlane(app,shape){

  // Create world
  var world = new CANNON.World();
  app.setWorld(world);
  world.gravity(new CANNON.Vec3(0,0,-40));
  var bp = new CANNON.NaiveBroadphase();
  world.broadphase(bp);
  world.iterations(2);

  // Materials
  var stone = new CANNON.Material('stone');
  var stone_stone = new CANNON.ContactMaterial(stone,
					       stone,
					       0.3, // Static friction
					       0.3, // Kinetic friction
					       0.3  // Restitution
					       );
  world.addContactMaterial(stone_stone);

  // ground plane
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
  var groundBody = new CANNON.RigidBody(0,groundShape,stone);
  world.add(groundBody);
  app.addVisual(groundBody);

  // Sphere on plane
  var sphereBody = new CANNON.RigidBody(5,shape,stone);
  var pos = new CANNON.Vec3(0,3,2);
  sphereBody.setPosition(pos.x,pos.y,pos.z);
  sphereBody.setOrientation(0,1,0,0.2);
  world.add(sphereBody);
  
  app.addVisual(sphereBody);
}