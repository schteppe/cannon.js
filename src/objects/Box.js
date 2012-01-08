/**
 * Box
 * @param Vec3 halfExtents
 * @param float mass
 * @author schteppe
 */
CANNON.Box = function(halfExtents,mass){
  // Extend rigid body class
  CANNON.RigidBody.apply(this,[CANNON.RigidBody.types.BOX]);
  this._halfExtents = halfExtents;
  this.mass = mass!=undefined ? mass : 0;
};

CANNON.Box.prototype = new CANNON.RigidBody();
CANNON.Box.prototype.constructor = CANNON.Box;
