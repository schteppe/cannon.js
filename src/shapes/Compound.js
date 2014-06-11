module.exports = Compound;

var Shape = require('./Shape')
,   Vec3 = require('../math/Vec3')
,   Box = require('../shapes/Box')
,   Mat3 = require('../math/Mat3')
,   Quaternion = require('../math/Quaternion')

/**
 * A shape made of several other shapes.
 * @class Compound
 * @extends {Shape}
 * @author schteppe
 */
function Compound(){
    Shape.call(this);
    this.type = Shape.types.COMPOUND;

    /**
     * @property {Array} childShapes
     */
    this.childShapes = [];

    /**
     * @property {Array} childOffsets
     */
    this.childOffsets = [];

    /**
     * @property {Array} childOrientations
     */
    this.childOrientations = [];
};
Compound.prototype = new Shape();
Compound.prototype.constructor = Compound;

/**
 * Add a child shape.
 * @method addChild
 * @param {Shape} shape
 * @param {Vec3} offset
 * @param {Quaternion} orientation
 */
Compound.prototype.addChild = function(shape,offset,orientation){
    offset = offset || new Vec3();
    orientation = orientation || new Quaternion();
    this.childShapes.push(shape);
    this.childOffsets.push(offset);
    this.childOrientations.push(orientation);
    this.updateBoundingSphereRadius();
};

Compound.prototype.clearAllChildren = function(){
    this.childOffsets = [];
    this.childOrientations = [];
    this.childShapes = [];
};

Compound.prototype.volume = function(){
    var r = 0.0;
    var Nchildren = this.childShapes.length;
    for(var i=0; i!==Nchildren; i++){
        r += this.childShapes[i].volume();
    }
    return r;
};

/*
var Compound_calculateLocalInertia_mr2 = new Vec3();
var Compound_calculateLocalInertia_childInertia = new Vec3();
var cli_m1 = new Mat3(),
    cli_m2 = new Mat3(),
    cli_m3 = new Mat3();
*/
var cli_min = new Vec3(),
    cli_max = new Vec3(),
    cli_pos = new Vec3(),
    cli_quat = new Quaternion();
Compound.prototype.calculateLocalInertia = function(mass,target){
    target = target || new Vec3();

    var min = cli_min,
        max = cli_max,
        pos = cli_pos,
        quat =cli_quat;

    this.calculateWorldAABB(pos,quat,min,max);
    Box.calculateInertia(new Vec3((max.x-min.x)/2,(max.y-min.y)/2,(max.z-min.z)/2),mass,target);

    /*
    // Calculate the total volume, we will spread out this objects' mass on the sub shapes
    var m1 = cli_m1,
        m2 = cli_m2,
        m3 = cli_m3;
    var V = this.volume();
    var childInertia = Compound_calculateLocalInertia_childInertia;
    for(var i=0, Nchildren=this.childShapes.length; i!==Nchildren; i++){
        // Get child information
        var b = this.childShapes[i];
        var o = this.childOffsets[i];
        var q = this.childOrientations[i];
        var m = b.volume() / V * mass;

        // Get the child inertia, transformed relative to local frame
        b.calculateLocalInertia(m,childInertia);

        // Transform it to the local compound frame
        m1.setRotationFromQuaternion(q);
        m1.transpose(m2);
        m1.scale(childInertia,m1);
        m1.mmult(m2,m3);
        m3.getTrace(childInertia);

        // Add its inertia using the parallel axis theorem, i.e.
        // I = Icm + m * r^2

        target.vadd(childInertia,target);
        var mr2 = Compound_calculateLocalInertia_mr2;
        mr2.set(m*o.x*o.x,
                m*o.y*o.y,
                m*o.z*o.z);
        target.vadd(mr2,target);
    }
    */

    return target;
};

Compound.prototype.updateBoundingSphereRadius = function(){
    var r = 0.0;
    for(var i = 0; i<this.childShapes.length; i++){
        var si = this.childShapes[i];
        si.updateBoundingSphereRadius();

        var candidate = this.childOffsets[i].norm() + si.boundingSphereRadius;
        if(r < candidate){
            r = candidate;
        }
    }
    this.boundingSphereRadius = r;
};

var aabbmaxTemp = new Vec3();
var aabbminTemp = new Vec3();
var childPosTemp = new Vec3();
var childQuatTemp = new Quaternion();
Compound.prototype.calculateWorldAABB = function(pos,quat,min,max){
    var N=this.childShapes.length;

    // If the compound doesn't have any child
    if(N === 0)
        return;

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
