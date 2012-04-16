/**
 * Distance constraint class
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.RigidBody bodyB
 * @param float distance
 * @todo test
 */
CANNON.DistanceConstraint = function(bodyA,bodyB,distance){
  CANNON.Constraint.call(this);
  this.body_i = bodyA;
  this.body_j = bodyB;
  this.distance = distance;
  var eq = new CANNON.Equation(bodyA,bodyB);
  this.equations.push(eq);
};

CANNON.DistanceConstraint.prototype = new CANNON.Constraint();
CANNON.DistanceConstraint.prototype.constructor = CANNON.DistanceConstraint;

CANNON.DistanceConstraint.prototype.update = function(){
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
};

CANNON.DistanceConstraint.prototype.setMaxForce = function(f){
  // @todo rescale with masses
  this.equations[0].lambdamax = Math.abs(f);
  this.equations[0].lambdamin = -this.equations[0].lambdamax;
};