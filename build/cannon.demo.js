/**
 * Copyright (c) 2012 cannon.js Authors
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @class CANNON.Demo
 * @brief Demo framework class.
 */
CANNON.Demo = function(){

  // Global settings
  this.settings = {
    gx:0.0,
    gy:0.0,
    gz:-10.0,
    iterations:3,
    scene:0,
    paused:false,
    rendermode:0,
    contacts:false,  // Contact points
    cm2contact:false // center of mass to contact points
  };

  this._phys_bodies = [];
  this._phys_visuals = [];
  this._phys_startpositions = [];
  this._phys_startrot = [];
  this._phys_startvelocities = [];
  this._phys_startrotvelo = [];
  this._scenes = [];
  this._gui = null;
  this.paused = false;
  this.timestep = 1.0/60.0;
  this.shadowsOn = true;
  this._contactmeshes = [];
  this._contactlines = [];

  // Material
  this.materialColor = 0xdddddd;
  this.solidMaterial = new THREE.MeshLambertMaterial( { color: this.materialColor } );
  THREE.ColorUtils.adjustHSV( this.solidMaterial.color, 0, 0, 0.9 );
  this.wireframeMaterial = new THREE.MeshBasicMaterial( { color: this.materialColor, wireframe:true } );
  this.currentMaterial = this.solidMaterial;
  this.contactDotMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );

  this.renderModes = {
    NORMAL:0,
    WIREFRAME:1
  };

  this._updategui = function(){
    if(this._gui){
      // First level
      for (var i in this._gui.__controllers)
	this._gui.__controllers[i].updateDisplay();

      // Second level
      for (var f in this._gui.__folders)
	for (var i in this._gui.__folders[f].__controllers)
	  this._gui.__folders[f].__controllers[i].updateDisplay();
    }
  };
};

/**
 * @fn renderMode
 * @memberof CANNON.Demo
 * @brief Get/set render mode
 * @param int mode
 * @see CANNON.Demo.renderModes
 */
CANNON.Demo.prototype.renderMode = function(mode){
  var that = this;

  mode = parseInt(mode);
  switch(mode){
    
  case this.renderModes.NORMAL:
    that.currentMaterial = that.solidMaterial;
    // Change all current geometries to normal
    function setNormal(node){
      if(node.material)
	node.material = that.solidMaterial;
      for(var i=0; i<node.children.length; i++)
	setNormal(node.children[i]);
    }
    for(var i=0; i<this._phys_visuals.length; i++)
      setNormal(this._phys_visuals[i]);
    break;
    
  case this.renderModes.WIREFRAME:
    that.currentMaterial = that.wireframeMaterial;
    // Change all current geometries to normal
    function setWireframe(node){
      if(node.material)
	node.material = that.wireframeMaterial;
      for(var i=0; i<node.children.length; i++)
	setWireframe(node.children[i]);
    }
    for(var i=0; i<this._phys_visuals.length; i++)
      setWireframe(this._phys_visuals[i]);
    break;
    
  default:
    console.log("Could not recognize mode: "+mode);
    break;
  }
  
  this.settings.rendermode = mode;
};

/**
 * @fn addScene
 * @memberof CANNON.Demo
 * @brief Add a scene to the demo app
 * @param function initfunc
 */
CANNON.Demo.prototype.addScene = function(initfunc){
  this._scenes.push(initfunc);
};

/**
 * @fn restartCurrentScene
 * @memberof CANNON.Demo
 * @brief Restarts the current scene
 */
CANNON.Demo.prototype.restartCurrentScene = function(){
  for(var i=0; i<this._phys_bodies.length; i++){
    this._phys_bodies[i].setPosition(this._phys_startpositions[i].x,
				     this._phys_startpositions[i].y,
				     this._phys_startpositions[i].z);
    this._phys_bodies[i].setVelocity(this._phys_startvelocities[i].x,
				     this._phys_startvelocities[i].y,
				     this._phys_startvelocities[i].z);
    this._phys_bodies[i].setAngularVelocity(this._phys_startrotvelo[i].x,
					    this._phys_startrotvelo[i].y,
					    this._phys_startrotvelo[i].z);
    this._phys_bodies[i].setOrientation(this._phys_startrot[i].x,
					this._phys_startrot[i].y,
					this._phys_startrot[i].z,
					this._phys_startrot[i].w);
  }
};

/**
 * @fn updateVisuals
 * @memberof CANNON.Demo
 * @brief Loads body positions and orientations from the World and updates the Three.js graphics.
 */
CANNON.Demo.prototype.updateVisuals = function(){
  
  // Read position data into visuals
  for(var i=0; i<this._phys_bodies.length; i++){
    this._phys_bodies[i].getPosition(this._phys_visuals[i].position);
    this._phys_bodies[i].getOrientation(this._phys_visuals[i].quaternion);
  }
  
  // Render contacts
  if(this.settings.contacts){

    // Add new
    var sphere_geometry = new THREE.SphereGeometry( 0.1, 6, 6);
    var numadded = 0;
    var old_meshes = this._contactmeshes;
    this._contactmeshes = [];
    for(var ci in this._world.contacts){
      for(var k=0; k<this._world.contacts[ci].length; k++){
	var ij = ci.split(",");
	var i=parseInt(ij[0]), j=parseInt(ij[1]), mesh_i, mesh_j;
	if(numadded<old_meshes.length){
	  // Get mesh from prev timestep
	  mesh_i = old_meshes[numadded];
	} else {
	  // Create new mesh
	  mesh_i = new THREE.Mesh( sphere_geometry, this.contactDotMaterial );
	  this._scene.add(mesh_i);
	}
	this._contactmeshes.push(mesh_i);
	numadded++;

	if(numadded<old_meshes.length){
	  // Get mesh from prev timestep
	  mesh_j = old_meshes[numadded];
	} else {
	  // Create new mesh
	  mesh_j = new THREE.Mesh( sphere_geometry, this.contactDotMaterial );
	  this._scene.add(mesh_j);
	}
	this._contactmeshes.push(mesh_j);
	numadded++;

	mesh_i.position.x = this._world.x[i] + this._world.contacts[ci][k].ri.x;
	mesh_i.position.y = this._world.y[i] + this._world.contacts[ci][k].ri.y;
	mesh_i.position.z = this._world.z[i] + this._world.contacts[ci][k].ri.z;

	mesh_j.position.x = this._world.x[j] + this._world.contacts[ci][k].rj.x;
	mesh_j.position.y = this._world.y[j] + this._world.contacts[ci][k].rj.y;
	mesh_j.position.z = this._world.z[j] + this._world.contacts[ci][k].rj.z;
      }
    }

    // Remove overflowing
    for(var i=numadded; i<old_meshes.length; i++)
      this._scene.remove(old_meshes[i]);

  } else if(this._contactmeshes.length){

    // Remove all contact meshes
    for(var i=0; i<this._contactmeshes.length; i++)
      this._scene.remove(this._contactmeshes[i]);
  }

  // Lines
  if(this.settings.cm2contact){

    // remove last timesteps' lines
    /*while(this._contactlines.length)
      this._scene.remove(this._contactlines.pop());*/

    var old_lines = this._contactlines;
    this._contactlines = [];

    for(var ci in this._world.contacts){
      for(var k=0; k<this._world.contacts[ci].length; k++){
	var ij = ci.split(",");
	var i=parseInt(ij[0]), j=parseInt(ij[1]);
	var line, geometry;

	for(var l=0; l<2; l++){
	  if(old_lines.length){
	    // Get mesh from prev timestep
	    line = old_lines.pop();
	    geometry = line.geometry;
	    geometry.vertices.pop();
	    geometry.vertices.pop();
	  } else {
	    // Create new mesh
	    geometry = new THREE.Geometry();
	    geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(0,0,0)));
	    geometry.vertices.push(new THREE.Vertex(new THREE.Vector3(1,1,1)));
	    line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );
	    this._scene.add(line);
	  }
	  this._contactlines.push(line);
	  var r = l==0 ? this._world.contacts[ci][k].ri : this._world.contacts[ci][k].rj;
	  var pos_idx = l==0 ? i : j;
	  line.scale = new THREE.Vector3(r.x,r.y,r.z);
	  line.position.set(this._world.x[pos_idx],
			    this._world.y[pos_idx],
			    this._world.z[pos_idx]);
	  this._scene.add(line);
	}
      }
    }

    // Remove overflowing
    while(old_lines.length)
      this._scene.remove(old_lines.pop());

  } else if(this._contactmeshes.length){

    // Remove all contact lines
    for(var i=0; i<this._contactlines.length; i++)
      this._scene.remove(this._contactlines[i]);

  }
};

/**
 * @fn start
 * @memberof CANNON.Demo
 * @brief When all scenes have been added, run this to launch the Demo app.
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
    controls.minDistance = 0.0;
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
      that.updateVisuals();
    }
    render();
    stats.update();
  }

  function updatePhysics(){
    // Step world
    that._world.step(that.timestep);
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
    controls.update();
    renderer.clear();
    renderer.render( scene, camera );
  }

  document.addEventListener('keypress',function(e){
      if(e.keyCode){
	switch(e.keyCode){
	  
	case 32: // Space - restart
	that.restartCurrentScene();
	break;
	case 112: // p
	that.paused = !that.paused;
	that.settings.paused = that.paused;
	that._updategui();
	break;
	case 115: // s
	updatePhysics();
	that.updateVisuals();
	break;
	}
      }
    });

  if(window.dat!=undefined){
    that._gui = new dat.GUI();

    // Render mode
    var rf = that._gui.addFolder('Rendering');
    rf.add(that.settings,'rendermode',{Solid:that.renderModes.NORMAL,Wireframe:that.renderModes.WIREFRAME}).onChange(function(mode){
	that.renderMode(mode);
      });
    rf.add(that.settings,'contacts').onChange(function(contacts){
	// Do nothing... contacts are dynamically added/removed for each frame
      });
    rf.add(that.settings,'cm2contact').onChange(function(cm2contact){
	
      });

    // World folder
    var wf = that._gui.addFolder('World');
    wf.add(that.settings, 'gx').step(1).onChange(function(gx){
	that._world.gravity(new CANNON.Vec3(gx,that.settings.gy,that.settings.gz));
      });
    wf.add(that.settings, 'gy').step(1).onChange(function(gy){
	that._world.gravity(new CANNON.Vec3(that.settings.gx,gy,that.settings.gz));
      });
    wf.add(that.settings, 'gz').step(1).onChange(function(gz){
	that._world.gravity(new CANNON.Vec3(that.settings.gx,that.settings.gy,gz));
      });

    // Solver folder
    var sf = that._gui.addFolder('Solver');
    sf.add(that.settings, 'iterations').min(1).step(1).onChange(function(it){
	that._world.solver.iter = it;
      });

    // Pause
    wf.add(that.settings,'paused').onChange(function(p){
	that.paused = p;
      });

    // Scene picker
    var scenes = {};
    for(var i=0; i<that._scenes.length; i++)
      scenes[(i+1)+'. Scene '+(i+1)] = i;
    that._gui.add(that.settings,'scene',scenes).onChange(function(sceneNumber){
	that.paused = false;
	that.settings.paused = false;
	that._updategui();
	that._buildScene(sceneNumber);
      });
  }
};

/**
 * @private
 * @fn _buildScene
 * @memberof CANNON.Demo
 * @brief Build a stored scene.
 * @param int n
 */
CANNON.Demo.prototype._buildScene = function(n){
  
  var that = this,
  materialColor = this.materialColor;

  // Remove old things from scene
  var num = that._phys_visuals.length;
  for(var i=0; i<num; i++){
    that._phys_bodies.pop();
    that._phys_startpositions.pop();
    that._phys_startvelocities.pop();
    that._phys_startrotvelo.pop();
    that._phys_startrot.pop();
    var mesh = that._phys_visuals.pop();
    that._scene.remove(mesh);
  }

  function shape2mesh(shape){
    var wireframe = that.settings.rendermode==that.renderModes.WIREFRAME;
    var mesh;
    switch(shape.type){
      
    case CANNON.Shape.types.SPHERE:
      var sphere_geometry = new THREE.SphereGeometry( shape.radius, 8, 8);
      mesh = new THREE.Mesh( sphere_geometry, that.currentMaterial );
      break;

    case CANNON.Shape.types.PLANE:
      var geometry = new THREE.PlaneGeometry( 100, 100 , 100 , 100 );
      mesh = new THREE.Object3D();
      var submesh = new THREE.Object3D();
      var subsubmesh = new THREE.Object3D();

      var ground = new THREE.Mesh( geometry, that.currentMaterial );
      ground.scale = new THREE.Vector3(100,100,100);
      subsubmesh.add(ground);
      var n = shape.normal.copy();

      if(that.shadowsOn){
	ground.castShadow = true;
	ground.receiveShadow = true;
      }

      // Rotate the plane according to normal
      var q = new CANNON.Quaternion();
      q.setFromVectors(n,new CANNON.Vec3(0,0,-1));
      submesh.useQuaternion = true;
      submesh.quaternion.set(q.x,q.y,q.z,q.w);
      submesh.add(subsubmesh);
      mesh.add(submesh);
      break;

    case CANNON.Shape.types.BOX:
      var box_geometry = new THREE.CubeGeometry( shape.halfExtents.x*2, shape.halfExtents.y*2, shape.halfExtents.z*2 );
      mesh = new THREE.Mesh( box_geometry, that.currentMaterial );
      break;

    case CANNON.Shape.types.COMPOUND:
      // @todo recursive compounds
      var o3d = new THREE.Object3D();
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

    if(that.shadowsOn){
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      if(mesh.children)
	for(var i=0; i<mesh.children.length; i++){
	  mesh.children[i].castShadow = true;
	  mesh.children[i].receiveShadow = true;
	  if(mesh.children[i])
	    for(var j=0; j<mesh.children[i].length; j++){
	      mesh.children[i].children[j].castShadow = true;
	      mesh.children[i].children[j].receiveShadow = true;
	    }
	}
    }
    return mesh;
  }

  // Run the user defined "build scene" function
  that._scenes[n]({

      addVisual:function(body){
	// What geometry should be used?
	var mesh = shape2mesh(body._shape);
	if(mesh) {

	  // Shadows on?
	    /*
	  if(that.shadowsOn){
	    mesh.castShadow = true;
	    mesh.receiveShadow = true;
	    if(mesh.children)
	      for(var i=0; i<mesh.children.length; i++){
		mesh.children[i].castShadow = true;
		mesh.children[i].receiveShadow = true;
		if(body._shape.type==CANNON.Shape.types.BOX)
		  mesh.children[i].receiveShadow = false;
	      }
	  }
	  if(that.shadowsOn && body._shape.type==CANNON.Shape.types.BOX)
	    mesh.receiveShadow = false;
	    */

	  // Add body
	  that._phys_bodies.push(body);
	  that._phys_visuals.push(mesh);
	  that._phys_startpositions.push(body.getPosition());
	  that._phys_startvelocities.push(body.getVelocity());
	  that._phys_startrot.push(body.getOrientation());
	  that._phys_startrotvelo.push(body.getAngularVelocity());
	  body.visualref = mesh;
	  body.visualref.visualId = that._phys_startpositions.length - 1;
	  mesh.useQuaternion = true;
	  that._scene.add(mesh);
	}
      },

      removeVisual:function(body){
	if(body.visualref!=undefined){
	  var old_sp = [];
	  var old_sq = [];
	  var old_sv = [];
	  var old_sw = [];
	  var old_b = [];
	  var old_v = [];
	  var n = that._phys_startpositions.length;
	  for(var i=0; i<n; i++){
	    old_b.unshift(that._phys_bodies.pop());
	    old_v.unshift(that._phys_visuals.pop());
	    old_sp.unshift(that._phys_startpositions.pop());
	    old_sv.unshift(that._phys_startvelocities.pop());
	    old_sw.unshift(that._phys_startrotvelo.pop());
	    old_sq.unshift(that._phys_startrot.pop());
	  }
	  var id = body.visualref.visualId;
	  for(var j=0; j<old_sp.length; j++){
	    if(j!=id){
	      var i = j>id ? j-1 : j;
	      that._phys_startpositions[i] = old_sp[j];
	      that._phys_startvelocities[i] = old_sv[j];
	      that._phys_startrotvelo[i] = old_sw[j];
	      that._phys_startrot[i] = old_sq[j];
	      that._phys_bodies[i] = old_b[j];
	      that._phys_visuals[i] = old_v[j];
	      that._phys_bodies[i].visualref = old_b[j].visualref;
	      that._phys_bodies[i].visualref.visualId = i;
	    }
	  }
	  body.visualref.visualId = null;
	  that._scene.remove(body.visualref);
	  body.visualref = null;
	}
      },

      setWorld:function(w){
	that._world = w;
      }
    });

  // Read the newly set data to the gui
  that.settings.iterations = that._world.solver.iter;
  that.settings.gx = that._world._gravity.x;
  that.settings.gy = that._world._gravity.y;
  that.settings.gz = that._world._gravity.z;
  that._updategui();
};