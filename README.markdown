# cannon.js - a lightweight 3D physics engine for the web

<a href="http://schteppe.github.com/cannon.js"> Click here for examples >><br><img src="http://granular.cs.umu.se/browserphysics/wp-content/uploads/2012/01/myphysicslib_javascript.png" width="300"></a>

Inspired by [three.js](https://github.com/mrdoob/three.js) and [ammo.js](https://github.com/kripken/ammo.js), and driven by the fact that the web lacks a physics engine, here comes cannon.js.

## Features

* Lightweight - less than 40Kb compressed. For comparison: [ammo.js](https://github.com/kripken/ammo.js/) uses 1.12Mb when compressed.
* Supports solid spheres and static planes at the moment - soon also boxes
* 100% open source JavaScript, written from scratch
* Uses typed arrays for [fast number crunching](http://granular.cs.umu.se/browserphysics/?p=729)
* Uses an iterative Gauss-Seidel solver to solve generic constraints
* Uses [SPOOK](https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf) for time stepping

## Example

```javascript
// Setup our world
var world = new CANNON.World();
world.gravity(new CANNON.Vec3(0,0,-50));
var bp = new CANNON.BroadPhase();
world.broadphase(bp);
    
// Create a plane
var groundShape = new CANNON.Plane(new CANNON.Vec3(0,0,1));
var groundBody = new CANNON.RigidBody(0,groundShape);
world.add(groundBody);
    
// Create a sphere
var sphereShape = new CANNON.Sphere(1);
var sphereBody = new CANNON.RigidBody(5,sphereShape);
world.add(sphereBody);
    
// Step the simulation
setInterval(function(){
  world.step(1.0/60.0);
}, 1000.0/60.0);
```

# Developer instructions

## Todo

* Box/box collision
* Box/sphere collision
* Friction constraints
* Better collision detection - spatial hashing, octrees or similar
* Debug app that uses three.js or scenejs
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
