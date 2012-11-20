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
CANNON.PointToPointConstraint = function(bodyA,pivotA,bodyB,pivotB){
    CANNON.Constraint.call(this);
    this.body_i = bodyA;
    this.body_j = bodyB;
    this.pivot_i = pivotA;
    this.pivot_j = pivotB;
    this.equations.push(new CANNON.Equation(bodyA, bodyB));
    
    /**
     * @property CANNON.Vec3 piWorld
     * @memberof CANNON.PointToPointConstraint
     * @brief Pivot point relative to body_i in world coordinates
     */
    this.piWorld = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 pjWorld
     * @memberof CANNON.PointToPointConstraint
     */
    this.pjWorld = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 ri
     * @memberof CANNON.PointToPointConstraint
     * @brief Pivot point relative to body_i (this vector is world oriented but without offset)
     */
    this.ri = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 rj
     * @memberof CANNON.PointToPointConstraint
     */
    this.rj = new CANNON.Vec3();

    /**
     * @property CANNON.Vec3 di
     * @memberof CANNON.PointToPointConstraint
     * @brief Difference vector; piWorld - pjWorld
     */
    this.di = new CANNON.Vec3(); // The diff vector

    /**
     * @property CANNON.Vec3 dj
     * @memberof CANNON.PointToPointConstraint
     */
    this.dj = new CANNON.Vec3();
    this.temp = new CANNON.Vec3();
};

CANNON.PointToPointConstraint.prototype = new CANNON.Constraint();
CANNON.PointToPointConstraint.prototype.constructor = CANNON.PointToPointConstraint;

CANNON.PointToPointConstraint.prototype.update = function(){
    var neq=this.equations[0],
        bi=this.body_i,
        bj=this.body_j,
        pi=this.pivot_i,
        pj=this.pivot_j,
        temp = this.temp;
    var di = this.di; // The diff vector in tangent directions
    var dj = this.dj;
    var ri = this.ri; // The diff vector in tangent directions
    var rj = this.rj;
    var pair = typeof(bj.mass)=="number";

    var piWorld = this.piWorld; // get world points
    var pjWorld = this.pjWorld;
    bi.quaternion.vmult(pi,piWorld);
    bj.quaternion.vmult(pj,pjWorld);
    bi.quaternion.vmult(pi,ri);
    bj.quaternion.vmult(pj,rj);
    piWorld.vadd(bi.position,piWorld);
    pjWorld.vadd(bj.position,pjWorld);

    // Normals
    var ni = new CANNON.Vec3();
    var nj = new CANNON.Vec3();
    ri.copy(ni);
    rj.copy(nj);
    ni.normalize();
    nj.normalize();
      
    // Violation is the amount of rotation needed to bring the rotation back
    // Get the diff between piWorld and where it should be
    piWorld.vsub(pjWorld,di);
    pjWorld.vsub(piWorld,dj);

    var diUnit = di.unit();
    diUnit.negate(neq.G1);
    diUnit.copy(neq.G3);
    ri.cross(diUnit,neq.G2);
    rj.cross(diUnit,neq.G4);
    neq.G2.negate(neq.G2);

    di.copy(neq.g1);
    dj.copy(neq.g3);
    neq.g1.mult(0.5,neq.g1);
    neq.g3.mult(0.5,neq.g3);

    bi.velocity.copy(neq.W1);
    bi.angularVelocity.copy(neq.W2);
    bj.velocity.copy(neq.W3);
    bj.angularVelocity.copy(neq.W4);

    // Mass properties
    neq.setDefaultMassProps();

    // Forces
    neq.setDefaultForce();
};

CANNON.DistanceConstraint.prototype.setMaxForce = function(f){
    this.equations[0].lambdamax = Math.abs(f);
    this.equations[0].lambdamin = -this.equations[0].lambdamax;
};