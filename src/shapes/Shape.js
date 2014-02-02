module.exports = Shape;

var Shape = require('./Shape')
,   Vec3 = require('../math/Vec3')
,   Quaternion = require('../math/Quaternion')
,   Particle = require('../objects/Particle')
,   Material = require('../material/Material')

/**
 * Base class for shapes
 * @class Shape
 * @constructor
 * @author schteppe
 * @todo Should have a mechanism for caching bounding sphere radius instead of calculating it each time
 */
function Shape(){

    /**
     * The type of this shape. Must be set to an int > 0 by subclasses.
     * @property type
     * @type {Number}
     * @see Shape.types
     */
    this.type = 0;

    this.aabbmin = new Vec3();
    this.aabbmax = new Vec3();

    this.boundingSphereRadius = 0;
    this.boundingSphereRadiusNeedsUpdate = true;
};
Shape.prototype.constructor = Shape;

/**
 * Computes the bounding sphere radius. The result is stored in the property .boundingSphereRadius
 * @method computeBoundingSphereRadius
 * @return {Number}
 */
Shape.prototype.computeBoundingSphereRadius = function(){
    throw "computeBoundingSphereRadius() not implemented for shape type "+this.type;
};

/**
 * Returns the bounding sphere radius. The result is stored in the property .boundingSphereRadius
 * @method getBoundingSphereRadius
 * @return {Number}
 */
Shape.prototype.getBoundingSphereRadius = function(){
	if (this.boundingSphereRadiusNeedsUpdate) {
		this.computeBoundingSphereRadius();
	}
	return this.boundingSphereRadius;
};

/**
 * Get the volume of this shape
 * @method volume
 * @return {Number}
 */
Shape.prototype.volume = function(){
    throw "volume() not implemented for shape type "+this.type;
};

/**
 * Calculates the inertia in the local frame for this shape.
 * @method calculateLocalInertia
 * @return {Vec3}
 * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
 */
Shape.prototype.calculateLocalInertia = function(mass,target){
    throw "calculateLocalInertia() not implemented for shape type "+this.type;
};

/**
 * Calculates inertia in a specified frame for this shape.
 * @method calculateTransformedInertia
 * @return {Vec3}
 */
var Shape_calculateTransformedInertia_localInertia = new Vec3();
var Shape_calculateTransformedInertia_worldInertia = new Vec3();
Shape.prototype.calculateTransformedInertia = function(mass,quat,target){
    target = target || new Vec3();

    // Compute inertia in the world frame
    //quat.normalize();
    var localInertia = Shape_calculateTransformedInertia_localInertia;
    var worldInertia = Shape_calculateTransformedInertia_worldInertia;
    this.calculateLocalInertia(mass,localInertia);

    // @todo Is this rotation OK? Check!
    quat.vmult(localInertia,worldInertia);
    target.x = Math.abs(worldInertia.x);
    target.y = Math.abs(worldInertia.y);
    target.z = Math.abs(worldInertia.z);
    return target;
};

// Calculates the local aabb and sets the result to .aabbmax and .aabbmin
Shape.calculateLocalAABB = function(){
    throw new Error(".calculateLocalAABB is not implemented for this Shape yet!");
};

/**
 * The available shape types.
 * @static
 * @property types
 * @type {Object}
 */
Shape.types = {
    SPHERE:1,
    PLANE:2,
    BOX:4,
    COMPOUND:8,
    CONVEXPOLYHEDRON:16
};

