/**
 * Box
 * @param Vec3 halfExtents
 * @param float mass
 * @author schteppe
 */
PHYSICS.Box = function(halfExtents,mass){
  // Extend rigid body class
  PHYSICS.RigidBody.apply(this,
			  [PHYSICS.RigidBody.types.BOX]);
  this._halfExtents = halfExtents;
  this.mass = mass || 1;
}