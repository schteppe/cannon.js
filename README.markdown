# cannon.js - a lightweight 3D physics engine for the web

<img src="http://granular.cs.umu.se/browserphysics/wp-content/uploads/2012/01/myphysicslib_javascript.png" width="300">

Inspired by [three.js](https://github.com/mrdoob/three.js) and [ammo.js](https://github.com/kripken/ammo.js), and driven by the fact that the web lacks a physics engine, here comes cannon.js.

## Example
    // Setup our world
    var world = new PHYSICS.World();
    world.gravity(new PHYSICS.Vec3(0,0,-50));
    var bp = new PHYSICS.BroadPhase();
    world.broadphase(bp);
    
    // Create a plane
    var plane = new PHYSICS.Plane(new PHYSICS.Vec3(0,0,0), new PHYSICS.Vec3(0,0,1));
    world.add(plane);
    
    // Create a box
    var sphere = new PHYSICS.Sphere(new PHYSICS.Vec3(0,0,2),1,5);
    world.add(sphere);
    
    // Step the simulation
    setInterval(function(){
      world.step(1.0/60.0);
    }, 1000.0/60.0);
    
## Features

* 100% JavaScript, written from scratch
* Uses typed arrays for fast number crunching
* Supports solid spheres and static planes
* Lightweight - less than 30Kb compressed. For comparison: ammo.js uses 1.12Mb when compressed.
* Uses an iterative Gauss-Seidel solver to solve generic constraints
* Uses [SPOOK](https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf) for time stepping

## Todo

* 3D box support
* Better collision detection - spatial hashing or similar
* Debug app that uses three.js or scenejs