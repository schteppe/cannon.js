/**
 * @class CANNON.DistanceConstraint
 * @brief Distance constraint class
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Body bodyB Could optionally be a CANNON.Vec3 to constrain a body to a static point in space
 * @param float distance
 */
 CANNON.DistanceConstraint = function(bodyA,bodyB,distance){
    CANNON.Constraint.call(this);
    this.body_i = bodyA;
    this.body_j = bodyB;
    this.distance = Number(distance);
    var eq = new CANNON.Equation(bodyA, bodyB instanceof CANNON.Vec3 ? null : bodyB);
    this.equations.push(eq);
};

CANNON.DistanceConstraint.prototype = new CANNON.Constraint();
CANNON.DistanceConstraint.prototype.constructor = CANNON.DistanceConstraint;

CANNON.DistanceConstraint.prototype.update = function(){
    var eq = this.equations[0], bi = this.body_i, bj = this.body_j;
    var pair = typeof(bj.mass)=="number";

    // Jacobian is the distance unit vector
    if(pair)
        bj.position.vsub(bi.position, eq.G1);
    else
        bi.position.vsub(bj,eq.G1);
    eq.G1.normalize();
    if(eq.G1.isZero()) eq.G1.set(1,0,0);
    eq.G1.negate(eq.G3);
  
    // Mass properties
    eq.setDefaultMassProps();
    eq.setDefaultForce();

    // Constraint violation
    eq.g1.set(  (pair ? bj.position.x : bj.x) - bi.position.x - eq.G1.x*this.distance,
                (pair ? bj.position.y : bj.y) - bi.position.y - eq.G1.y*this.distance,
                (pair ? bj.position.z : bj.z) - bi.position.z - eq.G1.z*this.distance);
    eq.g1.negate(eq.g1);
    eq.g1.negate(eq.g3);
};

CANNON.DistanceConstraint.prototype.setMaxForce = function(f){
    this.equations[0].lambdamax = Math.abs(f);
    this.equations[0].lambdamin = -this.equations[0].lambdamax;
};