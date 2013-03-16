/**
 * @class CANNON.Constraint
 * @brief Constraint base class
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Body bodyB
 */
CANNON.Constraint = function(bodyA,bodyB){

    /**
     * @property Array equations
     * @memberOf CANNON.Constraint
     * @brief Equations to be solved in this constraint
     */
    this.equations = [];

    /**
     * @property CANNON.Body bodyA
     * @memberOf CANNON.Constraint
     */
    this.bodyA = bodyA;

    /**
     * @property CANNON.Body bodyB
     * @memberOf CANNON.Constraint
     */
    this.bodyB = bodyB;
};

/**
 * @method update
 * @memberOf CANNON.Constraint
 */
CANNON.Constraint.prototype.update = function(){
    throw new Error("method update() not implmemented in this Constraint subclass!");
};