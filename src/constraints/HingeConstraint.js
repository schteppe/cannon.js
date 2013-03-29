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

    var unitPivotA = vec3.create(); vec3.normalize(unitPivotA,pivotA); //pivotA.unit();
    var unitPivotB = vec3.create(); vec3.normalize(unitPivotB,pivotB); //pivotB.unit();

    var axisA_x_pivotA = vec3.create();
    var axisA_x_axisA_x_pivotA = vec3.create();
    var axisB_x_pivotB = vec3.create();

    vec3.cross(axisA_x_pivotA, axisA, unitPivotA);// axisA.cross(unitPivotA,axisA_x_pivotA);
    vec3.cross(axisA_x_axisA_x_pivotA, axisA, axisA_x_pivotA);// axisA.cross(axisA_x_pivotA,axisA_x_axisA_x_pivotA);
    vec3.cross(axisB_x_pivotB, axisB, unitPivotB); //axisB.cross(unitPivotB,axisB_x_pivotB);

    vec3.normalize(axisA_x_pivotA,axisA_x_pivotA);// axisA_x_pivotA.normalize();
    vec3.normalize(axisB_x_pivotB,axisB_x_pivotB);//axisB_x_pivotB.normalize();

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
        vec3.set(normal.ni,1,0,0);//normal.ni.set(1,0,0);
        vec3.set(t1.ni,0,1,0);
        vec3.set(t2.ni,0,0,1);
        vec3.transformQuat(normal.ri, pivotA, bodyA.quaternion); //bodyA.quaternion.vmult(pivotA,normal.ri);
        vec3.transformQuat(normal.rj, pivotB, bodyB.quaternion); //bodyB.quaternion.vmult(pivotB,normal.rj);

        //normal.ni.tangents(t1.ni,t2.ni);
        vec3.copy(t1.ri, normal.ri); //normal.ri.copy(t1.ri);
        vec3.copy(t1.rj, normal.rj); //normal.rj.copy(t1.rj);
        vec3.copy(t2.ri, normal.ri); //normal.ri.copy(t2.ri);
        vec3.copy(t2.rj, normal.rj); //normal.rj.copy(t2.rj);

        // update rotational constraints
        vec3.transformQuat( r1.ni,axisA_x_pivotA,bodyA.quaternion);
        vec3.transformQuat(          r1.nj,axisB,bodyB.quaternion);
        vec3.transformQuat(  r2.ni,axisA_x_axisA_x_pivotA,bodyA.quaternion);
        vec3.transformQuat(           r2.nj,axisB,bodyB.quaternion);

        if(motorEnabled){
            vec3.transformQuat(motor.axisA,axisA,bodyA.quaternion);
            vec3.transformQuat(motor.axisB,axisB,bodyB.quaternion);
            motor.targetVelocity = that.motorTargetVelocity;
            motor.maxForce = that.motorMaxForce;
            motor.minForce = that.motorMinForce;
        }
    };
};
CANNON.HingeConstraint.prototype = new CANNON.Constraint();