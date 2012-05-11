/**
 * Demos of the RigidBody.motionstate types.
 */
var demo = new CANNON.Demo();
var size = 2;

var rbhandle;
// Sphere / box side
demo.addScene(function(app){
    var world = setupWorld(app);

    var boxShape = new CANNON.Box(new CANNON.Vec3(size*3,size*3,size));
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
    //b1.velocity.set(0,0,5);
	
	rbhandle = b1;
	
	
	
	

    // Dynamic Sphere
    // Dynamic bodies can collide with bodies of all other motionstates.
    var b2 = new CANNON.RigidBody(mass,sphereShape);
    b2.position.set(0,0,4.5*size);
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



function QuatToAxisAngle(q) {
	var angle = 2*Math.acos(q.w), scale = 1.0/Math.sqrt(1.0-q.w*q.w);
	var x = q.x*scale;
	var y = q.y*scale;
	var z = q.z*scale;
	return [x,y,z,angle];
}
function EulerToQuat(phi, theta, psi, q) {
	var c = Math.cos, s = Math.sin, f=phi, t=theta, p=psi;		
	var p2 = p*0.5, t2 = t*0.5, f2=f*0.5;
	q.w = c(f2)*c(t2)*c(p2)+s(f2)*s(t2)*s(p2);
	q.x = s(f2)*c(t2)*c(p2)-c(f2)*s(t2)*s(p2);
	q.y = c(f2)*s(t2)*c(p2)+s(f2)*c(t2)*s(p2);
	q.z = c(f2)*c(t2)*s(p2)-s(f2)*s(t2)*c(p2);
}

// Q1*Q2E(Q1^-1*Q2)*Q1^-1
// Not aware of a way to make this more efficent, my quat math sucks
// returns in axis-angle the rotation value to bring frame exactly to Q2 from Q1. 
// Used for setting proper velocity values for kinematic bodies. 
function Q2ToAxisAngle(q1,q2) {
	var q1i = q1.inverse();
	var AA = QuatToAxisAngle(q1i.mult(q2));
	var qv = new CANNON.Quaternion(AA[0],AA[1],AA[2],0);
	var v = q1.mult(qv).mult(q1i);
	return [v.x,v.y,v.z,AA[3]]; // returns an axis-angle value as an array
}

var xangle=0,yangle=0;
setInterval(function() {
	var newq = new CANNON.Quaternion();
	EulerToQuat(-yangle/4/180*3.14159,-xangle/4/180*3.14159,0,newq);
	rbhandle.quaternion.normalize();
	var aa = Q2ToAxisAngle(rbhandle.quaternion,newq);
	//console.log(aa.toString(),rbhandle.angularVelocity.toString());
	var rad_per_sec = aa[3]*30; // take me half the way to target in the next time step
	rbhandle.angularVelocity.set(aa[0]*rad_per_sec,aa[1]*rad_per_sec,aa[2]*rad_per_sec);
},16);
document.onmousemove = function(e){
    xangle =  e.pageX-window.innerWidth*0.5;
    yangle = e.pageY-window.innerHeight*0.5;	
}
