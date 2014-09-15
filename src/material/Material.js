module.exports = Material;

/**
 * Defines a physics material.
 * @class Material
 * @constructor
 * @param {String} name
 * @author schteppe
 */
function Material(name){
    /**
     * @property name
     * @type {String}
     */
    this.name = name;
    this.id = Material.idCounter++;
}

Material.idCounter = 0;
