/**
 * @class CANNON.ContactEquation
 * @brief Contact/non-penetration constraint equation
 * @author schteppe
 * @param CANNON.RigidBody bj
 * @param CANNON.RigidBody bi
 * @extends CANNON.Equation
 */
CANNON.ContactEquation = function(bi,bj){
    CANNON.Equation.call(this,bi,bj,0,1e6);
    this.penetration = 0.0;
    this.ri = new CANNON.Vec3();
    this.penetrationVec = new CANNON.Vec3();
    this.rj = new CANNON.Vec3();
    this.ni = new CANNON.Vec3();
    this.rixn = new CANNON.Vec3();
    this.rjxn = new CANNON.Vec3();
    this.rixw = new CANNON.Vec3();
    this.rjxw = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    this.relVel = new CANNON.Vec3();
    this.relForce = new CANNON.Vec3();
};

CANNON.ContactEquation.prototype = new CANNON.Equation();
CANNON.ContactEquation.prototype.constructor = CANNON.ContactEquation;

CANNON.ContactEquation.prototype.computeB = function(a,b,h){
    var bi = this.bi;
    var bj = this.bj;
    var ri = this.ri;
    var rj = this.rj;
    var rixn = this.rixn;
    var rjxn = this.rjxn;

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
    var penetrationVec = this.penetrationVec;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia) invIi.setTrace(bi.invInertia);
    else              invIi.identity(); // ok?
    if(bj.invInertia) invIj.setTrace(bj.invInertia);
    else              invIj.identity(); // ok?

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

    // Compute iteration
    var GW = vj.dot(n) - vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
    var GiMf = fj.dot(n)*invMassj - fi.dot(n)*invMassi + rjxn.dot(invIj.vmult(tauj)) - rixn.dot(invIi.vmult(taui)) ;

    var B = - Gq * a - GW * b - h*GiMf;

    return B;
};

// Compute C = GMG+eps in the SPOOK equation
CANNON.ContactEquation.prototype.computeC = function(eps){
    var bi = this.bi;
    var bj = this.bj;
    var rixn = this.rixn;
    var rjxn = this.rjxn;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = invMassi + invMassj + eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia) invIi.setTrace(bi.invInertia);
    else              invIi.identity(); // ok?
    if(bj.invInertia) invIj.setTrace(bj.invInertia);
    else              invIj.identity(); // ok?

    // Compute rxn * I * rxn for each body
    C += invIi.vmult(rixn).dot(rixn);
    C += invIj.vmult(rjxn).dot(rjxn);


    return C;
};

CANNON.ContactEquation.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;

    var GWlambda = 0.0;
    var ulambda = bj.vlambda.vsub(bi.vlambda);
    GWlambda += ulambda.dot(this.ni);

    // Angular
    if(bi.wlambda)
        GWlambda -= bi.wlambda.dot(this.rixn);
    if(bj.wlambda)
        GWlambda += bj.wlambda.dot(this.rjxn);

    return GWlambda;
};

CANNON.ContactEquation.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var rixn = this.rixn;
    var rjxn = this.rjxn;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;
    var n = this.ni;

    // Add to linear velocity
    bi.vlambda.vsub(n.mult(invMassi * deltalambda),bi.vlambda);
    bj.vlambda.vadd(n.mult(invMassj * deltalambda),bj.vlambda);

    // Add to angular velocity
    if(bi.wlambda){
        var I = this.invIi;
        bi.wlambda.vsub(I.vmult(rixn).mult(deltalambda),bi.wlambda);
    }
    if(bj.wlambda){
        var I = this.invIj;
        bj.wlambda.vadd(I.vmult(rjxn).mult(deltalambda),bj.wlambda);
    }
};
