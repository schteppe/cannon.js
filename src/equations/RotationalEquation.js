module.exports = RotationalEquation;

var Vec3 = require('../math/Vec3');
var Mat3 = require('../math/Mat3');
var Equation = require('./Equation');

/**
 * Rotational constraint. Works to keep the local vectors orthogonal to each other.
 * @class RotationalEquation
 * @constructor
 * @author schteppe
 * @param {RigidBody} bj
 * @param {Vec3} localVectorInBodyA
 * @param {RigidBody} bi
 * @param {Vec3} localVectorInBodyB
 * @extends Equation
 */
function RotationalEquation(bodyA, bodyB){
    Equation.call(this,bodyA,bodyB,-1e6,1e6);
    this.ni = new Vec3(); // World oriented localVectorInBodyA
    this.nj = new Vec3(); // ...and B

    this.nixnj = new Vec3();
    this.njxni = new Vec3();

    this.invIi = new Mat3();
    this.invIj = new Mat3();

    this.relVel = new Vec3();
    this.relForce = new Vec3();
}

RotationalEquation.prototype = new Equation();
RotationalEquation.prototype.constructor = RotationalEquation;

var zero = new Vec3();

RotationalEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b,
        bi = this.bi,
        bj = this.bj,

        ni = this.ni,
        nj = this.nj,

        nixnj = this.nixnj,
        njxni = this.njxni,

        vi = bi.velocity,
        wi = bi.angularVelocity ? bi.angularVelocity : zero,
        fi = bi.force,
        taui = bi.torque ? bi.torque : zero,

        vj = bj.velocity,
        wj = bj.angularVelocity ? bj.angularVelocity : zero,
        fj = bj.force,
        tauj = bj.torque ? bj.torque : zero,

        invMassi = bi.invMass,
        invMassj = bj.invMass,

        GA = this.jacobianElementA,
        GB = this.jacobianElementB,

        invIi = this.invIi,
        invIj = this.invIj;

    // Caluclate cross products
    ni.cross(nj,nixnj);
    nj.cross(ni,njxni);

    // g = ni * nj
    // gdot = (nj x ni) * wi + (ni x nj) * wj
    // G = [0 njxni 0 nixnj]
    // W = [vi wi vj wj]
    GA.rotational.copy(njxni);
    GB.rotational.copy(nixnj);

    var g = -ni.dot(nj),
        GW = this.computeGW(),//njxni.dot(wi) + nixnj.dot(wj),
        GiMf = this.computeGiMf();//njxni.dot(invIi.vmult(taui)) + nixnj.dot(invIj.vmult(tauj));

    var B = - g * a - GW * b - h*GiMf;

    return B;
};

