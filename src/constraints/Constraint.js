/*global CANNON:true */

/**
 * @class CANNON.Constraint
 * @brief Constraint base class
 * @author schteppe
 */
CANNON.Constraint = function(){

  /**
   * @property array equations
   * @brief A number of CANNON.Equation's that belongs to this Constraint
   * @memberof CANNON.Constraint
   */
  this.equations = [];
  this.id = -1;
};
CANNON.Constraint.prototype.constructor = CANNON.Constraint;

/**
 * @method update
 * @memberof CANNON.Constraint
 * @brief Updates the internal numbers, calculates the Jacobian etc.
 */
CANNON.Constraint.prototype.update = function(){
    throw "update() not implemented in this Constraint subclass!";
};
