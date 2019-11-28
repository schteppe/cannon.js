namespace CANNON
{
    export class WheelInfo
    {

        /**
         * Max travel distance of the suspension, in meters.
         */
        maxSuspensionTravel: number;

        /**
         * Speed to apply to the wheel rotation when the wheel is sliding.
         */
        customSlidingRotationalSpeed: number;

        /**
         * If the customSlidingRotationalSpeed should be used.
         */
        useCustomSlidingRotationalSpeed: boolean;

        sliding: boolean;

        /**
         * Connection point, defined locally in the chassis body frame.
         */
        chassisConnectionPointLocal: Vector3;

        chassisConnectionPointWorld: Vector3;

        directionLocal: Vector3;

        directionWorld: Vector3;

        axleLocal: Vector3;

        axleWorld: Vector3;

        suspensionRestLength: number;

        suspensionMaxLength: number;

        radius: number;

        suspensionStiffness: number;

        dampingCompression: number;

        dampingRelaxation: number;

        frictionSlip: number;

        steering: number;

        /**
         * Rotation value, in radians.
         */
        rotation: number;

        deltaRotation: number;

        rollInfluence: number;

        maxSuspensionForce: number;

        engineForce: number;

        brake: number;

        isFrontWheel: number;

        clippedInvContactDotSuspension: number;

        suspensionRelativeVelocity: number;

        suspensionForce: number;

        skidInfo: number;

        suspensionLength: number;

        sideImpulse: number;

        forwardImpulse: number;

        /**
         * The result from raycasting
         */
        raycastResult: RaycastResult;

        /**
         * Wheel world transform
         */
        worldTransform: Transform;

        isInContact: boolean;

        slipInfo: number;

        /**
         * 
         * @param options 
         */
        constructor(options: {
            maxSuspensionTravel?: number, customSlidingRotationalSpeed?: number, useCustomSlidingRotationalSpeed?: boolean,
            chassisConnectionPointLocal?: Vector3, chassisConnectionPointWorld?: Vector3, directionLocal?: Vector3, directionWorld?: Vector3,
            axleLocal?: Vector3, axleWorld?: Vector3, suspensionRestLength?: number, suspensionMaxLength?: number, radius?: number,
            suspensionStiffness?: number, dampingCompression?: number, dampingRelaxation?: number, frictionSlip?: number,
            rollInfluence?: number, maxSuspensionForce?: number, isFrontWheel?: number,
        } = {})
        {
            options = Utils.defaults(options, {
                chassisConnectionPointLocal: new Vector3(),
                chassisConnectionPointWorld: new Vector3(),
                directionLocal: new Vector3(),
                directionWorld: new Vector3(),
                axleLocal: new Vector3(),
                axleWorld: new Vector3(),
                suspensionRestLength: 1,
                suspensionMaxLength: 2,
                radius: 1,
                suspensionStiffness: 100,
                dampingCompression: 10,
                dampingRelaxation: 10,
                frictionSlip: 10000,
                steering: 0,
                rotation: 0,
                deltaRotation: 0,
                rollInfluence: 0.01,
                maxSuspensionForce: Number.MAX_VALUE,
                isFrontWheel: true,
                clippedInvContactDotSuspension: 1,
                suspensionRelativeVelocity: 0,
                suspensionForce: 0,
                skidInfo: 0,
                suspensionLength: 0,
                maxSuspensionTravel: 1,
                useCustomSlidingRotationalSpeed: false,
                customSlidingRotationalSpeed: -0.1
            });

            this.maxSuspensionTravel = options.maxSuspensionTravel;
            this.customSlidingRotationalSpeed = options.customSlidingRotationalSpeed;
            this.useCustomSlidingRotationalSpeed = options.useCustomSlidingRotationalSpeed;
            this.sliding = false;
            this.chassisConnectionPointLocal = options.chassisConnectionPointLocal.clone();
            this.chassisConnectionPointWorld = options.chassisConnectionPointWorld.clone();
            this.directionLocal = options.directionLocal.clone();
            this.directionWorld = options.directionWorld.clone();
            this.axleLocal = options.axleLocal.clone();
            this.axleWorld = options.axleWorld.clone();
            this.suspensionRestLength = options.suspensionRestLength;
            this.suspensionMaxLength = options.suspensionMaxLength;
            this.radius = options.radius;
            this.suspensionStiffness = options.suspensionStiffness;
            this.dampingCompression = options.dampingCompression;
            this.dampingRelaxation = options.dampingRelaxation;
            this.frictionSlip = options.frictionSlip;
            this.steering = 0;
            this.rotation = 0;
            this.deltaRotation = 0;
            this.rollInfluence = options.rollInfluence;
            this.maxSuspensionForce = options.maxSuspensionForce;
            this.engineForce = 0;
            this.brake = 0;
            this.isFrontWheel = options.isFrontWheel;
            this.clippedInvContactDotSuspension = 1;
            this.suspensionRelativeVelocity = 0;
            this.suspensionForce = 0;
            this.skidInfo = 0;
            this.suspensionLength = 0;
            this.sideImpulse = 0;
            this.forwardImpulse = 0;
            this.raycastResult = new RaycastResult();
            this.worldTransform = new Transform();
            this.isInContact = false;
        }

        updateWheel(chassis: Body)
        {
            var raycastResult = this.raycastResult;

            if (this.isInContact)
            {
                var project = raycastResult.hitNormalWorld.dot(raycastResult.directionWorld);
                raycastResult.hitPointWorld.subTo(chassis.position, relpos);
                chassis.getVelocityAtWorldPoint(relpos, chassis_velocity_at_contactPoint);
                var projVel = raycastResult.hitNormalWorld.dot(chassis_velocity_at_contactPoint);
                if (project >= -0.1)
                {
                    this.suspensionRelativeVelocity = 0.0;
                    this.clippedInvContactDotSuspension = 1.0 / 0.1;
                } else
                {
                    var inv = -1 / project;
                    this.suspensionRelativeVelocity = projVel * inv;
                    this.clippedInvContactDotSuspension = inv;
                }

            } else
            {
                // Not in contact : position wheel in a nice (rest length) position
                raycastResult.suspensionLength = this.suspensionRestLength;
                this.suspensionRelativeVelocity = 0.0;
                raycastResult.directionWorld.scaleNumberTo(-1, raycastResult.hitNormalWorld);
                this.clippedInvContactDotSuspension = 1.0;
            }
        }
    }

    var chassis_velocity_at_contactPoint = new Vector3();
    var relpos = new Vector3();
    var chassis_velocity_at_contactPoint = new Vector3();
}
