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
    this.ni = vec3.create(); // World oriented localVectorInBodyA 
    this.nj = vec3.create(); // ...and B

    this.nixnj = vec3.create();
    this.njxni = vec3.create();

    this.invIi = mat3.create();
    this.invIj = mat3.create();

    this.relVel = vec3.create();
    this.relForce = vec3.create();
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

    // Caluclate cross products
    vec3.cross(nixnj, ni, nj);// ni.cross(nj,nixnj);
    vec3.cross(njxni, nj, ni);// nj.cross(ni,njxni);

    // g = ni * nj
    // gdot = (nj x ni) * wi + (ni x nj) * wj
    // G = [0 njxni 0 nixnj]
    // W = [vi wi vj wj]
    var Gq = -vec3.dot(ni,nj);//-ni.dot(nj);
    var GW = vec3.dot(njxni,wi) + vec3.dot(nixnj,wj);// njxni.dot(wi) + nixnj.dot(wj);
    var GiMf = 0;//njxni.dot(invIi.vmult(taui)) + nixnj.dot(invIj.vmult(tauj));

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps
RotationalEquation_computeC_temp = vec3.create();
CANNON.RotationalEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var nixnj = this.nixnj;
    var njxni = this.njxni;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;
    var temp = RotationalEquation_computeC_temp;

    var C = /*invMassi + invMassj +*/ this.eps;

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
    vec3.transformMat3(temp, njxni, invIi);
    C += vec3.dot(temp,njxni);//invIi.vmult(njxni).dot(njxni);

    vec3.transformMat3(temp, nixnj, invIj);
    C += vec3.dot(temp,nixnj);//invIj.vmult(nixnj).dot(nixnj);

    return C;
};

var computeGWlambda_ulambda = vec3.create();
CANNON.RotationalEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var ulambda = computeGWlambda_ulambda;

    var GWlambda = 0.0;
    //bj.vlambda.vsub(bi.vlambda, ulambda);
    //GWlambda += ulambda.dot(this.ni);

    // Angular
    if(bi.wlambda){
        GWlambda += vec3.dot(bi.wlambda,this.njxni);
    }
    if(bj.wlambda){
        GWlambda += vec3.dot(bj.wlambda,this.nixnj);
    }

    //console.log("GWlambda:",GWlambda);

    return GWlambda;
};

var RotationalEquation_addToWlambda_temp = vec3.create();
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
    var temp = RotationalEquation_addToWlambda_temp;
    if(bi.wlambda){
        var I = this.invIi;
        vec3.transformMat3(temp, nixnj, I);
        vec3.scale(temp, temp, deltalambda);
        vec3.subtract(bi.wlambda, bi.wlambda, temp);//bi.wlambda.vsub(I.vmult(nixnj).mult(deltalambda),bi.wlambda);
    }
    if(bj.wlambda){
        var I = this.invIj;
        vec3.transformMat3(temp, nixnj, I);
        vec3.scale(temp, temp, deltalambda);
        vec3.add(bj.wlambda, bj.wlambda, temp);//bi.wlambda.vsub(I.vmult(nixnj).mult(deltalambda),bi.wlambda);
        /*
        var I = this.invIj;
        bj.wlambda.vadd(I.vmult(nixnj).mult(deltalambda),bj.wlambda);
         */
    }
};
