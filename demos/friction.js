var demo = new CANNON.Demo(),
  n=2,
  mu_min = 0.0,
  mu_max = 1.0,
  size = 1.0;

demo.addScene(function(app){
    createFricScene(app,new CANNON.Box(new CANNON.Vec3(size,size,size)));
  });

demo.addScene(function(app){
    createFricScene(app,new CANNON.Sphere(size));
  });

demo.start();

function createFricScene(app,shape){

  // Create world
  var world = new CANNON.World();
  app.setWorld(world);
  world.gravity.set(0,0,-60);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.iterations = 10;

  // Materials
  var ground_mat = new CANNON.Material('myGroundMaterial');

  // ground plane
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0.05,1));
  var groundBody = new CANNON.RigidBody(0,groundShape,ground_mat);
  world.add(groundBody);
  app.addVisual(groundBody);

  for(var i=0; i<n; i++){
    var mat = new CANNON.Material('myBoxMaterial'+i);
    var mu = (mu_max-mu_min)*(i/n)+mu_min;
    var gmat_mat = new CANNON.ContactMaterial(ground_mat,
					      mat,
					      mu, // friction
					      0.3  // restitution
					      );
    world.addContactMaterial(gmat_mat);

    // Box
    var boxBody = new CANNON.RigidBody(10,shape,mat);
    boxBody.position.set(i*size*4,0,5);
    world.add(boxBody);
    app.addVisual(boxBody);
  }
}