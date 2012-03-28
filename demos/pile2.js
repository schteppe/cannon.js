var demo = new CANNON.Demo();
var size = 1;

// Spheres
demo.addScene(function(app){
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
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(0,1,0),-Math.PI/8);
    //groundBody.setOrientation(q.x,q.y,q.z,q.w); // Inclined plane
    groundBody.setPosition(0,0,0);
    world.add(groundBody);
    app.addVisual(groundBody);

    // plane -x
    var planeShapeXmin = new CANNON.Plane(new CANNON.Vec3(0,1,0));
    var planeXmin = new CANNON.RigidBody(0, planeShapeXmin);
    planeXmin.setPosition(0,-5,0);
    world.add(planeXmin);

    // Plane +x
    var planeShapeXmax = new CANNON.Plane(new CANNON.Vec3(0,-1,0));
    var planeXmax = new CANNON.RigidBody(0, planeShapeXmax);
    planeXmax.setPosition(0,5,0);
    world.add(planeXmax);

    // Plane -y
    var planeShapeYmin = new CANNON.Plane(new CANNON.Vec3(1,0,0));
    var planeYmin = new CANNON.RigidBody(0, planeShapeYmin);
    planeYmin.setPosition(-5,0,0);
    world.add(planeYmin);

    // Plane +y
    var planeShapeYmax = new CANNON.Plane(new CANNON.Vec3(-1,0,0));
    var planeYmax = new CANNON.RigidBody(0, planeShapeYmax);
    planeYmax.setPosition(5,0,0);
    world.add(planeYmax);

    var bodies = [];
    var i = 0;
    var interval = setInterval(function(){
	// Sphere
	i++;
	var sphereShape = new CANNON.Sphere(size);
	var b1 = new CANNON.RigidBody(5,sphereShape);
	b1.setPosition(2*size*Math.sin(i),2*size*Math.cos(i),7*2*size);
	world.add(b1);
	app.addVisual(b1);
	bodies.push(b1);

	if(bodies.length>100){
	  var b = bodies.shift();
	  app.removeVisual(b);
	  world.remove(b);
	  //clearInterval(interval);
	}
      },100);

  });

demo.start();
