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
    this.impact = true; // Impact on first collision
    this.penetration = 0.0;
    this.bi = bi;
    this.bj = bj;
    this.slipForce = 0.0;
    this.ri = new CANNON.Vec3();
    this.rj = new CANNON.Vec3();
    this.ni = new CANNON.Vec3();
};

CANNON.ContactConstraint.prototype = new CANNON.Constraint();
CANNON.ContactConstraint.prototype.constructor = CANNON.ContactConstraint;
