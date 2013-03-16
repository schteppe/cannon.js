/**
 * @class CANNON.FrictionEquation
 * @brief Constrains the slipping in a contact along a tangent
 * @author schteppe
 * @param CANNON.Body bi
 * @param CANNON.Body bj
 * @param float slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
 * @extends CANNON.Equation
 */
CANNON.FrictionEquation = function(bi,bj,slipForce){
    CANNON.Equation.call(this,bi,bj,-slipForce,slipForce);
    this.ri = new CANNON.Vec3();
    this.rj = new CANNON.Vec3();
    this.t = new CANNON.Vec3(); // tangent


    // The following is just cache
    this.rixt = new CANNON.Vec3();
    this.rjxt = new CANNON.Vec3();
    this.wixri = new CANNON.Vec3();
    this.wjxrj = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    this.relVel = new CANNON.Vec3();
    this.relForce = new CANNON.Vec3();

    this.biInvInertiaTimesRixt =  new CANNON.Vec3();
    this.bjInvInertiaTimesRjxt =  new CANNON.Vec3();
};

CANNON.FrictionEquation.prototype = new CANNON.Equation();
CANNON.FrictionEquation.prototype.constructor = CANNON.FrictionEquation;

var FrictionEquation_computeB_temp1 = new CANNON.Vec3();
var FrictionEquation_computeB_temp2 = new CANNON.Vec3();
var FrictionEquation_computeB_zero = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b,
        bi = this.bi,
        bj = this.bj,
        ri = this.ri,
        rj = this.rj,
        rixt = this.rixt,
        rjxt = this.rjxt,
        wixri = this.wixri,
        wjxrj = this.wjxrj,
        zero = FrictionEquation_computeB_zero;

    var vi = bi.velocity,
        wi = bi.angularVelocity ? bi.angularVelocity : zero,
        fi = bi.force,
        taui = bi.tau ? bi.tau : zero,

        vj = bj.velocity,
        wj = bj.angularVelocity ? bj.angularVelocity : zero,
        fj = bj.force,
        tauj = bj.tau ? bj.tau : zero,

        relVel = this.relVel,
        relForce = this.relForce,
        invMassi = bi.invMass,
        invMassj = bj.invMass,

        invIi = this.invIi,
        invIj = this.invIj,

        t = this.t,

        invIi_vmult_taui = FrictionEquation_computeB_temp1,
        invIj_vmult_tauj = FrictionEquation_computeB_temp2;

    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    }


    // Caluclate cross products
    ri.cross(t,rixt);
    rj.cross(t,rjxt);

    wi.cross(ri,wixri);
    wj.cross(rj,wjxrj);

    invIi.vmult(taui,invIi_vmult_taui);
    invIj.vmult(tauj,invIj_vmult_tauj);

    var Gq = 0; // we do only want to constrain motion
    var GW = vj.dot(t) - vi.dot(t) + wjxrj.dot(t) - wixri.dot(t); // eq. 40
    var GiMf = fj.dot(t)*invMassj - fi.dot(t)*invMassi + rjxt.dot(invIj_vmult_tauj) - rixt.dot(invIi_vmult_taui);

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = G * Minv * G + eps
//var FEcomputeC_temp1 = new CANNON.Vec3();
//var FEcomputeC_temp2 = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.computeC = function(){
    var bi = this.bi,
        bj = this.bj,
        rixt = this.rixt,
        rjxt = this.rjxt,
        invMassi = bi.invMass,
        invMassj = bj.invMass,
        C = invMassi + invMassj + this.eps,
        invIi = this.invIi,
        invIj = this.invIj;

    /*
    if(bi.invInertia){
        invIi.setTrace(bi.invInertia);
    }
    if(bj.invInertia){
        invIj.setTrace(bj.invInertia);
    }
     */

    // Compute rxt * I * rxt for each body
    /*
    invIi.vmult(rixt,FEcomputeC_temp1);
    invIj.vmult(rjxt,FEcomputeC_temp2);
    C += FEcomputeC_temp1.dot(rixt);
    C += FEcomputeC_temp2.dot(rjxt);
      */
    invIi.vmult(rixt,this.biInvInertiaTimesRixt);
    invIj.vmult(rjxt,this.bjInvInertiaTimesRjxt);
    C += this.biInvInertiaTimesRixt.dot(rixt);
    C += this.bjInvInertiaTimesRjxt.dot(rjxt);

    return C;
};

var FrictionEquation_computeGWlambda_ulambda = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.computeGWlambda = function(){

    // Correct at all ???

    var bi = this.bi;
    var bj = this.bj;

    var GWlambda = 0.0;
    var ulambda = FrictionEquation_computeGWlambda_ulambda;
    bj.vlambda.vsub(bi.vlambda,ulambda);
    GWlambda += ulambda.dot(this.t);

    // Angular
    if(bi.wlambda){
        GWlambda -= bi.wlambda.dot(this.rixt);
    }
    if(bj.wlambda){
        GWlambda += bj.wlambda.dot(this.rjxt);
    }

    return GWlambda;
};

var FrictionEquation_addToWlambda_tmp = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi,
        bj = this.bj,
        rixt = this.rixt,
        rjxt = this.rjxt,
        invMassi = bi.invMass,
        invMassj = bj.invMass,
        t = this.t,
        tmp = FrictionEquation_addToWlambda_tmp,
        wi = bi.wlambda,
        wj = bj.wlambda;

    // Add to linear velocity
    t.mult(invMassi * deltalambda, tmp);
    bi.vlambda.vsub(tmp,bi.vlambda);

    t.mult(invMassj * deltalambda, tmp);
    bj.vlambda.vadd(tmp,bj.vlambda);

    // Add to angular velocity
    if(wi){
        /*
        var I = this.invIi;
        I.vmult(rixt,tmp);
        tmp.mult(deltalambda,tmp);
         */
        this.biInvInertiaTimesRixt.mult(deltalambda,tmp);
        wi.vsub(tmp,wi);
    }
    if(wj){
        /*
        var I = this.invIj;
        I.vmult(rjxt,tmp);
        tmp.mult(deltalambda,tmp);
         */
        this.bjInvInertiaTimesRjxt.mult(deltalambda,tmp);
        wj.vadd(tmp,wj);
    }
};