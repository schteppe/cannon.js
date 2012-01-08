/**
 * @class Shape
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Shape = function(){
  this.type = 0;
};

CANNON.Shape.prototype.constructor = CANNON.Shape;

CANNON.Shape.prototype.boundingSphereRadius = function(){
  throw "boundingSphereRadius not implemented for shape type "+this.type;
};

CANNON.Shape.prototype.calculateLocalInertia = function(mass,target){
  throw "calculateLocalInertia not implemented for shape type "+this.type;
};

CANNON.Shape.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4
};

