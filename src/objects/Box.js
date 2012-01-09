/**
 * Box
 * @param Vec3 halfExtents
 * @author schteppe
 */
CANNON.Box = function(halfExtents){
  CANNON.Shape.call(this);
  this.halfExtents = halfExtents;
  this.type = CANNON.Shape.types.BOX;
};

CANNON.Box.prototype = new CANNON.Shape();
CANNON.Box.prototype.constructor = CANNON.Box;

CANNON.Box.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();
  target.x = 1.0 / 12.0 * mass * (   this.halfExtents.y*this.halfExtents.y
				   + this.halfExtents.z*this.halfExtents.z );
  target.y = 1.0 / 12.0 * mass * (   this.halfExtents.x*this.halfExtents.x
				   + this.halfExtents.z*this.halfExtents.z );
  target.z = 1.0 / 12.0 * mass * (   this.halfExtents.y*this.halfExtents.y
				   + this.halfExtents.x*this.halfExtents.x );
  return target;
};
