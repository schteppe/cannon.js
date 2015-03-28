# cannon.js

### Lightweight 3D physics for the web
Inspired by [three.js](https://github.com/mrdoob/three.js) and [ammo.js](https://github.com/kripken/ammo.js), and driven by the fact that the web lacks a physics engine, here comes cannon.js.
The rigid body physics engine includes simple collision detection, various body shapes, contacts, friction and constraints.

[Demos](http://schteppe.github.com/cannon.js) - [Documentation](http://schteppe.github.com/cannon.js/docs) - [Rendering hints](https://github.com/schteppe/cannon.js/tree/master/examples) - [NPM package](https://npmjs.org/package/cannon) - [CDN](https://cdnjs.com/libraries/cannon.js)

### Browser install

Just include [cannon.js](https://github.com/schteppe/cannon.js/releases/download/v0.6.1/cannon.js) or [cannon.min.js](https://github.com/schteppe/cannon.js/releases/download/v0.6.1/cannon.min.js) in your html and you're done:

```html
<script src="cannon.min.js"></script>
```

### Node.js install

Install the cannon package via NPM:

```bash
npm install --save cannon
```

Alternatively, point to the Github repo directly to get the very latest version:

```bash
npm install --save schteppe/cannon.js
```

### Example

The sample code below creates a sphere on a plane, steps the simulation, and prints the sphere simulation to the console. Note that Cannon.js uses [SI units](http://en.wikipedia.org/wiki/International_System_of_Units) (metre, kilogram, second, etc.).

```javascript
// Setup our world
var world = new CANNON.World({
   gravity: new CANNON.Vec3(0, 0, -9.82) // m/s²
});

// Create a sphere
var radius = 1; // m
var sphereBody = new CANNON.Body({
   mass: 5, // kg
   position: new CANNON.Vec3(0, 0, 10), // m
   shape: new CANNON.Sphere(radius)
});
world.addBody(sphereBody);

// Create a plane
var groundBody = new CANNON.Body({
    mass: 0 // mass == 0 makes the body static
});
var groundShape = new CANNON.Plane();
groundBody.addShape(groundShape);
world.addBody(groundBody);

var fixedTimeStep = 1.0 / 60.0; // seconds
var maxSubSteps = 3;

// Start the simulation loop
var lastTime;
(function simloop(time){
  requestAnimationFrame(simloop);
  if(lastTime !== undefined){
     var dt = (time - lastTime) / 1000;
     world.step(fixedTimeStep, dt, maxSubSteps);
  }
  console.log("Sphere z position: " + sphereBody.position.z);
  lastTime = time;
})();
```

If you want to know how to use cannon.js with a rendering engine, for example Three.js, see the [Examples](examples).

### Features
* Rigid body dynamics
* Discrete collision detection
* Contacts, friction and restitution
* Constraints
   * PointToPoint (a.k.a. ball/socket joint)
   * Distance
   * Hinge (with optional motor)
   * Lock
   * ConeTwist
* Gauss-Seidel constraint solver and an island split algorithm
* Collision filters
* Body sleeping
* Experimental SPH / fluid support
* Various shapes and collision algorithms (see table below)

|             | [Sphere](http://schteppe.github.io/cannon.js/docs/classes/Sphere.html) | [Plane](http://schteppe.github.io/cannon.js/docs/classes/Plane.html) | [Box](http://schteppe.github.io/cannon.js/docs/classes/Box.html) | [Convex](http://schteppe.github.io/cannon.js/docs/classes/ConvexPolyhedron.html) | [Particle](http://schteppe.github.io/cannon.js/docs/classes/Particle.html) | [Heightfield](http://schteppe.github.io/cannon.js/docs/classes/Heightfield.html) | Trimesh |
| :-----------|:------:|:-----:|:---:|:------:|:--------:|:-----------:|:-------:|
| Sphere      | Yes    | Yes   | Yes | Yes    | Yes      | Yes         | Yes     |
| Plane       | -      | -     | Yes | Yes    | Yes      | -           | Yes     |
| Box         | -      | -     | Yes | Yes    | Yes      | Yes         | (todo)  |
| Cylinder    | -      | -     | Yes | Yes    | Yes      | Yes         | (todo)  |
| Convex      | -      | -     | -   | Yes    | Yes      | Yes         | (todo)  |
| Particle    | -      | -     | -   | -      | -        | (todo)      | (todo)  |
| Heightfield | -      | -     | -   | -      | -        | -           | (todo)  |
| Trimesh     | -      | -     | -   | -      | -        | -           | -       |

### Todo
The simpler todos are marked with ```@todo``` in the code. Github Issues can and should also be used for todos.

### Help
Create an [issue](https://github.com/schteppe/cannon.js/issues) if you need help.
