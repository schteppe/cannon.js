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

### Supported contact shape pairs
|           | Sphere | Plane | Box | Compound | Convex¹ | Particle |
| :-------: |:------:|:-----:|:---:|:--------:|:-------:|:--------:|
| Sphere    | Yes    | Yes   | Yes | Yes      | Yes     | Yes      |
| Plane     | -      | -     | Yes | Yes      | Yes     | Yes      |
| Box       | -      | -     | Yes | Yes      | Yes     | Yes      |
| Compound  | -      | -     | -   | Yes      | Yes     | Yes      |
| Convex¹   | -      | -     | -   | -        | Yes     | Yes      |
| Particle  | -      | -     | -   | -        | -       | -        |

¹ including Cylinder

### Change log
**Current**
 * Changed API for adding forces and impulses to a body. See ```RigidBody.addImpulse``` and ```RigidBody.addForce```.
 * Removed ```World.collision_matrix``` and instead added ```World.collisionMatrix``` and ```World.collisionMatrixPrevious```. They both now work with body indices instead of body IDs.
 * Added ```SPHSystem```.
 * Renamed ```RigidBody.calculateAABB``` to ```.computeAABB```. Added ```RigidBody.aabbNeedsUpdate```.
 * Added ```Broadphase.useBoundingBoxes```, ```.doBoundingBoxBroadphase``` and ```.intersectionTest```.
 * ```ConvexPolyhedron``` constructor now calculates normals instead of taking them as a parameter.
 * Added ```Body.collisionFilterGroup``` and ```Body.collisionFilterMask```.
 * Added ```GridBroadphase```, though it only supports ```Plane``` and ```Sphere``` for now.
 * Removed World.temp.
 * Reuse of various event objects to minimize object creation in the step loop.
 * Removed unused class ```ContactPoint```.
 * Changed the signature of ```Broadphase.collisionPairs``` to ```Broadphase.collisionPairs(world,pairs1,pairs2)```, removing the need of an array return value.

**0.5.0**
 * Changed unit of sleep properties in ```Particle``` to seconds instead of milliseconds, made ```Particle.sleepState``` public. (schteppe,airbaggins).
 * Changed property ```Shape.boundingSphereRadius``` to being a number, added method ```Shape.computeBoundingSphereRadius``` and ```.boundingSphereRadiusNeedsUpdate```
 * Removed ```Box.getCorners```
 * Added properties to ```ContactMaterial```:  ```.contactEquationStiffness```, ```.contactEquationRegularizationTime```, ```.frictionEquationStiffness```, ```.frictionEquationRegularizationTime``` to be able to control settings for the on-the-fly created contact constraints
 * Renamed the solver parameter "damping" to "regularizationTime", since it is a more correct name.
 * Solver parameters (stiffness, damping etc) were moved from ```Solver``` to ```Equation```. Now you control the solver parameters per constraint instead of globally.
 * Added ```HingeConstraint``` and its ```Constraint``` base class
 * Added contact support for all possible ```Shape.types``` (see table above).
 * Fixed convex contact bugs.
 * Added method ```ConvexPolyhedron.getAveragePointLocal```.
 * Added method ```ConvexPolyhedron.transformAllPoints```.
 * Added ```SplitSolver```.
 * Removed use of typed arrays, since they are slower than ordinary ones.   
 * Corrected applying of linear and angular damping, should now be physically correct and independent of timestep size.
 * Renamed ```Solver``` to ```GSSolver```, made ```Solver``` a base class instead.
 * Added method ```Mat3.setTrace```
 * ```ContactGenerator``` now produces ```ContactEquation``` instead of ```ContactPoint```
 * Added property ```Solver.tolerance```
 * Changed default ```Solver``` parameter values
 * Improved ```Solver``` algorithm, the parameters ```.a```, ```.b```, ```.k```, ```.d```, ```.eps``` do not have the same effect anymore.
 * Rewrote ```Solver```, ```Equation``` and ```Constraint``` totally, broke backward compatibility.
 * Added property ```World.enableImpulses``` - still an experimental feature
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
The simpler todos are marked with ```@todo``` in the code. Github Issues can and should also be used for todos.

### Help
Create an issue on here if you need help.
