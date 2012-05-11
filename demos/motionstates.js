/**
 * Demos of the RigidBody.motionstate types.
 */
var demo = new CANNON.Demo();
var size = 2;

var rbhandle,rbhandle2;
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
	
	
	var b2 = new CANNON.RigidBody(boxMass,boxShape); 
	b2.position.set(0,0,.5*size);
	world.add(b2);
	app.addVisual(b2);
	
	rbhandle2 = b2;
	

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

document.onkeydown = function (e) {
	var keynum;
	if (!(e.which)) keynum = e.keyCode;
	else if (e.which) keynum = e.which;
	else return;
	var keychar = String.fromCharCode(keynum);
	if (keychar == 'W') {
		
		var newq = new CANNON.Quaternion();
		EulerToQuat(-yangle/4/180*3.14159,-xangle/4/180*3.14159,0,newq);
		console.log("q2e of current",QuatToEuler(rbhandle.quaternion));
		console.log("euler of target", -yangle/4/180*3.14159,-xangle/4/180*3.14159,0);
		rbhandle.quaternion.normalize();
		var diffq = rbhandle.quaternion.inverse().mult(newq);	
		var A = QuatToAxisAngle(diffq);
		// A is the axis and angle which is the rotation needed to get us to where we want to be 
		// But I think it is in the wrong frame. To do this I do 
		// q * q_v * q^-1 to get the new (quat-)vector
		var tempQ = new CANNON.Quaternion(); tempQ.set(A[0],A[1],A[2],0);
		var finalAQ = rbhandle.quaternion.mult(tempQ).mult(rbhandle.quaternion.inverse());
		

		A[3] = A[3]*10;  
		rbhandle.angularVelocity.set(finalAQ.x*A[3],finalAQ.y*A[3],finalAQ.z*A[3]);
		

		/* 
		var oldangles = QuatToEuler(oldq);
		var xdiff = xangle/4/180*Math.PI + oldangles[1];
		var ydiff = yangle/4/180*Math.PI + oldangles[0];
		var zdiff = oldangles[2];
		// note that x-euler is set to -yangle, y-euler to -xangle. 
		console.log(xdiff,ydiff,zdiff);
		rbhandle.angularVelocity.set(-ydiff,-xdiff,-zdiff);
		*/
	}
}
var xangle,yangle;
setInterval(function() {
	rbhandle.angularVelocity.set(0,0,0);
},100);
document.onmousemove = function(e){
    xangle =  e.pageX-window.innerWidth*0.5;
    yangle = e.pageY-window.innerHeight*0.5;
	
	
	
	// computes and assigns new orientation	
	EulerToQuat(-yangle/4/180*3.14159,-xangle/4/180*3.14159,0,rbhandle2.quaternion);
	
	// computes change orientation 
	//var diffq = oldq.inverse().mult(rbhandle.quaternion); 
	//var A = QuatToAxisAngle(diffq);
	
	//rbhandle.angularVelocity.set(A[0],A[1],A[2],A[3]*60.0); // diff = velocity * dt
		
	
}

// Determine quaternion from roll, pitch, and yaw euler angles: http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
// just using roll and pitch here

function EulerToQuat(phi, theta, psi, q) {
	var c = Math.cos, s = Math.sin, f=phi, t=theta, p=psi;		
	var p2 = p*0.5, t2 = t*0.5, f2=f*0.5;
	q.w = c(f2)*c(t2)*c(p2)+s(f2)*s(t2)*s(p2);
	q.x = s(f2)*c(t2)*c(p2)-c(f2)*s(t2)*s(p2);
	q.y = c(f2)*s(t2)*c(p2)+s(f2)*c(t2)*s(p2);
	q.z = c(f2)*c(t2)*s(p2)-s(f2)*s(t2)*c(p2);
}

// http://www.gamedev.net/topic/423462-rotation-difference-between-two-quaternions/
// to compute the angular velocity to make correct collision resolution

function QuatToAxisAngle(q) {
	var angle = 2*Math.acos(q.w), scale = 1.0/Math.sqrt(1.0-q.w*q.w);
	var x = q.x*scale;
	var y = q.y*scale;
	var z = q.z*scale;
	return [x,y,z,angle];
}

function QuatToEuler(q) {
	var f,t,p;
	f = Math.atan2(2*(q.w*q.x+q.y*q.z),1-2*(q.x*q.x+q.y*q.y));
	t = Math.asin(2*(q.w*q.y-q.z*q.x));
	p = Math.atan2(2*(q.w*q.z+q.x*q.y),1-2*(q.y*q.y+q.z*q.z));
	return [f,t,p];
}

/* Not needed since inverse can use conjugate when unit quat 
function QuatReciprocal(q) {
	var recip = new CANNON.Quaternion();
	var scale = 1.0/(q.x*q.x+q.y*q.y+q.z*q.z+q.w*q.w);
	recip.set(-q.x*scale,-q.y*scale,-q.z*scale,q.w*scale);
	return recip;
} */