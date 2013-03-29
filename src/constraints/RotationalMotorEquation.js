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
    this.axisA = vec3.create(); // World oriented rotational axis
    this.axisB = vec3.create(); // World oriented rotational axis

    this.invIi = mat3.create();
    this.invIj = mat3.create();
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
    var wi = bi.angularVelocity ? bi.angularVelocity : vec3.create();
    var fi = bi.force;
    var taui = bi.tau ? bi.tau : vec3.create();

    var vj = bj.velocity;
    var wj = bj.angularVelocity ? bj.angularVelocity : vec3.create();
    var fj = bj.force;
    var tauj = bj.tau ? bj.tau : vec3.create();

    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        mat3.setTrace(invIi,bi.invInertia);//invIi.setTrace(bi.invInertia);
    } else {
        mat3.identity(invIi);//invIi.identity(); // ok?
    }
    if(bj.invInertia) {
        mat3.setTrace(invIj, bj.invInertia);//invIj.setTrace(bj.invInertia);
    } else {
        mat3.identity(invIj);//invIj.identity(); // ok?
    }

    // g = 0
    // gdot = axisA * wi - axisB * wj
    // G = [0 axisA 0 -axisB]
    // W = [vi wi vj wj]
    var Gq = 0;
    var GW = vec3.dot(axisA,wi) + vec3.dot(axisB,wj) + this.targetVelocity;
    var GiMf = 0;//axis.dot(invIi.vmult(taui)) + axis.dot(invIj.vmult(tauj));

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps
var RotationalMotorEquation_computeC_temp = vec3.create();
CANNON.RotationalMotorEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var axisA = this.axisA;
    var axisB = this.axisB;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;
    var temp = RotationalMotorEquation_computeC_temp;

    var C = this.eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia){
        mat3.setTrace(invIi,bi.invInertia);//invIi.setTrace(bi.invInertia);
    } else {
        mat3.identity(invIi);//invIi.identity(); // ok?
    }
    if(bj.invInertia) {
        mat3.setTrace(invIj, bj.invInertia);//invIj.setTrace(bj.invInertia);
    } else {
        mat3.identity(invIj);//invIj.identity(); // ok?
    }

    // Add up to C
    vec3.transformMat3(temp, axisA, invIi);
    C += vec3.dot(temp,axisB); // Correct?

    vec3.transformMat3(temp, axisB, invIj);
    C += vec3.dot(temp,axisB);

    //C += invIi.vmult(axisA).dot(axisB);
    //C += invIj.vmult(axisB).dot(axisB);

    return C;
};

var computeGWlambda_ulambda = vec3.create();
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
        GWlambda += vec3.dot(bi.wlambda,axisA);
    }
    if(bj.wlambda){
        GWlambda += vec3.dot(bj.wlambda,axisB);
    }

    //console.log("GWlambda:",GWlambda);

    return GWlambda;
};

var RotationalMotorEquation_addToWlambda_temp = vec3.create();
CANNON.RotationalMotorEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var axisA = this.axisA;
    var axisB = this.axisB;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;
    var temp = RotationalMotorEquation_addToWlambda_temp;

    // Add to linear velocity
    //bi.vlambda.vsub(n.mult(invMassi * deltalambda),bi.vlambda);
    //bj.vlambda.vadd(n.mult(invMassj * deltalambda),bj.vlambda);

    // Add to angular velocity
    if(bi.wlambda){
        var I = this.invIi;
        vec3.transformMat3(temp, axisA, I);
        vec3.scale(temp, temp, deltalambda);
        vec3.subtract(bi.wlambda, bi.wlambda, temp);
        /*
        var I = this.invIi;
        bi.wlambda.vsub(I.vmult(axisA).mult(deltalambda),bi.wlambda);
         */
    }
    if(bj.wlambda){
        /*
        var I = this.invIj;
        bj.wlambda.vadd(I.vmult(axisB).mult(deltalambda),bj.wlambda);
        */

        var I = this.invIj;
        vec3.transformMat3(temp, axisB, I);
        vec3.scale(temp, temp, deltalambda);
        vec3.add(bj.wlambda, bj.wlambda, temp);
    }
};
