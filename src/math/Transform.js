var Vec3 = require('./Vec3');
var Quaternion = require('./Quaternion');

module.exports = Transform;

function Transform() {
	this.position = new Vec3();
	this.quaternion = new Quaternion();
}

var tmpQuat = new Quaternion();
Transform.pointToLocalFrame = function(position, quaternion, worldPoint, result){
    var result = result || new Vec3();
    worldPoint.vsub(position, result);
    quaternion.conjugate(tmpQuat);
    tmpQuat.vmult(result, result);
    return result;
};

Transform.pointToWorldFrame = function(position, quaternion, localPoint, result){
    var result = result || new Vec3();
    quaternion.vmult(localPoint, result);
    result.vadd(position, result);
    return result;
};