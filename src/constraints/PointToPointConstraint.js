/**
 * Point to point constraint class
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.Vec3 pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
 * @param CANNON.RigidBody bodyB Optional. If specified, pivotB must also be specified, and bodyB will be constrained in a similar way to the same point as bodyA. We will therefore get sort of a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
 * @param CANNON.Vec3 pivotB Optional.
 */
CANNON.PointToPointConstraint = function(bodyA,pivotA,bodyB,pivotB){
  CANNON.Constraint.call(this);
  this.body_i = bodyA;
  this.body_j = bodyB;
  this.pivot_i = pivotA;
  this.pivot_j = pivotB;

  // Need 3 equations, 1 normal + 2 tangent
  for(var i=0; i<3; i++)
    this.equations.push(new Equation(bodyA,bodyB));
};

CANNON.PointToPointConstraint.prototype = new CANNON.Constraint();
CANNON.PointToPointConstraint.prototype.constructor = CANNON.PointToPointConstraint;

/**
 * @todo
 */
CANNON.PointToPointConstraint.prototype.update = function(){
  /*
  var eq = this.equations[0], bi = this.body_i, bj = this.body_j;

  // Jacobian is the distance unit vector
  bj.position.vsub(bi.position,eq.G1);
  eq.G1.normalize();
  eq.G1.negate(eq.G3);
  
  // Mass properties
  eq.setDefaultMassProps();
  eq.setDefaultForce();

  // Constraint violation
  eq.g1.set(bj.position.x - bi.position.x - eq.G1.x*dist,
	    bj.position.y - bi.position.y - eq.G1.y*dist,
	    bj.position.z - bi.position.z - eq.G1.z*dist);
  eq.g1.negate(eq.g3);  
  */
};