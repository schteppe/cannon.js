/**
 * @class CANNON.Compound
 * @extends CANNON.Shape
 * @brief A shape made of several other shapes.
 * @author schteppe
 */
CANNON.Compound = function(){
    CANNON.Shape.call(this);
    this.type = CANNON.Shape.types.COMPOUND;
    this.childShapes = [];
    this.childOffsets = [];
    this.childOrientations = [];
};
CANNON.Compound.prototype = new CANNON.Shape();
CANNON.Compound.prototype.constructor = CANNON.Compound;

/**
 * @method addChild
 * @memberof CANNON.Compound
 * @brief Add a child shape.
 * @param CANNON.Shape shape
 * @param CANNON.Vec3 offset
 * @param CANNON.Quaternion orientation
 */
CANNON.Compound.prototype.addChild = function(shape,offset,orientation){
    offset = offset || new CANNON.Vec3();
    orientation = orientation || new CANNON.Quaternion();
    this.childShapes.push(shape);
    this.childOffsets.push(offset);
    this.childOrientations.push(orientation);
};

CANNON.Compound.prototype.volume = function(){
    var r = 0.0;
    var Nchildren = this.childShapes.length;
    for(var i=0; i!==Nchildren; i++){
        r += this.childShapes[i].volume();
    }
    return r;
};

var Compound_calculateLocalInertia_mr2 = new CANNON.Vec3();
var Compound_calculateLocalInertia_childInertia = new CANNON.Vec3();
CANNON.Compound.prototype.calculateLocalInertia = function(mass,target){
    target = target || new CANNON.Vec3();

    // Calculate the total volume, we will spread out this objects' mass on the sub shapes
    var V = this.volume();
    var childInertia = Compound_calculateLocalInertia_childInertia;
    for(var i=0, Nchildren=this.childShapes.length; i!==Nchildren; i++){
        // Get child information
        var b = this.childShapes[i];
        var o = this.childOffsets[i];
        var q = this.childOrientations[i];
        var m = b.volume() / V * mass;

        // Get the child inertia, transformed relative to local frame
        //var inertia = b.calculateTransformedInertia(m,q);
        b.calculateLocalInertia(m,childInertia); // Todo transform!
        //console.log(childInertia,m,b.volume(),V);

        // Add its inertia using the parallel axis theorem, i.e.
        // I += I_child;    
        // I += m_child * r^2

        target.vadd(childInertia,target);
        var mr2 = Compound_calculateLocalInertia_mr2;
        mr2.set(m*o.x*o.x,
                m*o.y*o.y,
                m*o.z*o.z);
        target.vadd(mr2,target);
    }

    return target;
};

CANNON.Compound.prototype.computeBoundingSphereRadius = function(){
    var r = 0.0;
    for(var i = 0; i<this.childShapes.length; i++){
        var si = this.childShapes[i];
        if(si.boundingSphereRadiusNeedsUpdate){
            si.computeBoundingSphereRadius();
        }
        var candidate = this.childOffsets[i].norm() + si.boundingSphereRadius;
        if(r < candidate){
            r = candidate;
        }
    }
    this.boundingSphereRadius = r;
    this.boundingSphereRadiusNeedsUpdate = false;
};

var aabbmaxTemp = new CANNON.Vec3();
var aabbminTemp = new CANNON.Vec3();
var childPosTemp = new CANNON.Vec3();
var childQuatTemp = new CANNON.Quaternion();
CANNON.Compound.prototype.calculateWorldAABB = function(pos,quat,min,max){
    var N=this.childShapes.length;
    min.set(Infinity,Infinity,Infinity);
    max.set(-Infinity,-Infinity,-Infinity);
    // Get each axis max
    for(var i=0; i!==N; i++){

        // Accumulate transformation to child
        this.childOffsets[i].copy(childPosTemp);
        quat.vmult(childPosTemp,childPosTemp);
        pos.vadd(childPosTemp,childPosTemp);

        quat.mult(this.childOrientations[i],childQuatTemp);

        // Get child AABB
        this.childShapes[i].calculateWorldAABB(childPosTemp,
                                               childQuatTemp,//this.childOrientations[i],
                                               aabbminTemp,
                                               aabbmaxTemp);

        if(aabbminTemp.x < min.x){
            min.x = aabbminTemp.x;
        }
        if(aabbminTemp.y < min.y){
            min.y = aabbminTemp.y;
        }
        if(aabbminTemp.z < min.z){
            min.z = aabbminTemp.z;
        }

        if(aabbmaxTemp.x > max.x){
            max.x = aabbmaxTemp.x;
        }
        if(aabbmaxTemp.y > max.y){
            max.y = aabbmaxTemp.y;
        }
        if(aabbmaxTemp.z > max.z){
            max.z = aabbmaxTemp.z;
        }
    }
};