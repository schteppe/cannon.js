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

    // World oriented normal
    this.worldNormal = vec3.create();
    this.worldNormalNeedsUpdate = true;
};
CANNON.Plane.prototype = new CANNON.Shape();
CANNON.Plane.prototype.constructor = CANNON.Plane;

CANNON.Plane.prototype.computeWorldNormal = function(q){
    var n = this.worldNormal;
    vec3.set(n,0,0,1);
    vec3.transformQuat(n,n,q);
    this.worldNormalNeedsUpdate = false;
};

CANNON.Plane.prototype.calculateLocalInertia = function(mass,target){
    target = target || vec3.create();
    return target;
};

CANNON.Plane.prototype.volume = function(){
    return Infinity; // The plane is infinite...
};

var tempNormal = vec3.create();
CANNON.Plane.prototype.calculateWorldAABB = function(pos,q,min,max){
    // The plane AABB is infinite, except if the normal is pointing along any axis
    vec3.set(tempNormal,0,0,1); // Default plane normal is z
    vec3.transformQuat( tempNormal, tempNormal, q );
    vec3.set(min,-Infinity,-Infinity,-Infinity);
    vec3.set(max,Infinity,Infinity,Infinity);

    if(tempNormal[0] === 1){ max[0] = pos[0]; }
    if(tempNormal[1] === 1){ max[1] = pos[1]; }
    if(tempNormal[2] === 1){ max[2] = pos[2]; }

    if(tempNormal[0] === -1){ min[0] = pos[0]; }
    if(tempNormal[1] === -1){ min[1] = pos[1]; }
    if(tempNormal[2] === -1){ min[2] = pos[2]; }

};
