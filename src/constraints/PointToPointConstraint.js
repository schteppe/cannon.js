/**
 * @class CANNON.PointToPointConstraint
 * @brief Connects two bodies at given offset points
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Vec3 pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
 * @param CANNON.Body bodyB Body that will be constrained in a similar way to the same point as bodyA. We will therefore get sort of a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
 * @param CANNON.Vec3 pivotB See pivotA.
 * @param float maxForce The maximum force that should be applied to constrain the bodies.
 * @extends CANNON.Constraint
 */
CANNON.PointToPointConstraint = function(bodyA,pivotA,bodyB,pivotB,maxForce){
    CANNON.Constraint.call(this,bodyA,bodyB);

    // Equations to be fed to the solver
    var eqs = this.equations = [
        new CANNON.ContactEquation(bodyA,bodyB), // Normal
        new CANNON.ContactEquation(bodyA,bodyB), // Tangent2
        new CANNON.ContactEquation(bodyA,bodyB), // Tangent2
    ];

    var normal = eqs[0];
    var t1 = eqs[1];
    var t2 = eqs[2];

    t1.minForce = t2.minForce = normal.minForce = -maxForce;
    t1.maxForce = t2.maxForce = normal.maxForce =  maxForce;

    // Update 
    this.update = function(){
        vec3.subtract(normal.ni,bodyB.position,bodyA.position);
        vec3.normalize(normal.ni,normal.ni);
        vec3.transformQuat(normal.ri, pivotA, bodyA.quaternion);
        vec3.transformQuat(normal.rj, pivotB, bodyB.quaternion); //bodyB.quaternion.vmult(pivotB,normal.rj);

        vec3.tangents(t1.ni,t2.ni,normal.ni);
        vec3.copy(t1.ri,normal.ri);
        vec3.copy(t1.rj,normal.rj);
        vec3.copy(t2.ri,normal.ri);
        vec3.copy(t2.rj,normal.rj);
    };
};
CANNON.PointToPointConstraint.prototype = new CANNON.Constraint();
