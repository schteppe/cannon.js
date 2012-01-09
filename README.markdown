# cannon.js - a lightweight 3D physics engine for the web

<img src="http://granular.cs.umu.se/browserphysics/wp-content/uploads/2012/01/myphysicslib_javascript.png" width="300">

Inspired by [three.js](https://github.com/mrdoob/three.js) and [ammo.js](https://github.com/kripken/ammo.js), and driven by the fact that the web lacks a physics engine, here comes cannon.js.
    
## Features

* Lightweight - less than 30Kb compressed. For comparison: ammo.js uses 1.12Mb when compressed.
* Supports solid spheres and static planes at the moment - soon also boxes
* 100% open source JavaScript, written from scratch
* Uses typed arrays for fast number crunching
* Uses an iterative Gauss-Seidel solver to solve generic constraints
* Uses [SPOOK](https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf) for time stepping

## Example
    // Setup our world
    var world = new PHYSICS.World();
    world.gravity(new PHYSICS.Vec3(0,0,-50));
    var bp = new PHYSICS.BroadPhase();
    world.broadphase(bp);
    
    // Create a plane
    var plane = new PHYSICS.Plane(new PHYSICS.Vec3(0,0,0), new PHYSICS.Vec3(0,0,1));
    world.add(plane);
    
    // Create a sphere
    var sphere = new PHYSICS.Sphere(new PHYSICS.Vec3(0,0,2),1,5);
    world.add(sphere);
    
    // Step the simulation
    setInterval(function(){
      world.step(1.0/60.0);
    }, 1000.0/60.0);

## Todo

* Material and ContactMaterial classes
* Impulses should be applied when two objects are overlapping and approaching each other - then contact constraint solving if we still have contact
* Friction constraints for spheres and boxes
* Better collision detection - spatial hashing, octrees or similar
* Debug app that uses three.js or scenejs
* Parallel solver that uses Web Workers - splits the system and adds to a subsolver (may be any other solver) - see http://www.html5rocks.com/en/tutorials/workers/basics/