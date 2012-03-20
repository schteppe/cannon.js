# cannon.js - a lightweight 3D physics engine for the web

<a href="http://schteppe.github.com/cannon.js/examples/container.html"><img src="http://schteppe.github.com/cannon.js/images/container.png" height="200" alt="Container"></a>
<a href="http://schteppe.github.com/cannon.js/examples/boxes.html"><img src="http://schteppe.github.com/cannon.js/images/boxes.png" height="200" alt="Boxes"></a>

<a href="http://schteppe.github.com/cannon.js"> All examples >></a>

Inspired by [three.js](https://github.com/mrdoob/three.js) and [ammo.js](https://github.com/kripken/ammo.js), and driven by the fact that the web lacks a physics engine, here comes cannon.js.

## Features

* Lightweight - less than 50Kb compressed. For comparison: [ammo.js](https://github.com/kripken/ammo.js/) uses 1.12Mb when compressed.
* Supports solid spheres and static planes at the moment - soon also boxes
* 100% open source JavaScript, written from scratch
* Uses typed arrays for [fast number crunching](http://granular.cs.umu.se/browserphysics/?p=729)
* Uses an iterative Gauss-Seidel solver to solve generic constraints
* Uses [SPOOK](https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf) for time stepping

## Example

```javascript
// Setup our world
var world = new CANNON.World();
world.gravity(new CANNON.Vec3(0,0,-9.82));
var bp = new CANNON.BroadPhase();
world.broadphase(bp);
    
// Create a sphere
var mass = 5, radius = 1;
var sphereShape = new CANNON.Sphere(radius);
var sphereBody = new CANNON.RigidBody(mass,sphereShape);
sphereBody.setPosition(0,0,10);
world.add(sphereBody);
    
// Create a plane
var normal = new CANNON.Vec3(0,0,1);
var groundShape = new CANNON.Plane(normal);
var groundBody = new CANNON.RigidBody(0,groundShape);
world.add(groundBody);
    
// Step the simulation
setInterval(function(){
  world.step(1.0/60.0);
  var pos = sphereBody.getPosition();
  console.log("Sphere z position: "+pos.x);
}, 1000.0/60.0);
```

# Developer instructions

## Todo

* Box/box collision
* Friction constraints
* Better collision detection - spatial hashing, octrees or similar
* Rename the current Solver class to GSSolver, and make the Solver class to a base class
* ParallelSolver that uses Web Workers - splits the system into islands and then adds to subsolvers (may be any other solver) - see http://www.html5rocks.com/en/tutorials/workers/basics/
* Remove objects during simulation
* Caching of bounding sphere radius
* Shapes: Cone, cylinder, compound
* Search for "@todo" if you want to find more things to do

## Build

When a new version of the software has been made, a new build needs to be made. Run <code>cd cannon.js/utils/; ./build.py;</code> to do this. The version number will be read from <code>cannon.js/VERSION</code> and put into the built files, so update VERSION first. The software versioning should follow the Semantic Version Specification: http://semver.org/

## Documentation

The documentation is made using Doxygen-style blocks before each class, method and property.

## Examples

To be able to view the examples on the web using Github Pages, the code need to be copied to that public branch. The master branch is therefore being merged into the gh-pages branch now and then, eg <code>git checkout gh-pages; git merge master;</code>. This way we can use file references in the examples transparently.

## Profiling / optimizing the code

Use the FireBug profiling function <code>console.profile();</code> before the <code>world.step();</code> and <code>console.profileEnd();</code> afterwards. Open FireBug and you'll see execution times for each function. All entries will be on anonymous functions, but you can always look up the corresponding function in the code.
Hopefully, profiling will be integrated in the future debug renderer so it can be used by pressing a button.