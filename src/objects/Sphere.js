/*global CANNON:true */

/**
 * @brief Spherical rigid body
 * @class CANNON.Sphere
 * @extends CANNON.Shape
 * @param float radius
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Sphere = function(radius){
    CANNON.Shape.call(this);

    /**
     * @property float radius
     * @memberof CANNON.Sphere
     */
    this.radius = radius!=undefined ? Number(radius) : 1.0;
    this.type = CANNON.Shape.types.SPHERE;
};
CANNON.Sphere.prototype = new CANNON.Shape();
CANNON.Sphere.prototype.constructor = CANNON.Sphere;

CANNON.Sphere.prototype.calculateLocalInertia = function(mass,target){
    target = target || new CANNON.Vec3();
    var I = 2.0*mass*this.radius*this.radius/5.0;
    target.x = I;
    target.y = I;
    target.z = I;
    return target;
};

CANNON.Sphere.prototype.volume = function(){
    return 4.0 * Math.PI * this.radius / 3.0;
};

CANNON.Sphere.prototype.boundingSphereRadius = function(){
    return this.radius;
};

CANNON.Sphere.prototype.calculateWorldAABB = function(pos,quat,min,max){
    var r = this.radius;
    var axes = ['x','y','z'];
    for(var i=0; i<axes.length; i++){
        var ax = axes[i];
        min[ax] = pos[ax] - r;
        max[ax] = pos[ax] + r;
    }
};