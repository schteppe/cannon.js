// Physics
var world = new CANNON.World();
world.gravity(new CANNON.Vec3(0,0,-10));
var bp = new CANNON.NaiveBroadphase();
world.broadphase(bp);
world.iterations(3);

var phys_bodies = [];
var phys_visuals = [];
var phys_startpositions = [];

if ( ! Detector.webgl )
  Detector.addGetWebGLMessage();

var SHADOW_MAP_WIDTH = 1024, SHADOW_MAP_HEIGHT = 1024;
var MARGIN = 0;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
var camera, controls, scene, renderer;
var container, stats;
var NEAR = 5, FAR = 5000;
var sceneHUD, cameraOrtho, hudMaterial;
var light;
var shadowsOn = false;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  // SCENE CAMERA
  camera = new THREE.PerspectiveCamera( 24, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
  camera.up.set(0,0,1);
  camera.position.x = 0;
  camera.position.y = 30;
  camera.position.z = 12;
 
  // SCENE
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog( 0xffffff, 1000, FAR );
  THREE.ColorUtils.adjustHSV( scene.fog.color, 0.02, -0.15, -0.65 );

  // LIGHTS
  var ambient = new THREE.AmbientLight( 0x555555 );
  scene.add( ambient );

  light = new THREE.SpotLight( 0xffffff );
  light.position.set( 0, 50, 150 );
  light.target.position.set( 0, 0, 0 );
  if(shadowsOn)
    light.castShadow = true;
  scene.add( light );
  scene.add( camera );
  createScene();

  // RENDERER
  renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
  renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
  renderer.domElement.style.position = "relative";
  renderer.domElement.style.top = MARGIN + 'px';
  container.appendChild( renderer.domElement );

  document.addEventListener('mousemove',onDocumentMouseMove);

  renderer.setClearColor( scene.fog.color, 1 );
  renderer.autoClear = false;

  if(shadowsOn){
    renderer.shadowCameraNear = 0.1;
    renderer.shadowCameraFar = camera.far;
    renderer.shadowCameraFov = 25;
    
    renderer.shadowMapBias = 0.0039;
    renderer.shadowMapDarkness = 0.5;
    renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
    renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
    
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
  }

  // STATS
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.zIndex = 100;
  container.appendChild( stats.domElement );
}

function createScene( ) {

  // GROUND
  var geometry = new THREE.PlaneGeometry( 100, 100 );
  var planeMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
  THREE.ColorUtils.adjustHSV( planeMaterial.color, 0, 0, 0.9 );
  var ground = new THREE.Mesh( geometry, planeMaterial );
  ground.position.set( 0, 0, 0 );
  ground.scale.set( 100, 100, 100 );
  
  if(shadowsOn){
    ground.castShadow = false;
    ground.receiveShadow = true;
  }
  scene.add( ground );

  // ground plane
  var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
  var groundBody = new CANNON.RigidBody(0,groundShape);
  world.add(groundBody);

  var box_geometry = new THREE.CubeGeometry( 4, 4, 2 ); // extents, not half extents
  var boxMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff } );
  THREE.ColorUtils.adjustHSV( boxMaterial.color, 0, 0, 0.9 );

  // Box on plane
  var nx = 1;
  var ny = 1;
  var nz = 1;
  var rand = 0.005;
  var h = 1;
  var boxShape = new CANNON.Box(new CANNON.Vec3(2,2,1)); // half extents
  for(var i=0; i<nx; i++){
    for(var j=0; j<ny; j++){
      for(var k=0; k<nz; k++){
	// THREE.js
	var boxmesh = new THREE.Mesh( box_geometry, boxMaterial );
	if(shadowsOn){
	  boxmesh.castShadow = true;
	  boxmesh.receiveShadow = true;
	}
	scene.add( boxmesh );
	boxmesh.useQuaternion = true;

	// Physics
	var boxBody = new CANNON.RigidBody(5,boxShape);
	var pos = new CANNON.Vec3(i-nx*0.5 + (Math.random()-0.5)*rand,
				  j-ny*0.5 + (Math.random()-0.5)*rand,
				  1+k*2+h);
	boxBody.setPosition(pos.x,pos.y,pos.z);
	boxBody.setAngularVelocity(0,1,0);
	boxBody.setOrientation(1,0,0,0.0);
	
	// Save initial positions for later
	phys_bodies.push(boxBody);
	phys_visuals.push(boxmesh);
	phys_startpositions.push(pos);
	world.add(boxBody);
      }
    }
  }
}

var sphere_geometry = new THREE.SphereGeometry( 1, 16, 16 );
var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff } );
THREE.ColorUtils.adjustHSV( sphereMaterial.color, 0, 0, 0.9 );

var spheremesh = new THREE.Mesh( sphere_geometry, sphereMaterial );
if(shadowsOn){
  spheremesh.castShadow = true;
  spheremesh.receiveShadow = true;
}
scene.add( spheremesh );
spheremesh.useQuaternion = true;

// Physics
var sphereShape = new CANNON.Sphere(1);
var sphereBody = new CANNON.RigidBody(5,sphereShape);
var pos = new CANNON.Vec3(0,0,5);
sphereBody.setPosition(0,0,5);

// Save initial positions for later
phys_bodies.push(sphereBody);
phys_visuals.push(spheremesh);
phys_startpositions.push(pos);
world.add(sphereBody);

var t = 0, newTime, delta;

function animate(){
  requestAnimationFrame( animate );
  updatePhysics();
  render();
  stats.update();
}

function updatePhysics(){
  // Step world
  if(!world.paused){
    world.step(1.0/60.0);
    
    // Read position data into visuals
    for(var i=0; i<phys_bodies.length; i++){
      phys_bodies[i].getPosition(phys_visuals[i].position);
      phys_bodies[i].getOrientation(phys_visuals[i].quaternion);
    }
  }
}

function onDocumentMouseMove( event ) {
  mouseX = ( event.clientX - windowHalfX );
  mouseY = ( event.clientY - windowHalfY );
}

function render(){
  camera.position.x += ( mouseX/windowHalfX*300 - camera.position.x ) * 0.05;
  camera.position.z += ( - (mouseY/windowHalfY*200) - camera.position.z ) * 0.05;
  if(camera.position.z<=0.0)
    camera.position.z = 0.0;
  camera.lookAt( new THREE.Vector3(scene.position.x,scene.position.y,scene.position.z+5) );
  renderer.clear();
  renderer.render( scene, camera );
}

document.addEventListener('keypress',function(e){
    if(e.keyCode){
      switch(e.keyCode){
      case 32:
	for(var i=0; i<phys_bodies.length; i++){
	  phys_bodies[i].setPosition(phys_startpositions[i].x,
				     phys_startpositions[i].y,
				     phys_startpositions[i].z);
	}
	break;
      case 43:
	world.solver.iter++;
	console.log("Number of iterations: "+world.solver.iter);
	break;
      case 45:
	world.solver.iter>1 ? world.solver.iter-- : "";
	console.log("Number of iterations: "+world.solver.iter);
	break;
      case 112: // p
	world.togglepause();
	break;
      }
    }
  });