/*global CANNON:true */

/**
 * Constraint base class
 * @author schteppe
 */
CANNON.Constraint = function(){

  /**
   * @property array equations
   * @brief A number of CANNON.Equation's that belongs to this Constraint
   */
  this.equations = [];

};
CANNON.Constraint.prototype.constructor = CANNON.Constraint;

/**
 * @brief Updates the internal numbers, calculates the Jacobian etc.
 */
CANNON.Constraint.prototype.update = function(){
  throw "update() not implemented in this Constraint subclass!";
};
