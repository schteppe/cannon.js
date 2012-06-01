/*global CANNON:true */

/**
 * @class CANNON.Demo
 * @brief Demo framework class. If you want to learn how to connect Cannon.js with Three.js, please look at the examples/ instead.
 */
CANNON.Demo = function(){

  // Global settings
  this.settings = {
    gx:0.0,
    gy:0.0,
    gz:0.0,
    iterations:3,
    scene:0,
    paused:false,
    rendermode:0,
    contacts:false,  // Contact points
    cm2contact:false, // center of mass to contact points
    normals:false, // contact normals
    axes:false // "local" frame axes
  };

  this._phys_bodies = [];
  this._phys_visuals = [];
  this._scenes = [];
  this._gui = null;

  /**
   * @property bool paused
   * @memberof CANNON.Demo
   * @brief Controls if the simulation runs or not
   */
  this.paused = false;

  /**
   * @property float timestep
   * @memberof CANNON.Demo
   */
  this.timestep = 1.0/60.0;
  this.shadowsOn = true;
  this._contactmeshes = [];
  this._normallines = [];
  this._contactlines = [];
  this._axes = [];

  this.three_contactpoint_geo = new THREE.SphereGeometry( 0.1, 6, 6);

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
 * @param function A function that takes one argument, app, and initializes a physics scene. The function runs app.setWorld(body), app.addVisual(body), app.removeVisual(body) etc.
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
    this._phys_bodies[i].initPosition.copy(this._phys_bodies[i].position);
    this._phys_bodies[i].initVelocity.copy(this._phys_bodies[i].velocity);
    this._phys_bodies[i].initAngularVelocity.copy(this._phys_bodies[i].angularVelocity);
    this._phys_bodies[i].initQuaternion.copy(this._phys_bodies[i].quaternion);
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
    this._phys_bodies[i].position.copy(this._phys_visuals[i].position);
    this._phys_bodies[i].quaternion.copy(this._phys_visuals[i].quaternion);
  }
  
  // Render contacts
  if(this.settings.contacts){

    // Add new
    var sphere_geometry = this.three_contactpoint_geo;
    var numadded = 0;
    var old_meshes = this._contactmeshes;
    var old_normal_meshes = this._normalmeshes;
    this._contactmeshes = [];
    for(var ci in this._world.contacts){
      var c = this._world.contacts[ci];
      var bi=c.bi, bj=c.bj, mesh_i, mesh_j;
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
      
      mesh_i.position.x = bi.position.x + c.ri.x;
      mesh_i.position.y = bi.position.y + c.ri.y;
      mesh_i.position.z = bi.position.z + c.ri.z;
      
      mesh_j.position.x = bj.position.x + c.rj.x;
      mesh_j.position.y = bj.position.y + c.rj.y;
      mesh_j.position.z = bj.position.z + c.rj.z;
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
      var c = this._world.contacts[ci];
      var bi=c.bi, bj=c.bj, mesh_i, mesh_j;
      var i=bi.id, j=bj.id;
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
	  geometry.vertices.push(new THREE.Vector3(0,0,0));
	  geometry.vertices.push(new THREE.Vector3(1,1,1));
	  line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );
	  this._scene.add(line);
	}
	this._contactlines.push(line);
	var r = l==0 ? c.ri : c.rj;
	var b = l==0 ? bi : bj;
	line.scale.set(r.x,r.y,r.z);
	b.position.copy(line.position);
	this._scene.add(line);
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

  // Normal lines
  if(this.settings.normals){
    var old_lines = this._normallines;
    this._normallines = [];
    for(var ci in this._world.contacts){
      var c = this._world.contacts[ci];
      var bi=c.bi, bj=c.bj, mesh;
      var i=bi.id, j=bj.id;
      var line, geometry;
      if(old_lines.length){
	// Get mesh from prev timestep
	line = old_lines.pop();
	geometry = line.geometry;
	geometry.vertices.pop();
	geometry.vertices.pop();
      } else {
	// Create new mesh
	geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(0,0,0));
	geometry.vertices.push(new THREE.Vector3(1,1,1));
	line = new THREE.Line( geometry, new THREE.LineBasicMaterial({color:0x00ff00}));
	this._scene.add(line);
      }
      this._normallines.push(line);
      var n = c.ni;
      var b = bi;
      line.scale.set(n.x,n.y,n.z);
      b.position.copy(line.position);
      c.ri.vadd(line.position,line.position);
      this._scene.add(line);
    }

    // Remove overflowing
    while(old_lines.length)
      this._scene.remove(old_lines.pop());
  } else if(this._normallines.length){
    // Remove all contact lines
    for(var i=0; i<this._normallines.length; i++)
      this._scene.remove(this._normallines[i]);
  }

  // Frame axes for each body
  if(this.settings.axes){
    var old_axes = this._axes;
    this._axes = [];
    for(var bi in this._world.bodies){
      var b = this._world.bodies[bi], mesh;
      if(old_axes.length){
	// Get mesh from prev timestep
	mesh = old_axes.pop();
      } else {
	// Create new mesh
	mesh = new THREE.Object3D();
	mesh.useQuaternion = true;
	var origin = new THREE.Vector3(0,0,0);
	var gX = new THREE.Geometry();
	var gY = new THREE.Geometry();
	var gZ = new THREE.Geometry();
	gX.vertices.push(origin);
	gY.vertices.push(origin);
	gZ.vertices.push(origin);
	gX.vertices.push(new THREE.Vector3(1,0,0));
	gY.vertices.push(new THREE.Vector3(0,1,0));
	gZ.vertices.push(new THREE.Vector3(0,0,1));
	var lineX = new THREE.Line( gX, new THREE.LineBasicMaterial({color:0xff0000}));
	var lineY = new THREE.Line( gY, new THREE.LineBasicMaterial({color:0x00ff00}));
	var lineZ = new THREE.Line( gZ, new THREE.LineBasicMaterial({color:0x0000ff}));
	mesh.add(lineX);
	mesh.add(lineY);
	mesh.add(lineZ);
      }
      b.position.copy(mesh.position);
      b.quaternion.copy(mesh.quaternion);
      this._axes.push(mesh);
      this._scene.add(mesh);
    }

    // Remove overflowing
    while(old_axes.length)
      this._scene.remove(old_axes.pop());
  } else if(this._axes.length){
    // Remove all contact lines
    for(var i=0; i<this._axes.length; i++)
      this._scene.remove(this._axes[i]);
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
      that.updateVisuals();
      updatePhysics();
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

	case 49:
	case 50:
	case 51:
	case 52:
	case 53:
	case 54:
	case 55:
	case 56:
	case 57:
	  // Change scene
	  // Only for numbers 1-9 and if no input field is active
	  if(that._scenes.length > e.keyCode-49 && !document.activeElement.localName.match(/input/))
	    that._changeScene(e.keyCode-49);
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
    rf.add(that.settings,'cm2contact').onChange(function(cm2contact){});
    rf.add(that.settings,'normals').onChange(function(normals){});
    rf.add(that.settings,'axes').onChange(function(axes){});

    // World folder
    var wf = that._gui.addFolder('World');
    // Pause
    wf.add(that.settings,'paused').onChange(function(p){
	that.paused = p;
      });
      var maxg = 100;
    wf.add(that.settings, 'gx',-maxg,maxg).onChange(function(gx){
	if(!isNaN(gx))
	  that._world.gravity.set(gx,that.settings.gy,that.settings.gz);
      });
    wf.add(that.settings, 'gy',-maxg,maxg).onChange(function(gy){
	if(!isNaN(gy))
	  that._world.gravity.set(that.settings.gx,gy,that.settings.gz);
      });
    wf.add(that.settings, 'gz',-maxg,maxg).onChange(function(gz){
	if(!isNaN(gz))
	  that._world.gravity.set(that.settings.gx,that.settings.gy,gz);
      });

    // Solver folder
    var sf = that._gui.addFolder('Solver');
      sf.add(that.settings, 'iterations',1,50).step(1).onChange(function(it){
	that._world.solver.iterations = it;
      });

    // Scene picker
    var scenes = {};
    for(var i=0; i<that._scenes.length; i++)
      scenes[(i+1)+'. Scene '+(i+1)] = i;
    that._gui.add(that.settings,'scene',scenes).onChange(function(sceneNumber){
	that._changeScene(sceneNumber);
      });
  }
};

CANNON.Demo.prototype._changeScene = function(n){
  this.paused = false;
  this.settings.paused = false;
  this._updategui();
  this._buildScene(n);
}

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
      ground.rotation.x = Math.PI/2;
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

    case CANNON.Shape.types.CONVEXPOLYHEDRON:
      var verts = [];
      for(var i=0; i<shape.vertices.length; i++){
	verts.push(new THREE.Vector3(shape.vertices[i].x,
				     shape.vertices[i].y,
				     shape.vertices[i].z));
      }
      var geo = new THREE.ConvexGeometry( verts );
      mesh = new THREE.Mesh( geo, that.currentMaterial );
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
	var mesh = shape2mesh(body.shape);
	if(mesh) {
	  // Add body
	  that._phys_bodies.push(body);
	  that._phys_visuals.push(mesh);
	  body.visualref = mesh;
	  body.visualref.visualId = that._phys_bodies.length - 1;
	  mesh.useQuaternion = true;
	  that._scene.add(mesh);
	}
      },

      removeVisual:function(body){
	if(body.visualref!=undefined){
	  var old_b = [];
	  var old_v = [];
	  var n = that._phys_bodies.length;
	  for(var i=0; i<n; i++){
	    old_b.unshift(that._phys_bodies.pop());
	    old_v.unshift(that._phys_visuals.pop());
	  }
	  var id = body.visualref.visualId;
	  for(var j=0; j<old_b.length; j++){
	    if(j!=id){
	      var i = j>id ? j-1 : j;
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
  that.settings.iterations = that._world.solver.iterations;
  that.settings.gx = that._world.gravity.x+0.0;
  that.settings.gy = that._world.gravity.y+0.0;
  that.settings.gz = that._world.gravity.z+0.0;
  that._updategui();
};