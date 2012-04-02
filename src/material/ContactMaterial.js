/**
 * Defines what happens when two materials meet.
 * @class ContactMaterial
 * @param Material m1
 * @param Material m2
 * @param float friction
 * @param float restitution
 * @todo Contact solving parameters here too?
 */
CANNON.ContactMaterial = function(m1, m2, friction, restitution){

  /// Contact material index in the world, -1 until added to the world
  this._id = -1;

  /// The two materials participating in the contact
  this.materials = [m1,m2];

  /// Static friction
  this.static_friction =  static_friction!=undefined ?  Number(static_friction) :  0.3;

  /// Kinetic friction
  this.kinetic_friction = kinetic_friction!=undefined ? Number(kinetic_friction) : 0.3;

  /// Restitution
  this.restitution =      restitution!=undefined ?      Number(restitution) :      0.3;
  
};

