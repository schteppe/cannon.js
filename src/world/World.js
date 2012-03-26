/**
 * The physics world
 * @class World
 */
CANNON.World = function(){

  /// @deprecated The application GUI should take care of pausing
  this.paused = false;

  /// The wall-clock time since simulation start
  this.time = 0.0;

  /// Number of timesteps taken since start
  this.stepnumber = 0;

  /// Spring constant
  this.spook_k = 3000.0;

  /// Stabilization parameter (number of timesteps until stabilization)
  this.spook_d = 3.0;

  /// Default and last timestep sizes
  this.default_dt = 1/60;
  this.last_dt = this.default_dt;

  var th = this;

  /// Contact solver parameters, @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
  this.spook_a = function(h){ return 4.0 / (h * (1 + 4 * th.spook_d)); };
  this.spook_b = (4.0 * this.spook_d) / (1 + 4 * this.spook_d);
  this.spook_eps = function(h){ return 4.0 / (h * h * th.spook_k * (1 + 4 * th.spook_d)); };

  /// The contact solver
  this.solver = new CANNON.Solver(this.spook_a(1.0/60.0),
				  this.spook_b,
				  this.spook_eps(1.0/60.0),
				  this.spook_k,
				  this.spook_d,
				  5,
				  1.0/60.0);

  this._materials = [];
  this._material_contactmaterial_refs = [];
  /// ContactMaterial objects
  this._contactmaterials = [];
  this._contact_material1 = [];
  this._contact_material2 = [];
  this._contact_friction_k = [];
  this._contact_friction_s = [];
  this._contact_restitution = [];
};

/**
 * Toggle pause mode. When pause is enabled, step() won't do anything.
 * @todo Pausing is the simulation gui's responsibility, should remove this.
 */
CANNON.World.prototype.togglepause = function(){
  this.paused = !this.paused;
};

/**
 * Get the contact material between bodies bi and bj
 */
CANNON.World.prototype._getContactMaterialId = function(bi,bj){
  if(this.material[bi]>=0 && this.material[bj]>=0){
    // Material found
    var i = this._materials[this.material[bi]]._id;
    var j = this._materials[this.material[bj]]._id;
    if(i<j){
      var temp = i;
      i = j;
      j = temp;
    }
    return this._material_contactmaterial_refs[i+j*this._materials.length];
  }
  return -1;
};

/**
 * Add an impulse to the colliding bodies i and j
 * @param int i Body number 1
 * @param int i Body number 2
 * @param Vec3 ri Vector from body 1's center of mass to the contact point on its surface
 * @param Vec3 ri Vector from body 1's center of mass to the contact point on its surface
 * @param Vec3 ui The relative velocity eg. vj+wj*rj - (vi+wj*rj)
 * @param Vec3 ni The contact normal pointing out from body i.
 * @param float e The coefficient of restitution
 * @param float mu The contact friction
 * @todo Use it in the code!
 */
CANNON.World.prototype._addImpulse = function(i,j,ri,rj,ui,ni,e,mu){

  var ri_star = ri.crossmat();
  var rj_star = rj.crossmat();
  
  // Inverse inertia matrices
  var ii = this.inertiax[i]>0 ? 1.0/this.inertiax[i] : 0.0;
  var Iinv_i = new CANNON.Mat3([ii,0,0,
				0,ii,0,
				0,0,ii]);
  ii = this.inertiax[j]>0 ? 1.0/this.inertiax[j] : 0.0;
  var Iinv_j = new CANNON.Mat3([ii,0,0,
				0,ii,0,
				0,0,ii]);

  // Collision matrix:
  // K = 1/mi + 1/mj - ri_star*I_inv_i*ri_star - rj_star*I_inv_j*rj_star;
  var im = this.invm[i] + this.invm[j];
  var K = new CANNON.Mat3([im,0,0,
			   0,im,0,
			   0,0,im]);
  var rIr_i = ri_star.mmult(Iinv_i.mmult(ri_star));
  var rIr_j = rj_star.mmult(Iinv_j.mmult(rj_star));

  /*
  // @todo add back when this works
  for(var el = 0; el<9; el++)
    K.elements[el] -= (rIr_i.elements[el] + rIr_j.elements[el]);
  */
	
  // First assume stick friction
  // Final velocity if stick:
  var v_f = ni.mult(-e * ui.dot(ni));

  var J =  K.solve(v_f.vsub(ui));

  // Check if slide mode (J_t > J_n) - outside friction cone
  var mu = 0.0; // quick fix
  if(mu>0){
    var J_n = ni.mult(J.dot(ni));
    var J_t = J.vsub(J_n);
    if(J_t.norm() > J_n.mult(mu).norm()){

      // Calculate impulse j = -(1+e)u_n / nK(n-mu*t)
      var v_tang = ui.vsub(ni.mult(ui.dot(ni)));
      var tangent = v_tang.mult(1.0/(v_tang.norm() + 0.0001));
      var impulse = -(1+e)*(ui.dot(ni))/(ni.dot(K.vmult((ni.vsub(tangent.mult(mu))))));
      J = ni.mult(impulse).vsub(tangent.mult(mu * impulse));
    }
  }

  // Add to velocities
  var imi = this.invm[i];
  var imj = this.invm[j];

  // du = uprim - u
  //   => uprim = du + u
  // vi = vi + J/mi
  // vj = vj - J/mj

  // Convert back to non-relative velocities:
  // u_rel = vj - vi
  // vi = vj - u_rel
  // vj = vi + u_rel

  this.vx[i] +=  J.x * imi - (this.vx[j] - ui.x);
  this.vy[i] +=  J.y * imi - (this.vy[j] - ui.y);
  this.vz[i] +=  J.z * imi - (this.vz[j] - ui.z);
  this.vx[j] -=  J.x * imj + (this.vx[i] + ui.x);
  this.vy[j] -=  J.y * imj + (this.vy[i] + ui.y);
  this.vz[j] -=  J.z * imj + (this.vz[i] + ui.z);

  var cr = ri.cross(J);
  var wadd = cr.mult(1.0/this.inertiax[i]);

  /*
  // Add rotational impulses
  this.wx[i] += wadd.x;
  this.wy[i] += wadd.y;
  this.wz[i] += wadd.z;
  cr = rj.cross(J);
  wadd = cr.mult(1.0/this.inertiax[j]); // @todo fix to suit asymmetric inertia
  this.wx[j] -= wadd.x;
  this.wy[j] -= wadd.y;
  this.wz[j] -= wadd.z;
  */
};

/**
 * Get number of objects in the world.
 * @return int
 */
CANNON.World.prototype.numObjects = function(){
  return this.x ? this.x.length : 0;
};

/**
 * Clear the contact state for a body.
 * @param RigidBody body
 */
CANNON.World.prototype.clearCollisionState = function(body){
  var n = this.numObjects();
  var i = body._id;
  for(var idx=0; idx<n; idx++){
    var j = idx;
    if(i>j) this.collision_matrix[j+i*n] = 0;
    else    this.collision_matrix[i+j*n] = 0;
  }
};

/**
 * Add a rigid body to the simulation.
 * @param RigidBody body
 * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
 * @todo Adding an array of bodies should be possible. This would save some loops too
 */
CANNON.World.prototype.add = function(body){
  if(!body) return;
  var t = this;

  var n = t.numObjects();

  var old_x =    t.x,    old_y =  t.y,      old_z = t.z;
  var old_vx =   t.vx,   old_vy = t.vy,     old_vz = t.vz;
  var old_fx =   t.fx,   old_fy = t.fy,     old_fz = t.fz;
  var old_taux = t.taux, old_tauy = t.tauy, old_tauz = t.tauz;
  var old_wx =   t.wx,   old_wy = t.wy,     old_wz = t.wz;
  var old_qx =   t.qx,   old_qy = t.qy,     old_qz = t.qz, old_qw = t.qw;

  var old_type = t.type;
  var old_body = t.body;
  var old_fixed = t.fixed;
  var old_invm = t.invm;
  var old_mass = t.mass;
  var old_material = t.material;

  var old_inertiax = t.inertiax, old_inertiay = t.inertiay, old_inertiaz = t.inertiaz;
  var old_iinertiax = t.iinertiax, old_iinertiay = t.iinertiay, old_iinertiaz = t.iinertiaz;

  function f(){ return new Float32Array(n+1); };

  t.x = f();  t.y = f();  t.z = f();
  t.vx = f(); t.vy = f(); t.vz = f();
  t.fx = f(); t.fy = f(); t.fz = f();
  t.taux = f(); t.tauy = f(); t.tauz = f();
  t.wx = f(); t.wy = f(); t.wz = f();
  t.qx = f(); t.qy = f(); t.qz = f(); t.qw = f();

  t.type = new Int16Array(n+1);
  t.body = [];
  t.fixed = new Int16Array(n+1);
  t.mass = f();
  /// References to material for each body
  t.material = new Int16Array(n+1);
  t.inertiax = f();
  t.inertiay = f();
  t.inertiaz = f();
  t.iinertiax = f();
  t.iinertiay = f();
  t.iinertiaz = f();
  t.invm = f();
  
  // Add old data to new array
  for(var i=0; i<n; i++){
    t.x[i] =    old_x[i];    t.y[i] = old_y[i];       t.z[i] = old_z[i];
    t.vx[i] =   old_vx[i];   t.vy[i] = old_vy[i];     t.vz[i] = old_vz[i];
    t.fx[i] =   old_fx[i];   t.fy[i] = old_fy[i];     t.fz[i] = old_fz[i];
    t.taux[i] = old_taux[i]; t.tauy[i] = old_tauy[i]; t.tauz[i] = old_tauz[i];
    t.wx[i] =   old_wx[i];   t.wy[i] = old_wy[i];     t.wz[i] = old_wz[i];

    t.qx[i] = old_qx[i];
    t.qy[i] = old_qy[i];
    t.qz[i] = old_qz[i];
    t.qw[i] = old_qw[i];

    t.type[i] = old_type[i];
    t.body[i] = old_body[i];
    t.fixed[i] = old_fixed[i];
    t.invm[i] = old_invm[i];
    t.mass[i] = old_mass[i];
    t.material[i] = old_material[i];
    t.inertiax[i] = old_inertiax[i];
    t.inertiay[i] = old_inertiay[i];
    t.inertiaz[i] = old_inertiaz[i];
    t.iinertiax[i] = old_iinertiax[i];
    t.iinertiay[i] = old_iinertiay[i];
    t.iinertiaz[i] = old_iinertiaz[i];
  }

  // Add one more
  t.x[n] = body._position.x;
  t.y[n] = body._position.y;
  t.z[n] = body._position.z;
  
  t.vx[n] = body._velocity.x;
  t.vy[n] = body._velocity.y;
  t.vz[n] = body._velocity.z;
  
  t.fx[n] = body._force.x;
  t.fy[n] = body._force.y;
  t.fz[n] = body._force.z;
  
  t.taux[n] = body._tau.x;
  t.tauy[n] = body._tau.y;
  t.tauz[n] = body._tau.z;

  t.wx[n] = body._rotvelo.x;
  t.wy[n] = body._rotvelo.y;
  t.wz[n] = body._rotvelo.z;
  
  t.qx[n] = body._quaternion.x;
  t.qy[n] = body._quaternion.y;
  t.qz[n] = body._quaternion.z;
  t.qw[n] = body._quaternion.w;

  t.type[n] = body._shape.type;
  t.body[n] = body; // Keep reference to body
  t.fixed[n] = body._mass<=0.0 ? 1 : 0;
  t.invm[n] = body._mass>0 ? 1.0/body._mass : 0;
  t.mass[n] = body._mass;
  t.material[n] = body._material!=undefined ? body._material._id : -1;

  t.inertiax[n] = body._inertia.x;
  t.inertiay[n] = body._inertia.y;
  t.inertiaz[n] = body._inertia.z;
  t.iinertiax[n] = body._inertia.x > 0 ? 1.0/body._inertia.x : 0.0;
  t.iinertiay[n] = body._inertia.y > 0 ? 1.0/body._inertia.y : 0.0;
  t.iinertiaz[n] = body._inertia.z > 0 ? 1.0/body._inertia.z : 0.0;

  body._id = n; // give id as index in table
  body._world = t;

  // Create collision matrix
  t.collision_matrix = new Int16Array((n+1)*(n+1));

  console.log("num now: "+this.numObjects());
};


/**
 * Remove a rigid body from the simulation.
 * @param RigidBody body
 */
CANNON.World.prototype.remove = function(body){
  if(!body) return;
  var t = this;
  var n = t.numObjects();

  var o = {}; // save old things
  o.x = t.x;       o.y =    t.y;    o.z = t.z;
  o.vx = t.vx;     o.vy =   t.vy;   o.vz = t.vz;
  o.fx = t.fx;     o.fy =   t.fy;   o.fz = t.fz;
  o.taux = t.taux; o.tauy = t.tauy; o.tauz = t.tauz;
  o.wx = t.wx;     o.wy =   t.wy;   o.wz = t.wz;
  o.qx = t.qx;     o.qy =   t.qy;   o.qz = t.qz; o.qw = t.qw;
  o.type = t.type;
  o.body = t.body;
  o.fixed = t.fixed;
  o.mass = t.mass;
  o.material =  t.material;
  o.inertiax =  t.inertiax;  o.inertiay = t.inertiay;   o.inertiaz = t.inertiaz;
  o.iinertiax = t.iinertiax; o.iinertiay = t.iinertiay; o.iinertiaz = t.iinertiaz;
  o.invm =      t.invm;

  function f(){ return new Float32Array(n-1); };

  // Create new arrays
  t.x = f();    t.y = f();    t.z = f();
  t.vx = f();   t.vy = f();   t.vz = f();
  t.fx = f();   t.fy = f();   t.fz = f();
  t.taux = f(); t.tauy = f(); t.tauz = f();
  t.wx = f();   t.wy = f();   t.wz = f();
  t.qx = f();   t.qy = f();   t.qz = f(); t.qw = f();

  t.type = new Int16Array(n-1);
  t.body = [];
  t.fixed = new Int16Array(n-1);
  t.mass = f();
  /// References to material for each body
  t.material = new Int16Array(n-1);
  t.inertiax = f();
  t.inertiay = f();
  t.inertiaz = f();
  t.iinertiax = f();
  t.iinertiay = f();
  t.iinertiaz = f();
  t.invm = f();
  
  // Copy old data to new arrays, without the deleted index
  for(var j=0; j<n; j++){
    if(j!=body._id){
      var i = j>body._id ? j-1 : j;
      t.x[i] =    o.x[i];    t.y[i] = o.y[i];       t.z[i] = o.z[i];
      t.vx[i] =   o.vx[i];   t.vy[i] = o.vy[i];     t.vz[i] = o.vz[i];
      t.fx[i] =   o.fx[i];   t.fy[i] = o.fy[i];     t.fz[i] = o.fz[i];
      t.taux[i] = o.taux[i]; t.tauy[i] = o.tauy[i]; t.tauz[i] = o.tauz[i];
      t.wx[i] =   o.wx[i];   t.wy[i] = o.wy[i];     t.wz[i] = o.wz[i];
      
      t.qx[i] = o.qx[i];
      t.qy[i] = o.qy[i];
      t.qz[i] = o.qz[i];
      t.qw[i] = o.qw[i];
      
      t.type[i] = o.type[i];
      t.body[i] = o.body[i];
      t.fixed[i] = o.fixed[i];
      t.invm[i] = o.invm[i];
      t.mass[i] = o.mass[i];
      t.material[i] = o.material[i];
      t.inertiax[i] = o.inertiax[i];
      t.inertiay[i] = o.inertiay[i];
      t.inertiaz[i] = o.inertiaz[i];
      t.iinertiax[i] = o.iinertiax[i];
      t.iinertiay[i] = o.iinertiay[i];
      t.iinertiaz[i] = o.iinertiaz[i];
    }
  }

  // disconnect to the world
  body._id = -1;
  body._world = null;

  // Reset collision matrix
  t.collision_matrix = new Int16Array((n-1)*(n-1));

  console.log(this.body.length+" bodies left after remove, n="+n);
};


/**
 * Adds a contact material to the world
 * @param ContactMaterial cmat
 */
CANNON.World.prototype.addContactMaterial = function(cmat) {

  // Expand old arrays

  // Two more contact material rows+cols
  var newcm = new Int16Array((this._materials.length+2)
			     * (this._materials.length+2));
  for(var i=0; i<newcm.length; i++)
    newcm[i] = -1;
  for(var i=0; i<this._materials.length; i++)
    for(var j=0; j<this._materials.length; j++)
      newcm[i+this._materials.length*j] = this._material_contactmaterial_refs[i+this._materials.length*j];
  this._material_contactmaterial_refs = newcm;
  
  // Add the materials to an array for access later
  for(var i=0; i<2; i++){
    if(cmat.materials[i]._id==-1){
      this._materials.push(cmat.materials[i]);
      cmat.materials[i]._id = this._materials.length-1;
    }
  }
  
  // Save (material1,material2) -> (contact material) reference for easy access later
  var i = cmat.materials[0]._id;
  var j = cmat.materials[1]._id; // Make sure i>j, ie upper right matrix
  
  this._material_contactmaterial_refs[i+this._materials.length*j]
    = (this._contact_material1.length); // The index of the contact material

  // Add the contact material properties
  this._contactmaterials.push(cmat);
  this._contact_material1.push(cmat.materials[0]._id);
  this._contact_material2.push(cmat.materials[1]._id);
  this._contact_friction_k.push(cmat.kinematic_friction);
  this._contact_friction_s.push(cmat.static_friction);
  this._contact_restitution.push(cmat.restitution);
};

/**
 * Get/set the broadphase collision detector for the world.
 * @param BroadPhase broadphase
 * @return BroadPhase
 */
CANNON.World.prototype.broadphase = function(broadphase){
  if(broadphase){
    this._broadphase = broadphase;
    broadphase.world = this;
  } else
    return this._broadphase;
};

/**
 * Get/set the number of iterations
 * @param int n
 * @return int
 */
CANNON.World.prototype.iterations = function(n){
  if(n===undefined)
    return this.solver.iter;
  else if(Number(n) && n>0)
    this.solver.iter = parseInt(n);
  else
    throw "Argument must be an integer larger than 0";
};

/**
 * Set the gravity
 * @param Vec3
 * @return Vec3
 */
CANNON.World.prototype.gravity = function(g){
  if(g==undefined)
    return this._gravity;
  else
    this._gravity = g;
};

/**
 * Step the simulation
 * @param float dt
 */
CANNON.World.prototype.step = function(dt){

  var world = this;
  
  if(dt==undefined){
    if(this.last_dt)
      dt = this.last_dt;
    else
      dt = this.default_dt;
  }

  // 1. Collision detection
  var pairs = this._broadphase.collisionPairs(this);
  var p1 = pairs[0];
  var p2 = pairs[1];

  // Get references to things that are accessed often. Will save some lookup time.
  var SPHERE = CANNON.Shape.types.SPHERE;
  var PLANE = CANNON.Shape.types.PLANE;
  var BOX = CANNON.Shape.types.BOX;
  var COMPOUND = CANNON.Shape.types.COMPOUND;
  var types = world.type;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var qx = world.qx;
  var qy = world.qy;
  var qz = world.qz;
  var qw = world.qw;
  var vx = world.vx;
  var vy = world.vy;
  var vz = world.vz;
  var wx = world.wx;
  var wy = world.wy;
  var wz = world.wz;
  var fx = world.fx;
  var fy = world.fy;
  var fz = world.fz;
  var taux = world.taux;
  var tauy = world.tauy;
  var tauz = world.tauz;
  var invm = world.invm;

  // @todo reuse these somehow?
  var vx_lambda = new Float32Array(world.x.length);
  var vy_lambda = new Float32Array(world.y.length);
  var vz_lambda = new Float32Array(world.z.length);
  var wx_lambda = new Float32Array(world.x.length);
  var wy_lambda = new Float32Array(world.y.length);
  var wz_lambda = new Float32Array(world.z.length);

  var lambdas = new Float32Array(p1.length);
  var lambdas_t1 = new Float32Array(p1.length);
  var lambdas_t2 = new Float32Array(p1.length);
  for(var i=0; i<lambdas.length; i++){
    lambdas[i] = 0;
    lambdas_t1[i] = 0;
    lambdas_t2[i] = 0;
    vx_lambda[i] = 0;
    vy_lambda[i] = 0;
    vz_lambda[i] = 0;
    wx_lambda[i] = 0;
    wy_lambda[i] = 0;
    wz_lambda[i] = 0;
  }

  var that = this;

  /**
   * Keep track of contacts for current and previous timesteps
   * @param int i Body index
   * @param int j Body index
   * @param int which 0 means current, -1 one timestep behind, -2 two behind etc
   * @param int newval New contact status
   */
  function cmatrix(i,j,which,newval){
    // i == column
    // j == row
    if((which==0 && i<j) || // Current uses upper part of the matrix
       (which==-1 && i>j)){ // Previous uses lower part of the matrix
      var temp = j;
      j = i;
      i = temp;
    }
    if(newval===undefined)
      return that.collision_matrix[i+j*that.numObjects()];
    else
      that.collision_matrix[i+j*that.numObjects()] = parseInt(newval);
  }

  // Begin with transferring old contact data to the right place
  for(var i=0; i<this.numObjects(); i++)
    for(var j=0; j<i; j++){
      cmatrix(i,j,-1, cmatrix(i,j,0));
      cmatrix(i,j,0,0);
    }

  // Add gravity to all objects
  for(var i=0; i<world.numObjects(); i++){
    fx[i] += world._gravity.x * world.mass[i];
    fy[i] += world._gravity.y * world.mass[i];
    fz[i] += world._gravity.z * world.mass[i];
  }

  // Reset contact solver
  this.solver.reset(world.numObjects());

  /**
   * Near phase calculation, get the contact point, normal, etc.
   * @param array result The result one will get back with all the contact point information
   * @param Shape si Colliding shape
   * @param Shape sj
   * @param Vec3 xi Position of the center of mass
   * @param Vec3 xj
   * @param Quaternion qi Rotation around the center of mass
   * @param Quaternion qj
   * @todo All collision cases
   * @todo Replace the current nearphase with this function.
   */
  function nearPhase(result,si,sj,xi,xj,qi,qj){
    var swapped = false;
    if(si.type>sj.type){
      var temp;
      temp=sj;   sj=si;   si=temp;
      temp=xj;   xj=xi;   xi=temp;
      temp=qj;   qj=qi;   qi=temp;
      swapped = true;
    }

    /**
     * Make a contact object.
     * @return object
     * @todo Perhaps we should make a Contact class out of this instead...
     */
    function makeResult(){
      return {
	  ri:new CANNON.Vec3(), // Vector from body i center to contact point
	  rj:new CANNON.Vec3(), // Vector from body j center to contact point
	  ni:new CANNON.Vec3()  // Contact normal protruding body i
	};
    }

    /**
     * Swaps the body references in the contact
     * @param object r
     */
    function swapResult(r){
      var temp = CANNON.Vec3()
      temp = r.ri; r.ri = r.rj; r.rj = temp;
      r.ni.negate(r.ni);
    }

    /**
     * Go recursive for compound shapes
     * @param Shape si
     * @param CompoundShape sj
     */
    function recurseCompound(result,si,sj,xi,xj,qi,qj){
      for(var i=0; i<sj.childShapes.length; i++){
	var r = [];
	nearPhase(r,
		  si,
		  sj.childShapes[i],
		  xi,
		  xj.vadd(sj.childOffsets[i]), // Transform the shape to its local frame
		  qi,
		  qj.mult(sj.childOrientations[i]));
	for(var j=0; j<r.length; j++){
	  // transform back how?
	  r[j].rj.vsub(sj.childOffsets[i],r[j].rj);
	  //sj.childOrientations[i].inverse().vmult(r[j].rj,r[j].rj);
	  //sj.childOrientations[i].vmult(r[j].ni,r[j].ni);
	  result.push(r[j]);
	}
      }
    }

    if(si.type==CANNON.Shape.types.SPHERE){
      if(sj.type==CANNON.Shape.types.SPHERE){ // sphere-sphere

	// We will have one contact in this case
	var r = makeResult();

	// Contact normal
	xj.vsub(xi,r.ni);
	r.ni.normalize();

	// Contact point locations
	r.ni.copy(r.ri);
	r.ni.copy(r.rj);
	r.ri.mult(si.radius,r.ri);
	r.rj.mult(-sj.radius,r.rj);
	result.push(r);

      } else if(sj.type==CANNON.Shape.types.PLANE){ // sphere-plane

	// We will have one contact in this case
	var r = makeResult();

	// Contact normal
	sj.normal.copy(r.ni);
	r.ni.negate(r.ni); // body i is the sphere, flip normal
	r.ni.normalize();

	// Vector from sphere center to contact point
	r.ni.mult(si.radius,r.ri);

	// Project down sphere on plane
	var point_on_plane_to_sphere = xi.vsub(xj);
	var plane_to_sphere_ortho = r.ni.mult(r.ni.dot(point_on_plane_to_sphere));
	r.rj = point_on_plane_to_sphere.vsub(plane_to_sphere_ortho); // The sphere position projected to plane
	result.push(r);
	
      } else if(sj.type==CANNON.Shape.types.BOX){ // sphere-box

	// we refer to the box as body j
	var box_to_sphere =  xi.vsub(xj);
	var sides = sj.getSideNormals(true,qj);
	var R =     si.radius;
	var penetrating_sides = [];

	// Check side (plane) intersections
	var found = false;
	for(var idx=0; idx<sides.length && !found; idx++){ // Max 3 penetrating sides
	  var ns = sides[idx].copy();
	  var h = ns.norm();
	  ns.normalize();
	  var dot = box_to_sphere.dot(ns);
	  if(dot<h+R && dot>0){
	    // Intersects plane. Now check the other two dimensions
	    var ns1 = sides[(idx+1)%3].copy();
	    var ns2 = sides[(idx+2)%3].copy();
	    var h1 = ns1.norm();
	    var h2 = ns2.norm();
	    ns1.normalize();
	    ns2.normalize();
	    var dot1 = box_to_sphere.dot(ns1);
	    var dot2 = box_to_sphere.dot(ns2);
	    if(dot1<h1 && dot1>-h1 && dot2<h2 && dot2>-h2){
	      found = true;
	      var r = makeResult();
	      ns.mult(-R,r.ri); // Sphere r
	      ns.copy(r.ni);
	      r.ni.negate(r.ni); // Normal should be out of sphere
	      ns.mult(h,r.rj); // box
	      result.push(r);
	    }
	  }
	}

	// Check corners
	for(var j=0; j<2 && !found; j++){
	  for(var k=0; k<2 && !found; k++){
	    for(var l=0; l<2 && !found; l++){
	      var rj = new CANNON.Vec3();
	      if(j) rj.vadd(sides[0],rj);
	      else  rj.vsub(sides[0],rj);
	      if(k) rj.vadd(sides[1],rj);
	      else  rj.vsub(sides[1],rj);
	      if(l) rj.vadd(sides[2],rj);
	      else  rj.vsub(sides[2],rj);

	      // World position of corner
	      var sphere_to_corner = xj.vadd(rj).vsub(xi);
	      if(sphere_to_corner.norm()<R){
		found = true;
		var r = makeResult();
		sphere_to_corner.copy(r.ri);
		r.ri.normalize();
		r.ri.copy(r.ni);
		r.ri.mult(R,r.ri);
		rj.copy(r.rj);
		result.push(r);
	      }
	    }
	  }
	}

	// Check edges
	for(var j=0; j<sides.length && !found; j++){
	  for(var k=0; k<sides.length && !found; k++){
	    if(j%3!=k%3){
	      // Get edge tangent
	      var edgeTangent = sides[k].cross(sides[j]);
	      edgeTangent.normalize();
	      var edgeCenter = sides[j].vadd(sides[k]);
	      
	      var r = xi.vsub(edgeCenter.vadd(xj)); // r = edge center to sphere center
	      var orthonorm = r.dot(edgeTangent); // distance from edge center to sphere center in the tangent direction
	      var orthogonal = edgeTangent.mult(orthonorm); // Vector from edge center to sphere center in the tangent direction
	      
	      // Find the third side orthogonal to this one
	      var l = 0;
	      while(l==j%3 || l==k%3) l++;

	      // vec from edge center to sphere projected to the plane orthogonal to the edge tangent
	      var dist = xi.vsub(orthogonal).vsub(edgeCenter.vadd(xj));

	      // Distances in tangent direction and distance in the plane orthogonal to it
	      var tdist = Math.abs(orthonorm);
	      var ndist = dist.norm();
	      
	      if(tdist < sides[l].norm() && ndist<R){
		found = true;
		var res = makeResult();
		edgeCenter.vadd(orthogonal,res.rj); // box rj
		res.rj.copy(res.rj);
		dist.negate(res.ri);
		res.ri.normalize();
		res.ri.copy(res.ni); // Normal is from sphere
		res.ri.mult(R,r.ri); // ri from sphere
		result.push(res);
	      }
	    }
	  }
	}

      } else if(sj.type==CANNON.Shape.types.COMPOUND){ // sphere-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
      }
      
    } else if(si.type==CANNON.Shape.types.PLANE){
      
      if(sj.type==CANNON.Shape.types.PLANE){ // plane-plane
	throw "Plane-plane collision... wait, you did WHAT?";
	
      } else if(sj.type==CANNON.Shape.types.BOX){ // plane-box

	// Collision normal
	var n = si.normal.copy();

	// Loop over corners
	var numcontacts = 0;
	var corners = sj.getCorners(qj);
	for(var idx=0; idx<corners.length && numcontacts<=4; idx++){ // max 4 corners against plane
	  var r = makeResult();
	  var worldCorner = corners[idx].vadd(xj);
	  corners[idx].copy(r.rj);

	  // Project down corner to plane to get xj
	  var point_on_plane_to_corner = worldCorner.vsub(xi);
	  var d = n.dot(point_on_plane_to_corner);
	  if(d<=0){
	    numcontacts++;
	    var plane_to_corner = n.mult(d);
	    point_on_plane_to_corner.vsub(plane_to_corner,r.ri);
	    
	    // Set contact normal
	    n.copy(r.ni);
	    
	    // Add contact
	    result.push(r);
	  }
	}
	
      } else if(sj.type==CANNON.Shape.types.COMPOUND){ // plane-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
      }
      
    } else if(si.type==CANNON.Shape.types.BOX){
      
      if(sj.type==CANNON.Shape.types.BOX){ // box-box
	throw "box-box collision not implemented yet";
      }
      
      if(sj.type==CANNON.Shape.types.COMPOUND){ // box-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
	
      }
      
    } else if(si.type==CANNON.Shape.types.COMPOUND){
      
      if(sj.type==CANNON.Shape.types.COMPOUND){ // compound-compound
	recurseCompound(result,si,sj,xi,xj,qi,qj);
	
      }
    }
    
    // Swap back if we swapped bodies in the beginning
    for(var i=0; swapped && i<result.length; i++)
      swapResult(result[i]);
  }

  // Loop over all collisions
  for(var k=0; k<p1.length; k++){

    // Get current collision indeces
    var i = p1[k];
    var j = p2[k];
    
    // Check last step stats
    var lastCollisionState = cmatrix(i,j,-1);
    
    // Get collision properties
    var mu_s = 0.3, mu_k = 0.3, e = 0.2;
    var cm = this._getContactMaterialId(i,j);
    if(cm!=-1){
      mu_s = this._contact_friction_s[cm];
      mu_k = this._contact_friction_k[cm];
      e = this._contact_restitution[cm];
    }
    
    // Get contacts
    var contacts = [];
    nearPhase(contacts,
	      world.body[i]._shape,
	      world.body[j]._shape,
	      new CANNON.Vec3(x[i],y[i],z[i]),
	      new CANNON.Vec3(x[j],y[j],z[j]),
	      new CANNON.Quaternion(qx[i],qy[i],qz[i],qw[i]),
	      new CANNON.Quaternion(qx[j],qy[j],qz[j],qw[j]));

    // Add contact constraint(s)
    for(var ci = 0; ci<contacts.length; ci++){
      var c = contacts[ci];
      
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      var gvec = new CANNON.Vec3(x[j] + c.rj.x - x[i] - c.ri.x,
				 y[j] + c.rj.y - y[i] - c.ri.y,
				 z[j] + c.rj.z - z[i] - c.ri.z);
      var g = gvec.dot(c.ni); // Gap, negative if penetration

      // Action if penetration
      if(g<0.0){
	var vi = new CANNON.Vec3(vx[i],vy[i],vz[i]);
	var wi = new CANNON.Vec3(wx[i],wy[i],wz[i]);
	var vj = new CANNON.Vec3(vx[j],vy[j],vz[j]);
	var wj = new CANNON.Vec3(wx[j],wy[j],wz[j]);

	var n = c.ni;
	var tangents = [new CANNON.Vec3(),new CANNON.Vec3()];
	n.tangents(tangents[0],tangents[1]);

	var v_contact_i = vi.vadd(wi.cross(c.ri));
	var v_contact_j = vj.vadd(wj.cross(c.rj));
	var u_rel = v_contact_j.vsub(v_contact_i);
	var w_rel = wj.cross(c.rj).vsub(wi.cross(c.ri));

	var u = (vj.vsub(vi)); // Contact velo
	var uw = (c.rj.cross(wj)).vsub(c.ri.cross(wi));
	u.vsub(uw,u);

	// Get mass properties
	var iMi = world.invm[i];
	var iMj = world.invm[j];
	var iIxi = world.inertiax[i] > 0 ? 1.0/world.inertiax[i] : 0;
	var iIyi = world.inertiay[i] > 0 ? 1.0/world.inertiay[i] : 0;
	var iIzi = world.inertiaz[i] > 0 ? 1.0/world.inertiaz[i] : 0;
	var iIxj = world.inertiax[j] > 0 ? 1.0/world.inertiax[j] : 0;
	var iIyj = world.inertiay[j] > 0 ? 1.0/world.inertiay[j] : 0;
	var iIzj = world.inertiaz[j] > 0 ? 1.0/world.inertiaz[j] : 0;

	// Add contact constraint
	var rixn = c.ri.cross(n);
	var rjxn = c.rj.cross(n);

	var un_rel = n.mult(u_rel.dot(n));
	var u_rixn_rel = rixn.unit().mult(w_rel.dot(rixn.unit()));
	var u_rjxn_rel = rjxn.unit().mult(-w_rel.dot(rjxn.unit()));

	var gn = c.ni.mult(g);

	this.solver
	  .addConstraint( // Non-penetration constraint jacobian
			 [-n.x,-n.y,-n.z,
			  -rixn.x,-rixn.y,-rixn.z,
			  n.x,n.y,n.z,
			  rjxn.x,rjxn.y,rjxn.z],
			 
			 // Inverse mass matrix
			 [iMi,iMi,iMi,
			  iIxi,iIyi,iIzi,
			  iMj,iMj,iMj,
			  iIxj,iIyj,iIzj],
			 
			 // g - constraint violation / gap
			 [-gn.x,-gn.y,-gn.z,
			  0,0,0,//-gn.x,-gn.y,-gn.z,
			  gn.x,gn.y,gn.z,
			  0,0,0//gn.x,gn.y,gn.z
			  ],

			 [-un_rel.x,-un_rel.y,-un_rel.z,
			  -u_rixn_rel.x,-u_rixn_rel.y,-u_rixn_rel.z,
			  un_rel.x,un_rel.y,un_rel.z,
			  u_rjxn_rel.x,u_rjxn_rel.y,u_rjxn_rel.z],
			 
			 // External force - forces & torques
			 [fx[i],fy[i],fz[i],
			  taux[i],tauy[i],tauz[i],
			  fx[j],fy[j],fz[j],
			  taux[j],tauy[j],tauz[j]],
			 0,
			 'inf',
			 i,
			 j);

	// Friction constraints
	if(false){ // until debugged
	  var mu = 0.3, g = that.gravity().norm();
	  for(var ti=0; ti<tangents.length; ti++){
	    var t = tangents[ti];
	    var rixt = c.ri.cross(t);
	    var rjxt = c.rj.cross(t);

	    var ut_rel = t.mult(u_rel.dot(t));
	    var u_rixt_rel = rixt.unit().mult(u_rel.dot(rixt.unit()));
	    var u_rjxt_rel = rjxt.unit().mult(-u_rel.dot(rjxt.unit()));
	    this.solver
	      .addConstraint( // Non-penetration constraint jacobian
			     [-t.x,-t.y,-t.z,
			      -rixt.x,-rixt.y,-rixt.z,
			      t.x,t.y,t.z,
			      rjxt.x,rjxt.y,rjxt.z
			      ],
			     
			     // Inverse mass matrix
			     [iMi,iMi,iMi,
			      iIxi,iIyi,iIzi,
			      iMj,iMj,iMj,
			      iIxj,iIyj,iIzj],
			     
			     // g - constraint violation / gap
			     [0,0,0,
			      0,0,0,
			      0,0,0,
			      0,0,0],
			     
			     [-ut_rel.x,-ut_rel.y,-ut_rel.z,
			      0,0,0,//-u_rixt_rel.x,-u_rixt_rel.y,-u_rixt_rel.z,
			      ut_rel.x,ut_rel.y,ut_rel.z,
			      0,0,0//u_rjxt_rel.x,u_rjxt_rel.y,u_rjxt_rel.z
			      ],
			     
			     // External force - forces & torques
			     [fx[i],fy[i],fz[i],
			      taux[i],tauy[i],tauz[i],
			      fx[j],fy[j],fz[j],
			      taux[j],tauy[j],tauz[j]
			      ],

			     -mu*g*(world.mass[i]+world.mass[j]),
			     mu*g*(world.mass[i]+world.mass[j]),

			     i,
			     j);
	  }
	}
      }
    }
  }

  if(this.solver.n){
    this.solver.solve();

    // Apply constraint velocities
    for(var i=0; i<world.numObjects(); i++){
      vx[i] += this.solver.vxlambda[i];
      vy[i] += this.solver.vylambda[i];
      vz[i] += this.solver.vzlambda[i];
      wx[i] += this.solver.wxlambda[i];
      wy[i] += this.solver.wylambda[i];
      wz[i] += this.solver.wzlambda[i];
    }
  }

  // Apply damping
  for(var i=0; i<world.numObjects(); i++){
    var ld = 1.0 - this.body[i].linearDamping();
    var ad = 1.0 - this.body[i].angularDamping();
    vx[i] *= ld;
    vy[i] *= ld;
    vz[i] *= ld;
    wx[i] *= ad;
    wy[i] *= ad;
    wz[i] *= ad;
  }

  // Leap frog
  // vnew = v + h*f/m
  // xnew = x + h*vnew
  for(var i=0; i<world.numObjects(); i++){
    if(!world.fixed[i]){
      vx[i] += fx[i] * world.invm[i] * dt;
      vy[i] += fy[i] * world.invm[i] * dt;
      vz[i] += fz[i] * world.invm[i] * dt;

      wx[i] += taux[i] * 1.0/world.inertiax[i] * dt;
      wy[i] += tauy[i] * 1.0/world.inertiay[i] * dt;
      wz[i] += tauz[i] * 1.0/world.inertiaz[i] * dt;

      // Use new velocity  - leap frog
      x[i] += vx[i] * dt;
      y[i] += vy[i] * dt;
      z[i] += vz[i] * dt;
      
      var q = new CANNON.Quaternion(qx[i],qy[i],qz[i],qw[i]);
      var w = new CANNON.Quaternion(wx[i],wy[i],wz[i],0);

      var wq = w.mult(q);

      qx[i] += dt * 0.5 * wq.x;
      qy[i] += dt * 0.5 * wq.y;
      qz[i] += dt * 0.5 * wq.z;
      qw[i] += dt * 0.5 * wq.w;
      
      q.x = qx[i];
      q.y = qy[i];
      q.z = qz[i];
      q.w = qw[i];

      q.normalize();

      qx[i]=q.x;
      qy[i]=q.y;
      qz[i]=q.z;
      qw[i]=q.w;
    }
  }

  // Reset all forces
  for(var i = 0; i<world.numObjects(); i++){
    fx[i] = 0.0;
    fy[i] = 0.0;
    fz[i] = 0.0;
    taux[i] = 0.0;
    tauy[i] = 0.0;
    tauz[i] = 0.0;
  }

  // Update world time
  world.time += dt;
  world.stepnumber += 1;
};

