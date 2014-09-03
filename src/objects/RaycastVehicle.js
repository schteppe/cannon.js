var Body = require('./Body');
var Vec3 = require('../math/Vec3');
var RaycastResult = require('../collision/RaycastResult');
var Ray = require('../collision/Ray');

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
}

var tmpVec1 = new Vec3();
var tmpVec2 = new Vec3();
var tmpVec3 = new Vec3();
var tmpRay = new Ray();

/**
 * Add a wheel
 * @param {object} options
 * @param {object} [options.isFrontWheel]
 * @param {Vec3} [options.position] Position of the wheel, locally in the chassis body.
 * @param {Vec3} [options.direction] Slide direction of the wheel along the suspension.
 * @param {Vec3} [options.axis] Axis of rotation of the wheel, locally defined in the chassis.
 */
RaycastVehicle.prototype.addWheel = function(options){
    options = options || {};
    this.wheelForces.push(0);

    var zero = new Vec3();
    var position = typeof(options.position) !== 'undefined' ? options.position.clone() : new Vec3();
    this.wheelPositions.push(position);

    // Constrain wheel
    var axis = typeof(options.axis) !== 'undefined' ? options.axis.clone() : new Vec3(0, 1, 0);
    this.wheelAxes.push(axis);

    return this.wheelAxes.length - 1;
};

/**
 * Set the steering value of a wheel.
 * @param {number} value
 * @param {integer} wheelIndex
 * @todo check coordinateSystem
 */
RaycastVehicle.prototype.setSteeringValue = function(value, wheelIndex){
    // Set angle of the hinge axis
    var axis = this.wheelAxes[wheelIndex];

    var c = Math.cos(value),
        s = Math.sin(value),
        x = axis.x,
        y = axis.y;
    // this.constraints[wheelIndex].axisA.set(
    //     c*x -s*y,
    //     s*x +c*y,
    //     0
    // );
};

var torque = new Vec3();

/**
 * Set the wheel force to apply on one of the wheels each time step
 * @param  {number} value
 * @param  {integer} wheelIndex
 */
RaycastVehicle.prototype.setWheelForce = function(value, wheelIndex){
    this.wheelForces[wheelIndex] = value;
};

/**
 * Apply a torque on one of the wheels.
 * @param  {number} value
 * @param  {integer} wheelIndex
 */
RaycastVehicle.prototype.applyWheelForce = function(value, wheelIndex){
    var axis = this.wheelAxes[wheelIndex];
    var wheelBody = this.wheelBodies[wheelIndex];
    var bodyTorque = wheelBody.tau;

    axis.scale(value, torque);
    wheelBody.vectorToWorldFrame(torque, torque);
    bodyTorque.vadd(torque, bodyTorque);
};

/**
 * Add the vehicle including its constraints to the world.
 * @param {World} world
 */
RaycastVehicle.prototype.addToWorld = function(world){
    var constraints = this.constraints;
    world.add(this.chassisBody);
    world.addEventListener('preStep', this._update.bind(this));
    this.world = world;
};

RaycastVehicle.prototype._update = function(){
    var wheelForces = this.wheelForces;
    for (var i = 0; i < wheelForces.length; i++) {
        this.applyWheelForce(wheelForces[i], i);
    }
};

/**
 * Remove the vehicle including its constraints from the world.
 * @param {World} world
 */
RaycastVehicle.prototype.removeFromWorld = function(world){
    var constraints = this.constraints;
    world.remove(this.chassisBody);
    world.removeEventListener('preStep', this._update);
    this.world = null;
};

/**
 * Raycast from wheel position and down along the suspension vector. The distance to the ground is returned.
 * @param  {number} wheelIndex
 * @return {number}
 */
RaycastVehicle.prototype.castRay = function(wheelIndex){
    var wheel = this.wheelInfos[wheelIndex];

    // Set position locally to the chassis
    var worldPosition = tmpVec1;
    this.chassisBody.pointToWorldFrame(wheel, worldPosition);

    var from = tmpVec2;
    var to = tmpVec3;

    // Shoot ray
    worldPosition.copy(tmpRay.origin);
    wheel.directionLocal.cross(wheel.axleLocal, tmpRay.direction);

    var result = new RaycastResult();
    this.world.rayTest(from, to, result);

};

var worldAxis = new Vec3();

/**
 * Get current rotational velocity of a wheel
 * @method getWheelSpeed
 * @param {integer} wheelIndex
 */
RaycastVehicle.prototype.getWheelSpeed = function(wheelIndex){
    var axis = this.wheelAxes[wheelIndex];
    // TODO
    return 0;
};
