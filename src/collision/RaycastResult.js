var Vec3 = require('../math/Vec3');

module.exports = RaycastResult;

function RaycastResult(){
	this.rayFromWorld = new Vec3();
	this.rayToWorld = new Vec3();
	this.hitNormalWorld = new Vec3();
	this.hitPointWorld = new Vec3();
	this.hasHit = false;
	this.shape = null;
	this.body = null;
	this.distance = -1;
}

RaycastResult.prototype.reset = function () {
	this.rayFromWorld.setZero();
	this.rayToWorld.setZero();
	this.hitNormalWorld.setZero();
	this.hitPointWorld.setZero();
	this.hasHit = false;
	this.shape = null;
	this.body = null;
	this.distance = -1;
};

RaycastResult.prototype.set = function(
	rayFromWorld,
	rayToWorld,
	hitNormalWorld,
	hitPointWorld,
	shape,
	body,
	distance
){
	this.rayFromWorld.copy(rayFromWorld);
	this.rayToWorld.copy(rayToWorld);
	this.hitNormalWorld.copy(hitNormalWorld);
	this.hitPointWorld.copy(hitPointWorld);
	this.shape = shape;
	this.body = body;
	this.distance = distance;
};