var Vec3 = require('../math/Vec3');
var Transform = require('../math/Transform');
var RaycastResult = require('../collision/RaycastResult');

module.exports = WheelInfo;

/**
 * @class WheelInfo
 * @constructor
 */
function WheelInfo(options){

    this.chassisConnectionPointLocal = new Vec3();
    if(options.chassisConnectionPointLocal){
        options.chassisConnectionPointLocal.copy(this.chassisConnectionPointLocal);
    }

    this.chassisConnectionPointWorld = new Vec3();
    if(options.chassisConnectionPointWorld){
        options.chassisConnectionPointWorld.copy(this.chassisConnectionPointWorld);
    }

    this.directionLocal = new Vec3();
    if(options.directionLocal){
        options.directionLocal.copy(this.directionLocal);
    }

    this.directionWorld = new Vec3();
    if(options.directionWorld){
        options.directionWorld.copy(this.directionWorld);
    }

    this.axleLocal = new Vec3();
    if(options.axleLocal){
        options.axleLocal.copy(this.axleLocal);
    }

    this.axleWorld = new Vec3();
    if(options.axleWorld){
        options.axleWorld.copy(this.axleWorld);
    }

    this.suspensionRestLength = typeof(options.suspensionRestLength) === 'number' ? options.suspensionRestLength : 1;
    this.suspensionMaxLength = typeof(options.suspensionMaxLength) === 'number' ? options.suspensionMaxLength : 2;

    this.radius = typeof(options.radius) === 'number' ? options.radius : 1;

    this.suspensionStiffness = typeof(options.suspensionStiffness) === 'number' ? options.suspensionStiffness : 100;
    this.dampingCompression = typeof(options.dampingCompression) === 'number' ? options.dampingCompression : 10;
    this.dampingRelaxation = typeof(options.dampingRelaxation) === 'number' ? options.dampingRelaxation : 10;
    this.frictionSlip = typeof(options.frictionSlip) === 'number' ? options.frictionSlip : 10000;
    this.steering = 0;
    this.rotation = 0;
    this.deltaRotation = 0;
    this.rollInfluence = 0;
    this.maxSuspensionForce = typeof(options.maxSuspensionForce) === 'number' ? options.maxSuspensionForce : 10000;

    this.engineForce = 0;
    this.brake = 0;

    this.isFrontWheel = true;
    this.clippedInvContactDotSuspension = 1;
    this.suspensionRelativeVelocity = 0;
    this.suspensionForce = 0;
    this.skidInfo = 0;
    this.suspensionLength = 0;

    /**
     * raycast starting point
     * @property {Vec3} raycastStartWorld
     */
    this.raycastResult = new RaycastResult();
    this.worldTransform = new Transform();
    this.isInContact = false;
}

WheelInfo.prototype.updateWheel = function(chassis){
    var raycastResult = this.raycastResult;

    if (raycastResult.isInContact){
        var project= raycastResult.hitNormalWorld.dot(raycastResult.directionWorld);
        var chassis_velocity_at_contactPoint = new Vec3();
        var relpos = new Vec3();
        raycastResult.hitPointWorld.vsub(chassis.position, relpos);
        var chassis_velocity_at_contactPoint = new Vec3();
        chassis.getVelocityAtWorldPoint(relpos, chassis_velocity_at_contactPoint);
        var projVel = raycastResult.hitNormalWorld.dot( chassis_velocity_at_contactPoint );
        if (project >= -0.1) {
            this.suspensionRelativeVelocity = 0.0;
            this.clippedInvContactDotSuspension = 1.0 / 0.1;
        } else {
            var inv = -1 / project;
            this.suspensionRelativeVelocity = projVel * inv;
            this.clippedInvContactDotSuspension = inv;
        }

    } else {
        // Not in contact : position wheel in a nice (rest length) position
        raycastResult.suspensionLength = this.suspensionRestLength;
        this.suspensionRelativeVelocity = 0.0;
        raycastResult.directionWorld.scale(-1, raycastResult.hitNormalWorld);
        this.clippedInvContactDotSuspension = 1.0;
    }
}