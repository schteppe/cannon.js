module.exports = RotationalEquation;

var Vec3 = require('../math/Vec3')
,   Mat3 = require('../math/Mat3')
,   Equation = require('./Equation')

/**
 * Rotational constraint. Works to keep the local vectors orthogonal to each other.
 * @class RotationalEquation
 * @author schteppe
 * @param {RigidBody} bj
 * @param {Vec3} localVectorInBodyA
 * @param {RigidBody} bi
 * @param {Vec3} localVectorInBodyB
 * @extends {Equation}
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
};

RotationalEquation.prototype = new Equation();
RotationalEquation.prototype.constructor = RotationalEquation;

RotationalEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b;
    var bi = this.bi;
    var bj = this.bj;

    var ni = this.ni;
    var nj = this.nj;

    var nixnj = this.nixnj;
    var njxni = this.njxni;

    var vi = bi.velocity;
    var wi = bi.angularVelocity ? bi.angularVelocity : new Vec3();
    var fi = bi.force;
    var taui = bi.tau ? bi.tau : new Vec3();

    var vj = bj.velocity;
    var wj = bj.angularVelocity ? bj.angularVelocity : new Vec3();
    var fj = bj.force;
    var tauj = bj.tau ? bj.tau : new Vec3();

    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var invIi = this.invIi;
    var invIj = this.invIj;

    /*
    if(bi.invInertiaWorld){
        invIi.setTrace(bi.invInertiaWorld);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertiaWorld) {
        invIj.setTrace(bj.invInertiaWorld);
    } else {
        invIj.identity(); // ok?
    }
    */

    // Caluclate cross products
    ni.cross(nj,nixnj);
    nj.cross(ni,njxni);

    // g = ni * nj
    // gdot = (nj x ni) * wi + (ni x nj) * wj
    // G = [0 njxni 0 nixnj]
    // W = [vi wi vj wj]
    var Gq = -ni.dot(nj);
    var GW = njxni.dot(wi) + nixnj.dot(wj);
    var GiMf = 0;//njxni.dot(invIi.vmult(taui)) + nixnj.dot(invIj.vmult(tauj));

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps
RotationalEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var nixnj = this.nixnj;
    var njxni = this.njxni;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = /*invMassi + invMassj +*/ this.eps;

    /*
    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertiaWorld){
        invIi.setTrace(bi.invInertiaWorld);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertiaWorld){
        invIj.setTrace(bj.invInertiaWorld);
    } else {
        invIj.identity(); // ok?
    }
    */

    C += bi.invInertiaWorld.vmult(njxni).dot(njxni);
    C += bj.invInertiaWorld.vmult(nixnj).dot(nixnj);

    return C;
};

var computeGWlambda_ulambda = new Vec3();
RotationalEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var ulambda = computeGWlambda_ulambda;

    var GWlambda = 0.0;
    //bj.vlambda.vsub(bi.vlambda, ulambda);
    //GWlambda += ulambda.dot(this.ni);

    // Angular
    if(bi.wlambda){
        GWlambda += bi.wlambda.dot(this.njxni);
    }
    if(bj.wlambda){
        GWlambda += bj.wlambda.dot(this.nixnj);
    }

    //console.log("GWlambda:",GWlambda);

    return GWlambda;
};

RotationalEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var nixnj = this.nixnj;
    var njxni = this.njxni;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    // Add to linear velocity
    //bi.vlambda.vsub(n.mult(invMassi * deltalambda),bi.vlambda);
    //bj.vlambda.vadd(n.mult(invMassj * deltalambda),bj.vlambda);

    // Add to angular velocity
    if(bi.wlambda){
        var I = bi.invInertiaWorld;
        bi.wlambda.vsub(I.vmult(nixnj).mult(deltalambda),bi.wlambda);
    }
    if(bj.wlambda){
        var I = bj.invInertiaWorld;
        bj.wlambda.vadd(I.vmult(nixnj).mult(deltalambda),bj.wlambda);
    }
};
