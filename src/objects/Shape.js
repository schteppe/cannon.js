/**
 * @class CANNON.Shape
 * @author schteppe
 * @brief Base class for shapes
 * @todo Should have a mechanism for caching bounding sphere radius instead of calculating it each time
 */
CANNON.Shape = function(){

    /**
     * @property int type
     * @memberof CANNON.Shape
     * @brief The type of this shape. Must be set to an int > 0 by subclasses.
     * @see CANNON.Shape.types
     */
    this.type = 0;

    this.aabbmin = new CANNON.Vec3();
    this.aabbmax = new CANNON.Vec3();

    this.boundingSphereRadius = 0;
    this.boundingSphereRadiusNeedsUpdate = true;
};
CANNON.Shape.prototype.constructor = CANNON.Shape;

/**
 * @method computeBoundingSphereRadius
 * @memberof CANNON.Shape
 * @brief Computes the bounding sphere radius. The result is stored in the property .boundingSphereRadius
 * @return float
 */
CANNON.Shape.prototype.computeBoundingSphereRadius = function(){
    throw "computeBoundingSphereRadius() not implemented for shape type "+this.type;
};

/**
 * @method getBoundingSphereRadius
 * @memberof CANNON.Shape
 * @brief Returns the bounding sphere radius. The result is stored in the property .boundingSphereRadius
 * @return float
 */
CANNON.Shape.prototype.getBoundingSphereRadius = function(){
	if (this.boundingSphereRadiusNeedsUpdate) {
		this.computeBoundingSphereRadius();
	}
	return this.boundingSphereRadius;
};

/**
 * @method volume
 * @memberof CANNON.Shape
 * @brief Get the volume of this shape
 * @return float
 */
CANNON.Shape.prototype.volume = function(){
    throw "volume() not implemented for shape type "+this.type;
};

/**
 * @method calculateLocalInertia
 * @memberof CANNON.Shape
 * @brief Calculates the inertia in the local frame for this shape.
 * @return CANNON.Vec3
 * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
 */
CANNON.Shape.prototype.calculateLocalInertia = function(mass,target){
    throw "calculateLocalInertia() not implemented for shape type "+this.type;
};

/**
 * @method calculateTransformedInertia
 * @memberof CANNON.Shape
 * @brief Calculates inertia in a specified frame for this shape.
 * @return CANNON.Vec3
 */
var Shape_calculateTransformedInertia_localInertia = new CANNON.Vec3();
var Shape_calculateTransformedInertia_worldInertia = new CANNON.Vec3();
CANNON.Shape.prototype.calculateTransformedInertia = function(mass,quat,target){
    target = target || new CANNON.Vec3();

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
CANNON.Shape.calculateLocalAABB = function(){
    throw new Error(".calculateLocalAABB is not implemented for this Shape yet!");
};

/**
 * @property Object types
 * @memberof CANNON.Shape
 * @brief The available shape types.
 */
CANNON.Shape.types = {
    SPHERE:1,
    PLANE:2,
    BOX:4,
    COMPOUND:8,
    CONVEXPOLYHEDRON:16
};

