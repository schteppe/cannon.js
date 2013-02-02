/**
 * @class CANNON.DistanceConstraint
 * @brief Constrains two bodies to be at a constant distance from each other.
 * @author schteppe
 * @param CANNON.Body bodyA
 * @param CANNON.Body bodyB
 * @param float distance
 * @param float maxForce
 */
CANNON.DistanceConstraint = function(bodyA,bodyB,distance,maxForce){
    if(typeof(maxForce)=="undefined" )
        maxForce = 1e6;

    // Equations to be fed to the solver
    var eqs = this.equations = {
        normal: new CANNON.ContactEquation(bodyA,bodyB),
    };

    var normal = eqs.normal;

    normal.minForce = -maxForce;
    normal.maxForce =  maxForce;

    // Update 
    this.update = function(){
        bodyB.position.vsub(bodyA.position,normal.ni);
        normal.ni.normalize();
        /*bodyA.quaternion.vmult(pivotA,normal.ri);
        bodyB.quaternion.vmult(pivotB,normal.rj);*/
        normal.ni.mult( distance*0.5,normal.ri);
        normal.ni.mult( -distance*0.5,normal.rj);
    };
};
