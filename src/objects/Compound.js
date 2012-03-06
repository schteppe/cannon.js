/**
 * Compound shape
 * @author schteppe - https://github.com/schteppe
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
 * Add a subshape
 * @param Shape shape
 * @param Vec3 offset
 * @param Quaternion orientation
 */
CANNON.Compound.prototype.addChild = function(shape,offset,orientation){
  this.childShapes.push(shape);
  this.childOffsets.push(offset);
  this.childOrientations.push(orientation);
};

/**
 * Calculate the inertia in the local frame.
 * @todo Implement me! Loop over all sub bodies and add to inertia.
 * @return Vec3
 */
CANNON.Compound.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();
  
  for(var i = 0; i<this.childShapes.length; i++){
    var b = this.childShapes[i];
    var o = this.childOffsets[i];
    var q = this.childOrientations[i];
    // @todo 
    // 1. Get the child inertia
    // 2. Transform the inertia so it's relative to this local frame
    // 3. Add its inertia using the parallell axis theorem, i.e.
    //    I += I_child;
    //    I += m_child * r^2
    // Question: how do we know the weight of the individual shapes? Split according to volume perhaps?
  }

  throw "calculateLocalInertia not implemented for Compound shape!";

  return target;
};

CANNON.Compound.prototype.boundingSphereRadius = function(){
  var r = 0.0;
  for(var i = 0; i<this.childShapes.length; i++){
    var candidate = this.childOffsets[i] + cr;
    if(r < candidate)
      r = candidate;
  }
  return r;
};