# How to render a Cannon.js scene

You've learnt how to render really cool 3D in the browser, and now you want your mesh to move. You add your favorite physics engine (cannon.js) to your project, and then... what?

These examples demonstrates how to render a Cannon.js physics scene using commonly used 3D libraries. The main problem is to make a mesh move according to a ```CANNON.RigidBody``` by synchronizing coordinates (position and orientation).

If you are looking for more in-depth examples on how to use Cannon.js, go to the [demos](https://github.com/schteppe/cannon.js/tree/master/demos) instead.

### Three.js

One of the most convenient ways of using Cannon.js with [Three.js](https://github.com/mrdoob/three.js/) is by enabling use of quaternions:

```javascript
mesh.useQuaternion = true;
```

Then it gets really simple to copy over position+orientation data to the Three.js mesh:
```javascript
rigidbody.position.copy(mesh.position);
rigidbody.quaternion.copy(mesh.quaternion);
```

See [threejs.html](https://github.com/schteppe/cannon.js/blob/master/examples/threejs.html) for a full example.

### SceneJS

[SceneJS](http://scenejs.org/) [supports quaternions](http://scenejs.wikispaces.com/quaternion), too. When setting up your scene, make sure to create a translation node and a quaternion node for your mesh.

```
...
{
  type: "translate",
  id: "my-translate",
  x : 0.0, y : 0.0, z : 0.0,
  
  nodes: [
    {
      type: "quaternion",
      id: "my-quaternion",
      x : 1.0, y : 0.0, z : 0.0, angle : 0.0,
            
      nodes: [
...
```
The update of these nodes can be done like this:
```
scene.findNode("my-translate").set("xyz",{ x:0.0, y:0.0, z:0.0});
scene.findNode("my-quaternion").set("rotation",{ x:0.0, y:0.0, z:0.0, angle:0.0 });
```
The full example, and how to get the axis/angle representation of the ```CANNON.Quaternion```, can be found in [scenejs.html](https://github.com/schteppe/cannon.js/blob/master/examples/scenejs.html).