/*global CANNON:true */

/**
 * @class CANNON.PointToPointConstraint
 * @brief Connects two bodies at given offset points
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Vec3 pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
 * @param CANNON.Body bodyB Optional. If specified, pivotB must also be specified, and bodyB will be constrained in a similar way to the same point as bodyA. We will therefore get sort of a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
 * @param CANNON.Vec3 pivotB Optional. See pivotA.
 */
CANNON.PointToPointConstraint = function(bodyA,pivotA,bodyB,pivotB,maxForce){
    // Equations to be fed to the solver
    var eqs = this.equations = {
        normal: new CANNON.ContactEquation(bodyA,bodyB),
        tangent1: new CANNON.ContactEquation(bodyA,bodyB),
        tangent2: new CANNON.ContactEquation(bodyA,bodyB),
    };

    var normal = eqs.normal;
    var t1 = eqs.tangent1;
    var t2 = eqs.tangent2;

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
