// Drawing settings
var scale = 200;

var world, physicsCube;

var gravityZ = -10;

var container, stats, useStats = false;
var camera, scene, renderer;
var cube;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseY = 0;
var mouseXOnMouseDown = 0;
var mouseYOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var info;

init();
animate();

function init() {
    
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    
    info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = '<h1>cannon.js</h1><br>Lightweight 3d physics in JavaScript';
    container.appendChild( info );

    // Create world
    world = new CANNON.World();
    world.gravity.set(0,0,gravityZ);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Physics box dimensions
    var boxWidth = windowHalfX/windowHalfY * 2;
    var boxHeight = 2;
    var boxDepth = 20;

    // Physics Cube
    var cubeShape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
    physicsCube = new CANNON.RigidBody(1.0, cubeShape);
    physicsCube.position.set(0,1,0);
    world.add(physicsCube);

    // ground plane
    var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
    var groundBody = new CANNON.RigidBody(0,groundShape);
    groundBody.position.set(0,0,-1);
    world.add(groundBody);

    // top plane
    var topShape = new CANNON.Plane(new CANNON.Vec3(0,0,-1));
    var topBody = new CANNON.RigidBody(0,topShape);
    topBody.position.set(0,0,boxDepth);
    world.add(topBody);

    // plane -x
    var planeShapeXmin = new CANNON.Plane(new CANNON.Vec3(0,1,0));
    var planeXmin = new CANNON.RigidBody(0, planeShapeXmin);
    planeXmin.position.set(0,-boxHeight,0);
    world.add(planeXmin);

    // Plane +x
    var planeShapeXmax = new CANNON.Plane(new CANNON.Vec3(0,-1,0));
    var planeXmax = new CANNON.RigidBody(0, planeShapeXmax);
    planeXmax.position.set(0,boxHeight,0);
    world.add(planeXmax);

    // Plane -y
    var planeShapeYmin = new CANNON.Plane(new CANNON.Vec3(1,0,0));
    var planeYmin = new CANNON.RigidBody(0, planeShapeYmin);
    planeYmin.position.set(-boxWidth,0,0);
    world.add(planeYmin);

    // Plane +y
    var planeShapeYmax = new CANNON.Plane(new CANNON.Vec3(-1,0,0));
    var planeYmax = new CANNON.RigidBody(0, planeShapeYmax);
    planeYmax.position.set(boxWidth,0,0);
    world.add(planeYmax);

    
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.y = 0;
    camera.position.z = 500;
    scene.add( camera );
    
    // Cube
    
    var materials = [];
    
    for ( var i = 0; i < 6; i ++ ) {	
	materials.push( new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff } ) );
    }
    
    cube = new THREE.Mesh( new THREE.CubeGeometry( scale*physicsCube.shape.halfExtents.x,
						   scale*physicsCube.shape.halfExtents.y,
						   scale*physicsCube.shape.halfExtents.z,
						   1, 1, 1, 
						   materials ),
			   new THREE.MeshFaceMaterial() );
    cube.useQuaternion = true;
    cube.position.set(0,200,0);
    scene.add( cube );
    
    renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    
    container.appendChild( renderer.domElement );
    
    if(useStats){
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );
    }

    // Motion events test
    if (window.DeviceMotionEvent) {
	window.addEventListener('devicemotion', deviceMotionHandler, false);
    } else {
	addMouseEventListeners();
    }
}

function deviceMotionHandler(e){
    world.gravity.set(-e.accelerationIncludingGravity.x,
		      -e.accelerationIncludingGravity.y,
		      -e.accelerationIncludingGravity.z);
}

function addMouseEventListeners(){
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );
}

//
function onDocumentMouseDown( event ) {
    
    event.preventDefault();
    
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mouseout', onDocumentMouseOut, false );
    
    mouseXOnMouseDown = event.clientX - windowHalfX;
    mouseYOnMouseDown = event.clientY - windowHalfY;
    targetRotationOnMouseDown = targetRotation;
}

function onDocumentMouseMove( event ) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
    world.gravity.set(10*mouseX/scale,
		      -10*mouseY/scale,
		      gravityZ);
    targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
}

function onDocumentMouseUp( event ) {
    
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {
    
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentTouchStart( event ) {
    
    if ( event.touches.length == 1 ) {
	
	event.preventDefault();
	
	mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
	mouseYOnMouseDown = event.touches[ 0 ].pageY - windowHalfY;
	targetRotationOnMouseDown = targetRotation;
	
    }
}

function onDocumentTouchMove( event ) {
    if ( event.touches.length == 1 ) {
	event.preventDefault();
	mouseX = event.touches[ 0 ].pageX - windowHalfX;
	mouseY = event.touches[ 0 ].pageY - windowHalfY;
	targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.05;
    }
}

//
function animate() {  
    requestAnimationFrame( animate );
    render();
    world.step(1.0/60.0);
    if(useStats)
	stats.update();
}

function render() {
    physicsCube.position.mult(scale,cube.position);
    physicsCube.quaternion.copy(cube.quaternion);
    renderer.render( scene, camera );
}
