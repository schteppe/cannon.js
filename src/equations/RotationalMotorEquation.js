module.exports = RotationalMotorEquation;

var Vec3 = require('../math/Vec3');
var Mat3 = require('../math/Mat3');
var Equation = require('./Equation');

/**
 * Rotational motor constraint. Works to keep the relative angular velocity of the bodies to a given value
 * @class RotationalMotorEquation
 * @constructor
 * @author schteppe
 * @param {RigidBody} bodyA
 * @param {RigidBody} bodyB
 * @param {Number} maxForce
 * @extends Equation
 */
function RotationalMotorEquation(bodyA, bodyB, maxForce){
    maxForce = maxForce || 1e6;
    Equation.call(this,bodyA,bodyB,-maxForce,maxForce);
    this.axisA = new Vec3(); // World oriented rotational axis
    this.axisB = new Vec3(); // World oriented rotational axis

    this.invIi = new Mat3();
    this.invIj = new Mat3();

    /**
     * Motor velocity
     * @property {Number} targetVelocity
     */
    this.targetVelocity = 0;
}

RotationalMotorEquation.prototype = new Equation();
RotationalMotorEquation.prototype.constructor = RotationalMotorEquation;

var zero = new Vec3();

RotationalMotorEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b,
        bi = this.bi,
        bj = this.bj,

        axisA = this.axisA,
        axisB = this.axisB,

        vi = bi.velocity,
        wi = bi.angularVelocity ? bi.angularVelocity : zero,
        fi = bi.force,
        taui = bi.torque ? bi.torque : zero,

        vj = bj.velocity,
        wj = bj.angularVelocity ? bj.angularVelocity : zero,
        fj = bj.force,
        tauj = bj.torque ? bj.torque : zero,

        GA = this.jacobianElementA,
        GB = this.jacobianElementB,

        invMassi = bi.invMass,
        invMassj = bj.invMass;

    // g = 0
    // gdot = axisA * wi - axisB * wj
    // G = [0 axisA 0 -axisB]
    // W = [vi wi vj wj]

    GA.rotational.copy(axisA);
    axisB.negate(GB.rotational);

    var GW = this.computeGW() - this.targetVelocity,
        GiMf = this.computeGiMf();//axis.dot(invIi.vmult(taui)) + axis.dot(invIj.vmult(tauj));

    var B = - GW * b - h*GiMf;

    return B;
};
