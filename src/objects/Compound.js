/*global CANNON:true */

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
  for(var i = 0; i<this.childShapes.length; i++)
    r += this.childShapes[i].volume();
  return r;
};

CANNON.Compound.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();

  // Calculate the total volume, we will spread out this objects' mass on the sub shapes
  var V = this.volume();

  for(var i = 0; i<this.childShapes.length; i++){
    // Get child information
    var b = this.childShapes[i];
    var o = this.childOffsets[i];
    var q = this.childOrientations[i];
    var m = b.volume() / V * mass;

    // Get the child inertia, transformed relative to local frame
    var inertia = b.calculateTransformedInertia(m,q);

    // Add its inertia using the parallel axis theorem, i.e.
    // I += I_child;    
    // I += m_child * r^2

    target.vadd(inertia,target);
    var mr2 = new CANNON.Vec3(m*o.x*o.x,
			      m*o.y*o.y,
			      m*o.z*o.z);
    target.vadd(mr2,target);
  }
  return target;
};

CANNON.Compound.prototype.boundingSphereRadius = function(){
  var r = 0.0;
  for(var i = 0; i<this.childShapes.length; i++){
    var candidate = this.childOffsets[i].norm() + this.childShapes[i].boundingSphereRadius();
    if(r < candidate)
      r = candidate;
  }
  return r;
};

var aabbmaxTemp = new CANNON.Vec3();
var aabbminTemp = new CANNON.Vec3();
var childPosTemp = new CANNON.Vec3();
var childQuatTemp = new CANNON.Vec3();
CANNON.Compound.prototype.calculateWorldAABB = function(pos,quat,min,max){
    var minx,miny,minz,maxx,maxy,maxz;
    // Get each axis max
    for(var i=0; i<this.childShapes.length; i++){

	// Accumulate transformation to child
	pos.vadd(this.childOffsets[i],childPosTemp);
	quat.mult(this.childOrientations[i],childQuatTemp);

	// Get child AABB
	this.childShapes[i].calculateWorldAABB(childPosTemp,quat,aabbminTemp,aabbmaxTemp);

	if(aabbminTemp.x > minx || minx===undefined) minx = aabbminTemp.x;
	if(aabbminTemp.y > miny || miny===undefined) miny = aabbminTemp.y;
	if(aabbminTemp.z > minz || minz===undefined) minz = aabbminTemp.z;
	
	if(aabbmaxTemp.x > maxx || maxx===undefined) maxx = aabbmaxTemp.x;
	if(aabbmaxTemp.y > maxy || maxy===undefined) maxy = aabbmaxTemp.y;
	if(aabbmaxTemp.z > maxz || maxz===undefined) maxz = aabbmaxTemp.z;
    }

    min.set(minx,miny,minz);
    max.set(maxx,maxy,maxz);
};