var Vec3 = require('../math/Vec3');
var Transform = require('../math/Transform');

module.exports = WheelInfo;

/**
 * @class WheelInfo
 * @constructor
 */
function WheelInfo(){

    // Parameters

    this.chassisConnectionPointLocal = new Vec3();
    this.directionLocal = new Vec3();
    this.axleLocal = new Vec3();
    this.suspensionRestLength1 = 0;
    this.maxSuspensionTravelCm = 0;
    this.radius = 0;
    this.suspensionStiffness = 0;
    this.dampingCompression = 0;
    this.dampingRelaxation = 0;
    this.frictionSlip = 0;
    this.steering = 0;
    this.rotation = 0;
    this.deltaRotation = 0;
    this.rollInfluence = 0;
    this.maxSuspensionForce = 0;

    this.engineForce = 0;
    this.brake = 0;

    this.isFrontWheel = true;
    this.clippedInvContactDotSuspension = 0;
    this.suspensionRelativeVelocity = 0;
    this.suspensionForce = 0;
    this.skidInfo = 0;


    // Raycast info

    /**
     * contactnormal
     * @property {Vec3} contactNormalWorld
     */
    this.contactNormalWorld = new Vec3();

    /**
     * raycast hitpoint
     * @property {Vec3} contactPointWorld
     */
    this.contactPointWorld = new Vec3();

    this.suspensionLength = 0;

    /**
     * raycast starting point
     * @property {Vec3} raycastStartWorld
     */
    this.raycastStartWorld = new Vec3();

    /**
     * direction in worldspace
     * @property {Vec3} wheelDirectionWorld
     */
    this.wheelDirectionWorld = new Vec3();

    /**
     * axle in worldspace
     * @property {Vec3} wheelAxleWorld
     */
    this.wheelAxleWorld = new Vec3();
    this.isInContact = false;
    this.groundObject = null;
    this.worldTransform = new Transform();

}