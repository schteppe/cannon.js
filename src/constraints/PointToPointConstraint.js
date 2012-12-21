/*global CANNON:true */

/**
 * @class CANNON.PointToPointConstraint
 * @brief Connects two bodies at given offset points
 * @extends CANNON.Constraint
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Vec3 pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
 * @param CANNON.Body bodyB Optional. If specified, pivotB must also be specified, and bodyB will be constrained in a similar way to the same point as bodyA. We will therefore get sort of a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
 * @param CANNON.Vec3 pivotB Optional. See pivotA.
 */
CANNON.PointToPointConstraint = function(bodyA,pivotA,bodyB,pivotB,maxForce){
    CANNON.Constraint.call(this,bodyA,bodyB,-maxForce,maxForce);
    this.penetration = 0.0;

    bodyA.invInertiaWorldAutoUpdate = true;
    bodyB.invInertiaWorldAutoUpdate = true;

    // Pivots
    this.pi = new CANNON.Vec3();
    pivotA.copy(this.pi);
    this.pj = new CANNON.Vec3();
    pivotB.copy(this.pj);

    this.ri = new CANNON.Vec3();
    this.rj = new CANNON.Vec3();
    this.ni = new CANNON.Vec3();

    this.penetrationVec = new CANNON.Vec3();

    this.rixn = new CANNON.Vec3();
    this.rjxn = new CANNON.Vec3();
    this.rixw = new CANNON.Vec3();
    this.rjxw = new CANNON.Vec3();

    this.invIi = new CANNON.Mat3();
    this.invIj = new CANNON.Mat3();

    this.relVel = new CANNON.Vec3();
    this.relForce = new CANNON.Vec3();
};

CANNON.PointToPointConstraint.prototype = new CANNON.Constraint();
CANNON.PointToPointConstraint.prototype.constructor = CANNON.PointToPointConstraint;

CANNON.PointToPointConstraint.prototype.computeB = function(a,b,h){
    var bi = this.bi;
    var bj = this.bj;
    var ri = this.ri;
    var rj = this.rj;
    var pi = this.pi;
    var pj = this.pj;
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

    if(bi.invInertia) invIi.setTrace(bi.invInertiaWorld);
    else              invIi.setZero();
    if(bj.invInertia) invIj.setTrace(bj.invInertiaWorld);
    else              invIj.setZero();

    var n = this.ni;

    // Convert to oriented pivots
    bi.quaternion.vmult(pi,ri);
    bj.quaternion.vmult(pj,rj);

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

    //penetrationVec.copy(n);
    bj.position.vsub(bi.position,n); // Use a "penetration normal" along the distance vector in between
    n.normalize();

    var Gq = n.dot(penetrationVec);

    // Compute iteration
    var GW = vj.dot(n) - vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
    var GiMf = fj.dot(n)*invMassj - fi.dot(n)*invMassi + rjxn.dot(invIj.vmult(tauj)) - rixn.dot(invIi.vmult(taui)) ;

    var B = - Gq*a - GW*b - h*GiMf;

    return B;
};

// Compute C = GMG+eps in the SPOOK equation
CANNON.PointToPointConstraint.prototype.computeC = function(eps){
    var bi = this.bi;
    var bj = this.bj;
    var rixn = this.rixn;
    var rjxn = this.rjxn;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var C = invMassi + invMassj + eps;

    var invIi = this.invIi;
    var invIj = this.invIj;

    if(bi.invInertia) invIi.setTrace(bi.invInertiaWorld);
    else              invIi.setZero();
    if(bj.invInertia) invIj.setTrace(bj.invInertiaWorld);
    else              invIj.setZero();

    // Compute rxn * I * rxn for each body
    C += invIi.vmult(rixn).dot(rixn);
    C += invIj.vmult(rjxn).dot(rjxn);

    return C;
};

CANNON.PointToPointConstraint.prototype.computeGWlambda = function(){
    var bi = this.bi;
    var bj = this.bj;
    var n = this.ni;

    var GWlambda = 0.0;
    var ulambda = bj.vlambda.vsub(bi.vlambda);
    GWlambda += ulambda.dot(n);

    // Angular
    if(bi.wlambda) GWlambda -= bi.wlambda.dot(this.rixn);
    if(bj.wlambda) GWlambda += bj.wlambda.dot(this.rjxn);

    return GWlambda;
};

CANNON.PointToPointConstraint.prototype.addToWlambda = function(deltalambda){
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
