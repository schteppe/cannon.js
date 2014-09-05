var Body = require('./Body');
var Vec3 = require('../math/Vec3');
var Quaternion = require('../math/Quaternion');
var RaycastResult = require('../collision/RaycastResult');
var Ray = require('../collision/Ray');
var WheelInfo = require('../objects/WheelInfo');

module.exports = RaycastVehicle;

/**
 * Vehicle helper class that casts rays from the wheel positions towards the ground and applies forces.
 * @param {object} [options.chassisBody]
 */
function RaycastVehicle(options){

    /**
     * @property coordinateSystem
     * @type {Vec3}
     */
    this.coordinateSystem = typeof(options.coordinateSystem)==='undefined' ? new Vec3(1, 2, 3) : options.coordinateSystem.clone();

    /**
     * @property {Body} chassisBody
     */
    this.chassisBody = options.chassisBody;

    this.wheelInfos = [];

    this.world = null;

    this.indexRightAxis = 1;
    this.indexForwardAxis = 0;
    this.indexUpAxis = 2;
}

var tmpVec1 = new Vec3();
var tmpVec2 = new Vec3();
var tmpVec3 = new Vec3();
var tmpVec4 = new Vec3();
var tmpVec5 = new Vec3();
var tmpVec6 = new Vec3();
var tmpRay = new Ray();

/**
 * Add a wheel
 * @param {object} options
 */
RaycastVehicle.prototype.addWheel = function(options){
    options = options || {};

    var info = new WheelInfo(options);
    var index = this.wheelInfos.length;
    this.wheelInfos.push(info);

    return index;
};

/**
 * Set the steering value of a wheel.
 * @param {number} value
 * @param {integer} wheelIndex
 * @todo check coordinateSystem
 */
RaycastVehicle.prototype.setSteeringValue = function(value, wheelIndex){
    // Set angle of the hinge axis
    var wheel = this.wheelInfos[wheelIndex];
    wheel.steering = value;
};

var torque = new Vec3();

/**
 * Set the wheel force to apply on one of the wheels each time step
 * @param  {number} value
 * @param  {integer} wheelIndex
 */
RaycastVehicle.prototype.applyEngineForce = function(value, wheelIndex){
    this.wheelInfos[wheelIndex].engineForce = value;
};

RaycastVehicle.setBrake = function(brake, wheelIndex){
    this.wheelInfos[wheelIndex].brake = brake;
};

/**
 * Add the vehicle including its constraints to the world.
 * @param {World} world
 */
RaycastVehicle.prototype.addToWorld = function(world){
    var constraints = this.constraints;
    world.add(this.chassisBody);
    var that = this;
    world.addEventListener('preStep', function(){
        that.updateVehicle(world.last_dt);
    });
    this.world = world;
};

RaycastVehicle.prototype.getVehicleAxisWorld = function(axisIndex, result){
    result.set(
        axisIndex === 0 ? 1 : 0,
        axisIndex === 1 ? 1 : 0,
        axisIndex === 2 ? 1 : 0
    );
    this.chassisBody.vectorToWorldFrame(result, result);
};

RaycastVehicle.prototype.updateVehicle = function(timeStep){
    var wheelInfos = this.wheelInfos;
    var numWheels = wheelInfos.length;
    var chassisBody = this.chassisBody;

    // for (var i = 0; i < wheelInfos.length; i++) {
    //     this.castRay(i);
    //     this.addSuspensionForces(i);
    //     this.addEngineForces(i);
    // }

    for (var i = 0; i < numWheels; i++) {
        this.updateWheelTransform(i, false);
    }

    this.currentVehicleSpeedKmHour = 3.6 * chassisBody.velocity.norm();

    var forwardWorld = new Vec3();
    this.getVehicleAxisWorld(this.indexForwardAxis, forwardWorld);

    if (forwardWorld.dot(chassisBody.velocity) < 0){
        this.currentVehicleSpeedKmHour *= -1;
    }

    // simulate suspension
    for (var i = 0; i < numWheels; i++) {
        this.castRay(wheelInfos[i]);
    }

    this.updateSuspension(timeStep);

    for (var i = 0; i < numWheels; i++) {
        //apply suspension force
        var wheel = wheelInfos[i];
        var suspensionForce = wheel.suspensionForce;
        if (suspensionForce > wheel.maxSuspensionForce) {
            suspensionForce = wheel.maxSuspensionForce;
        }
        var impulse = new Vec3();
        wheel.raycastResult.hitNormalWorld.scale(suspensionForce * timeStep, impulse);

        var relpos = new Vec3();
        wheel.raycastResult.hitPointWorld.vsub(chassisBody.position, relpos);
        chassisBody.applyImpulse(impulse, wheel.raycastResult.hitPointWorld/*relpos*/);
    }

    this.updateFriction(timeStep);

    for (i = 0; i < numWheels; i++) {
        var wheel = wheelInfos[i];
        var relpos = new Vec3();
        wheel.chassisConnectionPointWorld.vsub(chassisBody.position, relpos);
        var vel = new Vec3();
        chassisBody.getVelocityAtWorldPoint(relpos, vel);

        if (wheel.isInContact) {

            var fwd  = new Vec3();
            this.getVehicleAxisWorld(this.indexForwardAxis, fwd);

            var proj = fwd.dot(wheel.raycastResult.hitNormalWorld);
            var hitNormalWorldScaledWithProj = new Vec3();
            wheel.raycastResult.hitNormalWorld.scale(proj, hitNormalWorldScaledWithProj);

            fwd.vsub(hitNormalWorldScaledWithProj, fwd);

            var proj2 = fwd.dot(vel);

            wheel.deltaRotation = (proj2 * timeStep) / wheel.radius;
            wheel.rotation += wheel.deltaRotation;

        } else {
            wheel.rotation += wheel.deltaRotation;
        }
        wheel.deltaRotation *= 0.99; //damping of rotation when not in contact
    }
};

RaycastVehicle.prototype.updateSuspension = function(deltaTime) {
    var chassisBody = this.chassisBody;
    var chassisMass = chassisBody.mass;
    var wheelInfos = this.wheelInfos;
    var numWheels = wheelInfos.length;

    for (var w_it = 0; w_it < numWheels; w_it++){
        var wheel = wheelInfos[w_it];

        if (wheel.isInContact){
            var force;

            // Spring
            var susp_length = wheel.suspensionRestLength;
            var current_length = wheel.suspensionLength;

            var length_diff = (susp_length - current_length);

            force = wheel.suspensionStiffness * length_diff * wheel.clippedInvContactDotSuspension;

            // Damper
            var projected_rel_vel = wheel.suspensionRelativeVelocity;
            var susp_damping;
            if (projected_rel_vel < 0) {
                susp_damping = wheel.dampingCompression;
            } else {
                susp_damping = wheel.dampingRelaxation;
            }
            force -= susp_damping * projected_rel_vel;

            // RESULT
            wheel.suspensionForce = force * chassisMass;
            if (wheel.suspensionForce < 0) {
                wheel.suspensionForce = 0;
            }
        } else {
            wheel.suspensionForce = 0;
        }
    }
};

/**
 * Remove the vehicle including its constraints from the world.
 * @param {World} world
 */
RaycastVehicle.prototype.removeFromWorld = function(world){
    var constraints = this.constraints;
    world.remove(this.chassisBody);
    world.removeEventListener('preStep', this.updateVehicle);
    this.world = null;
};

var from = new Vec3();
var to = new Vec3();

/**
 * Raycast from wheel position and down along the suspension vector. The distance to the ground is returned.
 * @param  {number} wheelIndex
 * @return {number}
 */
/*RaycastVehicle.prototype.castRay = function(wheel){
    var chassisBody = this.chassisBody;

    // Set position locally to the chassis
    var worldPosition = tmpVec1;
    this.chassisBody.pointToWorldFrame(wheel.chassisConnectionPointLocal, from);

    // Get wheel bottom point
    wheel.directionLocal.scale(wheel.radius + wheel.suspensionMaxLength, to);
    wheel.chassisConnectionPointLocal.vadd(to, to);
    this.chassisBody.pointToWorldFrame(to, to);

    // Shoot ray
    var result = wheel.raycastResult;
    this.world.rayTest(from, to, result);

    wheel.isInContact = result.hasHit;
};
*/

RaycastVehicle.prototype.castRay = function(wheel) {
    this.updateWheelTransformWorld(wheel);
    var chassisBody = this.chassisBody;

    var depth = -1;

    var raylen = wheel.suspensionRestLength + wheel.radius;

    var rayvector = new Vec3();
    wheel.directionWorld.scale(raylen, rayvector);
    var source = wheel.chassisConnectionPointWorld;
    var target = new Vec3();
    source.vadd(rayvector, target);
    var raycastResult = wheel.raycastResult;

    var param = 0;

    raycastResult.reset();
    this.world.rayTest(source, target, raycastResult);
    var object = raycastResult.body;

    wheel.raycastResult.groundObject = 0;

    if (object) {
        depth = raycastResult.distance;
        wheel.raycastResult.hitNormalWorld  = raycastResult.hitNormalWorld;
        wheel.isInContact = true;

        var hitDistance = raycastResult.distance;
        wheel.suspensionLength = hitDistance - wheel.radius;

        // clamp on max suspension travel
        var minSuspensionLength = wheel.suspensionRestLength - wheel.maxSuspensionTravelCm * 0.01;
        var maxSuspensionLength = wheel.suspensionRestLength + wheel.maxSuspensionTravelCm * 0.01;
        if (wheel.suspensionLength < minSuspensionLength) {
            wheel.suspensionLength = minSuspensionLength;
        }
        if (wheel.suspensionLength > maxSuspensionLength) {
            wheel.suspensionLength = maxSuspensionLength;
        }

        var denominator = wheel.raycastResult.hitNormalWorld.dot(wheel.directionWorld);

        var chassis_velocity_at_contactPoint = new Vec3();
        chassisBody.getVelocityAtWorldPoint(wheel.raycastResult.hitPointWorld, chassis_velocity_at_contactPoint);

        var projVel = wheel.raycastResult.hitNormalWorld.dot( chassis_velocity_at_contactPoint );

        if (denominator >= -0.1) {
            wheel.suspensionRelativeVelocity = 0.0;
            wheel.clippedInvContactDotSuspension = 1.0 / 0.1;
        } else {
            var inv = -1 / denominator;
            wheel.suspensionRelativeVelocity = projVel * inv;
            wheel.clippedInvContactDotSuspension = inv;
        }

    } else {

        //put wheel info as in rest position
        wheel.suspensionLength = wheel.suspensionRestLength;
        wheel.suspensionRelativeVelocity = 0.0;
        wheel.directionWorld.scale(-1, wheel.raycastResult.hitNormalWorld);
        wheel.clippedInvContactDotSuspension = 1.0;
    }

    return depth;
};

RaycastVehicle.prototype.updateWheelTransformWorld = function(wheel){
    wheel.isInContact = false;
    var chassisBody = this.chassisBody;
    chassisBody.pointToWorldFrame(wheel.chassisConnectionPointLocal, wheel.chassisConnectionPointWorld);
    chassisBody.vectorToWorldFrame(wheel.directionLocal, wheel.directionWorld);
    chassisBody.vectorToWorldFrame(wheel.axleLocal, wheel.axleWorld);
};

RaycastVehicle.prototype.updateWheelTransform = function(wheelIndex){
    var up = tmpVec4;
    var right = tmpVec5;
    var fwd = tmpVec6;

    var wheel = this.wheelInfos[wheelIndex];
    this.updateWheelTransformWorld(wheel);

    wheel.directionLocal.scale(-1, up);
    wheel.axleLocal.copy(right);
    up.cross(right, fwd);
    fwd.normalize();

    // Rotate around steering over the wheelAxle
    var steering = wheel.steering;
    var steeringOrn = new Quaternion();
    steeringOrn.setFromAxisAngle(up, steering);

    var rotatingOrn = new Quaternion();
    rotatingOrn.setFromAxisAngle(right, wheel.rotation);

    // World rotation of the wheel
    var q = wheel.worldTransform.quaternion;
    this.chassisBody.quaternion.mult(steeringOrn, q);
    q.mult(rotatingOrn, q);

    // world position of the wheel
    var p = wheel.worldTransform.position;
    wheel.directionWorld.copy(p);
    p.scale(wheel.suspensionLength, p);
    p.vadd(wheel.chassisConnectionPointWorld, p);
};

var directions = [
    new Vec3(1, 0, 0),
    new Vec3(0, 1, 0),
    new Vec3(0, 0, 1)
];


RaycastVehicle.prototype.getWheelTransformWorld = function(wheelIndex) {
    return this.wheelInfos[wheelIndex].worldTransform;
};


var sideFrictionStiffness2 = 1;
RaycastVehicle.prototype.updateFriction = function(timeStep) {

    //calculate the impulse, so that the wheels don't move sidewards
    var wheelInfos = this.wheelInfos;
    var numWheels = wheelInfos.length;
    var chassisBody = this.chassisBody;
    var forwardWS = [];
    var axle = [];
    var forwardImpulse = [];
    var sideImpulse = [];

    var numWheelsOnGround = 0;

    for (var i = 0; i < numWheels; i++) {
        var wheel = wheelInfos[i];

        var groundObject = wheel.raycastResult.body;
        if (groundObject){
            numWheelsOnGround++;
        }

        sideImpulse[i] = 0;
        forwardImpulse[i] = 0;
        forwardWS[i] = new Vec3();
        axle[i] = new Vec3();
    }

    for (var i = 0; i < numWheels; i++){
        var wheel = wheelInfos[i];

        var groundObject = wheel.raycastResult.body;

        if (groundObject) {
            var axlei = axle[i];
            var wheelTrans = this.getWheelTransformWorld(i);

            // Get world axle
            wheelTrans.vectorToWorldFrame(directions[this.indexRightAxis], axlei);

            var surfNormalWS = wheel.raycastResult.hitNormalWorld;
            var surfNormalWS_scaled_proj = new Vec3();
            var proj = axlei.dot(surfNormalWS);
            surfNormalWS.scale(proj, surfNormalWS_scaled_proj);
            axlei.vsub(surfNormalWS_scaled_proj, axlei);
            axlei.normalize();

            surfNormalWS.cross(axlei, forwardWS[i]);
            forwardWS[i].normalize();

            sideImpulse[i] = resolveSingleBilateral(
                chassisBody,
                wheel.raycastResult.hitPointWorld,
                groundObject,
                wheel.raycastResult.hitPointWorld,
                axlei
            );

            sideImpulse[i] *= sideFrictionStiffness2;
        }
    }

    var sideFactor = 1;
    var fwdFactor = 0.5;

    var sliding = false;
    for (var i = 0; i < numWheels; i++) {
        var wheel = wheelInfos[i];
        var groundObject = wheel.raycastResult.body;

        var rollingFriction = 0;

        if (groundObject) {
            if (wheel.engineForce !== 0) {
                rollingFriction = wheel.engineForce * timeStep;
            } else {
                var defaultRollingFrictionImpulse = 0;
                var maxImpulse = wheel.brake ? wheel.brake : defaultRollingFrictionImpulse;

                // TODO:
                // btWheelContactPoint contactPt(chassisBody,groundObject,wheelInfraycastInfo.hitPointWorld,forwardWS[wheel],maxImpulse);
                // rollingFriction = calcRollingFriction(contactPt);
                rollingFriction = calcRollingFriction(chassisBody, groundObject, wheel.raycastResult.hitPointWorld, forwardWS[i], maxImpulse);
                // rollingFriction = 0;
            }
        }

        //switch between active rolling (throttle), braking and non-active rolling friction (nthrottle/break)

        forwardImpulse[i] = 0;
        wheel.skidInfo = 1;

        if (groundObject) {
            wheel.skidInfo = 1;

            var maximp = wheel.suspensionForce * timeStep * wheel.frictionSlip;
            var maximpSide = maximp;

            var maximpSquared = maximp * maximpSide;

            forwardImpulse[i] = rollingFriction;//wheelInfo.engineForce* timeStep;

            var x = forwardImpulse[i] * fwdFactor;
            var y = sideImpulse[i] * sideFactor;

            var impulseSquared = x*x + y*y;

            if (impulseSquared > maximpSquared) {
                sliding = true;

                var factor = maximp / Math.sqrt(impulseSquared);

                wheel.skidInfo *= factor;
            }
        }
    }

    if (sliding) {
        for (var i = 0; i < numWheels; i++) {
            var wheel = wheelInfos[i];
            if (sideImpulse[i] !== 0) {
                if (wheel.skidInfo < 1){
                    forwardImpulse[i] *= wheel.skidInfo;
                    sideImpulse[i] *= wheel.skidInfo;
                }
            }
        }
    }

    // apply the impulses
    for (var i = 0; i < numWheels; i++) {
        var wheel = wheelInfos[i];

        var rel_pos = new Vec3();
        //wheel.raycastResult.hitPointWorld.vsub(chassisBody.position, rel_pos);
        // cannons applyimpulse is using world coord for the position
        wheel.raycastResult.hitPointWorld.copy(rel_pos);

        if (forwardImpulse[i] !== 0) {
            var impulse = new Vec3();
            forwardWS[i].scale(forwardImpulse[i], impulse);
            chassisBody.applyImpulse(impulse, rel_pos);
        }

        if (sideImpulse[i] !== 0){
            var groundObject = wheel.raycastResult.body;

            var rel_pos2 = new Vec3();
            //wheel.raycastResult.hitPointWorld.vsub(groundObject.position, rel_pos2);
            wheel.raycastResult.hitPointWorld.copy(rel_pos2);
            var sideImp = new Vec3();
            axle[i].scale(sideImpulse[i], sideImp);

// #if defined ROLLING_INFLUENCE_FIX // fix. It only worked if car's up was along Y - VT.
//                    btVector3 vChassisWorldUp = getRigidBody().getCenterOfMassTransform(etBasis().getColumn(indexUpAxis);
//                    rel_pos -= vChassisWorldUp * (vChassisWorldUp.dot(rel_pos) * (1.wheelInfo.rollInfluence));
// #else
            rel_pos[this.indexUpAxis] *= wheel.rollInfluence;
//#endif
            chassisBody.applyImpulse(sideImp, rel_pos);

            //apply friction impulse on the ground
            sideImp.scale(-1, sideImp);
            groundObject.applyImpulse(sideImp, rel_pos2);
        }
    }
};

function calcRollingFriction(body0, body1, frictionPosWorld, frictionDirectionWorld, maxImpulse) {
    var j1 = 0;
    var contactPosWorld = frictionPosWorld;

    var rel_pos1 = new Vec3();
    contactPosWorld.vsub(body0.position, rel_pos1);
    var rel_pos2 = new Vec3();
    contactPosWorld.vsub(body1.position, rel_pos2);

    var maxImpulse  = maxImpulse;

    var vel1 = new Vec3();
    body0.getVelocityAtWorldPoint(rel_pos1, vel1);
    var vel2 = new Vec3();
    body1.getVelocityAtWorldPoint(rel_pos2, vel2);
    var vel = new Vec3();
    vel1.vsub(vel2, vel);

    var vrel = frictionDirectionWorld.dot(vel);

    var denom0 = computeImpulseDenominator(body0, frictionPosWorld, frictionDirectionWorld);
    var denom1 = computeImpulseDenominator(body1, frictionPosWorld, frictionDirectionWorld);
    var relaxation = 1;
    var jacDiagABInv = relaxation / (denom0 + denom1);

    // calculate j that moves us to zero relative velocity
    j1 = -vrel * jacDiagABInv;

    if (maxImpulse < j1) {
        j1 = maxImpulse;
    }
    if (j1 < -maxImpulse) {
        j1 = -maxImpulse;
    }

    return j1;
}

function computeImpulseDenominator(body, pos, normal) {
    var r0 = new Vec3();
    var c0 = new Vec3();
    var vec = new Vec3();
    var m = new Vec3();
    pos.vsub(body.position, r0);
    r0.cross(normal, c0);
    body.invInertiaWorld.vmult(c0, m);
    m.cross(r0, vec);
    return body.invMass + normal.dot(vec);
}

//bilateral constraint between two dynamic objects
function resolveSingleBilateral(body1, pos1, body2, pos2, normal, impulse){
    var normalLenSqr = normal.norm2();
    if (normalLenSqr > 1.1){
        return 0; // no impulse
    }
    // var rel_pos1 = new Vec3();
    // var rel_pos2 = new Vec3();
    // pos1.vsub(body1.position, rel_pos1);
    // pos2.vsub(body2.position, rel_pos2);

    var vel1 = new Vec3();
    var vel2 = new Vec3();
    body1.getVelocityAtWorldPoint(pos1, vel1);
    body2.getVelocityAtWorldPoint(pos2, vel2);

    var vel = new Vec3();
    vel1.vsub(vel2, vel);

    var rel_vel = normal.dot(vel);

    var contactDamping = 0.2;
    var massTerm = 1 / (body1.invMass + body2.invMass);
    var impulse = - contactDamping * rel_vel * massTerm;

    return impulse;
}