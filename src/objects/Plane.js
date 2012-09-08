/*global CANNON:true */

/**
 * @class CANNON.Plane
 * @extends CANNON.Shape
 * @param CANNON.Vec3 normal
 * @brief An infinite plane, facing in the direction of the given normal.
 * @author schteppe
 */
CANNON.Plane = function(normal){
    CANNON.Shape.call(this);
    normal.normalize();

    /**
     * @property CANNON.Vec3 normal
     * @memberof CANNON.Plane
     */
    this.normal = normal;
    this.type = CANNON.Shape.types.PLANE;
};
CANNON.Plane.prototype = new CANNON.Shape();
CANNON.Plane.prototype.constructor = CANNON.Plane;

CANNON.Plane.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();
  return target;
};

CANNON.Plane.prototype.volume = function(){
  return Infinity; // The plane is infinite...
};