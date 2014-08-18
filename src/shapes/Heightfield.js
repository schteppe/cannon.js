var Shape = require('./Shape');
var ConvexPolyhedron = require('./ConvexPolyhedron');
var Vec3 = require('../math/Vec3');
var Utils = require('../utils/Utils');

module.exports = Heightfield;

/**
 * Heightfield shape class. Height data is given as an array. These data points are spread out evenly with a distance "elementSize".
 * @class Heightfield
 * @extends Shape
 * @constructor
 * @param {Array} data An array of Y values that will be used to construct the terrain.
 * @param {object} options
 * @param {Number} [options.minValue] Minimum value of the data points in the data array. Will be computed automatically if not given.
 * @param {Number} [options.maxValue] Maximum value.
 * @param {Number} [options.elementSize=0.1] World spacing between the data points in X direction.
 * @todo Should be possible to use along all axes, not just y
 *
 * @example
 *     // Generate some height data (y-values).
 *     var data = [];
 *     for(var i = 0; i < 1000; i++){
 *         var y = 0.5 * Math.cos(0.2 * i);
 *         data.push(y);
 *     }
 *
 *     // Create the heightfield shape
 *     var heightfieldShape = new Heightfield(data, {
 *         elementSize: 1 // Distance between the data points in X direction
 *     });
 *     var heightfieldBody = new Body();
 *     heightfieldBody.addShape(heightfieldShape);
 *     world.addBody(heightfieldBody);
 */
function Heightfield(data, options){
    options = Utils.defaults(options, {
        maxValue : null,
        minValue : null,
        elementSize : 1
    });

    if(options.minValue === null || options.maxValue === null){
        options.maxValue = data[0][0];
        options.minValue = data[0][0];
        for(var i=0; i !== data.length; i++){
            var v = data[i];
            if(v > options.maxValue){
                options.maxValue = v;
            }
            if(v < options.minValue){
                options.minValue = v;
            }
        }
    }

    /**
     * An array of numbers, or height values, that are spread out along the x axis.
     * @property {array} data
     */
    this.data = data;

    /**
     * Max value of the data
     * @property {number} maxValue
     */
    this.maxValue = options.maxValue;

    /**
     * Max value of the data
     * @property {number} minValue
     */
    this.minValue = options.minValue;

    /**
     * The width of each element
     * @property {number} elementSize
     */
    this.elementSize = options.elementSize;

    Shape.call(this, Shape.HEIGHTFIELD);
}
Heightfield.prototype = new Shape();

/**
 * Get max/min in a rectangle in the matrix data
 * @param  {integer} iMinX
 * @param  {integer} iMinY
 * @param  {integer} iMaxX
 * @param  {integer} iMaxY
 * @param  {array} [result] An array to store the results in.
 * @return {array} The result array, if it was passed in. Minimum will be at position 0 and max at 1.
 */
Heightfield.prototype.getRectMinMax = function (iMinX, iMinY, iMaxX, iMaxY, result) {
    result = result || [];

    // Get max and min of the data
    var data = this.data,
        max = data[iMinX][iMinY], // Set first value
        min = max;
    for(var i = iMinX; i < iMaxX; i++){
        for(var j = iMinY; j < iMaxY; j++){
            var height = data[i][j];
            if(height < min){
                min = height;
            }
            if(height > max){
                max = height;
            }
        }
    }

    result[0] = min;
    result[1] = max;
};

/**
 * Get a triangle in the terrain in the form of a triangular convex shape.
 * @param  {integer} i
 * @param  {integer} j
 * @param  {boolean} getUpperTriangle
 * @param  {ConvexPolyhedron} result
 */
Heightfield.prototype.getConvexTrianglePillar = function(i, j, getUpperTriangle, result, offsetResult){
    result = result || new ConvexPolyhedron();
    var data = this.data;

    if (getUpperTriangle) {
        data[i][j];
    } else {

    }
};

Heightfield.prototype.calculateLocalInertia = function(mass, target){
    target = target || new Vec3();
    target.set(0,0,0);
    return target;
};

Heightfield.prototype.volume = function(){
    return Number.MAX_VALUE; // The terrain is infinite
};

Heightfield.prototype.calculateWorldAABB = function(pos, quat, min, max){
    // TODO: do it properly
    min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
};

Heightfield.prototype.updateBoundingSphereRadius = function(){
    this.boundingSphereRadius = Number.MAX_VALUE;
};