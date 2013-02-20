/*global CANNON:true */

/**
 * @class CANNON.Plane
 * @extends CANNON.Shape
 * @param CANNON.Vec3 normal
 * @brief A plane, facing in the Z direction.
 * @description A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a RigidBody and rotate that body. See the demos.
 * @author schteppe
 */
CANNON.Plane = function(){
    CANNON.Shape.call(this);
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

var tempNormal = new CANNON.Vec3(0,0,1);
CANNON.Plane.prototype.calculateWorldAABB = function(pos,quat,min,max){
    // The plane AABB is infinite, except if the normal is pointing along any axis
    quat.vmult(tempNormal,tempNormal);
    min.set(Infinity,Infinity,Infinity);
    var axes = ['x','y','z'];
    for(var i=0; i<axes.length; i++){
        var ax = axes[i];
        if(tempNormal[ax]==1)
            max[ax] = pos[ax];
        if(tempNormal[ax]==-1)
            min[ax] = pos[ax];
    }
};