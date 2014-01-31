/**
 * Constraint base class
 * @class Constraint
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 */
CANNON.Constraint = function(bodyA,bodyB){

    /**
     * Equations to be solved in this constraint
     * @property equations
     * @type {Array}
     */
    this.equations = [];

    /**
     * @property {Body} bodyA
     */
    this.bodyA = bodyA;

    /**
     * @property {Body} bodyB
     */
    this.bodyB = bodyB;
};

/**
 * @method update
 */
CANNON.Constraint.prototype.update = function(){
    throw new Error("method update() not implmemented in this Constraint subclass!");
};
