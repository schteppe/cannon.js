/**
 * @class CANNON.Vec3Pool
 */
CANNON.Vec3Pool = function(){
    CANNON.ObjectPool.call(this);
    this.type = vec3;
};
CANNON.Vec3Pool.prototype = new CANNON.ObjectPool();

CANNON.Vec3Pool.prototype.constructObject = function(){
    return vec3.create();
};