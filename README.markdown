# cannon.js

### Lightweight 3D physics for the web
Inspired by [three.js](https://github.com/mrdoob/three.js) and [ammo.js](https://github.com/kripken/ammo.js), and driven by the fact that the web lacks a physics engine, here comes cannon.js.

[Demos](http://schteppe.github.com/cannon.js) - [Documentation](http://schteppe.github.com/cannon.js/doc/) - [Rendering hints](https://github.com/schteppe/cannon.js/tree/master/examples) - [NPM package](https://npmjs.org/package/cannon)

### Usage 
Download [the library](https://raw.github.com/schteppe/cannon.js/master/build/cannon.js) and include it in your html. Alternatively, build the library yourself (see [Makefile](https://github.com/schteppe/cannon.js/blob/master/Makefile)).

```html
<script src="cannon.js"></script>
```

The code below creates a sphere on a plane, steps the simulation, and prints the sphere simulation to the console.

```javascript
// Setup our world
var world = new CANNON.World();
world.gravity.set(0,0,-9.82);
world.broadphase = new CANNON.NaiveBroadphase();
    
// Create a sphere
var mass = 5, radius = 1;
var sphereShape = new CANNON.Sphere(radius);
var sphereBody = new CANNON.RigidBody(mass,sphereShape);
sphereBody.position.set(0,0,10);
world.add(sphereBody);
    
// Create a plane
var groundShape = new CANNON.Plane();
var groundBody = new CANNON.RigidBody(0,groundShape);
world.add(groundBody);
    
// Step the simulation
setInterval(function(){
  world.step(1.0/60.0);
  console.log("Sphere z position: " + sphereBody.position.z);
}, 1000.0/60.0);
```

If you want to know how to use cannon.js with a rendering engine, for example Three.js, see the [Examples](https://github.com/schteppe/cannon.js/tree/master/examples).

### Change log
**Current**
 * Added property ```World.enableImpulses```
 * Added ```PointToPointConstraint```
 * Added ```Cylinder```.
 * Added method ```RigidBody.applyImpulse```
 * Added "iterator" method ```Box.forEachWorldCorner```
 * Added "abstract method" ```Shape.calculateWorldAABB``` and implemented it in subclasses.
 * Removed ```Plane.normal``` in favor of ```RigidBody.quaternion```. One way to rotate a plane is enough.

**0.4.3**
 * ```World``` now dispatches "preStep" and "postStep" events.
 * Introduced ```Body``` and ```Particle```. New inheritance: ```Body``` -> ```Particle``` -> ```RigidBody```.
 * Added ```Quaternion.toAxisAngle()```
 * Added ```Ray```. Basic hit testing for ```ConvexPolyhedra```.
 * ```RigidBody``` now dispatches the following events: ```"collide"```, ```"sleep"```, ```"sleepy"```, ```"wakeup"```
 * Added ```Solver.setSpookParams(k,d)``` and removed SPOOK param things from ```World```.
 * Sleep functionality for ```RigidBody```

**0.4.2** 2012-08-06
 * Code seem stable enough to start a change log.


### Todo
Ideas and todo's for developers. The todo's are marked with ```@todo``` in the code.
* Collision/contacts between convexhulls and sphere
* Contact reduction
* Improved collision detection - spatial hashing, octrees or similar (Continous?)
* Figure out good Solver base class API - make current Solver to a subclass
* Better class structure for Constraints, Jacobian entries etc
* ParallelSolver that uses Web Workers - splits system into independent parts and solves them in parallel - see http://www.html5rocks.com/en/tutorials/workers/basics/
* Caching of bounding sphere radius
* Shapes (based on ConvexHull is enough to begin with): Cone, cylinder
* First-contact impulse forces