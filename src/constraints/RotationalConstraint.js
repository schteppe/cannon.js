/*global CANNON:true */

/**
 * @class CANNON.RotationalEquation
 * @brief Rotational constraint. Works to keep the local vectors orthogonal to each other.
 * @author schteppe
 * @param CANNON.RigidBody bj
 * @param CANNON.Vec3 localVectorInBodyA
 * @param CANNON.RigidBody bi
 * @param CANNON.Vec3 localVectorInBodyB
 * @param float maxForce
 */
CANNON.RotationalConstraint = function(bodyA, localVectorInBodyA, bodyB, localVectorInBodyB, maxForce){
    maxForce = maxForce || 1e6; 
    // Equations to be fed to the solver
    var eqs = this.equations = {
        rotational: new CANNON.RotationalEquation(bodyA,bodyB),
    };

    var eq = eqs.rotational;

    eq.minForce = -maxForce;
    eq.maxForce = maxForce;

    // Update 
    this.update = function(){
        bodyA.quaternion.vmult(localVectorInBodyA, eq.ni);
        bodyB.quaternion.vmult(localVectorInBodyB, eq.nj);
    };
};
