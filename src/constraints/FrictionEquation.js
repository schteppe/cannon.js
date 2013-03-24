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
    this.ri = vec3.create();
    this.rj = vec3.create();
    this.t = vec3.create(); // tangent

    // The following is just cache
    this.rixt = vec3.create();
    this.rjxt = vec3.create();
    this.wixri = vec3.create();
    this.wjxrj = vec3.create();

    this.invIi = mat3.create();
    this.invIj = mat3.create();

    this.relVel = vec3.create();
    this.relForce = vec3.create();

    this.biInvInertiaTimesRixt =  vec3.create();
    this.bjInvInertiaTimesRjxt =  vec3.create();
};

CANNON.FrictionEquation.prototype = new CANNON.Equation();
CANNON.FrictionEquation.prototype.constructor = CANNON.FrictionEquation;

var FrictionEquation_computeB_temp1 = vec3.create();
var FrictionEquation_computeB_temp2 = vec3.create();
var FrictionEquation_computeB_zero = vec3.create();
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
        mat3.setTrace(invIi,bi.invInertia);//invIi.setTrace(bi.invInertia);
    }
    if(bj.invInertia){
        mat3.setTrace(invIj,bj.invInertia); //invIj.setTrace(bj.invInertia);
    }


    // Caluclate cross products
    vec3.cross(rixt,ri,t);
    vec3.cross(rjxt,rj,t);

    vec3.cross(wixri,wi,ri);
    vec3.cross(wjxrj,wj,rj);

    vec3.transformMat3(invIi_vmult_taui, taui, invIi); //invIi.vmult(taui,invIi_vmult_taui);
    vec3.transformMat3(invIj_vmult_tauj, tauj, invIj); //invIj.vmult(tauj,invIj_vmult_tauj);

    var Gq = 0; // we do only want to constrain motion
    var GW = vec3.dot(vj,t) - vec3.dot(vi,t) + vec3.dot(wjxrj,t) - vec3.dot(wixri,t); // eq. 40
    var GiMf = vec3.dot(fj,t)*invMassj - vec3.dot(fi,t)*invMassi + vec3.dot(rjxt,invIj_vmult_tauj) - vec3.dot(rixt,invIi_vmult_taui);

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = G * Minv * G + eps
//var FEcomputeC_temp1 = vec3.create();
//var FEcomputeC_temp2 = vec3.create();
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
    
    if(bi.invInertia){
        mat3.setTrace(invIi,bi.invInertia);
    }
    if(bj.invInertia){
        mat3.setTrace(invIj,bj.invInertia);
    }

    // Compute rxt * I * rxt for each body
    /*
    invIi.vmult(rixt,FEcomputeC_temp1);
    invIj.vmult(rjxt,FEcomputeC_temp2);
    C += vec3.dot(FEcomputeC_temp1,rixt);
    C += vec3.dot(FEcomputeC_temp2,rjxt);
      */
    vec3.transformMat3(this.biInvInertiaTimesRixt, rixt, invIi); // invIi.vmult(rixt,this.biInvInertiaTimesRixt);
    vec3.transformMat3(this.bjInvInertiaTimesRjxt, rjxt, invIj); // invIj.vmult(rjxt,this.bjInvInertiaTimesRjxt);
    C += vec3.dot(this.biInvInertiaTimesRixt,rixt);
    C += vec3.dot(this.bjInvInertiaTimesRjxt,rjxt);

    return C;
};

var FrictionEquation_computeGWlambda_ulambda = vec3.create();
CANNON.FrictionEquation.prototype.computeGWlambda = function(){

    // Correct at all ???

    var bi = this.bi;
    var bj = this.bj;

    var GWlambda = 0.0;
    var ulambda = FrictionEquation_computeGWlambda_ulambda;
    vec3.subtract(ulambda, bj.vlambda, bi.vlambda);
    GWlambda += vec3.dot(ulambda,this.t);

    // Angular
    if(bi.wlambda){
        GWlambda -= vec3.dot(bi.wlambda,this.rixt);
    }
    if(bj.wlambda){
        GWlambda += vec3.dot(bj.wlambda,this.rjxt);
    }

    return GWlambda;
};

var FrictionEquation_addToWlambda_tmp = vec3.create();
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
    vec3.scale(tmp, t, invMassi * deltalambda);
    vec3.subtract(bi.vlambda, bi.vlambda, tmp);

    vec3.scale(tmp, t, invMassj * deltalambda);
    vec3.add(bj.vlambda, bj.vlambda, tmp);

    // Add to angular velocity
    if(wi){
        /*
        var I = this.invIi;
        I.vmult(rixt,tmp);
        vec3.scale(tmp,tmp,deltalambda);
         */
        vec3.scale(tmp,this.biInvInertiaTimesRixt,deltalambda);
        vec3.subtract(wi,wi,tmp);
    }
    if(wj){
        /*
        var I = this.invIj;
        I.vmult(rjxt,tmp);
        vec3.scale(tmp,tmp,deltalambda);
         */
        vec3.scale(tmp,this.bjInvInertiaTimesRjxt,deltalambda);
        vec3.add(wj,wj,tmp);
    }
};