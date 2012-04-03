/**
 * @class Shape
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Shape = function(){

  /**
   * The type of this shape. Must be set to an int > 0 by subclasses.
   * @see Cannon.Shape.types
   */
  this.type = 0;
};

CANNON.Shape.prototype.constructor = CANNON.Shape;

/**
 * Get the bounding sphere radius from this shape
 * @return float
 */
CANNON.Shape.prototype.boundingSphereRadius = function(){
  throw "boundingSphereRadius() not implemented for shape type "+this.type;
};

/**
 * Get the volume of this shape
 * @return float
 */
CANNON.Shape.prototype.volume = function(){
  throw "volume() not implemented for shape type "+this.type;
};

/**
 * Calculates the inertia in the local frame for this shape.
 * @return Vec3
 * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
 */
CANNON.Shape.prototype.calculateLocalInertia = function(mass,target){
  throw "calculateLocalInertia() not implemented for shape type "+this.type;
};

/**
 * Calculates inertia in a specified frame for this shape.
 * @return Vec3
 */
CANNON.Shape.prototype.calculateTransformedInertia = function(mass,quat,target){
  if(target==undefined)
    target = new CANNON.Vec3();

  // Compute inertia in the world frame
  quat.normalize();
  var localInertia = this.calculateLocalInertia(mass);

  // @todo Is this rotation OK? Check!
  var worldInertia = quat.vmult(localInertia);
  target.x = Math.abs(worldInertia.x);
  target.y = Math.abs(worldInertia.y);
  target.z = Math.abs(worldInertia.z);
  return target;
  //throw "calculateInertia() not implemented for shape type "+this.type;
};

/**
 * The available shape types.
 */
CANNON.Shape.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4,
  COMPOUND:8
};

