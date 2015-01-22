module.exports = HingeConstraint;

var Constraint = require('./Constraint');
var PointToPointConstraint = require('./PointToPointConstraint');
var RotationalEquation = require('../equations/RotationalEquation');
var RotationalMotorEquation = require('../equations/RotationalMotorEquation');
var ContactEquation = require('../equations/ContactEquation');
var Vec3 = require('../math/Vec3');

/**
 * Hinge constraint. Defines an axis locally in each body, and tries to keep these equal in world space.
 * @class HingeConstraint
 * @constructor
 * @author schteppe
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {object} [options]
 * @param {Vec3} [options.pivotA] A point defined locally in bodyA. This defines the offset of axisA.
 * @param {Vec3} [options.axisA] an axis that bodyA can rotate around.
 * @param {Vec3} [options.pivotB]
 * @param {Vec3} [options.axisB]
 * @param {Number} [options.maxForce=1e6]
 * @extends PointToPointConstraint
 */
function HingeConstraint(bodyA, bodyB, options){
    var maxForce = typeof(options.maxForce) !== 'undefined' ? options.maxForce : 1e6;
    var pivotA = options.pivotA ? options.pivotA.clone() : new Vec3();
    var pivotB = options.pivotB ? options.pivotB.clone() : new Vec3();

    PointToPointConstraint.call(this, bodyA, pivotA, bodyB, pivotB, options);

    /**
     * Rotation axis, defined locally in bodyA.
     * @property {Vec3} axisA
     */
    var axisA = this.axisA = options.axisA ? options.axisA.clone() : new Vec3(1,0,0);

    /**
     * Rotation axis, defined locally in bodyB.
     * @property {Vec3} axisB
     */
    var axisB = this.axisB = options.axisB ? options.axisB.clone() : new Vec3(1,0,0);

    /**
     * @property {RotationalEquation} rotationalEquation1
     */
    var r1 = this.rotationalEquation1 = new RotationalEquation(bodyA,bodyB);

    /**
     * @property {RotationalEquation} rotationalEquation2
     */
    var r2 = this.rotationalEquation2 = new RotationalEquation(bodyA,bodyB);

    /**
     * @property {RotationalMotorEquation} motorEquation
     */
    var motor = this.motorEquation = new RotationalMotorEquation(bodyA,bodyB,maxForce);
    motor.enabled = false; // Not enabled by default

    // Equations to be fed to the solver
    this.equations.push(
        r1, // rotational1
        r2, // rotational2
        motor
    );

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

}
HingeConstraint.prototype = new PointToPointConstraint();
HingeConstraint.constructor = HingeConstraint;

/**
 * @method enableMotor
 */
HingeConstraint.prototype.enableMotor = function(){
    this.motorEquation.enabled = true;
};

/**
 * @method disableMotor
 */
HingeConstraint.prototype.disableMotor = function(){
    this.motorEquation.enabled = false;
};

/**
 * @method setMotorSpeed
 * @param {number} speed
 */
HingeConstraint.prototype.setMotorSpeed = function(speed){
    this.motorEquation.targetVelocity = speed;
};

/**
 * @method setMotorMaxForce
 * @param {number} maxForce
 */
HingeConstraint.prototype.setMotorMaxForce = function(maxForce){
    this.motorEquation.maxForce = maxForce;
    this.motorEquation.minForce = -maxForce;
};

HingeConstraint.prototype.update = function(){
    var bodyA = this.bodyA,
        bodyB = this.bodyB,
        eqs = this.equations,
        motor = this.motorEquation,
        r1 = this.rotationalEquation1,
        r2 = this.rotationalEquation2;

    PointToPointConstraint.prototype.update.call(this);

    var axisA_x_pivotA = this.axisA_x_pivotA;
    var axisA = this.axisA;
    var axisB = this.axisB;
    var pivotA = this.pivotA;
    var pivotB = this.pivotB;
    var axisA_x_axisA_x_pivotA = this.axisA_x_axisA_x_pivotA;
    var axisB_x_pivotB = this.axisB_x_pivotB;

    axisA.cross(pivotA, axisA_x_pivotA);
    if(axisA_x_pivotA.norm2() < 0.001){ // pivotA is along the same line as axisA
        pivotA.tangents(axisA_x_pivotA, axisA_x_pivotA);
    }
    axisA.cross(axisA_x_pivotA, axisA_x_axisA_x_pivotA);
    axisB.cross(pivotB, axisB_x_pivotB);
    if(axisB_x_pivotB.norm2() < 0.001){ // pivotB is along the same line as axisB
        axisB.tangents(axisB_x_pivotB,axisB_x_pivotB);
    }

    axisA_x_pivotA.normalize();
    axisB_x_pivotB.normalize();

    // update rotational constraints
    bodyA.quaternion.vmult(axisA_x_pivotA, r1.axisA);
    bodyB.quaternion.vmult(axisB, r1.axisB);
    bodyA.quaternion.vmult(axisA_x_axisA_x_pivotA, r2.axisA);
    bodyB.quaternion.vmult(axisB, r2.axisB);

    if(this.motorEquation.enabled){
        bodyA.quaternion.vmult(this.axisA, motor.axisA);
        bodyB.quaternion.vmult(this.axisB, motor.axisB);
    }
};

HingeConstraint.prototype.getRotationalEquation1 =   function(){ return this.rotationalEquation1; };
HingeConstraint.prototype.getRotationalEquation2 =   function(){ return this.rotationalEquation2; };
HingeConstraint.prototype.getPointToPointEquation1 = function(){ return this.equationX; };
HingeConstraint.prototype.getPointToPointEquation2 = function(){ return this.equationY; };
HingeConstraint.prototype.getPointToPointEquation3 = function(){ return this.equationZ; };
