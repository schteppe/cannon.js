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
    this.ri = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 rj
     * @memberof CANNON.ContactEquation
     */
    this.rj = new CANNON.Vec3();

    this.penetrationVec = new CANNON.Vec3();

    this.ni = new CANNON.Vec3();
    this.rixn = new CANNON.Vec3();
    this.rjxn = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    // Cache
    this.biInvInertiaTimesRixn =  new CANNON.Vec3();
    this.bjInvInertiaTimesRjxn =  new CANNON.Vec3();
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

var ContactEquation_computeB_temp1 = new CANNON.Vec3(); // Temp vectors
var ContactEquation_computeB_temp2 = new CANNON.Vec3();
var ContactEquation_computeB_zero = new CANNON.Vec3();
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
    ri.cross(n,rixn);
    rj.cross(n,rjxn);

    // Calculate q = xj+rj -(xi+ri) i.e. the penetration vector
    var penetrationVec = this.penetrationVec;
    penetrationVec.set(0,0,0);
    penetrationVec.vadd(bj.position,penetrationVec);
    penetrationVec.vadd(rj,penetrationVec);
    penetrationVec.vsub(bi.position,penetrationVec);
    penetrationVec.vsub(ri,penetrationVec);

    var Gq = n.dot(penetrationVec);//-Math.abs(this.penetration);

    var invIi_vmult_taui = ContactEquation_computeB_temp1;
    var invIj_vmult_tauj = ContactEquation_computeB_temp2;
    invIi.vmult(taui,invIi_vmult_taui);
    invIj.vmult(tauj,invIj_vmult_tauj);

    // Compute iteration
    var ePlusOne = this.restitution+1;
    var GW = ePlusOne*vj.dot(n) - ePlusOne*vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
    var GiMf = fj.dot(n)*invMassj - fi.dot(n)*invMassi + rjxn.dot(invIj_vmult_tauj) - rixn.dot(invIi_vmult_taui);

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps in the SPOOK equation
var computeC_temp1 = new CANNON.Vec3();
var computeC_temp2 = new CANNON.Vec3();
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
    
    C += computeC_temp1.dot(rixn);
    C += computeC_temp2.dot(rjxn);
     */
    C += this.biInvInertiaTimesRixn.dot(rixn);
    C += this.bjInvInertiaTimesRjxn.dot(rjxn);

    return C;
};

var computeGWlambda_ulambda = new CANNON.Vec3();
CANNON.ContactEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var ulambda = computeGWlambda_ulambda;

    var GWlambda = 0.0;

    bj.vlambda.vsub(bi.vlambda, ulambda);
    GWlambda += ulambda.dot(this.ni);

    // Angular
    if(bi.wlambda){
        GWlambda -= bi.wlambda.dot(this.rixn);
    }
    if(bj.wlambda){
        GWlambda += bj.wlambda.dot(this.rjxn);
    }

    return GWlambda;
};

var ContactEquation_addToWlambda_temp1 = new CANNON.Vec3();
var ContactEquation_addToWlambda_temp2 = new CANNON.Vec3();
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
    n.mult(invMassi * deltalambda, temp2);
    bi.vlambda.vsub(temp2,bi.vlambda);
    n.mult(invMassj * deltalambda, temp2);
    bj.vlambda.vadd(temp2,bj.vlambda);

    // Add to angular velocity
    if(bi.wlambda !== undefined){
        this.biInvInertiaTimesRixn.mult(deltalambda,temp1);

        bi.wlambda.vsub(temp1,bi.wlambda);
    }
    if(bj.wlambda !== undefined){
        this.bjInvInertiaTimesRjxn.mult(deltalambda,temp1);
        bj.wlambda.vadd(temp1,bj.wlambda);
    }
};
