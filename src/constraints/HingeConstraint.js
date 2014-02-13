module.exports = HingeConstraint;

var Constraint = require('./Constraint')
,   RotationalEquation = require('../equations/RotationalEquation')
,   RotationalMotorEquation = require('../equations/RotationalMotorEquation')
,   ContactEquation = require('../equations/ContactEquation')
,   Vec3 = require('../math/Vec3')

/**
 * Hinge constraint. Tries to keep the local body axes equal.
 * @class HingeConstraint
 * @author schteppe
 * @param {RigidBody} bodyA
 * @param {Vec3} pivotA A point defined locally in bodyA. This defines the offset of axisA.
 * @param {Vec3} axisA an axis that bodyA can rotate around.
 * @param {RigidBody} bodyB
 * @param {Vec3} pivotB
 * @param {Vec3} axisB
 * @param {Number} maxForce
 */
function HingeConstraint(bodyA, pivotA, axisA, bodyB, pivotB, axisB, maxForce){
    Constraint.call(this,bodyA,bodyB);

    maxForce = maxForce || 1e6;
    var that = this;

    // Equations to be fed to the solver
    var eqs = this.equations = [
        new RotationalEquation(bodyA,bodyB), // rotational1
        new RotationalEquation(bodyA,bodyB), // rotational2
        new ContactEquation(bodyA,bodyB),    // p2pNormal
        new ContactEquation(bodyA,bodyB),    // p2pTangent1
        new ContactEquation(bodyA,bodyB),    // p2pTangent2
    ];

    this.pivotA = pivotA;
    this.pivotB = pivotB;
    this.axisA = axisA;
    this.axisB = axisB;

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

    var axisA_x_pivotA = this.axisA_x_pivotA = new Vec3();
    var axisA_x_axisA_x_pivotA = this.axisA_x_axisA_x_pivotA = new Vec3();
    var axisB_x_pivotB = this.axisB_x_pivotB = new Vec3();
    axisA.cross(unitPivotA,axisA_x_pivotA);
    if(axisA_x_pivotA.norm2() < 0.001){ // pivotA is along the same line as axisA
        unitPivotA.tangents(axisA_x_pivotA,axisA_x_pivotA);
    }
    axisA.cross(axisA_x_pivotA,axisA_x_axisA_x_pivotA);
    axisB.cross(unitPivotB,axisB_x_pivotB);
    if(axisB_x_pivotB.norm2() < 0.001){ // pivotB is along the same line as axisB
        axisB.tangents(axisB_x_pivotB,axisB_x_pivotB);
    }

    axisA_x_pivotA.normalize();
    axisB_x_pivotB.normalize();

    // Motor stuff
    this.motorEnabled = false;
    this.motorTargetVelocity = 0;
    this.motorMinForce = -maxForce;
    this.motorMaxForce = maxForce;
    this.motorEquation = new RotationalMotorEquation(bodyA,bodyB,maxForce);
};
HingeConstraint.prototype = new Constraint();

HingeConstraint.prototype.enableMotor = function(){
    if(!this.motorEnabled){
        this.equations.push(this.motorEquation);
        this.motorEnabled = true;
    }
};

HingeConstraint.prototype.disableMotor = function(){
    if(this.motorEnabled){
        this.motorEnabled = false;
        this.equations.pop();
    }
};

HingeConstraint.prototype.update = function(){
    var bodyA = this.bodyA,
        bodyB = this.bodyB,
        eqs = this.equations,
        motor = this.motorEquation,
        r1 = eqs[0],
        r2 = eqs[1],
        normal = eqs[2],
        t1 = eqs[3],
        t2 = eqs[4];

    // Update world positions of pivots
    /*
    bodyB.position.vsub(bodyA.position,normal.ni);
    normal.ni.normalize();
    */
    normal.ni.set(1,0,0);
    t1.ni.set(0,1,0);
    t2.ni.set(0,0,1);
    bodyA.quaternion.vmult(this.pivotA,normal.ri);
    bodyB.quaternion.vmult(this.pivotB,normal.rj);

    //normal.ni.tangents(t1.ni,t2.ni);
    normal.ri.copy(t1.ri);
    normal.rj.copy(t1.rj);
    normal.ri.copy(t2.ri);
    normal.rj.copy(t2.rj);

    // update rotational constraints
    bodyA.quaternion.vmult(this.axisA_x_pivotA,         r1.ni);
    bodyB.quaternion.vmult(this.axisB,                  r1.nj);
    bodyA.quaternion.vmult(this.axisA_x_axisA_x_pivotA, r2.ni);
    bodyB.quaternion.vmult(this.axisB,                  r2.nj);

    if(this.motorEnabled){
        bodyA.quaternion.vmult(this.axisA,motor.axisA);
        bodyB.quaternion.vmult(this.axisB,motor.axisB);
        motor.targetVelocity = this.motorTargetVelocity;
        motor.maxForce = this.motorMaxForce;
        motor.minForce = this.motorMinForce;
    }
};

HingeConstraint.prototype.getRotationalEquation1 =   function(){ return this.equations[0]; };
HingeConstraint.prototype.getRotationalEquation2 =   function(){ return this.equations[1]; };
HingeConstraint.prototype.getPointToPointEquation1 = function(){ return this.equations[2]; };
HingeConstraint.prototype.getPointToPointEquation2 = function(){ return this.equations[3]; };
HingeConstraint.prototype.getPointToPointEquation3 = function(){ return this.equations[4]; };
