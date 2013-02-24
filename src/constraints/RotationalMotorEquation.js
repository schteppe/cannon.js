/**
 * @class CANNON.RotationalMotorEquation
 * @brief Rotational motor constraint. Works to keep the relative angular velocity of the bodies to a given value
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.RigidBody bodyB
 * @extends CANNON.Equation
 */
CANNON.RotationalMotorEquation = function(bodyA, bodyB, maxForce){
    maxForce = maxForce || 1e6;
    CANNON.Equation.call(this,bodyA,bodyB,-maxForce,maxForce);
    this.axisA = new CANNON.Vec3(); // World oriented rotational axis
    this.axisB = new CANNON.Vec3(); // World oriented rotational axis

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();
    this.targetVelocity = 0;
};

CANNON.RotationalMotorEquation.prototype = new CANNON.Equation();
CANNON.RotationalMotorEquation.prototype.constructor = CANNON.RotationalMotorEquation;

CANNON.RotationalMotorEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b;
    var bi = this.bi;
    var bj = this.bj;

    var axisA = this.axisA;
    var axisB = this.axisB;

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
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    } else {
        invIj.identity(); // ok?
    }

    // g = 0
    // gdot = axisA * wi - axisB * wj
    // G = [0 axisA 0 -axisB]
    // W = [vi wi vj wj]
    var Gq = 0;
    var GW = axisA.dot(wi) + axisB.dot(wj) + this.targetVelocity;
    var GiMf = 0;//axis.dot(invIi.vmult(taui)) + axis.dot(invIj.vmult(tauj));

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps
CANNON.RotationalMotorEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var axisA = this.axisA;
    var axisB = this.axisB;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = this.eps;

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

    C += invIi.vmult(axisA).dot(axisB);
    C += invIj.vmult(axisB).dot(axisB);

    return C;
};

var computeGWlambda_ulambda = new CANNON.Vec3();
CANNON.RotationalMotorEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var ulambda = computeGWlambda_ulambda;
    var axisA = this.axisA;
    var axisB = this.axisB;

    var GWlambda = 0.0;
    //bj.vlambda.vsub(bi.vlambda, ulambda);
    //GWlambda += ulambda.dot(this.ni);

    // Angular
    if(bi.wlambda){
        GWlambda += bi.wlambda.dot(axisA);
    }
    if(bj.wlambda){
        GWlambda += bj.wlambda.dot(axisB);
    }

    //console.log("GWlambda:",GWlambda);

    return GWlambda;
};

CANNON.RotationalMotorEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var axisA = this.axisA;
    var axisB = this.axisB;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    // Add to linear velocity
    //bi.vlambda.vsub(n.mult(invMassi * deltalambda),bi.vlambda);
    //bj.vlambda.vadd(n.mult(invMassj * deltalambda),bj.vlambda);

    // Add to angular velocity
    if(bi.wlambda){
        var I = this.invIi;
        bi.wlambda.vsub(I.vmult(axisA).mult(deltalambda),bi.wlambda);
    }
    if(bj.wlambda){
        var I = this.invIj;
        bj.wlambda.vadd(I.vmult(axisB).mult(deltalambda),bj.wlambda);
    }
};
