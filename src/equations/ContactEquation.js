module.exports = ContactEquation;

var Equation = require('./Equation')
,   Vec3 = require('../math/Vec3')
,   Mat3 = require('../math/Mat3')

/**
 * Contact/non-penetration constraint equation
 * @class ContactEquation
 * @author schteppe
 * @param {Body} bj
 * @param {Body} bi
 * @extends {Equation}
 */
function ContactEquation(bi,bj){
    Equation.call(this,bi,bj,0,1e6);

    /**
     * @property restitution
     * @type {Number}
     */
    this.restitution = 0.0; // "bounciness": u1 = -e*u0

    /**
     * World-oriented vector that goes from the center of bi to the contact point.
     * @property {Vec3} ri
     */
    this.ri = new Vec3();

    /**
     * World-oriented vector that starts in body j position and goes to the contact point.
     * @property {Vec3} rj
     */
    this.rj = new Vec3();

    this.penetrationVec = new Vec3();

    /**
     * Contact normal, pointing out of body i.
     * @property {Vec3} ni
     */
    this.ni = new Vec3();

    this.rixn = new Vec3();
    this.rjxn = new Vec3();

    this.invIi = new Mat3();
    this.invIj = new Mat3();

    // Cache
    this.biInvInertiaTimesRixn =  new Vec3();
    this.bjInvInertiaTimesRjxn =  new Vec3();
};

ContactEquation.prototype = new Equation();
ContactEquation.prototype.constructor = ContactEquation;

/**
 * To be run before object reuse
 * @method reset
 */
ContactEquation.prototype.reset = function(){
    this.invInertiaTimesRxnNeedsUpdate = true;
};

var ContactEquation_computeB_temp1 = new Vec3(); // Temp vectors
var ContactEquation_computeB_temp2 = new Vec3();
var ContactEquation_computeB_zero = new Vec3();
ContactEquation.prototype.computeB = function(h){
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
var computeC_temp1 = new Vec3();
var computeC_temp2 = new Vec3();
ContactEquation.prototype.computeC = function(){
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

var computeGWlambda_ulambda = new Vec3();
ContactEquation.prototype.computeGWlambda = function(){
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

var ContactEquation_addToWlambda_temp1 = new Vec3();
var ContactEquation_addToWlambda_temp2 = new Vec3();
ContactEquation.prototype.addToWlambda = function(deltalambda){
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
