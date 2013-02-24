/**
 * @class CANNON.RotationalEquation
 * @brief Rotational constraint. Works to keep the local vectors orthogonal to each other.
 * @author schteppe
 * @param CANNON.RigidBody bj
 * @param CANNON.Vec3 localVectorInBodyA
 * @param CANNON.RigidBody bi
 * @param CANNON.Vec3 localVectorInBodyB
 * @extends CANNON.Equation
 */
CANNON.RotationalEquation = function(bodyA, bodyB){
    CANNON.Equation.call(this,bodyA,bodyB,-1e6,1e6);
    this.ni = new CANNON.Vec3(); // World oriented localVectorInBodyA 
    this.nj = new CANNON.Vec3(); // ...and B

    this.nixnj = new CANNON.Vec3();
    this.njxni = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    this.relVel = new CANNON.Vec3();
    this.relForce = new CANNON.Vec3();
};

CANNON.RotationalEquation.prototype = new CANNON.Equation();
CANNON.RotationalEquation.prototype.constructor = CANNON.RotationalEquation;

CANNON.RotationalEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b;
    var bi = this.bi;
    var bj = this.bj;

    var ni = this.ni;
    var nj = this.nj;

    var nixnj = this.nixnj;
    var njxni = this.njxni;

    var vi = bi.velocity;
    var wi = bi.angularVelocity ? bi.angularVelocity : new CANNON.Vec3();
    var fi = bi.force;
    var taui = bi.tau ? bi.tau : new CANNON.Vec3();

    var vj = bj.velocity;
    var wj = bj.angularVelocity ? bj.angularVelocity : new CANNON.Vec3();
    var fj = bj.force;
    var tauj = bj.tau ? bj.tau : new CANNON.Vec3();

    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertia) {
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }

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
CANNON.RotationalEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var nixnj = this.nixnj;
    var njxni = this.njxni;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = /*invMassi + invMassj +*/ this.eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    } else {
        invIi.identity(); // ok?
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }

    C += invIi.vmult(njxni).dot(njxni);
    C += invIj.vmult(nixnj).dot(nixnj);

    return C;
};

var computeGWlambda_ulambda = new CANNON.Vec3();
CANNON.RotationalEquation.prototype.computeGWlambda = function(){
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

CANNON.RotationalEquation.prototype.addToWlambda = function(deltalambda){
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
        var I = this.invIi;
        bi.wlambda.vsub(I.vmult(nixnj).mult(deltalambda),bi.wlambda);
    }
    if(bj.wlambda){
        var I = this.invIj;
        bj.wlambda.vadd(I.vmult(nixnj).mult(deltalambda),bj.wlambda);
    }
};
