/**
 * @class CANNON.ContactEquation
 * @brief Contact/non-penetration constraint equation
 * @author schteppe
 * @param CANNON.Body bj
 * @param CANNON.Body bi
 * @extends CANNON.Equation
 */
CANNON.ContactEquation = function(bi,bj){
    CANNON.Equation.call(this,bi,bj,0,1e6);

    /**
     * @property float restitution
     * @memberof CANNON.ContactEquation
     */
    this.restitution = 0.0; // "bounciness": u1 = -e*u0

    /**
     * @property CANNON.Vec3 ri
     * @memberof CANNON.ContactEquation
     * @brief World-oriented vector that goes from the center of bi to the contact point in bi.
     */
    this.ri = vec3.create();

    /**
     * @property CANNON.Vec3 rj
     * @memberof CANNON.ContactEquation
     */
    this.rj = vec3.create();

    this.penetrationVec = vec3.create();

    this.ni = vec3.create();
    this.rixn = vec3.create();
    this.rjxn = vec3.create();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    // Cache
    this.biInvInertiaTimesRixn =  vec3.create();
    this.bjInvInertiaTimesRjxn =  vec3.create();
};

CANNON.ContactEquation.prototype = new CANNON.Equation();
CANNON.ContactEquation.prototype.constructor = CANNON.ContactEquation;

/**
 * @method reset
 * @memberof CANNON.ContactEquation
 * @brief To be run before object reuse
 */
CANNON.ContactEquation.prototype.reset = function(){
    this.invInertiaTimesRxnNeedsUpdate = true;
};

var ContactEquation_computeB_temp1 = vec3.create(); // Temp vectors
var ContactEquation_computeB_temp2 = vec3.create();
var ContactEquation_computeB_zero = vec3.create();
CANNON.ContactEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b;
    var bi = this.bi;
    var bj = this.bj;
    var ri = this.ri;
    var rj = this.rj;
    var rixn = this.rixn;
    var rjxn = this.rjxn;

    var zero = ContactEquation_computeB_zero;

    var vi = bi.velocity;
    var wi = bi.angularVelocity ? bi.angularVelocity : zero;
    var fi = bi.force;
    var taui = bi.tau ? bi.tau : zero;

    var vj = bj.velocity;
    var wj = bj.angularVelocity ? bj.angularVelocity : zero;
    var fj = bj.force;
    var tauj = bj.tau ? bj.tau : zero;

    var penetrationVec = this.penetrationVec;
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

    var n = this.ni;

    // Caluclate cross products
    vec3.cross(rixn,ri,n);
    vec3.cross(rjxn,rj,n);

    // Calculate q = xj+rj -(xi+ri) i.e. the penetration vector
    var penetrationVec = this.penetrationVec;
    vec3.set(penetrationVec,0,0,0);
    vec3.add(penetrationVec,penetrationVec,bj.position);
    vec3.add(penetrationVec,penetrationVec,rj);
    vec3.subtract(penetrationVec,penetrationVec,bi.position);
    vec3.subtract(penetrationVec,penetrationVec,ri);

    var Gq = vec3.dot(n,penetrationVec);//-Math.abs(this.penetration);

    var invIi_vmult_taui = ContactEquation_computeB_temp1;
    var invIj_vmult_tauj = ContactEquation_computeB_temp2;
    invIi.vmult(taui,invIi_vmult_taui);
    invIj.vmult(tauj,invIj_vmult_tauj);

    // Compute iteration
    var ePlusOne = this.restitution+1;
    var GW = ePlusOne*vec3.dot(vj,n) - ePlusOne*vec3.dot(vi,n) + vec3.dot(wj,rjxn) - vec3.dot(wi,rixn);
    var GiMf = vec3.dot(fj,n)*invMassj - vec3.dot(fi,n)*invMassi + vec3.dot(rjxn,invIj_vmult_tauj) - vec3.dot(rixn,invIi_vmult_taui);

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps in the SPOOK equation
var computeC_temp1 = vec3.create();
var computeC_temp2 = vec3.create();
CANNON.ContactEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var rixn = this.rixn;
    var rjxn = this.rjxn;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = invMassi + invMassj + this.eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    /*
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
     */

    // Compute rxn * I * rxn for each body
    invIi.vmult(rixn, this.biInvInertiaTimesRixn);
    invIj.vmult(rjxn, this.bjInvInertiaTimesRjxn);

    /*
    invIi.vmult(rixn,computeC_temp1);
    invIj.vmult(rjxn,computeC_temp2);
    
    C += vec3.dot(computeC_temp1,rixn);
    C += vec3.dot(computeC_temp2,rjxn);
     */
    C += vec3.dot(this.biInvInertiaTimesRixn,rixn);
    C += vec3.dot(this.bjInvInertiaTimesRjxn,rjxn);

    return C;
};

var computeGWlambda_ulambda = vec3.create();
CANNON.ContactEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var ulambda = computeGWlambda_ulambda;

    var GWlambda = 0.0;

    vec3.subtract( ulambda,bj.vlambda,bi.vlambda);
    GWlambda += vec3.dot(ulambda,this.ni);

    // Angular
    if(bi.wlambda){
        GWlambda -= vec3.dot(bi.wlambda,this.rixn);
    }
    if(bj.wlambda){
        GWlambda += vec3.dot(bj.wlambda,this.rjxn);
    }

    return GWlambda;
};

var ContactEquation_addToWlambda_temp1 = vec3.create();
var ContactEquation_addToWlambda_temp2 = vec3.create();
CANNON.ContactEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi,
        bj = this.bj,
        rixn = this.rixn,
        rjxn = this.rjxn,
        invMassi = bi.invMass,
        invMassj = bj.invMass,
        n = this.ni,
        temp1 = ContactEquation_addToWlambda_temp1,
        temp2 = ContactEquation_addToWlambda_temp2;


    // Add to linear velocity
    vec3.scale(temp2, n, invMassi * deltalambda);
    vec3.subtract(bi.vlambda,bi.vlambda,temp2);
    vec3.scale(temp2, n, invMassj * deltalambda);
    vec3.add(bj.vlambda,bj.vlambda,temp2);

    // Add to angular velocity
    if(bi.wlambda !== undefined){
        vec3.scale(temp1,this.biInvInertiaTimesRixn,deltalambda);
        vec3.subtract(bi.wlambda,bi.wlambda,temp1);
    }
    if(bj.wlambda !== undefined){
        vec3.scale(temp1,this.bjInvInertiaTimesRjxn,deltalambda);
        vec3.add(bj.wlambda,bj.wlambda,temp1);
    }
};
