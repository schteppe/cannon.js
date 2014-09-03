var Vec3 = require('../math/Vec3');

module.exports = RaycastResult;

function RaycastResult(){
	this.rayFromWorld = new Vec3();
	this.rayToWorld = new Vec3();
	this.hitNormalWorld = new Vec3();
	this.hitPointWorld = new Vec3();
}