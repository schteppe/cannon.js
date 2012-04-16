/**
 * Contact constraint class
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.RigidBody bodyB
 * @param float friction
 * @todo test
 */
CANNON.ContactConstraint = function(bodyA,bodyB,slipForce){
  CANNON.Constraint.call(this);
  this.body_i = bodyA;
  this.body_j = bodyB;
  this.contact = contact;
  if(friction>0.0){
    for(var i=0; i<3; i++)
      this.equations.push(new CANNON.Equation(bodyA,bodyB));
  } else
    this.equations.push(new CANNON.Equation(bodyA,bodyB));
  this.slipForce = slipForce;
};

CANNON.ContactConstraint.prototype = new CANNON.Constraint();
CANNON.ContactConstraint.prototype.constructor = CANNON.ContactConstraint;

CANNON.ContactConstraint.prototype.update = function(){
  throw "ContactConstraint.update() is @todo";
};
