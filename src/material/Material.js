/**
 * Defines a physics material.
 * @class Material
 * @constructor
 * @param {String} name
 * @author schteppe
 */
CANNON.Material = function(name){
    /**
     * @property name
     * @type {String}
     */
    this.name = name;
    this.id = -1;
};

