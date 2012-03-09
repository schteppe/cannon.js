/**
 * Point to point constraint class
 * @author schteppe
 * @param RigidBody bodyA
 * @param Vec3 pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
 * @param RigidBody bodyB Optional. If specified, pivotB must also be specified, and bodyB will be constrained in a similar way to the same point as bodyA. We will therefore get sort of a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
 * @param Vec3 pivotB Optional.
 */
CANNON.PointToPointConstraint = function(bodyA,pivotA,bodyB,pivotB){
  CANNON.Constraint.call(this);
};

CANNON.PointToPointConstraint.prototype = new CANNON.Constraint();
CANNON.PointToPointConstraint.prototype.constructor = CANNON.PointToPointConstraint;

/**
 * @todo
 */
CANNON.PointToPointConstraint.prototype.update = function(){
  throw "PointToPointConstraint.update() is @todo";
};