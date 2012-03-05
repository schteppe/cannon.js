var demo = new CANNON.Demo();
demo.addScene(function(app){
    createContainer(app,4,4,4);
  });

demo.addScene(function(app){
    createContainer(app,4,4,8);
  });

demo.addScene(function(app){
    createContainer(app,4,4,15);
  });

demo.start();

function createContainer(app,nx,ny,nz){

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

  // plane -x
  var planeShapeXmin = new CANNON.Plane(new CANNON.Vec3(0,1,0));
  var planeXmin = new CANNON.RigidBody(0, planeShapeXmin,stone);
  planeXmin.setPosition(0,-5,0);
  world.add(planeXmin);

  // Plane +x
  var planeShapeXmax = new CANNON.Plane(new CANNON.Vec3(0,-1,0));
  var planeXmax = new CANNON.RigidBody(0, planeShapeXmax,stone);
  planeXmax.setPosition(0,5,0);
  world.add(planeXmax);

  // Plane -y
  var planeShapeYmin = new CANNON.Plane(new CANNON.Vec3(1,0,0));
  var planeYmin = new CANNON.RigidBody(0, planeShapeYmin,stone);
  planeYmin.setPosition(-5,0,0);
  world.add(planeYmin);

  // Plane +y
  var planeShapeYmax = new CANNON.Plane(new CANNON.Vec3(-1,0,0));
  var planeYmax = new CANNON.RigidBody(0, planeShapeYmax, stone);
  planeYmax.setPosition(5,0,0);
  world.add(planeYmax);

  // Sphere on plane
  var rand = 0.01;
  var h = 0;
  var sphereShape = new CANNON.Sphere(1); // Sharing shape saves memory
  for(var i=0; i<nx; i++){
    for(var j=0; j<ny; j++){
      for(var k=0; k<nz; k++){

	var sphereBody = new CANNON.RigidBody(5,sphereShape,stone);
	var pos = new CANNON.Vec3(i*2-nx*0.5 + (Math.random()-0.5)*rand,
				  j*2-ny*0.5 + (Math.random()-0.5)*rand,
				  1+k*2.1+h+(i+j)*0.0);
	sphereBody.setPosition(pos.x,pos.y,pos.z);
	world.add(sphereBody);
	  
	app.addVisual(sphereBody);
      }
    }
  }
}