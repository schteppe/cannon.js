var demo = new CANNON.Demo();
var nx=4, ny=4;
demo.addScene(function(app){
    createContainer(app,nx,ny,4);
  });

demo.addScene(function(app){
    createContainer(app,nx,ny,8);
  });

demo.addScene(function(app){
    createContainer(app,nx,ny,15);
  });

demo.addScene(function(app){
    createContainer(app,nx,ny,20);
  });

demo.addScene(function(app){
    createContainer(app,nx,ny,25);
  });

demo.addScene(function(app){
    createContainer(app,nx,ny,30);
  });

demo.start();

function createContainer(app,nx,ny,nz){

  console.log((nx*ny*nz)+" spheres");

  // Create world
  var world = new CANNON.World();
  app.setWorld(world);
  world.gravity.set(0,0,-40);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 5;

  // Materials
  var stone = new CANNON.Material('stone');
  var stone_stone = new CANNON.ContactMaterial(stone,
					       stone,
					       0.3, // friction
					       0.3  // Restitution
					       );
  world.addContactMaterial(stone_stone);

  // ground plane
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
  var groundBody = new CANNON.RigidBody(0,groundShape,stone);
  world.add(groundBody);
  app.addVisual(groundBody);

  // plane -x
  var planeShapeXmin = new CANNON.Plane(new CANNON.Vec3(0,1,0));
  var planeXmin = new CANNON.RigidBody(0, planeShapeXmin,stone);
  planeXmin.position.set(0,-5,0);
  world.add(planeXmin);

  // Plane +x
  var planeShapeXmax = new CANNON.Plane(new CANNON.Vec3(0,-1,0));
  var planeXmax = new CANNON.RigidBody(0, planeShapeXmax,stone);
  planeXmax.position.set(0,5,0);
  world.add(planeXmax);

  // Plane -y
  var planeShapeYmin = new CANNON.Plane(new CANNON.Vec3(1,0,0));
  var planeYmin = new CANNON.RigidBody(0, planeShapeYmin,stone);
  planeYmin.position.set(-5,0,0);
  world.add(planeYmin);

  // Plane +y
  var planeShapeYmax = new CANNON.Plane(new CANNON.Vec3(-1,0,0));
  var planeYmax = new CANNON.RigidBody(0, planeShapeYmax, stone);
  planeYmax.position.set(5,0,0);
  world.add(planeYmax);

  // Box
  /*var boxShape = new CANNON.Box(new CANNON.Vec3(1,1,1));
  var boxBody = new CANNON.RigidBody(10,boxShape);
  boxBody.position.set(0,0,20);
  world.add(boxBody);
  app.addVisual(boxBody);*/

  // Sphere on plane
  var rand = 0.01;
  var h = 0;
  var sphereShape = new CANNON.Sphere(1); // Sharing shape saves memory
  for(var i=0; i<nx; i++){
    for(var j=0; j<ny; j++){
      for(var k=0; k<nz; k++){

	var sphereBody = new CANNON.RigidBody(5,sphereShape,stone);
	sphereBody.position.set(i*2-nx*0.5 + (Math.random()-0.5)*rand,
				j*2-ny*0.5 + (Math.random()-0.5)*rand,
				1+k*2.1+h+(i+j)*0.0);
	world.add(sphereBody);
	app.addVisual(sphereBody);
      }
    }
  }
}