/**
 * Constraint base class
 * @author schteppe
 */
CANNON.Constraint = function(){
  // n := number of subconstraints
  this.J =          [];         // Jacobian, 12*n
  this.iM =         [];         // Inverse mass matrix, 12*n
  this.g =          [];         // Constraint violation, 12*n
  this.gdot =       [];         // Derivative of g, 12*n
  this.fext =       [];         // External force, 12*n
  this.lambdamax = -Infinity;   // Clamping for multipliers (see this as max constraint force)
  this.lambdamin =  Infinity;   
  this.bodyIds =    [];         // Body id's to apply the constraint forces on. 2*n
};

CANNON.Constraint.prototype.constructor = CANNON.Constraint;

/**
 * Updates the internal numbers, calculates the Jacobian etc.
 */
CANNON.Constraint.prototype.update = function(){
  throw "update() not implemented in this Constraint subclass!";
};
