module.exports = ContactMaterial;

/**
 * Defines what happens when two materials meet.
 * @class ContactMaterial
 * @constructor
 * @param {Material} m1
 * @param {Material} m2
 * @param {Number} friction
 * @param {Number} restitution
 * @todo Contact solving parameters here too?
 */
function ContactMaterial(m1, m2, friction, restitution){

    /**
     * Identifier of this material
     * @property {Number} id
     */
    this.id = ContactMaterial.idCounter++;

    /**
     * Participating materials
     * @property {Array} materials
     * @todo  Should be .materialA and .materialB instead
     */
    this.materials = [m1,m2];

    /**
     * Friction coefficient
     * @property {Number} friction
     */
    this.friction = friction!==undefined ? Number(friction) : 0.3;

    /**
     * Restitution coefficient
     * @property {Number} restitution
     */
    this.restitution =      restitution !== undefined ?      Number(restitution) :      0.3;

    /**
     * Stiffness of the produced contact equations
     * @property {Number} contactEquationStiffness
     */
    this.contactEquationStiffness = 1e7;

    /**
     * Relaxation time of the produced contact equations
     * @property {Number} contactEquationRelaxation
     */
    this.contactEquationRelaxation = 3;

    /**
     * Stiffness of the produced friction equations
     * @property {Number} frictionEquationStiffness
     */
    this.frictionEquationStiffness = 1e7;

    /**
     * Relaxation time of the produced friction equations
     * @property {Number} frictionEquationRelaxation
     */
    this.frictionEquationRelaxation = 3;
};

ContactMaterial.idCounter = 0;
