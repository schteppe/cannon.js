module.exports = Vec3Pool;

var Vec3 = require('../math/Vec3')
,   ObjectPool = require('./Pool')

/**
 * @class Vec3Pool
 * @constructor
 * @extends {ObjectPool}
 */
function Vec3Pool(){
    ObjectPool.call(this);
    this.type = Vec3;
};
Vec3Pool.prototype = new ObjectPool();

/**
 * Construct a vector
 * @method constructObject
 * @return {Vec3}
 */
Vec3Pool.prototype.constructObject = function(){
    return new Vec3();
};
