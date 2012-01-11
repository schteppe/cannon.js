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
  throw "boundingSphereRadius not implemented for shape type "+this.type;
};

/**
 * Calculates the inertia in the local frame for this shape.
 * @return Vec3
 * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
 */
CANNON.Shape.prototype.calculateLocalInertia = function(mass,target){
  throw "calculateLocalInertia not implemented for shape type "+this.type;
};

CANNON.Shape.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4
};

