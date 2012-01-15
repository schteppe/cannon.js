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
  this.vx[j] -=  J.x * imj - (this.vx[i] - ui.x);
  this.vy[j] -=  J.y * imj - (this.vy[i] - ui.y);
  this.vz[j] -=  J.z * imj - (this.vz[i] - ui.z);

  var cr = ri.cross(J);
  var wadd = cr.mult(1.0/this.inertiax[i]);

  /*
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
  if(!body)
    return;

  var n = this.numObjects();

  old_x = this.x;
  old_y = this.y;
  old_z = this.z;
  
  old_vx = this.vx;
  old_vy = this.vy;
  old_vz = this.vz;
  
  old_fx = this.fx;
  old_fy = this.fy;
  old_fz = this.fz;
  
  old_taux = this.taux;
  old_tauy = this.tauy;
  old_tauz = this.tauz;
  
  old_wx = this.wx;
  old_wy = this.wy;
  old_wz = this.wz;
  
  old_qx = this.qx;
  old_qy = this.qy;
  old_qz = this.qz;
  old_qw = this.qw;

  old_type = this.type;
  old_body = this.body;
  old_fixed = this.fixed;
  old_invm = this.invm;
  old_mass = this.mass;
  old_material = this.material;

  old_inertiax = this.inertiax;
  old_inertiay = this.inertiay;
  old_inertiaz = this.inertiaz;

  old_iinertiax = this.iinertiax;
  old_iinertiay = this.iinertiay;
  old_iinertiaz = this.iinertiaz;

  this.x = new Float32Array(n+1);
  this.y = new Float32Array(n+1);
  this.z = new Float32Array(n+1);
  
  this.vx = new Float32Array(n+1);
  this.vy = new Float32Array(n+1);
  this.vz = new Float32Array(n+1);
  
  this.fx = new Float32Array(n+1);
  this.fy = new Float32Array(n+1);
  this.fz = new Float32Array(n+1);
  
  this.taux = new Float32Array(n+1);
  this.tauy = new Float32Array(n+1);
  this.tauz = new Float32Array(n+1);
  
  this.wx = new Float32Array(n+1);
  this.wy = new Float32Array(n+1);
  this.wz = new Float32Array(n+1);
  
  this.qx = new Float32Array(n+1);
  this.qy = new Float32Array(n+1);
  this.qz = new Float32Array(n+1);
  this.qw = new Float32Array(n+1);

  this.type = new Int16Array(n+1);
  this.body = [];
  this.fixed = new Int16Array(n+1);
  this.mass = new Float32Array(n+1);
  /// References to material for each body
  this.material = new Int16Array(n+1);
  this.inertiax = new Float32Array(n+1);
  this.inertiay = new Float32Array(n+1);
  this.inertiaz = new Float32Array(n+1);
  this.iinertiax = new Float32Array(n+1);
  this.iinertiay = new Float32Array(n+1);
  this.iinertiaz = new Float32Array(n+1);
  this.invm = new Float32Array(n+1);
  
  // Add old data to new array
  for(var i=0; i<n; i++){
    this.x[i] = old_x[i];
    this.y[i] = old_y[i];
    this.z[i] = old_z[i];
  
    this.vx[i] = old_vx[i];
    this.vy[i] = old_vy[i];
    this.vz[i] = old_vz[i];
  
    this.fx[i] = old_fx[i];
    this.fy[i] = old_fy[i];
    this.fz[i] = old_fz[i];
  
    this.taux[i] = old_taux[i];
    this.tauy[i] = old_tauy[i];
    this.tauz[i] = old_tauz[i];
  
    this.wx[i] = old_wx[i];
    this.wy[i] = old_wy[i];
    this.wz[i] = old_wz[i];
  
    this.qx[i] = old_qx[i];
    this.qy[i] = old_qy[i];
    this.qz[i] = old_qz[i];
    this.qw[i] = old_qw[i];

    this.type[i] = old_type[i];
    this.body[i] = old_body[i];
    this.fixed[i] = old_fixed[i];
    this.invm[i] = old_invm[i];
    this.mass[i] = old_mass[i];
    this.material[i] = old_material[i];
    this.inertiax[i] = old_inertiax[i];
    this.inertiay[i] = old_inertiay[i];
    this.inertiaz[i] = old_inertiaz[i];
    this.iinertiax[i] = old_iinertiax[i];
    this.iinertiay[i] = old_iinertiay[i];
    this.iinertiaz[i] = old_iinertiaz[i];
  }

  // Add one more
  this.x[n] = body._position.x;
  this.y[n] = body._position.y;
  this.z[n] = body._position.z;
  
  this.vx[n] = body._velocity.x;
  this.vy[n] = body._velocity.y;
  this.vz[n] = body._velocity.z;
  
  this.fx[n] = body._force.x;
  this.fy[n] = body._force.y;
  this.fz[n] = body._force.z;
  
  this.taux[n] = body._tau.x;
  this.tauy[n] = body._tau.y;
  this.tauz[n] = body._tau.z;

  this.wx[n] = body._rotvelo.x;
  this.wy[n] = body._rotvelo.y;
  this.wz[n] = body._rotvelo.z;
  
  this.qx[n] = body._quaternion.x;
  this.qy[n] = body._quaternion.y;
  this.qz[n] = body._quaternion.z;
  this.qw[n] = body._quaternion.w;

  this.type[n] = body._shape.type;
  this.body[n] = body; // Keep reference to body
  this.fixed[n] = body._mass<=0.0 ? 1 : 0;
  this.invm[n] = body._mass>0 ? 1.0/body._mass : 0;
  this.mass[n] = body._mass;
  this.material[n] = body._material!=undefined ? body._material._id : -1;

  this.inertiax[n] = body._inertia.x;
  this.inertiay[n] = body._inertia.y;
  this.inertiaz[n] = body._inertia.z;
  this.iinertiax[n] = body._inertia.x > 0 ? 1.0/body._inertia.x : 0.0;
  this.iinertiay[n] = body._inertia.y > 0 ? 1.0/body._inertia.y : 0.0;
  this.iinertiaz[n] = body._inertia.z > 0 ? 1.0/body._inertia.z : 0.0;

  body._id = n; // give id as index in table
  body._world = this;

  // Create collision matrix
  this.collision_matrix = new Int16Array((n+1)*(n+1));
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
  if(n)
    this.solver.iter = parseInt(n);
  else
    return this.solver.iter;
};

/**
 * Set the gravity
 * @param Vec3
 * @return Vec3
 */
CANNON.World.prototype.gravity = function(g){
  if(g==undefined)
    return this.gravity;
  else
    this.gravity = g;
};

/**
 * Step the simulation
 * @param float dt
 */
CANNON.World.prototype.step = function(dt){

  var world = this;

  if(world.paused)
    return;

  // 1. Collision detection
  var pairs = this._broadphase.collisionPairs(this);
  var p1 = pairs[0];
  var p2 = pairs[1];

  // Get references to things that are accessed often. Will save some lookup time.
  var SPHERE = CANNON.Shape.types.SPHERE;
  var PLANE = CANNON.Shape.types.PLANE;
  var BOX = CANNON.Shape.types.BOX;
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
    fx[i] += world.gravity.x * world.mass[i];
    fy[i] += world.gravity.y * world.mass[i];
    fz[i] += world.gravity.z * world.mass[i];
  }

  this.solver.reset(world.numObjects());
  var cid = new Int16Array(p1.length); // For saving constraint refs
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
    
    // sphere-plane collision
    if((types[i]==SPHERE && types[j]==PLANE) ||
       (types[i]==PLANE  && types[j]==SPHERE)){
      // Identify what is what
      var pi, si;
      if(types[i]==SPHERE){
	si=i;
	pi=j;
      } else {
	si=j;
	pi=i;
      }

      // Collision normal
      var n = world.body[pi]._shape.normal.copy();
      n.normalize();
      n.negate(n); // We are working with the sphere as body i!

      // Vector from sphere center to contact point
      var rsi = n.mult(world.body[si]._shape.radius);
      var rsixn = rsi.cross(n);

      // Project down shpere on plane???
      var point_on_plane_to_sphere = new CANNON.Vec3(x[si]-x[pi],
						     y[si]-y[pi],
						     z[si]-z[pi]);
      var xs = new CANNON.Vec3(x[si],y[si],z[si]);
      var plane_to_sphere = n.mult(n.dot(point_on_plane_to_sphere));
      var xp = xs.vsub(plane_to_sphere); // The sphere position projected to plane
      var rj = new CANNON.Vec3(xp.x-x[pi],
			       xp.y-y[pi],
			       xp.z-z[pi]);
      var xj = new CANNON.Vec3(x[pi],
			       y[pi],
			       z[pi]);

      // Pseudo name si := i
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      // xj is in this case the penetration point on the plane, and rj=0
      var qvec = new CANNON.Vec3(xj.x + rj.x - x[si] - rsi.x,
				 xj.y + rj.y - y[si] - rsi.y,
				 xj.z + rj.z - z[si] - rsi.z);
      var q = qvec.dot(n);
	
      // Action if penetration
      if(q<0.0){
	cmatrix(si,pi,0,1); // Set current contact state to contact
	var v_sphere = new CANNON.Vec3(vx[si],vy[si],vz[si]);
	var w_sphere = new CANNON.Vec3(wx[si],wy[si],wz[si]);
	var v_contact = w_sphere.cross(rsi);
	var u = v_sphere;//.vadd(w_sphere.cross(rsi));

	// Which collision state?
	if(lastCollisionState==0){ // No contact last timestep -> impulse

	  // Inverse inertia matrix
	  //console.log("sphere-plane...");
	  this._addImpulse(si,pi,rsi,rj,u,n,mu_s,e);

	} else if(lastCollisionState==1){ // Last contact was also overlapping - contact
	  // --- Solve for contacts ---
	  var iM = world.invm[si];
	  var iI = world.inertiax[si] > 0 ? 1.0/world.inertiax[si] : 0; // Sphere - same for all dims
	  cid[k] = this.solver
	    .addConstraint( // Non-penetration constraint jacobian
			   [-n.x,-n.y,-n.z,
			    0,0,0,
			    0,0,0,
			    0,0,0],
			 
			   // Inverse mass matrix
			   [iM,iM,iM,
			    iI,iI,iI,
			    0,0,0,   // Static plane -> infinite mass
			    0,0,0],
			 
			   // q - constraint violation
			   [-qvec.x*2,-qvec.y*2,-qvec.z*2, // why *2 ?
			    0,0,0,
			    0,0,0,
			    0,0,0],
			 
			   // qdot - motion along penetration normal
			   [v_sphere.x, v_sphere.y, v_sphere.z,
			    0,0,0,
			    0,0,0,
			    0,0,0],
			 
			   // External force - forces & torques
			   [fx[si],fy[si],fz[si],
			    taux[si],tauy[si],tauz[si],
			    0,0,0,
			    0,0,0],
			   0,
			   'inf',
			   si,
			   pi);
	}
      }

    } else if(types[i]==SPHERE && types[j]==SPHERE){

      var ri = new CANNON.Vec3(x[j]-x[i],y[j]-y[i],z[j]-z[i]);
      var rj = new CANNON.Vec3(x[i]-x[j],y[i]-y[j],z[i]-z[j]);
      var nlen = ri.norm();
      ri.normalize();
      ri.mult(world.body[i]._shape.radius,ri);
      rj.normalize();
      rj.mult(world.body[j]._shape.radius,rj);
      var ni = new CANNON.Vec3(x[j]-x[i],
			       y[j]-y[i],
			       z[j]-z[i]);
      ni.normalize();
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      var q_vec = new CANNON.Vec3(x[j]+rj.x-x[i]-ri.x,
				  y[j]+rj.y-y[i]-ri.y,
				  z[j]+rj.z-z[i]-ri.z);
      var q = q_vec.dot(ni);

      // Sphere contact!
      if(q<0.0){ // Violation always < 0

	// Set contact
	cmatrix(i,j,0,1);
	
	var v_sphere_i = new CANNON.Vec3(vx[i],vy[i],vz[i]);
	var v_sphere_j = new CANNON.Vec3(vx[j],vy[j],vz[j]);
	var w_sphere_i = new CANNON.Vec3(wx[i],wy[i],wz[i]);
	var w_sphere_j = new CANNON.Vec3(wx[j],wy[j],wz[j]);
	v_sphere_i.vadd(ri.cross(w_sphere_i));
	v_sphere_j.vadd(rj.cross(w_sphere_j));
	  
	var u = v_sphere_j.vsub(v_sphere_i);

	if(lastCollisionState == 0){ // No contact last timestep -> impulse
	  //console.log("sphere-sphere impulse...");
	  this._addImpulse(i,j,ri,rj,u,ni,mu_s,e);
	  
	} else { // Contact in last timestep -> contact solve
	  //console.log("sphere-sphere contact...");
	  // gdot = ( vj + wj x rj - vi - wi x ri ) .dot ( ni )
	  // => W = ( vj + wj x rj - vi - wi x ri )
	  
	  var iM_i = !world.fixed[i] ? world.invm[i] : 0;
	  var iI_i = !world.fixed[i] ? 1.0/world.inertiax[i] : 0;
	  var iM_j = !world.fixed[j] ? world.invm[j] : 0;
	  var iI_j = !world.fixed[j] ? 1.0/world.inertiax[j] : 0;
	  var rxni = ri.cross(ni);
	  
	  cid[k] = this.solver
	    .addConstraint( // Non-penetration constraint jacobian
			   [-ni.x,   -ni.y,   -ni.z,
			    0,0,0,//-rxni.x, -rxni.y, -rxni.z,
			    ni.x,   ni.y,    ni.z,
			    0,0,0],//rxni.x, rxni.y,  rxni.z],
			   
			   // Inverse mass matrix
			   [iM_i, iM_i, iM_i,
			    iI_i, iI_i, iI_i,
			    iM_j, iM_j, iM_j,
			    iI_j, iI_j, iI_j],
			   
			   // q - constraint violation
			   [-q_vec.x,-q_vec.y,-q_vec.z,
			    0,0,0,
			    q_vec.x,q_vec.y,q_vec.z,
			    0,0,0],
			   
			   [vx[i],vy[i],vz[i],
			    0,0,0,
			    vx[j],vy[j],vz[j],
			    0,0,0],
			   
			   // External force - forces & torques
			   [fx[i],fy[i],fz[i],
			    taux[i],tauy[i],tauz[i],
			    fx[j],fy[j],fz[j],
			    taux[j],tauy[j],tauz[j]],
			   0,
			   'inf',
			   i,
			   j);
	}
      }
    } else if((types[i]==BOX && types[j]==PLANE) || 
	      (types[i]==PLANE && types[j]==BOX)){
      
      // Identify what is what
      var pi, bi;
      if(types[i]==BOX){
	bi=i;
	pi=j;
      } else {
	bi=j;
	pi=i;
      }
      
      // Collision normal
      var n = world.body[pi]._shape.normal.copy();
      n.negate(n); // We are working with the box as body i!

      var xi = new CANNON.Vec3(world.x[bi],
			       world.y[bi],
			       world.z[bi]);

      // Compute inertia in the world frame
      var quat = new CANNON.Quaternion(qx[bi],qy[bi],qz[bi],qw[bi]);
      quat.normalize();
      var localInertia = new CANNON.Vec3(world.inertiax[bi],
					 world.inertiay[bi],
					 world.inertiaz[bi]);
      // @todo Is this rotation OK? Check!
      var worldInertia = quat.vmult(localInertia);
      worldInertia.x = Math.abs(worldInertia.x);
      worldInertia.y = Math.abs(worldInertia.y);
      worldInertia.z = Math.abs(worldInertia.z);

      var corners = world.body[bi]._shape.getCorners();
      
      // Loop through each corner
      var numcontacts = 0;
      for(var idx=0; idx<corners.length && numcontacts<=4; idx++){ // max 4 corners against plane

	var ri = corners[idx];

	// Compute penetration corner in the world frame
	quat.vmult(ri,ri);

	var rixn = ri.cross(n);

	// Project down corner to plane to get xj
	var point_on_plane_to_corner = new CANNON.Vec3(xi.x+ri.x*0.5-x[pi],
						       xi.y+ri.y*0.5-y[pi],
						       xi.z+ri.z*0.5-z[pi]); // 0.5???
	var plane_to_corner = n.mult(n.dot(point_on_plane_to_corner));

	var xj = xi.vsub(plane_to_corner);
	
	// Pseudo name: box index = i
	// g = ( xj + rj - xi - ri ) .dot ( ni )
	var qvec = new CANNON.Vec3(xj.x - x[bi] - ri.x*0.5, // 0.5???
				   xj.y - y[bi] - ri.y*0.5,
				   xj.z - z[bi] - ri.z*0.5);
	var q = qvec.dot(n);
	n.mult(q,qvec);
	
	// Action if penetration
	if(q<0.0){

	  numcontacts++;

	  var v_box = new CANNON.Vec3(vx[bi],vy[bi],vz[bi]);
	  var w_box = new CANNON.Vec3(wx[bi],wy[bi],wz[bi]);

	  var v_contact = w_box.cross(ri);
	  var u = v_box.vadd(w_box.cross(ri));

	  var iM = world.invm[bi];
	  cid[k] = this.solver
	    .addConstraint( // Non-penetration constraint jacobian
			   [-n.x,-n.y,-n.z,
			    -rixn.x,-rixn.y,-rixn.z,
			    0,0,0,
			    0,0,0],
			   
			   // Inverse mass matrix
			   [iM,iM,iM,
			    1.0/worldInertia.x, 1.0/worldInertia.y, 1.0/worldInertia.z,
			    0,0,0,   // Static plane -> infinite mass
			    0,0,0],
			   
			   // q - constraint violation
			   [-qvec.x,-qvec.y,-qvec.z,
			    0,0,0,
			    0,0,0,
			    0,0,0],
			   
			   // qdot - motion along penetration normal
			   [v_box.x, v_box.y, v_box.z,
			    w_box.x, w_box.y, w_box.z,
			    0,0,0,
			    0,0,0],
			   
			   // External force - forces & torques
			   [fx[bi],fy[bi],fz[bi],
			    taux[bi],tauy[bi],tauz[bi],
			    fx[pi],fy[pi],fz[pi],
			    taux[pi],tauy[pi],tauz[pi]],

			   0,
			   'inf',
			   bi,
			   pi);
	}
      }

    } else if((types[i]==BOX && types[j]==SPHERE) || 
	      (types[i]==SPHERE && types[j]==BOX)){

      /*
	--- Box-sphere collision ---
	We have several scenarios here... But obviously we can only have 1 contact point
	- One of the 8 corners penetrate - normal is the sphere center-->corner vector
	- Sphere is penetrating one of the 6 box side - normal is the box side
	- Sphere collides with one of the 12 box edges
	
	To identify scenario, we project the vector from the box center to the
	sphere center onto each of the 6 box side normals, penetration if r*n<h+rs
	3 side penetrations => corner
	2 side penetrations => edge
	1 side penetrations => side
      */

      // Identify what is what
      var si, bi;
      if(types[i]==BOX){
	bi=i;
	si=j;
      } else {
	bi=j;
	si=i;
      }
      
      // we refer to the box as body i
      var xi = new CANNON.Vec3(world.x[bi],world.y[bi],world.z[bi]);
      var xj = new CANNON.Vec3(world.x[si],world.y[si],world.z[si]);
      var xixj = xj.vsub(xi);

      var qi = new CANNON.Quaternion(world.qx[bi],world.qy[bi],world.qz[bi],world.qw[bi]);
      var sides = world.body[bi]._shape.getSideNormals(true,qi);
      var R = world.body[si]._shape.radius;

      var penetrating_sides = [];
      for(var idx=0; idx<sides.length && penetrating_sides.length<=3; idx++){ // Max 3 penetrating sides
	// Need vector from side center to sphere center, r
	var ns = sides[idx].copy();
	var h = ns.norm();
	var r = xixj.vsub(ns);
	ns.normalize();
	var dot = ns.dot(r);
	if(dot<h+R && dot>0)
	  penetrating_sides.push(idx);
      }


      var iMi = new CANNON.Vec3(world.invm[bi],
				world.invm[bi],
				world.invm[bi]);
      var iMj = new CANNON.Vec3(world.invm[si],
				world.invm[si],
				world.invm[si]);
      var iIi = new CANNON.Vec3(world.iinertiax[bi],
				world.iinertiay[bi],
				world.iinertiaz[bi]); // @todo rotate into world frame
      var iIj = new CANNON.Vec3(world.iinertiax[si],
				world.iinertiay[si],
				world.iinertiaz[si]);
      var vi = new CANNON.Vec3(vx[bi],vy[bi],vz[bi]);
      var vj = new CANNON.Vec3(vx[si],vy[si],vz[si]);
      var wi = new CANNON.Vec3(wx[bi],wy[bi],wz[bi]);
      var wj = new CANNON.Vec3(wx[si],wy[si],wz[si]);

      var fi = new CANNON.Vec3(fx[bi],fy[bi],fz[bi]);
      var fj = new CANNON.Vec3(fx[si],fy[si],fz[si]);

      var taui = new CANNON.Vec3(taux[bi],tauy[bi],tauz[bi]);
      var tauj = new CANNON.Vec3(taux[si],tauy[si],tauz[si]);

      // Identify collision type
      if(penetrating_sides.length==1){
	// "Flat" collision against one side, normal is the side normal
	var axis = penetrating_sides[0];
	var h = sides[axis];
	var ni = h.copy();
	ni.normalize();
	var r = xj.vsub(xi.vadd(h)); // center of box side to center of sphere
	var t1 = sides[(axis+1)%3];
	var t2 = sides[(axis+2)%3];
	t1.normalize();
	t2.normalize();
	var ri = h.vsub(t1.mult(r.dot(t1))).vsub(t2.mult(r.dot(t2)));
	var rj = ni.copy();
	rj.normalize();
	rj.mult(-R,rj);
	this.solver
	  .addNonPenetrationConstraint(bi,si,xi,xj,ni,ri,rj,iMi,iMj,iIi,iIj,vi,vj,wi,wj,fi,fj,taui,tauj);
      } else if(penetrating_sides.length==2){
	// Contact with edge
	// normal is the edge-sphere unit vector, orthogonal to the edge
	var axis1 = penetrating_sides[0];
	var axis2 = penetrating_sides[1];
	var edgeCenter = sides[axis1].vadd(sides[axis2]);
	var edgeTangent = sides[axis1].cross(sides[axis2]);
	edgeTangent.normalize();
	var r = xj.vsub(edgeCenter.vadd(xi));
	var ri = edgeCenter.vadd(edgeTangent.mult(r.dot(edgeTangent)));
	var rj = xi.vadd(ri).vsub(xj);
	rj.normalize();
	rj.mult(R);
	var ni = rj.copy();
	ni.negate(ni);
	ni.normalize();
	this.solver
	  .addNonPenetrationConstraint(bi,si,xi,xj,ni,ri,rj,iMi,iMj,iIi,iIj,vi,vj,wi,wj,fi,fj,taui,tauj);
      } else if(penetrating_sides.length==3){
	// Corner collision
	var s1 = sides[penetrating_sides[0]];
	var s2 = sides[penetrating_sides[1]];
	var s3 = sides[penetrating_sides[2]];
	var corner = s1.vadd(s2).vadd(s3);
	var ri = corner;
	var ni = corner.vadd(xi).vsub(xj);
	ni.normalize();
	var rj = ni.mult(-R);
	// @todo add contact constraint
      } else {
	// No contact...
      }

      /*
      // Scenario 1: Corner collision
      var corners = world.body[bi]._shape.getCorners();

      // Loop through each corner
      var numcontacts = 0;
      for(var idx=0; idx<corners.length && numcontacts<=1; idx++){ // max 1 corner

	var ri = corners[idx];

	// Rotate corner into the world frame
	quat.vmult(ri,ri);

	var rj = new CANNON.Vec3(x[bi] + ri.x - x[si],
				 y[bi] + ri.y - y[si],
				 z[bi] + ri.z - z[si]);
	
	// Pseudo name: box index = i
	// g = ( xj + rj - xi - ri ) .dot ( ni )
	var qvec = new CANNON.Vec3(xj.x + rj.x - xi.x - ri.x,
				   xj.y + rj.y - xi.y - ri.y,
				   xj.z + rj.z - xi.z - ri.z);
	var q = qvec.dot(n);
	n.mult(q,qvec);
	
	// Action if penetration
	if(q<0.0){

	  var rixn = ri.cross(n);

	  numcontacts++;

	  var v_box = new CANNON.Vec3(vx[bi],vy[bi],vz[bi]);
	  var w_box = new CANNON.Vec3(wx[bi],wy[bi],wz[bi]);
	  var v_sphere = new CANNON.Vec3(vx[si],vy[si],vz[si]);
	  var w_sphere = new CANNON.Vec3(wx[si],wy[si],wz[si]);
	  var u = v_sphere.vadd(w_sphere.cross(rj)).vsub(v_box.vadd(w_box.cross(ri)));

	  var iMi = world.invm[bi];
	  var iMj = world.invm[si];

	  var iIbx = 1.0/worldInertia.x,
  	      iIby = 1.0/worldInertia.y,
	      iIbz = 1.0/worldInertia.z;
	  cid[k] = this.solver
	    .addConstraint( // Non-penetration constraint jacobian
			   [-n.x,-n.y,-n.z,
			    -rixn.x,-rixn.y,-rixn.z,
			    0,0,0,
			    0,0,0],
			   
			   // Inverse mass matrix
			   [iMi,iMi,iMi,
			    iIbx,iIby,iIbz,
			    iMj,iMj,iMj,
			    Is,Is,Is], // Symmetric for sphere
			   
			   // q - constraint violation
			   [-qvec.x,-qvec.y,-qvec.z,
			    0,0,0,
			    qvec.x,qvec.y,qvec.z,
			    0,0,0],
			   
			   // qdot - motion along penetration normal
			   [v_box.x, v_box.y, v_box.z,
			    w_box.x, w_box.y, w_box.z,
			    0,0,0,
			    0,0,0],
			   
			   // External force - forces & torques
			   [fx[bi],fy[bi],fz[bi],
			    taux[bi],tauy[bi],tauz[bi],
			    fx[pi],fy[pi],fz[pi],
			    taux[pi],tauy[pi],tauz[pi]],

			   0,
			   'inf',
			   bi,
			   pi);
	}
      }

      // Still no contacts? Check scenario 2 - the 6 box sides
      if(numcontacts==0){
	// Idea: get the 6 side normals

	// @todo
      }

      // Still no contacts? Check scenario 3 - the 12 box edges
      if(numcontacts==0){
	// @todo
      }
      */
    }
  }

  if(this.solver.n){
    this.solver.solve();
    //world.togglepause();

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

