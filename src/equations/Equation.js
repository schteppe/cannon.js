module.exports = Equation;

/**
 * Equation base class
 * @class Equation
 * @author schteppe
 * @param {Body} bi
 * @param {Body} bj
 * @param {Number} minForce Minimum (read: negative max) force to be applied by the constraint.
 * @param {Number} maxForce Maximum (read: positive max) force to be applied by the constraint.
 */
function Equation(bi,bj,minForce,maxForce){
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
     * @property bi
     * @type {Body}
     */
    this.bi = bi;

    /**
     * @property bj
     * @type {Body}
     */
    this.bj = bj;

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

    // Set typical spook params
    this.setSpookParams(1e7,4,1/60);
};
Equation.prototype.constructor = Equation;

/**
 * Recalculates a,b,eps.
 * @method setSpookParams
 */
Equation.prototype.setSpookParams = function(stiffness,relaxation,timeStep){
    var d = relaxation,
        k = stiffness,
        h = timeStep;
    this.a = 4.0 / (h * (1 + 4 * d));
    this.b = (4.0 * d) / (1 + 4 * d);
    this.eps = 4.0 / (h * h * k * (1 + 4 * d));
};
