# cannon.js - a lightweight 3D physics engine for the web

<a href="http://schteppe.github.com/cannon.js/demos/container.html"><img src="http://schteppe.github.com/cannon.js/images/container2.png" height="150" alt="Container"></a>
<a href="http://schteppe.github.com/cannon.js/demos/stacks.html"><img src="http://schteppe.github.com/cannon.js/images/stack.png" height="150" alt="Stacks"></a>
<a href="http://schteppe.github.com/cannon.js/demos/pile2.html"><img src="http://schteppe.github.com/cannon.js/images/pile.png" height="150" alt="Pile"></a>
<a href="http://schteppe.github.com/cannon.js/demos/compound.html"><img src="http://schteppe.github.com/cannon.js/images/compound.png" height="150" alt="Compound"></a>

<a href="http://schteppe.github.com/cannon.js"> All demos >></a>

Inspired by [three.js](https://github.com/mrdoob/three.js) and [ammo.js](https://github.com/kripken/ammo.js), and driven by the fact that the web lacks a physics engine, here comes cannon.js.

## Features

* Lightweight - less than 50Kb compressed. For comparison: [ammo.js](https://github.com/kripken/ammo.js/) uses 1.12Mb when compressed.
* 100% open source JavaScript, written from scratch
* Uses an iterative Gauss-Seidel solver to solve generic constraints
* Uses [SPOOK](https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf) for time stepping

## Example

```javascript
// Setup our world
var world = new CANNON.World();
world.gravity.set(0,0,-9.82);
world.broadphase = new CANNON.Broadphase();
    
// Create a sphere
var mass = 5, radius = 1;
var sphereShape = new CANNON.Sphere(radius);
var sphereBody = new CANNON.RigidBody(mass,sphereShape);
sphereBody.position.set(0,0,10);
world.add(sphereBody);
    
// Create a plane
var normal = new CANNON.Vec3(0,0,1);
var groundShape = new CANNON.Plane(normal);
var groundBody = new CANNON.RigidBody(0,groundShape);
world.add(groundBody);
    
// Step the simulation
setInterval(function(){
  world.step(1.0/60.0);
  console.log("Sphere z position: " + sphereBody.position.z);
}, 1000.0/60.0);
```

## Documentation

Here is a [live version](http://schteppe.github.com/ghdoc/#schteppe/cannon.js/master).

# Developer instructions

## Todo

* Box/box collision
* Better collision detection - spatial hashing, octrees or similar
* Rename the current Solver class to GSSolver, and make the Solver class to a base class
* ParallelSolver that uses Web Workers - splits the system into islands and then adds to subsolvers (may be any other solver) - see http://www.html5rocks.com/en/tutorials/workers/basics/
* Caching of bounding sphere radius
* Better class structure for Constraints, Jacobian entries etc
* Shapes: Cone, cylinder, TriangleMeshShape, ConvexHullShape
* Search for "@todo" if you want to find more things to do

## Build

When a new version of the software has been made, a new build needs to be made. Run <code>cd cannon.js/utils/; ./build.py;</code> to do this. The version number will be read from <code>cannon.js/VERSION</code> and put into the built files, so update VERSION first. The software versioning should follow the Semantic Version Specification: http://semver.org/