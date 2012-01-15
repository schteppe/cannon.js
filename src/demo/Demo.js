/**
 * @class Demo
 */
CANNON.Demo = function(){
  this._phys_bodies = [];
  this._phys_visuals = [];
  this._phys_startpositions = [];
  this._scenes = [];
  this.paused = false;
  this.timestep = 1.0/60.0;
};

/**
 * Add a scene to the demo app
 */
CANNON.Demo.prototype.addScene = function(initfunc){
  this._scenes.push(initfunc);
};

/**
 * When all scenes have been added, run this
 */
CANNON.Demo.prototype.start = function(){

  var that = this;

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
    that._scene = scene;
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
    that._renderer = renderer;
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

  function createScene(){
    that._buildScene(0);
  }

  var t = 0, newTime, delta;

  function animate(){
    requestAnimationFrame( animate );
    updatePhysics();
    render();
    stats.update();
  }

  function updatePhysics(){
    // Step world
    if(!that.paused){
      that._world.step(that.timestep);
    
      // Read position data into visuals
      for(var i=0; i<that._phys_bodies.length; i++){
	that._phys_bodies[i].getPosition(that._phys_visuals[i].position);
	that._phys_bodies[i].getOrientation(that._phys_visuals[i].quaternion);
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
    if(camera.position.z<=1.0)
      camera.position.z = 1.0;
    camera.lookAt( new THREE.Vector3(scene.position.x,scene.position.y,scene.position.z+5) );
    renderer.clear();
    renderer.render( scene, camera );
  }

  document.addEventListener('keypress',function(e){
      if(e.keyCode){
	switch(e.keyCode){
	 
	case 32:
	for(var i=0; i<that._phys_bodies.length; i++){
	  that._phys_bodies[i].setPosition(that._phys_startpositions[i].x,
					   that._phys_startpositions[i].y,
					   that._phys_startpositions[i].z);
	}
	break;
	case 43:
	that._world.solver.iter++;
	console.log("Number of iterations: "+that._world.solver.iter);
	break;
	case 45:
	that._world.solver.iter>1 ? that._world.solver.iter-- : "";
	console.log("Number of iterations: "+that._world.solver.iter);
	break;
	case 112: // p
	that._world.togglepause();
	break;
	case 49:
	case 50:
	case 51:
	case 52:
	case 53:
	case 54:
	case 55:
	case 56:
	case 57:
	if(that._scenes.length>e.keyCode-49)
	  that._buildScene(e.keyCode-49);
	break;
	}
      }
    });
};

CANNON.Demo.prototype._buildScene = function(n){
  
  var that = this;

  // Remove old things from scene
  var num = that._phys_visuals.length;
  for(var i=0; i<num; i++){
    that._phys_bodies.pop();
    that._phys_startpositions.pop();
    var mesh = that._phys_visuals.pop();
    that._scene.remove(mesh);
    that._scene.removeObject(mesh);
  }
 
  // Get new scene information
  that._scenes[n]({
      addVisual:function(body){

	// What geometry should be used?
	var mesh;
	switch(body._shape.type){

	case CANNON.Shape.types.SPHERE:
	  var sphere_geometry = new THREE.SphereGeometry( 1, 16, 16);
	  var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff } );
	  THREE.ColorUtils.adjustHSV( sphereMaterial.color, 0, 0, 0.9 );
	  mesh = new THREE.Mesh( sphere_geometry, sphereMaterial );
	  break;

	case CANNON.Shape.types.PLANE:
	  var geometry = new THREE.PlaneGeometry( 100, 100 );
	  var planeMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
	  THREE.ColorUtils.adjustHSV( planeMaterial.color, 0, 0, 0.9 );
	  var submesh = new THREE.Object3D();
	  var ground = new THREE.Mesh( geometry, planeMaterial );
	  ground.scale.set( 100, 100, 100 );
	  ground.rotation.x = Math.PI;
	  mesh = new THREE.Object3D();
	  mesh.add(ground);
	  break;

	case CANNON.Shape.types.BOX:
	  var box_geometry = new THREE.CubeGeometry( body._shape.halfExtents.x*2, body._shape.halfExtents.y*2, body._shape.halfExtents.z*2 );
	  var boxMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff } );
	  THREE.ColorUtils.adjustHSV( boxMaterial.color, 0, 0, 0.9 );
	  mesh = new THREE.Mesh( box_geometry, boxMaterial );
	  break;

	default:
	  throw "Visual type not recognized: "+body._shape.type;
	}
	if(mesh) {
	  // Add body
	  that._phys_bodies.push(body);

	  that._phys_visuals.push(mesh);
	  var pos = new CANNON.Vec3();
	  body.getPosition(pos);
	  that._phys_startpositions.push(pos);
	  mesh.useQuaternion = true;
	}
      },
	setWorld:function(w){
	that._world = w;
      }
    });

  // Add new meshes to scene
  for(var i=0; i<that._phys_visuals.length; i++)
    that._scene.add(that._phys_visuals[i]);
};