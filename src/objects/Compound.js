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
    offset = offset || vec3.create();
    orientation = orientation || quat.create();
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

var Compound_calculateLocalInertia_mr2 = vec3.create();
var Compound_calculateLocalInertia_childInertia = vec3.create();
CANNON.Compound.prototype.calculateLocalInertia = function(mass,target){
    target = target || vec3.create();

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

        vec3.add(target,target,childInertia);
        var mr2 = Compound_calculateLocalInertia_mr2;
        vec3.set(mr2,   m*o.x*o.x,
                        m*o.y*o.y,
                        m*o.z*o.z);
        vec3.add(target,target,mr2);
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
        var candidate = vec3.length(this.childOffsets[i]) + si.boundingSphereRadius;
        if(r < candidate){
            r = candidate;
        }
    }
    this.boundingSphereRadius = r;
    this.boundingSphereRadiusNeedsUpdate = false;
};

var aabbmaxTemp = vec3.create();
var aabbminTemp = vec3.create();
var childPosTemp = vec3.create();
var childQuatTemp = new CANNON.Quaternion();
CANNON.Compound.prototype.calculateWorldAABB = function(pos,q,min,max){
    var N=this.childShapes.length;
    vec3.set(min,Infinity,Infinity,Infinity);
    vec3.set(max,-Infinity,-Infinity,-Infinity);

    // Get each axis max
    for(var i=0; i!==N; i++){

        // Accumulate transformation to child
        vec3.copy(childPosTemp, this.childOffsets[i]);

        vec3.transformQuaternion(childPosTemp, childPosTemp, q); //q.vmult(childPosTemp,childPosTemp);
        vec3.add(childPosTemp, childPosTemp, pos);//pos.vadd(childPosTemp,childPosTemp);

        vec3.transformQuaternion(childQuatTemp, this.childOrientations[i], q); //q.mult(this.childOrientations[i],childQuatTemp);

        // Get child AABB
        this.childShapes[i].calculateWorldAABB(childPosTemp,
                                               childQuatTemp,//this.childOrientations[i],
                                               aabbminTemp,
                                               aabbmaxTemp);

        if(aabbminTemp[0] < min[0]){ min[0] = aabbminTemp[0]; }
        if(aabbminTemp[1] < min[1]){ min[1] = aabbminTemp[1]; }
        if(aabbminTemp[2] < min[2]){ min[2] = aabbminTemp[2]; }

        if(aabbmaxTemp[0] > max[0]){ max[0] = aabbmaxTemp[0]; }
        if(aabbmaxTemp[1] > max[1]){ max[1] = aabbmaxTemp[1]; }
        if(aabbmaxTemp[2] > max[2]){ max[2] = aabbmaxTemp[2]; }
    }
};