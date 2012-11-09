/*global CANNON:true */

/**
 * @class CANNON.Demo
 * @brief Demo framework class. If you want to learn how to connect Cannon.js with Three.js, please look at the examples/ instead.
 * @param Object options
 */
 CANNON.Demo = function(options){

    // API
    this.removeVisual = removeVisual;
    this.addScene = addScene;
    this.restartCurrentScene = restartCurrentScene;
    this.changeScene = changeScene;
    this.addVisual = addVisual;
    this.removeVisual = removeVisual;
    this.getWorld = getWorld;
    this.start = start;

    // Global settings
    var settings = {
       stepFrequency:60,
       quatNormalizeSkip:2,
       quatNormalizeFast:true,
       gx:0.0,
       gy:0.0,
       gz:0.0,
       iterations:3,
       k:1000,
       d:3,
       scene:0,
       paused:false,
       rendermode:"solid",
       constraints:false,
       contacts:false,  // Contact points
       cm2contact:false, // center of mass to contact points
       normals:false, // contact normals
       axes:false, // "local" frame axes
       particleSize:0.1,
       paused:false,
       shadows:true,
       aabbs:false,
    };

    // Extend settings with options
    options = options || {};
    for(var key in options){
        if(key in settings){
            settings[key] = options[key];
        }
    }

    if(settings.stepFrequency % 60 != 0)
        throw new Error("stepFrequency must be a multiple of 60.");

    var bodies = [];
    var visuals = [];
    var scenes = [];
    var gui = null;
    var scenePicker = {};

    var three_contactpoint_geo = new THREE.SphereGeometry( 0.1, 6, 6);
    var particleGeo = new THREE.SphereGeometry( 1, 16, 8 );

    // Material
    var materialColor = 0xdddddd;
    var solidMaterial = new THREE.MeshLambertMaterial( { color: materialColor } );
    THREE.ColorUtils.adjustHSV( solidMaterial.color, 0, 0, 0.9 );
    var wireframeMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, wireframe:true } );
    var currentMaterial = solidMaterial;
    var contactDotMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    var particleMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );

    // Geometry caches
    var contactMeshCache = new GeometryCache(function(){
        return new THREE.Mesh( three_contactpoint_geo, contactDotMaterial );
    });
    var cm2contactMeshCache = new GeometryCache(function(){
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0,0,0));
        geometry.vertices.push(new THREE.Vector3(1,1,1));
        return new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );
    });
    var bboxGeometry = new THREE.CubeGeometry(1,1,1);
    var bboxMaterial = new THREE.MeshBasicMaterial({
    color: materialColor,
    wireframe:true
    });
    var bboxMeshCache = new GeometryCache(function(){
    return new THREE.Mesh(bboxGeometry,bboxMaterial);
    });
    var distanceConstraintMeshCache = new GeometryCache(function(){
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0,0,0));
        geometry.vertices.push(new THREE.Vector3(1,1,1));
        return new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );
    });
    var p2pConstraintMeshCache = new GeometryCache(function(){
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0,0,0));
        geometry.vertices.push(new THREE.Vector3(1,1,1));
        return new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000 } ) );
    });
    var normalMeshCache = new GeometryCache(function(){
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0,0,0));
        geometry.vertices.push(new THREE.Vector3(1,1,1));
        return new THREE.Line( geometry, new THREE.LineBasicMaterial({color:0x00ff00}));
    });
    var axesMeshCache = new GeometryCache(function(){
        var mesh = new THREE.Object3D();
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
        return mesh;
    });
    function restartGeometryCaches(){
        contactMeshCache.restart();
        contactMeshCache.hideCached();

        cm2contactMeshCache.restart();
        cm2contactMeshCache.hideCached();

        distanceConstraintMeshCache.restart();
        distanceConstraintMeshCache.hideCached();

        normalMeshCache.restart();
        normalMeshCache.hideCached();
    }

    // Create physics world
    var world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();

    var renderModes = ["solid","wireframe"];

    function updategui(){
        if(gui){
            // First level
            for (var i in gui.__controllers){
                gui.__controllers[i].updateDisplay();
            }

            // Second level
            for (var f in gui.__folders){
                for (var i in gui.__folders[f].__controllers){
                    gui.__folders[f].__controllers[i].updateDisplay();
                }
            }
        }
    };

    var light, scene, ambient, stats;

    function setRenderMode(mode){
        if(renderModes.indexOf(mode)==-1)
            throw new Error("Render mode "+mode+" not found!");

        switch(mode){
            case "solid":
                currentMaterial = solidMaterial;
                light.intensity = 1;
                ambient.color.setHex(0x222222);
                break;
            case "wireframe":
                currentMaterial = wireframeMaterial;
                light.intensity = 0;
                ambient.color.setHex(0xffffff);
                break;
        }

        function setMaterial(node,mat){
            if(node.material)
                node.material = mat;
            for(var i=0; i<node.children.length; i++)
                setMaterial(node.children[i],mat);
        }
        for(var i=0; i<visuals.length; i++)
            setMaterial(visuals[i],currentMaterial);
        settings.rendermode = mode;
    }

    /**
    * @method addScene
    * @memberof CANNON.Demo
    * @brief Add a scene to the demo app
    * @param title Title of the scene
    * @param function A function that takes one argument, app, and initializes a physics scene. The function runs app.setWorld(body), app.addVisual(body), app.removeVisual(body) etc.
    */
    function addScene(title,initfunc){
        if(typeof(title)!="string")
            throw new Error("1st argument of Demo.addScene(title,initfunc) must be a string!");
        if(typeof(initfunc)!="function")
            throw new Error("2nd argument of Demo.addScene(title,initfunc) must be a function!");
        scenes.push(initfunc);
        var idx = scenes.length-1;
        scenePicker[title] = function(){
            changeScene(idx);
        };
        sceneFolder.add(scenePicker,title);
    };

    /**
    * @method restartCurrentScene
    * @memberof CANNON.Demo
    * @brief Restarts the current scene
    */
    function restartCurrentScene(){
        var N = bodies.length;
        for(var i=0; i<N; i++){
            var b = bodies[i];
            b.initPosition.copy(b.position);
            b.initVelocity.copy(b.velocity);
            if(b.initAngularVelocity){
                b.initAngularVelocity.copy(b.angularVelocity);
                b.initQuaternion.copy(b.quaternion);
            }
        }
    };

    function makeSureNotZero(vec){
        if(vec.x==0.0) vec.x = 1e-6;
        if(vec.y==0.0) vec.y = 1e-6;
        if(vec.z==0.0) vec.z = 1e-6;
    }

    function updateVisuals(){
        var N = bodies.length;

        // Read position data into visuals
        for(var i=0; i<N; i++){
            var b = bodies[i], visual = visuals[i];
            b.position.copy(visual.position);
            if(b.quaternion)
                b.quaternion.copy(visual.quaternion);
        }

        // Render contacts
        contactMeshCache.restart();
        if(settings.contacts){
            // if ci is even - use body i, else j
            for(var ci=0; ci < world.contacts.length; ci++){
                for(var ij=0; ij < 2; ij++){
                    var  mesh = contactMeshCache.request(),
                    c = world.contacts[ci],
                    b = ij==0 ? c.bi : c.bj,
                    r = ij==0 ? c.ri : c.rj;
                    mesh.position.set( b.position.x + r.x , b.position.y + r.y , b.position.z + r.z );
                }
            }
        }
        contactMeshCache.hideCached();

        // Lines from center of mass to contact point
        cm2contactMeshCache.restart();
        if(settings.cm2contact){
            for(var ci=0; ci<world.contacts.length; ci++){
                for(var ij=0; ij < 2; ij++){
                    var  line = cm2contactMeshCache.request(),
                    c = world.contacts[ci],
                    b = ij==0 ? c.bi : c.bj,
                    r = ij==0 ? c.ri : c.rj;
                    line.scale.set( r.x, r.y, r.z);
                    makeSureNotZero(line.scale);
                    b.position.copy(line.position);
                }
            }
        }
        cm2contactMeshCache.hideCached();

        distanceConstraintMeshCache.restart();
        p2pConstraintMeshCache.restart();
        if(settings.constraints){
            // Lines for distance constraints
            for(var ci=0; ci<world.constraints.length; ci++){
                var c = world.constraints[ci];
                if(!(c instanceof CANNON.DistanceConstraint))
                    continue;

                var bi=c.body_i, bj=c.body_j, line = distanceConstraintMeshCache.request();
                var i=bi.id, j=bj.id;

                // Remember, bj is either a Vec3 or a Body.
                var v;
                if(bj.position)
                    v = bj.position;
                else
                    v = bj;
                line.scale.set( v.x-bi.position.x,
                                v.y-bi.position.y,
                                v.z-bi.position.z );
                makeSureNotZero(line.scale);
                bi.position.copy(line.position);
            }


            // Lines for distance constraints
            for(var ci=0; ci<world.constraints.length; ci++){
                var c = world.constraints[ci];
                if(!(c instanceof CANNON.PointToPointConstraint))
                    continue;

                var bi=c.body_i, bj=c.body_j, relLine1 = p2pConstraintMeshCache.request(), relLine2 = p2pConstraintMeshCache.request(), diffLine = p2pConstraintMeshCache.request();
                var i=bi.id, j=bj.id;

                relLine1.scale.set( c.ri.x, c.ri.y, c.ri.z );
                relLine2.scale.set( c.rj.x, c.rj.y, c.rj.z );
                diffLine.scale.set( c.piWorld.x-c.pjWorld.x,
                                    c.piWorld.y-c.pjWorld.y,
                                    c.piWorld.z-c.pjWorld.z );
                makeSureNotZero(relLine1.scale);
                makeSureNotZero(relLine2.scale);
                makeSureNotZero(diffLine.scale);
                bi.position.copy(relLine1.position);
                bj.position.copy(relLine2.position);
                c.pjWorld.copy(diffLine.position);
            }
        }
        p2pConstraintMeshCache.hideCached();
        distanceConstraintMeshCache.hideCached();

        // Normal lines
        normalMeshCache.restart();
        if(settings.normals){
            for(var ci=0; ci<world.contacts.length; ci++){
                var c = world.contacts[ci];
                var bi=c.bi, bj=c.bj, line=normalMeshCache.request();
                var i=bi.id, j=bj.id;
                var n = c.ni;
                var b = bi;
                line.scale.set(n.x,n.y,n.z);
                makeSureNotZero(line.scale);
                b.position.copy(line.position);
                c.ri.vadd(line.position,line.position);
            }
        }
        normalMeshCache.hideCached();

        // Frame axes for each body
        axesMeshCache.restart();
        if(settings.axes){
            for(var bi=0; bi<bodies.length; bi++){
                var b = bodies[bi], mesh=axesMeshCache.request();
                b.position.copy(mesh.position);
                if(b.quaternion)
                    b.quaternion.copy(mesh.quaternion);
            }
        }
        axesMeshCache.hideCached();

        // AABBs
        bboxMeshCache.restart();
        if(settings.aabbs){
            for(var i=0; i<bodies.length; i++){
                var b = bodies[i];
                if(b.calculateAABB){
                    b.calculateAABB();
                    // Todo: cap the infinite AABB to scene AABB, for now just dont render
                    if( isFinite(b.aabbmax.x) &&
                        isFinite(b.aabbmax.y) &&
                        isFinite(b.aabbmax.z) &&
                        isFinite(b.aabbmin.x) &&
                        isFinite(b.aabbmin.y) &&
                        isFinite(b.aabbmin.z) && 
                        b.aabbmax.x - b.aabbmin.x != 0 && 
                        b.aabbmax.y - b.aabbmin.y != 0 && 
                        b.aabbmax.z - b.aabbmin.z != 0){
                            var mesh = bboxMeshCache.request();
                            mesh.scale.set( b.aabbmax.x - b.aabbmin.x,
                                            b.aabbmax.y - b.aabbmin.y,
                                            b.aabbmax.z - b.aabbmin.z);
                            mesh.position.set(  (b.aabbmax.x + b.aabbmin.x)*0.5,
                                                (b.aabbmax.y + b.aabbmin.y)*0.5,
                                                (b.aabbmax.z + b.aabbmin.z)*0.5);
                        }
                }
            }
        }
        bboxMeshCache.hideCached();
    }

    if ( ! Detector.webgl )
        Detector.addGetWebGLMessage();

    var SHADOW_MAP_WIDTH = 512;
    var SHADOW_MAP_HEIGHT = 512;
    var MARGIN = 0;
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
    var camera, controls, renderer;
    var container;
    var NEAR = 5, FAR = 2000;
    var sceneHUD, cameraOrtho, hudMaterial;

    var mouseX = 0, mouseY = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    init();
    animate();

    function init() {
        container = document.createElement( 'div' );
        document.body.appendChild( container );

        // Camera
        camera = new THREE.PerspectiveCamera( 24, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );

        camera.up.set(0,0,1);
        camera.position.set(0,30,20);

        // SCENE
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog( 0x222222, 1000, FAR );

        // LIGHTS
        ambient = new THREE.AmbientLight( 0x222222 );
        scene.add( ambient );

        light = new THREE.SpotLight( 0xffffff );
        light.position.set( 30, 30, 40 );
        light.target.position.set( 0, 0, 0 );

        light.castShadow = true;

        light.shadowCameraNear = 10;
        light.shadowCameraFar = 100;//camera.far;
        light.shadowCameraFov = 30;

        light.shadowMapBias = 0.0039;
        light.shadowMapDarkness = 0.5;
        light.shadowMapWidth = SHADOW_MAP_WIDTH;
        light.shadowMapHeight = SHADOW_MAP_HEIGHT;

        //light.shadowCameraVisible = true;

        scene.add( light );
        scene.add( camera );

        // RENDERER
        renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        renderer.domElement.style.position = "relative";
        renderer.domElement.style.top = MARGIN + 'px';
        container.appendChild( renderer.domElement );

        document.addEventListener('mousemove',onDocumentMouseMove);
        window.addEventListener('resize',onWindowResize);

        renderer.setClearColor( scene.fog.color, 1 );
        renderer.autoClear = false;

        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;

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
        //controls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]
        controls.screen.width = SCREEN_WIDTH;
        controls.screen.height = SCREEN_HEIGHT;
    }

    var t = 0, newTime, delta;

    function animate(){
        requestAnimationFrame( animate );
        if(!settings.paused){
            updateVisuals();
            updatePhysics();
        }
        render();
        stats.update();
    }

    function updatePhysics(){
        // Step world
        for(var i=0; i<Math.ceil(settings.stepFrequency/60); i++){
            world.step(1/settings.stepFrequency);
        }
    }

    function onDocumentMouseMove( event ) {
        mouseX = ( event.clientX - windowHalfX );
        mouseY = ( event.clientY - windowHalfY );
    }

    function onWindowResize( event ) {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;

        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

        camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
        camera.updateProjectionMatrix();

        controls.screen.width = SCREEN_WIDTH;
        controls.screen.height = SCREEN_HEIGHT;

        camera.radius = ( SCREEN_WIDTH + SCREEN_HEIGHT ) / 4;
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
                restartCurrentScene();
                break;

                case 104:
                if(stats.domElement.style.display=="none")
                    stats.domElement.style.display = "block";
                else
                    stats.domElement.style.display = "none";
                break;

                case 97: // a - AABBs
                settings.aabbs = !settings.aabbs;
                updategui();
                break;

                case 99: // c - constraints
                settings.constraints = !settings.constraints;
                updategui();
                break;

                case 112: // p
                settings.paused = !settings.paused;
                updategui();
                break;

                case 115: // s
                updatePhysics();
                updateVisuals();
                break;

                case 109: // m - toggle materials
                var idx = renderModes.indexOf(settings.rendermode);
                idx++;
                idx = idx % renderModes.length; // begin at 0 if we exceeded number of modes
                setRenderMode(renderModes[idx]);
                updategui();
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
                if(scenes.length > e.keyCode-49 && !document.activeElement.localName.match(/input/)){
                    changeScene(e.keyCode-49);
                }
                break;
            }
        }
    });

    if(window.dat!=undefined){
        gui = new dat.GUI();

        // Render mode
        var rf = gui.addFolder('Rendering');
        rf.add(settings,'rendermode',{Solid:"solid",Wireframe:"wireframe"}).onChange(function(mode){
            setRenderMode(mode);
        });
        rf.add(settings,'contacts');
        rf.add(settings,'cm2contact');
        rf.add(settings,'normals');
        rf.add(settings,'constraints');
        rf.add(settings,'axes');
        rf.add(settings,'particleSize').min(0).max(1).onChange(function(size){
            for(var i=0; i<visuals.length; i++){
                if(bodies[i] instanceof CANNON.Particle)
                    visuals[i].scale.set(size,size,size);
            }
        });
        rf.add(settings,'shadows').onChange(function(shadows){
            if(shadows){
                renderer.shadowMapAutoUpdate = true;
            } else {
                renderer.shadowMapAutoUpdate = false;
                renderer.clearTarget( light.shadowMap );
            }
        });
    rf.add(settings,'aabbs');

        // World folder
        var wf = gui.addFolder('World');
        // Pause
        wf.add(settings, 'paused');
        wf.add(settings, 'stepFrequency',60,60*10).step(60);
        var maxg = 100;
        wf.add(settings, 'gx',-maxg,maxg).onChange(function(gx){
            if(!isNaN(gx))
                world.gravity.set(gx,settings.gy,settings.gz);
        });
        wf.add(settings, 'gy',-maxg,maxg).onChange(function(gy){
            if(!isNaN(gy))
                world.gravity.set(settings.gx,gy,settings.gz);
        });
        wf.add(settings, 'gz',-maxg,maxg).onChange(function(gz){
            if(!isNaN(gz))
                world.gravity.set(settings.gx,settings.gy,gz);
        });
        wf.add(settings, 'quatNormalizeSkip',0,50).step(1).onChange(function(skip){
            if(!isNaN(skip)){
                world.quatNormalizeSkip = skip;
            }
        });
        wf.add(settings, 'quatNormalizeFast').onChange(function(fast){
            world.quatNormalizeFast = !!fast;
        });

        // Solver folder
        var sf = gui.addFolder('Solver');
        sf.add(settings, 'iterations',1,50).step(1).onChange(function(it){
            world.solver.iterations = it;
        });
        sf.add(settings, 'k',10,10000).onChange(function(k){
            world.solver.setSpookParams(k,world.solver.d);
        });
        sf.add(settings, 'd',0,20).step(0.1).onChange(function(d){
            world.solver.setSpookParams(world.solver.k,d);
        });

        // Scene picker
        var sceneFolder = gui.addFolder('Scenes');
        sceneFolder.open();
    }

    function changeScene(n){
        settings.paused = false;
        updategui();
        buildScene(n);
    }

    function shape2mesh(shape){
        var wireframe = settings.renderMode=="wireframe";
        var mesh;
        switch(shape.type){

            case CANNON.Shape.types.SPHERE:
            var sphere_geometry = new THREE.SphereGeometry( shape.radius, 8, 8);
            mesh = new THREE.Mesh( sphere_geometry, currentMaterial );
            break;

            case CANNON.Shape.types.PLANE:
            var geometry = new THREE.PlaneGeometry( 10, 10 , 4 , 4 );
            mesh = new THREE.Object3D();
            var submesh = new THREE.Object3D();
            var ground = new THREE.Mesh( geometry, currentMaterial );
            ground.scale = new THREE.Vector3(100,100,100);
            submesh.add(ground);

            ground.castShadow = true;
            ground.receiveShadow = true;

            mesh.add(submesh);
            break;

            case CANNON.Shape.types.BOX:
            var box_geometry = new THREE.CubeGeometry(  shape.halfExtents.x*2,
                                                        shape.halfExtents.y*2,
                                                        shape.halfExtents.z*2 );
            mesh = new THREE.Mesh( box_geometry, currentMaterial );
            break;

            case CANNON.Shape.types.CONVEXPOLYHEDRON:

            var verts = [];
            for(var i=0; i<shape.vertices.length; i++){
                verts.push(new THREE.Vector3(shape.vertices[i].x,
                shape.vertices[i].y,
                shape.vertices[i].z));
            }
            var geo = new THREE.ConvexGeometry( verts );
            mesh = new THREE.Mesh( geo, currentMaterial );

            break;

            case CANNON.Shape.types.COMPOUND:
            // recursive compounds
            var o3d = new THREE.Object3D();
            for(var i = 0; i<shape.childShapes.length; i++){

                // Get child information
                var subshape = shape.childShapes[i];
                var o = shape.childOffsets[i];
                var q = shape.childOrientations[i];
        
                var submesh = shape2mesh(subshape);
                submesh.position.set(o.x,o.y,o.z);
                submesh.quaternion.set(q.x,q.y,q.z,q.w);
        
                submesh.useQuaternion = true;
                o3d.add(submesh);
                mesh = o3d;
            }
            break;

            default:
            throw "Visual type not recognized: "+shape.type;
        }

        mesh.receiveShadow = true;
        mesh.castShadow = true;
        if(mesh.children){
            for(var i=0; i<mesh.children.length; i++){
                mesh.children[i].castShadow = true;
                mesh.children[i].receiveShadow = true;
                if(mesh.children[i]){
                    for(var j=0; j<mesh.children[i].length; j++){
                        mesh.children[i].children[j].castShadow = true;
                        mesh.children[i].children[j].receiveShadow = true;
                    }
                }
            }
        }
        return mesh;
    }

    function start(){
        buildScene(0);
    }

    function buildScene(n){
        // Remove current bodies and visuals
        var num = visuals.length;
        for(var i=0; i<num; i++){
            world.remove(bodies.pop());
            var mesh = visuals.pop();
            scene.remove(mesh);
        }
        // Remove all constraints
        while(world.constraints.length)
            world.removeConstraint(world.constraints[0]);
    
        // Run the user defined "build scene" function
        scenes[n]();

        // Read the newly set data to the gui
        settings.iterations = world.solver.iterations;
        settings.gx = world.gravity.x+0.0;
        settings.gy = world.gravity.y+0.0;
        settings.gz = world.gravity.z+0.0;
        settings.k = world.solver.k;
        settings.d = world.solver.d;
        updategui();

        restartGeometryCaches();
    };


    function addVisual(body){
        // What geometry should be used?
        var mesh;
        if(body instanceof CANNON.RigidBody)
            mesh = shape2mesh(body.shape);
        else if(body instanceof CANNON.Particle){
            mesh = new THREE.Mesh( particleGeo, particleMaterial );
            mesh.scale.set(settings.particleSize,settings.particleSize,settings.particleSize);
        }
        if(mesh) {
            // Add body
            bodies.push(body);
            visuals.push(mesh);
            body.visualref = mesh;
            body.visualref.visualId = bodies.length - 1;
            mesh.useQuaternion = true;
            scene.add(mesh);
        }
    };

    function removeVisual(body){
        if(body.visualref!=undefined){
            var old_b = [];
            var old_v = [];
            var n = bodies.length;
            for(var i=0; i<n; i++){
                old_b.unshift(bodies.pop());
                old_v.unshift(visuals.pop());
            }
            var id = body.visualref.visualId;
            for(var j=0; j<old_b.length; j++){
                if(j!=id){
                    var i = j>id ? j-1 : j;
                    bodies[i] = old_b[j];
                    visuals[i] = old_v[j];
                    bodies[i].visualref = old_b[j].visualref;
                    bodies[i].visualref.visualId = i;
                }
            }
            body.visualref.visualId = null;
            scene.remove(body.visualref);
            body.visualref = null;
        }
    };

    function getWorld(){
        return world;
    };

    function GeometryCache(createFunc){
        var that=this, geometries=[], gone=[];
        this.request = function(){
            if(geometries.length)
                geo = geometries.pop();
            else
                geo = createFunc();
            scene.add(geo);
            gone.push(geo);
            return geo;
        };

        this.restart = function(){
            while(gone.length)
                geometries.push(gone.pop());
        };

        this.hideCached = function(){
            for(var i=0; i<geometries.length; i++)
                scene.remove(geometries[i]);
        }
    }
}