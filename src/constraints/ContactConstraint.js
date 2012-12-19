/**
 * @class CANNON.ContactConstraint
 * @brief Contact constraint class
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.RigidBody bodyB
 * @param float friction
 * @extends CANNON.Constraint
 * @todo integrate with the World class
 */
CANNON.ContactConstraint = function(bi,bj){
    CANNON.Constraint.call(this);
    this.penetration = 0.0;
    this.bi = bi;
    this.bj = bj;
    this.slipForce = 0.0;
    this.ri = new CANNON.Vec3();
    this.rj = new CANNON.Vec3();
    this.ni = new CANNON.Vec3();

    this.minForce = 0.0; // Force must be repelling
    this.maxForce = 1e6;

    this.relVel = new CANNON.Vec3();
    this.relForce = new CANNON.Vec3();
};

CANNON.ContactConstraint.prototype = new CANNON.Constraint();
CANNON.ContactConstraint.prototype.constructor = CANNON.ContactConstraint;

CANNON.ContactConstraint.prototype.computeB = function(a,b,h){
    var bi = this.bi;
    var bj = this.bj;

    var vi = bi.velocity;
    var wi = bi.angularVelocity;
    var fi = bi.force;
    var taui = bi.tau;

    var vj = bj.velocity;
    var wj = bj.angularVelocity;
    var fj = bj.force;
    var tauj = bj.tau;

    var relVel = this.relVel;
    var relForce = this.relForce;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    var n = this.ni;

    vj.vsub(vi,relVel);
    relForce.set(   ( fj.x*invMassj - fi.x*invMassi ) ,
                    ( fj.y*invMassj - fi.y*invMassi ) ,
                    ( fj.z*invMassj - fi.z*invMassi ) );

    // Do contact Constraint!
    var q = -Math.abs(this.penetration);

    // Compute iteration
    var B = -q * a - relVel.dot(n) * b - relForce.dot(n) * h;
    return B;
};

CANNON.ContactConstraint.prototype.computeC = function(eps){
    var invMassi = this.bi.invMass;
    var invMassj = this.bj.invMass;
    var C = (invMassi + invMassj + eps);
    return C;
};

CANNON.ContactConstraint.prototype.computeGWlambda = function(){
    var ulambda = this.bj.vlambda.vsub(this.bi.vlambda);
    var GWlambda = ulambda.dot(this.ni);
    return GWlambda;
};

CANNON.ContactConstraint.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;
    var n = this.ni;
    bi.vlambda.vsub(n.mult(invMassi * deltalambda),bi.vlambda);
    bj.vlambda.vadd(n.mult(invMassj * deltalambda),bj.vlambda);
};