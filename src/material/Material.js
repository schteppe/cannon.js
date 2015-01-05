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

    /**
     * material id.
     * @property id
     */
    this.id = Material.idCounter++;

    /**
     * Friction for this material.
     * @property {number} friction
     */
    this.friction = -1;

    /**
     * Restitution for this material.
     * @property {number} restitution
     */
    this.restitution = -1;
}

Material.idCounter = 0;
