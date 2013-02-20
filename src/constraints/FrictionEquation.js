/**
 * @class CANNON.FrictionEquation
 * @brief Constrains the slipping in a contact along a tangent
 * @author schteppe
 * @param CANNON.RigidBody bi
 * @param CANNON.RigidBody bj
 * @param float slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
 * @extends CANNON.Equation
 */
CANNON.FrictionEquation = function(bi,bj,slipForce){
    CANNON.Equation.call(this,bi,bj,-slipForce,slipForce);
    this.ri = new CANNON.Vec3();
    this.rj = new CANNON.Vec3();
    this.t = new CANNON.Vec3(); // tangent

    this.rixt = new CANNON.Vec3();
    this.rjxt = new CANNON.Vec3();
    this.wixri = new CANNON.Vec3();
    this.wjxrj = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    this.relVel = new CANNON.Vec3();
    this.relForce = new CANNON.Vec3();
};

CANNON.FrictionEquation.prototype = new CANNON.Equation();
CANNON.FrictionEquation.prototype.constructor = CANNON.FrictionEquation;

var FrictionEquation_computeB_temp1 = new CANNON.Vec3();
var FrictionEquation_computeB_temp2 = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.computeB = function(h){
    var a = this.a,
        b = this.b;
    var bi = this.bi;
    var bj = this.bj;
    var ri = this.ri;
    var rj = this.rj;
    var rixt = this.rixt;
    var rjxt = this.rjxt;
    var wixri = this.wixri;
    var wjxrj = this.wjxrj;

    var vi = bi.velocity;
    var wi = bi.angularVelocity ? bi.angularVelocity : new CANNON.Vec3();
    var fi = bi.force;
    var taui = bi.tau ? bi.tau : new CANNON.Vec3();

    var vj = bj.velocity;
    var wj = bj.angularVelocity ? bj.angularVelocity : new CANNON.Vec3();
    var fj = bj.force;
    var tauj = bj.tau ? bj.tau : new CANNON.Vec3();

    var relVel = this.relVel;
    var relForce = this.relForce;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia) invIi.setTrace(bi.invInertia);
    if(bj.invInertia) invIj.setTrace(bj.invInertia);

    var t = this.t;

    // Caluclate cross products
    ri.cross(t,rixt);
    rj.cross(t,rjxt);

    wi.cross(ri,wixri);
    wj.cross(rj,wjxrj);

    var invIi_vmult_taui = FrictionEquation_computeB_temp1;
    var invIj_vmult_tauj = FrictionEquation_computeB_temp2;
    invIi.vmult(taui,invIi_vmult_taui);
    invIj.vmult(tauj,invIj_vmult_tauj);

    var Gq = 0; // we do only want to constrain motion
    var GW = vj.dot(t) - vi.dot(t) + wjxrj.dot(t) - wixri.dot(t); // eq. 40
    var GiMf = fj.dot(t)*invMassj - fi.dot(t)*invMassi + rjxt.dot(invIj_vmult_tauj) - rixt.dot(invIi_vmult_taui);

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = G * Minv * G + eps
var FEcomputeC_temp1 = new CANNON.Vec3();
var FEcomputeC_temp2 = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.computeC = function(){
    var bi = this.bi;
    var bj = this.bj;
    var rixt = this.rixt;
    var rjxt = this.rjxt;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = invMassi + invMassj + this.eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia) invIi.setTrace(bi.invInertia);
    if(bj.invInertia) invIj.setTrace(bj.invInertia);

    // Compute rxt * I * rxt for each body
    invIi.vmult(rixt,FEcomputeC_temp1); 
    invIj.vmult(rjxt,FEcomputeC_temp2);
    C += FEcomputeC_temp1.dot(rixt);
    C += FEcomputeC_temp2.dot(rjxt);


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
    if(bi.wlambda)
        GWlambda -= bi.wlambda.dot(this.rixt);
    if(bj.wlambda)
        GWlambda += bj.wlambda.dot(this.rjxt);

    return GWlambda;
};

var FrictionEquation_addToWlambda_tmp = new CANNON.Vec3();
CANNON.FrictionEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var rixt = this.rixt;
    var rjxt = this.rjxt;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;
    var t = this.t;
    var tmp = FrictionEquation_addToWlambda_tmp;

    // Add to linear velocity
    t.mult(invMassi * deltalambda, tmp);
    bi.vlambda.vsub(tmp,bi.vlambda);

    t.mult(invMassj * deltalambda, tmp);
    bj.vlambda.vadd(tmp,bj.vlambda);

    // Add to angular velocity
    var wi = bi.wlambda;
    if(wi){
        var I = this.invIi;
        I.vmult(rixt,tmp);
        tmp.mult(deltalambda,tmp);
        wi.vsub(tmp,wi);
    }
    var wj = bj.wlambda;
    if(wj){
        var I = this.invIj;
        I.vmult(rjxt,tmp);
        tmp.mult(deltalambda,tmp);
        wj.vadd(tmp,wj);
    }
};