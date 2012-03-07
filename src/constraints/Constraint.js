/**
 * Constraint base class
 * @author schteppe
 */
CANNON.Constraint = function(){
  this.J =        []; // Jacobian
  this.iM =       []; // inverse mass matrix
  this.q =        []; // Constraint violation
  this.qdot =     []; // 
  this.fext =     []; // External force
  this.lambdamax = -Infinity; // Clamping for multipliers (see this as max constraint force)
  this.lambdamin = Infinity;
  this.bodyIds =  []; // Body id's to apply the constraint forces on
};

CANNON.Constraint.prototype.constructor = CANNON.Constraint;

/**
 * Updates the internal numbers, calculates the Jacobian etc.
 */
CANNON.Constraint.prototype.update = function(){
  throw "update() not implemented in this Constraint subclass!";
};
