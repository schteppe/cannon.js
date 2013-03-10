/**
 * @class CANNON.HingeConstraint
 * @brief Hinge constraint. Tries to keep the local body axes equal.
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.Vec3 pivotA A point defined locally in bodyA. This defines the offset of axisA.
 * @param CANNON.Vec3 axisA an axis that bodyA can rotate around.
 * @param CANNON.RigidBody bodyB
 * @param CANNON.Vec3 pivotB
 * @param CANNON.Vec3 axisB
 * @param float maxForce
 */
CANNON.HingeConstraint = function(bodyA, pivotA, axisA, bodyB, pivotB, axisB, maxForce){
    CANNON.Constraint.call(this,bodyA,bodyB);

    maxForce = maxForce || 1e6;
    var that = this;
    // Equations to be fed to the solver
    var eqs = this.equations = [
        new CANNON.RotationalEquation(bodyA,bodyB), // rotational1
        new CANNON.RotationalEquation(bodyA,bodyB), // rotational2
        new CANNON.ContactEquation(bodyA,bodyB),    // p2pNormal
        new CANNON.ContactEquation(bodyA,bodyB),    // p2pTangent1
        new CANNON.ContactEquation(bodyA,bodyB),    // p2pTangent2
    ];

    this.getRotationalEquation1 =   function(){ return eqs[0]; };
    this.getRotationalEquation2 =   function(){ return eqs[1]; };
    this.getPointToPointEquation1 = function(){ return eqs[2]; };
    this.getPointToPointEquation2 = function(){ return eqs[3]; };
    this.getPointToPointEquation3 = function(){ return eqs[4]; };

    var r1 =        this.getRotationalEquation1();
    var r2 =        this.getRotationalEquation2();
    var normal =    this.getPointToPointEquation1();
    var t1 =        this.getPointToPointEquation2();
    var t2 =        this.getPointToPointEquation3();
    var motor; // not activated by default

    t1.minForce = t2.minForce = normal.minForce = -maxForce;
    t1.maxForce = t2.maxForce = normal.maxForce =  maxForce;

    var unitPivotA = pivotA.unit();
    var unitPivotB = pivotB.unit();

    var axisA_x_pivotA = new CANNON.Vec3();
    var axisA_x_axisA_x_pivotA = new CANNON.Vec3();
    var axisB_x_pivotB = new CANNON.Vec3();
    axisA.cross(unitPivotA,axisA_x_pivotA);
    axisA.cross(axisA_x_pivotA,axisA_x_axisA_x_pivotA);
    axisB.cross(unitPivotB,axisB_x_pivotB);

    axisA_x_pivotA.normalize();
    axisB_x_pivotB.normalize();

    // Motor stuff
    var motorEnabled = false;
    this.motorTargetVelocity = 0;
    this.motorMinForce = -maxForce;
    this.motorMaxForce = maxForce;
    this.enableMotor = function(){
        if(!motorEnabled){
            motor = new CANNON.RotationalMotorEquation(bodyA,bodyB,maxForce);
            eqs.push(motor);
            motorEnabled = true;
        }
    };
    this.disableMotor = function(){
        if(motorEnabled){
            motorEnabled = false;
            motor = null;
            eqs.pop();
        }
    };

    // Update 
    this.update = function(){
        // Update world positions of pivots
        /*
        bodyB.position.vsub(bodyA.position,normal.ni);
        normal.ni.normalize();
        */
        normal.ni.set(1,0,0);
        t1.ni.set(0,1,0);
        t2.ni.set(0,0,1);
        bodyA.quaternion.vmult(pivotA,normal.ri);
        bodyB.quaternion.vmult(pivotB,normal.rj);

        //normal.ni.tangents(t1.ni,t2.ni);
        normal.ri.copy(t1.ri);
        normal.rj.copy(t1.rj);
        normal.ri.copy(t2.ri);
        normal.rj.copy(t2.rj);

        // update rotational constraints
        bodyA.quaternion.vmult(axisA_x_pivotA, r1.ni);
        bodyB.quaternion.vmult(axisB,          r1.nj);
        bodyA.quaternion.vmult(axisA_x_axisA_x_pivotA,  r2.ni);
        bodyB.quaternion.vmult(axisB,           r2.nj);

        if(motorEnabled){
            bodyA.quaternion.vmult(axisA,motor.axisA);
            bodyB.quaternion.vmult(axisB,motor.axisB);
            motor.targetVelocity = that.motorTargetVelocity;
            motor.maxForce = that.motorMaxForce;
            motor.minForce = that.motorMinForce;
        }
    };
};
CANNON.HingeConstraint.prototype = new CANNON.Constraint();