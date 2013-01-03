/*global CANNON:true */

/**
 * @class CANNON.Equation
 * @brief Equation base class
 * @author schteppe
 */
CANNON.Equation = function(bi,bj,minForce,maxForce){
  this.id = -1;
  this.minForce = typeof(minForce)=="undefined" ? -1e6 : minForce;
  this.maxForce = typeof(maxForce)=="undefined" ? 1e6 : maxForce;
  this.bi = bi;
  this.bj = bj;
};
CANNON.Equation.prototype.constructor = CANNON.Equation;
