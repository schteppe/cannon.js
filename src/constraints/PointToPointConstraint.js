/**
 * Connects two bodies at given offset points
 * @class PointToPointConstraint
 * @author schteppe
 * @param {Body} bodyA
 * @param {Vec3} pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
 * @param {Body} bodyB Body that will be constrained in a similar way to the same point as bodyA. We will therefore get sort of a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
 * @param {Vec3} pivotB See pivotA.
 * @param {Number} maxForce The maximum force that should be applied to constrain the bodies.
 * @extends {Constraint}
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
        bodyB.position.vsub(bodyA.position,normal.ni);
        normal.ni.normalize();
        bodyA.quaternion.vmult(pivotA,normal.ri);
        bodyB.quaternion.vmult(pivotB,normal.rj);

        normal.ni.tangents(t1.ni,t2.ni);
        normal.ri.copy(t1.ri);
        normal.rj.copy(t1.rj);
        normal.ri.copy(t2.ri);
        normal.rj.copy(t2.rj);
    };
};
CANNON.PointToPointConstraint.prototype = new CANNON.Constraint();
