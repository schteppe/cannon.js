/**
 * Equation class
 * @uthor schteppe
 * @brief Something for the solver to chew on. Its mostly a holder of vectors
 * @todo try with the solver
 */
CANNON.Equation = function(bi,bj){

  // Jacobian
  this.G1 = new CANNON.Vec3();
  this.G2 = new CANNON.Vec3();
  this.G3 = new CANNON.Vec3();
  this.G4 = new CANNON.Vec3();

  // Inverse mass matrix
  this.iM1 = new CANNON.Vec3();
  this.iM2 = new CANNON.Vec3();
  this.iM3 = new CANNON.Vec3();
  this.iM4 = new CANNON.Vec3();

  // Constraint violation, g
  this.g1 = new CANNON.Vec3();
  this.g2 = new CANNON.Vec3();
  this.g3 = new CANNON.Vec3();
  this.g4 = new CANNON.Vec3();

  // Derivative of g, gdot
  this.W1 = new CANNON.Vec3();
  this.W2 = new CANNON.Vec3();
  this.W3 = new CANNON.Vec3();
  this.W4 = new CANNON.Vec3();
  
  // External force, f
  this.f1 = new CANNON.Vec3();
  this.f2 = new CANNON.Vec3();
  this.f3 = new CANNON.Vec3();
  this.f4 = new CANNON.Vec3();

  // Clamping for multipliers (see as max constraint force)
  this.lambdamax =  Infinity;
  this.lambdamin = -Infinity;

  // Bodies to apply the constraint forces on
  this.body_i = bi;
  this.body_j = bj;
};

CANNON.Equation.prototype.setDefaultMassProps = function(){
  var bi = this.body_i, bj = this.body_j;
  this.iM1.set(bi.invMass,
	       bi.invMass,
	       bi.invMass);
  this.body_i.invInertia.copy(this.iM2);
  this.iM3.set(bj.invMass,
	       bj.invMass,
	       bj.invMass);
  this.body_j.invInertia.copy(this.iM4);
};

CANNON.Equation.prototype.setDefaultForce = function(){
  var bi = this.body_i, bj = this.body_j;
  this.body_i.force.copy(this.f1);
  this.body_i.tau.copy(this.f2);
  this.body_j.force.copy(this.f3);
  this.body_j.tau.copy(this.f4);
};