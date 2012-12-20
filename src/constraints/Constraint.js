/*global CANNON:true */

/**
 * @class CANNON.Constraint
 * @brief Constraint base class
 * @author schteppe
 */
CANNON.Constraint = function(bi,bj,minForce,maxForce){
  this.id = -1;
  this.minForce = typeof(minForce)=="undefined" ? -1e6 : minForce;
  this.maxForce = typeof(maxForce)=="undefined" ? 1e6 : maxForce;
  this.bi = bi;
  this.bj = bj;
};
CANNON.Constraint.prototype.constructor = CANNON.Constraint;
