# cannon.js

### Lightweight 3D physics for the web
Inspired by [three.js](https://github.com/mrdoob/three.js) and [ammo.js](https://github.com/kripken/ammo.js), and driven by the fact that the web lacks a physics engine, here comes cannon.js.
The rigid body physics engine includes simple collision detection, various body shapes, contacts, friction and constraints.

[Demos](http://schteppe.github.com/cannon.js) - [Documentation](http://schteppe.github.com/cannon.js/docs) - [Rendering hints](https://github.com/schteppe/cannon.js/tree/master/examples) - [NPM package](https://npmjs.org/package/cannon)

### Usage
Optionally, start by building the library using [Grunt](http://gruntjs.com/).

Include [build/cannon.js](build/cannon.js) in your html:

```html
<script src="cannon.js"></script>
```

Then you can start experimenting.

The sample code below creates a sphere on a plane, steps the simulation, and prints the sphere simulation to the console. Note that Cannon.js uses [SI units](http://en.wikipedia.org/wiki/International_System_of_Units) (metre, kilogram, second, etc.).

```javascript
// Setup our world
var world = new CANNON.World();
world.gravity.set(0,0,-9.82); // m/s²
world.broadphase = new CANNON.NaiveBroadphase();

// Create a sphere
var radius = 1; // m
var sphereBody = new CANNON.Body({
   mass: 5 // kg
});
var sphereShape = new CANNON.Sphere(radius);
sphereBody.addShape(sphereShape);
sphereBody.position.set(0,0,10); // m
world.add(sphereBody);

// Create a plane
var groundBody = new CANNON.Body({
    mass: 0 // mass == 0 makes the body static
});
var groundShape = new CANNON.Plane();
groundBody.addShape(groundShape);
world.add(groundBody);

// Step the simulation
setInterval(function(){
  var timeStep = 1.0/60.0; // seconds
  world.step(timeStep);
  console.log("Sphere z position: " + sphereBody.position.z);
}, 1000.0/60.0);
```

If you want to know how to use cannon.js with a rendering engine, for example Three.js, see the [Examples](examples).

### Features
* Rigid body physics
* Collision detection (no CCD)
* Contacts with friction and restitution
* Constraints
   * PointToPoint (also called balljoint)
   * Distance
   * Hinge (with optional motor)
* Gauss-Seidel constraint solver and an island split algorithm
* Collision filters
* Body motion states (dynamic, kinematic, static)
* Body sleeping
* Experimental SPH / fluid support
* Various shapes and collisions (see table below)

|             | Sphere | Plane | Box | Convex | Particle | Heightfield |
| :-----------|:------:|:-----:|:---:|:------:|:--------:|:-----------:|
| Sphere      | Yes    | Yes   | Yes | Yes    | Yes      | Yes         |
| Plane       | -      | -     | Yes | Yes    | Yes      | -           |
| Box         | -      | -     | Yes | Yes    | Yes      | Yes         |
| Cylinder    | -      | -     | Yes | Yes    | Yes      | Yes         |
| Convex      | -      | -     | -   | Yes    | Yes      | Yes         |
| Particle    | -      | -     | -   | -      | -        | (todo)      |
| Heightfield | -      | -     | -   | -      | -        | -           |

### Todo
The simpler todos are marked with ```@todo``` in the code. Github Issues can and should also be used for todos.

### Help
Create an issue on here if you need help.
