/*global CANNON:true */

/**
 * @class CANNON.Equation
 * @brief Equation base class
 * @author schteppe
 * @param CANNON.Body bi
 * @param CANNON.Body bj
 * @param float minForce Minimum (read: negative max) force to be applied by the constraint.
 * @param float maxForce Maximum (read: positive max) force to be applied by the constraint.
 */
CANNON.Equation = function(bi,bj,minForce,maxForce){
  this.id = -1;
  this.minForce = typeof(minForce)=="undefined" ? -1e6 : minForce;
  this.maxForce = typeof(maxForce)=="undefined" ? 1e6 : maxForce;
  this.bi = bi;
  this.bj = bj;
};
CANNON.Equation.prototype.constructor = CANNON.Equation;
