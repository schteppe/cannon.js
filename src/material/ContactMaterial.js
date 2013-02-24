/**
 * @class CANNON.ContactMaterial
 * @brief Defines what happens when two materials meet.
 * @param CANNON.Material m1
 * @param CANNON.Material m2
 * @param float friction
 * @param float restitution
 * @todo Contact solving parameters here too?
 */
CANNON.ContactMaterial = function(m1, m2, friction, restitution){

    /// Contact material index in the world, -1 until added to the world
    this.id = -1;

    /// The two materials participating in the contact
    this.materials = [m1,m2];

    /// Kinetic friction
    this.friction = friction!==undefined ? Number(friction) : 0.3;

    /// Restitution
    this.restitution =      restitution !== undefined ?      Number(restitution) :      0.3;

    // Parameters to pass to the constraint when it is created
    this.contactEquationStiffness = 1e7;
    this.contactEquationRegularizationTime = 3;
    this.frictionEquationStiffness = 1e7;
    this.frictionEquationRegularizationTime = 3;
};

