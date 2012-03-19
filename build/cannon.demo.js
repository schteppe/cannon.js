/**
 * cannon.js v0.3.10 - A lightweight 3D physics engine for the web
 * 
 * http://github.com/schteppe/cannon.js
 * 
 * Copyright (c) 2012 Stefan Hedman (steffe.se)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * The Software shall be used for Good, not Evil.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
  this.shadowsOn = true;
};

/**
 * Add a scene to the demo app
 * @param function initfunc
 */
CANNON.Demo.prototype.addScene = function(initfunc){
  this._scenes.push(initfunc);
};

/**
 * When all scenes have been added, run this to launch the Demo app.
 */
CANNON.Demo.prototype.start = function(){

  var that = this;

  if ( ! Detector.webgl )
    Detector.addGetWebGLMessage();
  
  this.SHADOW_MAP_WIDTH = 1024;
  this.SHADOW_MAP_HEIGHT = 1024;
  var MARGIN = 0;
  this.SCREEN_WIDTH = window.innerWidth;
  this.SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
  var camera, controls, scene, renderer;
  var container, stats;
  var NEAR = 5, FAR = 2000;
  var sceneHUD, cameraOrtho, hudMaterial;
  var light;

  var mouseX = 0, mouseY = 0;
  
  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2;
  
  init();
  animate();
  
  function init() {
    
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    
    // Camera
    camera = new THREE.PerspectiveCamera( 24, that.SCREEN_WIDTH / that.SCREEN_HEIGHT, NEAR, FAR );
    camera.up.set(0,0,1);
    camera.position.x = 0;
    camera.position.y = 30;
    camera.position.z = 20;
 
    // SCENE
    scene = new THREE.Scene();
    that._scene = scene;
    scene.fog = new THREE.Fog( 0x222222, 1000, FAR );
    //THREE.ColorUtils.adjustHSV( scene.fog.color, 0.02, -0.15, -0.65 );

    // LIGHTS
    var ambient = new THREE.AmbientLight( 0x222222 );
    scene.add( ambient );

    light = new THREE.SpotLight( 0xffffff );
    light.position.set( 40, 40, 50 );
    light.target.position.set( 0, 0, 0 );
    if(that.shadowsOn){
      light.castShadow = true;

      light.shadowCameraNear = 1;
      light.shadowCameraFar = camera.far;
      light.shadowCameraFov = 30;
    
      light.shadowMapBias = 0.0039;
      light.shadowMapDarkness = 0.5;
      light.shadowMapWidth = that.SHADOW_MAP_WIDTH;
      light.shadowMapHeight = that.SHADOW_MAP_HEIGHT;
    }
    scene.add( light );
    scene.add( camera );

    createScene();

    // RENDERER
    renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
    that._renderer = renderer;
    renderer.setSize( that.SCREEN_WIDTH, that.SCREEN_HEIGHT );
    renderer.domElement.style.position = "relative";
    renderer.domElement.style.top = MARGIN + 'px';
    container.appendChild( renderer.domElement );

    document.addEventListener('mousemove',onDocumentMouseMove);
    window.addEventListener('resize',onWindowResize);

    renderer.setClearColor( scene.fog.color, 1 );
    renderer.autoClear = false;

    if(that.shadowsOn){
      renderer.shadowMapEnabled = true;
      renderer.shadowMapSoft = true;
    }

    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild( stats.domElement );

    // Trackball controls
    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.2;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.3;
    var radius = 100;
    controls.minDistance = radius * 0.1;
    controls.maxDistance = radius * 1000;
    controls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]
    controls.screen.width = that.SCREEN_WIDTH;
    controls.screen.height = that.SCREEN_HEIGHT;
  }

  function createScene(){
    that._buildScene(0);
  }

  var t = 0, newTime, delta;

  function animate(){
    requestAnimationFrame( animate );
    if(!that.paused){
      updatePhysics();
      updateVisuals();
    }
    render();
    stats.update();
  }

  function updatePhysics(){
    // Step world
    that._world.step(that.timestep);
  }

  function updateVisuals(){
    // Read position data into visuals
    for(var i=0; i<that._phys_bodies.length; i++){
      that._phys_bodies[i].getPosition(that._phys_visuals[i].position);
      that._phys_bodies[i].getOrientation(that._phys_visuals[i].quaternion);
    }
  }

  function onDocumentMouseMove( event ) {
    mouseX = ( event.clientX - windowHalfX );
    mouseY = ( event.clientY - windowHalfY );
  }

  function onWindowResize( event ) {
    that.SCREEN_WIDTH = window.innerWidth;
    that.SCREEN_HEIGHT = window.innerHeight;

    renderer.setSize( that.SCREEN_WIDTH, that.SCREEN_HEIGHT );

    camera.aspect = that.SCREEN_WIDTH / that.SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    controls.screen.width = that.SCREEN_WIDTH;
    controls.screen.height = that.SCREEN_HEIGHT;

    camera.radius = ( that.SCREEN_WIDTH + that.SCREEN_HEIGHT ) / 4;
  }

  function render(){
    /*
    camera.position.x += ( mouseX/windowHalfX*300 - camera.position.x ) * 0.05;
    camera.position.z += ( - (mouseY/windowHalfY*200) - camera.position.z ) * 0.05;
    if(camera.position.z<=1.0)
      camera.position.z = 1.0;
    camera.lookAt( new THREE.Vector3(scene.position.x,scene.position.y,scene.position.z+5) );*/

    controls.update();
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
	that.paused = !that.paused;
	break;
	case 115: // s
	updatePhysics();
	updateVisuals();
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
	if(that._scenes.length>e.keyCode-49){
	  that.paused = false;
	  that._buildScene(e.keyCode-49);
	}
	break;
	}
      }
    });
};

/**
 * Build a scene.
 * @private
 * @param int n
 */
CANNON.Demo.prototype._buildScene = function(n){
  
  var that = this;

  // Remove old things from scene
  var num = that._phys_visuals.length;
  for(var i=0; i<num; i++){
    that._phys_bodies.pop();
    that._phys_startpositions.pop();
    var mesh = that._phys_visuals.pop();
    that._scene.remove(mesh);
    //that._scene.removeObject(mesh);
  }
 
  var materialColor = 0xdddddd;

  function shape2mesh(shape){
    var mesh;
    switch(shape.type){
      
    case CANNON.Shape.types.SPHERE:
      var sphere_geometry = new THREE.SphereGeometry( 1, 16, 16);
      var sphereMaterial = new THREE.MeshLambertMaterial( { color: materialColor } );
      THREE.ColorUtils.adjustHSV( sphereMaterial.color, 0, 0, 0.9 );
      mesh = new THREE.Mesh( sphere_geometry, sphereMaterial );
      break;

    case CANNON.Shape.types.PLANE:
      var geometry = new THREE.PlaneGeometry( 100, 100 );
      var planeMaterial = new THREE.MeshBasicMaterial( { color: materialColor } );
      THREE.ColorUtils.adjustHSV( planeMaterial.color, 0, 0, 0.9 );
      var submesh = new THREE.Object3D();

      if(that.shadowsOn){
	submesh.castShadow = true;
	submesh.receiveShadow = true;
      }

      var ground = new THREE.Mesh( geometry, planeMaterial );
      ground.scale.set( 100, 100, 100 );
      ground.rotation.x = Math.PI;
      mesh = new THREE.Object3D();
      mesh.add(ground);
      break;

    case CANNON.Shape.types.BOX:
      var box_geometry = new THREE.CubeGeometry( shape.halfExtents.x*2, shape.halfExtents.y*2, shape.halfExtents.z*2 );
      var boxMaterial = new THREE.MeshLambertMaterial( { color: materialColor } );
      THREE.ColorUtils.adjustHSV( boxMaterial.color, 0, 0, 0.9 );
      mesh = new THREE.Mesh( box_geometry, boxMaterial );
      break;

    case CANNON.Shape.types.COMPOUND:
      // @todo recursive compounds
      var o3d = new THREE.Object3D();
      var compoundMaterial = new THREE.MeshLambertMaterial( { color: materialColor } );
      for(var i = 0; i<shape.childShapes.length; i++){

	// Get child information
	var subshape = shape.childShapes[i];
	var o = shape.childOffsets[i];
	var q = shape.childOrientations[i];
	    
	var submesh = shape2mesh(subshape);
	submesh.position.x = o.x;
	submesh.position.y = o.y;
	submesh.position.z = o.z;
	
	submesh.quaternion.x = q.x;
	submesh.quaternion.y = q.y;
	submesh.quaternion.z = q.z;
	submesh.quaternion.w = q.w;
	
	submesh.useQuaternion = true;
	
	o3d.add(submesh);
	
	mesh = o3d;
      }

      break;

    default:
      throw "Visual type not recognized: "+shape.type;
    }

    if(that.shadowsOn && shape.type!=CANNON.Shape.types.BOX)
      mesh.receiveShadow = true;
    if(that.shadowsOn)
      mesh.castShadow = true;

    return mesh;
  }

  // Get new scene information
  that._scenes[n]({
      addVisual:function(body){
	// What geometry should be used?
	var mesh = shape2mesh(body._shape);
	if(mesh) {
	  if(that.shadowsOn){
	    mesh.castShadow = true;
	    mesh.receiveShadow = true;
	    if(mesh.children)
	      for(var i=0; i<mesh.children.length; i++){
		mesh.children[i].castShadow = true;
		mesh.children[i].receiveShadow = true;
	      }
	  }
	  if(body._shape.type==CANNON.Shape.types.BOX)
	    mesh.receiveShadow = false;

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