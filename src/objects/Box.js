/**
 * Box
 * @param Vec3 halfExtents
 * @param float mass
 * @author schteppe
 */
CANNON.Box = function(halfExtents,mass){
  // Extend rigid body class
  CANNON.RigidBody.apply(this,
			  [CANNON.RigidBody.types.BOX]);
  this._halfExtents = halfExtents;
  this.mass = mass!=undefined ? mass : 0;
};
