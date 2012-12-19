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

    this.dir = new CANNON.Vec3();
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
    var dir = this.dir;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;

    this.ni.negate(dir);
    vi.vsub(vj,relVel);
    relForce.set(   ( fi.x*invMassi - fj.x*invMassj ) ,
                    ( fi.y*invMassi - fj.y*invMassj ) ,
                    ( fi.z*invMassi - fj.z*invMassj ) );

    // Do contact Constraint!
    var q = -Math.abs(this.penetration);

    // Compute iteration
    var B = -q * a - relVel.dot(dir) * b - relForce.dot(dir) * h;
    return B;
};

CANNON.ContactConstraint.prototype.computeC = function(eps){
    var invMassi = this.bi.invMass;
    var invMassj = this.bj.invMass;
    var C = (invMassi + invMassj + eps);
    return C;
};

CANNON.ContactConstraint.prototype.computeGWlambda = function(){
    var ulambda = this.bi.vlambda.vsub(this.bj.vlambda);
    var GWlambda = ulambda.dot(this.dir);
    return GWlambda;
};

CANNON.ContactConstraint.prototype.addToWlambda = function(deltalambda){
    var bi = this.bi;
    var bj = this.bj;
    var invMassi = bi.invMass;
    var invMassj = bj.invMass;
    var dir = this.dir;
    bi.vlambda.vadd(dir.mult(invMassi * deltalambda),bi.vlambda);
    bj.vlambda.vsub(dir.mult(invMassj * deltalambda),bj.vlambda);
};