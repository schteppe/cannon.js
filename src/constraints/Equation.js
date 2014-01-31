/**
 * Equation base class
 * @class Equation
 * @author schteppe
 * @param {Body} bi
 * @param {Body} bj
 * @param {Number} minForce Minimum (read: negative max) force to be applied by the constraint.
 * @param {Number} maxForce Maximum (read: positive max) force to be applied by the constraint.
 */
CANNON.Equation = function(bi,bj,minForce,maxForce){
    this.id = -1;

    /**
     * @property float minForce
     */
    this.minForce = typeof(minForce)==="undefined" ? -1e6 : minForce;

    /**
     * @property float maxForce
     */
    this.maxForce = typeof(maxForce)==="undefined" ? 1e6 : maxForce;

    /**
     * @property CANNON.Body bi
     */
    this.bi = bi;

    /**
     * @property CANNON.Body bj
     */
    this.bj = bj;

    /**
     * Corresponds to spring stiffness. Makes constraints stiffer, but harder to solve.
     * @property float stiffness
     */
    this.stiffness = 1e7;

    /**
     * Similar to damping. Represents the number of timesteps needed to stabilize the constraint.
     * @property float regularizationTime
     */
    this.regularizationTime = 5;

    /**
     * SPOOK parameter
     * @property float a
     */
    this.a = 0.0;

    /**
     * SPOOK parameter
     * @property float b
     */
    this.b = 0.0;

    /**
     * SPOOK parameter
     * @property float eps
     */
    this.eps = 0.0;

    /**
     * Set to true if you just changed stiffness or regularization. The parameters a,b,eps will be recalculated by the solver before solve.
     * @property bool spookParamsNeedsUpdate
     */
    this.spookParamsNeedsUpdate = true;
};
CANNON.Equation.prototype.constructor = CANNON.Equation;

/**
 * Recalculates a,b,eps.
 * @method updateSpookParams
 */
CANNON.Equation.prototype.updateSpookParams = function(h){
    var d = this.regularizationTime,
        k = this.stiffness;
    this.a = 4.0 / (h * (1 + 4 * d));
    this.b = (4.0 * d) / (1 + 4 * d);
    this.eps = 4.0 / (h * h * k * (1 + 4 * d));
};
