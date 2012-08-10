/*global CANNON:true */

/**
 * @class CANNON.World
 * @brief The physics world
 */
CANNON.World = function(){

    CANNON.EventTarget.apply(this);

  /// Makes bodies go to sleep when they've been inactive
  this.allowSleep = false;

  /// The wall-clock time since simulation start
  this.time = 0.0;

  /// Number of timesteps taken since start
  this.stepnumber = 0;

  /// Default and last timestep sizes
  this.default_dt = 1/60;
  this.last_dt = this.default_dt;

  this.nextId = 0;
  this.gravity = new CANNON.Vec3();
  this.broadphase = null;
  this.bodies = [];

  var th = this;

  /// The constraint solver
  this.solver = new CANNON.Solver();

  // User defined constraints
  this.constraints = [];

  // Contact generator
  this.contactgen = new CANNON.ContactGenerator();

  // Materials
  this.materials = []; // References to all added materials
  this.contactmaterials = []; // All added contact materials
  this.mats2cmat = []; // Hash: (mat1_id, mat2_id) => contactmat_id

  this.temp = {
    gvec:new CANNON.Vec3(),
    vi:new CANNON.Vec3(),
    vj:new CANNON.Vec3(),
    wi:new CANNON.Vec3(),
    wj:new CANNON.Vec3(),
    t1:new CANNON.Vec3(),
    t2:new CANNON.Vec3(),
    rixn:new CANNON.Vec3(),
    rjxn:new CANNON.Vec3(),
    step_q:new CANNON.Quaternion(),
    step_w:new CANNON.Quaternion(),
    step_wq:new CANNON.Quaternion()
  };
};

/**
 * @fn getContactMaterial
 * @memberof CANNON.World
 * @brief Get the contact material between materials m1 and m2
 * @param CANNON.Material m1
 * @param CANNON.Material m2
 * @return CANNON.Contactmaterial The contact material if it was found.
 */
CANNON.World.prototype.getContactMaterial = function(m1,m2){
  if((m1 instanceof CANNON.Material) && 
     (m2 instanceof CANNON.Material)){

    var i = m1.id;
    var j = m2.id;

    if(i<j){
      var temp = i;
      i = j;
      j = temp;
    }
    return this.contactmaterials[this.mats2cmat[i+j*this.materials.length]];
  }
};

/**
 * @private
 * @fn _addImpulse
 * @memberof CANNON.World
 * @brief Add an impulse to the colliding bodies i and j
 * @param int i Body number 1
 * @param int i Body number 2
 * @param CANNON.Vec3 ri Vector from body 1's center of mass to the contact point on its surface
 * @param CANNON.Vec3 ri Vector from body 1's center of mass to the contact point on its surface
 * @param CANNON.Vec3 ui The relative velocity eg. vj+wj*rj - (vi+wj*rj)
 * @param CANNON.Vec3 ni The contact normal pointing out from body i.
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
 * @fn numObjects
 * @memberof CANNON.World
 * @brief Get number of objects in the world.
 * @return int
 */
CANNON.World.prototype.numObjects = function(){
  return this.bodies.length;
};

/**
 * @fn clearCollisionState
 * @memberof CANNON.World
 * @brief Clear the contact state for a body.
 * @param CANNON.Body body
 */
CANNON.World.prototype.clearCollisionState = function(body){
  var n = this.numObjects();
  var i = body.id;
  for(var idx=0; idx<n; idx++){
    var j = idx;
    if(i>j) this.collision_matrix[j+i*n] = 0;
    else    this.collision_matrix[i+j*n] = 0;
  }
};

/**
 * @fn add
 * @memberof CANNON.World
 * @brief Add a rigid body to the simulation.
 * @param CANNON.Body body
 * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
 * @todo Adding an array of bodies should be possible. This would save some loops too
 */
CANNON.World.prototype.add = function(body){
    var n = this.numObjects();
    this.bodies.push(body);
    body.id = this.id();
    body.world = this;
    body.position.copy(body.initPosition);
    body.velocity.copy(body.initVelocity);
    if(body instanceof CANNON.RigidBody){
	body.angularVelocity.copy(body.initAngularVelocity);
	body.quaternion.copy(body.initQuaternion);
    }
    
    // Create collision matrix
    this.collision_matrix = new Int16Array((n+1)*(n+1));
};

/**
 * @fn addConstraint
 * @memberof CANNON.World
 * @brief Add a constraint to the simulation.
 * @param CANNON.Constraint c
 */
CANNON.World.prototype.addConstraint = function(c){
  if(c instanceof CANNON.Constraint){
    this.constraints.push(c);
    c.id = this.id();
  }
};

/**
 * @fn id
 * @memberof CANNON.World
 * @brief Generate a new unique integer identifyer
 * @return int
 */
CANNON.World.prototype.id = function(){
  return this.nextId++;
};

/**
 * @fn remove
 * @memberof CANNON.World
 * @brief Remove a rigid body from the simulation.
 * @param CANNON.Body body
 */
CANNON.World.prototype.remove = function(body){
    body.world = null;
    var n = this.numObjects();
    var bodies = this.bodies;
    for(var i in bodies)
      if(bodies[i].id == body.id)
	bodies.splice(i,1);

    // Reset collision matrix
    this.collision_matrix = new Int16Array((n-1)*(n-1));
};

/**
 * @fn addMaterial
 * @memberof CANNON.World
 * @brief Adds a material to the World. A material can only be added once, it's added more times then nothing will happen.
 * @param CANNON.Material m
 */
CANNON.World.prototype.addMaterial = function(m){
  if(m.id==-1){
    this.materials.push(m);
    m.id = this.materials.length-1;

    // Enlarge matrix
    var newcm = new Int16Array((this.materials.length)
			       * (this.materials.length));
    for(var i=0; i<newcm.length; i++)
      newcm[i] = -1;

    // Copy over old values
    for(var i=0; i<this.materials.length-1; i++)
      for(var j=0; j<this.materials.length-1; j++)
	newcm[i+this.materials.length*j] = this.mats2cmat[i+(this.materials.length-1)*j];
    this.mats2cmat = newcm;
  
  }
};

/**
 * @fn addContactMaterial
 * @memberof CANNON.World
 * @brief Adds a contact material to the World
 * @param CANNON.ContactMaterial cmat
 */
CANNON.World.prototype.addContactMaterial = function(cmat) {

  // Add materials if they aren't already added
  this.addMaterial(cmat.materials[0]);
  this.addMaterial(cmat.materials[1]);

  // Save (material1,material2) -> (contact material) reference for easy access later
  // Make sure i>j, ie upper right matrix
  if(cmat.materials[0].id > cmat.materials[1].id){
    i = cmat.materials[0].id;
    j = cmat.materials[1].id;
  } else {
    j = cmat.materials[0].id;
    i = cmat.materials[1].id;
  }
    
  // Add contact material
  this.contactmaterials.push(cmat);
  cmat.id = this.contactmaterials.length-1;

  // Add current contact material to the material table
  this.mats2cmat[i+this.materials.length*j] = cmat.id; // index of the contact material
};

// Get the index given body id. Returns -1 on fail
CANNON.World.prototype._id2index = function(id){
  // ugly but works
  for(var j=0; j<this.bodies.length; j++)
    if(this.bodies[j].id === id)
      return j;
  return -1;
};

/**
 * @fn step
 * @memberof CANNON.World
 * @brief Step the simulation
 * @param float dt
 */
CANNON.World.prototype.step = function(dt){
  var world = this,
  that = this,
  N = this.numObjects(),
  bodies = this.bodies;

  if(dt==undefined){
    if(this.last_dt)
      dt = this.last_dt;
    else
      dt = this.default_dt;
  }

  // Add gravity to all objects
  for(var i=0; i<N; i++){
    var bi = bodies[i];
    if(bi.motionstate & CANNON.Body.DYNAMIC){ // Only for dynamic bodies
      var f = bodies[i].force, m = bodies[i].mass;
      f.x += world.gravity.x * m;
      f.y += world.gravity.y * m;
      f.z += world.gravity.z * m;
    }
  }

  // 1. Collision detection
  var pairs = this.broadphase.collisionPairs(this);
  var p1 = pairs[0];
  var p2 = pairs[1];

  // Get references to things that are accessed often. Will save some lookup time.
  var SPHERE = CANNON.Shape.types.SPHERE;
  var PLANE = CANNON.Shape.types.PLANE;
  var BOX = CANNON.Shape.types.BOX;
  var COMPOUND = CANNON.Shape.types.COMPOUND;

  // Keep track of contacts for current and previous timestep
  // 0: No contact between i and j
  // 1: Contact
  function collisionMatrixGet(i,j,current){
      if(typeof(current)=="undefined") current = true;
      // i == column
      // j == row
      if((current && i<j) || // Current uses upper part of the matrix
	 (!current && i>j)){ // Previous uses lower part of the matrix
	  var temp = j;
	  j = i;
	  i = temp;
      }
      return that.collision_matrix[i+j*N];
  }
    
  function collisionMatrixSet(i,j,value,current){
      if(typeof(current)=="undefined") current = true;
      if((current && i<j) || // Current uses upper part of the matrix
	 (!current && i>j)){ // Previous uses lower part of the matrix
	  var temp = j;
	  j = i;
	  i = temp;
      }
      that.collision_matrix[i+j*N] = parseInt(value);
  }

  // transfer old contact state data to T-1
  function collisionMatrixTick(){
      for(var i=0; i<bodies.length; i++){
	  for(var j=0; j<i; j++){
	      var currentState = collisionMatrixGet(i,j,true);
	      collisionMatrixSet(i,j,currentState,false);
	      collisionMatrixSet(i,j,0,true);
	  }
      }
  }

  collisionMatrixTick();

  // Reset contact solver
  this.solver.reset(N);

  // Generate contacts
  var oldcontacts = this.contacts;
  this.contacts = [];
  this.contactgen.getContacts(p1,p2,
			      this,
			      this.contacts,
			      oldcontacts // To be reused
			      );

  // Loop over all collisions
  var temp = this.temp;
  for(var k=0; k<this.contacts.length; k++){

    // Current contact
    var c = this.contacts[k];

    // Get current collision indeces
    var bi = c.bi,
      bj = c.bj;

    // Resolve indeces
    var i = this._id2index(bi.id),
      j = this._id2index(bj.id);
    
    // Check last step stats
    var lastCollisionState = collisionMatrixGet(i,j,false);

    // Get collision properties
    var mu = 0.3, e = 0.2;
    var cm = this.getContactMaterial(bi.material,
				     bj.material);
    if(cm){
      mu = cm.friction;
      e = cm.restitution;
    }
      
    // g = ( xj + rj - xi - ri ) .dot ( ni )
    var gvec = temp.gvec;
    gvec.set(bj.position.x + c.rj.x - bi.position.x - c.ri.x,
	     bj.position.y + c.rj.y - bi.position.y - c.ri.y,
	     bj.position.z + c.rj.z - bi.position.z - c.ri.z);
    var g = gvec.dot(c.ni); // Gap, negative if penetration
    
    // Action if penetration
    if(g<0.0){
	// Now we know that i and j are in contact. Set collision matrix state
	collisionMatrixSet(i,j,1,true);
	
	if(collisionMatrixGet(i,j,true)!=collisionMatrixGet(i,j,false)){
	    bi.dispatchEvent({type:"collide", "with":bj});
	    bj.dispatchEvent({type:"collide", "with":bi});
	    bi.wakeUp();
	    bj.wakeUp();
	}

      var vi = bi.velocity;
      var wi = bi.angularVelocity;
      var vj = bj.velocity;
      var wj = bj.angularVelocity;

      var n = c.ni;
      var tangents = [temp.t1, temp.t2];
      n.tangents(tangents[0],tangents[1]);

      var v_contact_i = vi.vadd(wi.cross(c.ri));
      var v_contact_j = vj.vadd(wj.cross(c.rj));
      var u_rel = v_contact_j.vsub(v_contact_i);
      var w_rel = wj.cross(c.rj).vsub(wi.cross(c.ri));

      var u = (vj.vsub(vi)); // Contact velo
      var uw = (c.rj.cross(wj)).vsub(c.ri.cross(wi));
      u.vsub(uw,u);

      // Get mass properties
      var iMi = bi.invMass;
      var iMj = bj.invMass;
      var iIxi = bi.invInertia.x;
      var iIyi = bi.invInertia.y;
      var iIzi = bi.invInertia.z;
      var iIxj = bj.invInertia.x;
      var iIyj = bj.invInertia.y;
      var iIzj = bj.invInertia.z;

      // Add contact constraint
      var rixn = temp.rixn;
      var rjxn = temp.rjxn;
      c.ri.cross(n,rixn);
      c.rj.cross(n,rjxn);

      var un_rel = n.mult(u_rel.dot(n)*0.5);
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
			0,0,0,//-u_rixn_rel.x,-u_rixn_rel.y,-u_rixn_rel.z,
			un_rel.x,un_rel.y,un_rel.z,
			0,0,0//u_rjxn_rel.x,u_rjxn_rel.y,u_rjxn_rel.z
			],
			 
		       // External force - forces & torques
		       [bi.force.x,bi.force.y,bi.force.z,
			bi.tau.x,bi.tau.y,bi.tau.z,
			-bj.force.x,-bj.force.y,-bj.force.z,
			-bj.tau.x,-bj.tau.y,-bj.tau.z],
		       0,
		       'inf',
		       i, // These are id's, not indeces...
		       j);

      // Friction constraints
      if(mu>0.0){
	var g = that.gravity.norm();
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
			   [bi.force.x,bi.force.y,bi.force.z,
			    bi.tau.x,bi.tau.y,bi.tau.z,
			    bj.force.x,bj.force.y,bj.force.z,
			    bj.tau.x,bj.tau.y,bj.tau.z],
			     
			   -mu*100*(bi.mass+bj.mass),
			   mu*100*(bi.mass+bj.mass),

			   i, // id, not index
			   j);
	}
      }
    }
  }

  // Add user-defined constraints
  for(var i=0; i<this.constraints.length; i++){
    // Preliminary - ugly but works
    var bj=-1, bi=-1;
    for(var j=0; j<this.bodies.length; j++)
      if(this.bodies[j].id === this.constraints[i].body_i.id)
	bi = j;
      else if(this.bodies[j].id === this.constraints[i].body_j.id)
	bj = j;
    this.solver.addConstraint2(this.constraints[i],bi,bj);
  }

  var bi;
  if(this.solver.n){
   
      this.solver.h = dt;
      this.solver.solve();

      // Apply constraint velocities
      for(var i=0; i<N; i++){
	  bi = bodies[i];
	  if(bi.motionstate & CANNON.Body.DYNAMIC){ // Only for dynamic bodies
	      var b = bodies[i];
	      b.velocity.x += this.solver.vxlambda[i];
	      b.velocity.y += this.solver.vylambda[i];
	      b.velocity.z += this.solver.vzlambda[i];
	      b.angularVelocity.x += this.solver.wxlambda[i];
	      b.angularVelocity.y += this.solver.wylambda[i];
	      b.angularVelocity.z += this.solver.wzlambda[i];
	  }
      }
  }

  // Apply damping
  for(var i in bodies){
    bi = bodies[i];
    if(bi.motionstate & CANNON.Body.DYNAMIC){ // Only for dynamic bodies
      var ld = 1.0 - bi.linearDamping;
      var ad = 1.0 - bi.angularDamping;
      bi.velocity.mult(ld,bi.velocity);
      bi.angularVelocity.mult(ad,bi.angularVelocity);
    }
  }

  that.dispatchEvent({type:"preStep"});

  // Invoke pre-step callbacks
  for(var i in bodies){
    var bi = bodies[i];
    bi.preStep && bi.preStep.call(bi);
  }

  // Leap frog
  // vnew = v + h*f/m
  // xnew = x + h*vnew
  var q = temp.step_q; 
  var w = temp.step_w;
  var wq = temp.step_wq;
  var DYNAMIC_OR_KINEMATIC = CANNON.Body.DYNAMIC | CANNON.Body.KINEMATIC;
  for(var i=0; i<N; i++){
    var b = bodies[i];
    if((b.motionstate & DYNAMIC_OR_KINEMATIC)){ // Only for dynamic
      
      b.velocity.x += b.force.x * b.invMass * dt;
      b.velocity.y += b.force.y * b.invMass * dt;
      b.velocity.z += b.force.z * b.invMass * dt;

      b.angularVelocity.x += b.tau.x * b.invInertia.x * dt;
      b.angularVelocity.y += b.tau.y * b.invInertia.y * dt;
      b.angularVelocity.z += b.tau.z * b.invInertia.z * dt;

      // Use new velocity  - leap frog
      if(!b.isSleeping()){
	  b.position.x += b.velocity.x * dt;
	  b.position.y += b.velocity.y * dt;
	  b.position.z += b.velocity.z * dt;
	  
	  w.set(b.angularVelocity.x,
		b.angularVelocity.y,
		b.angularVelocity.z,
		0);
	  w.mult(b.quaternion,wq);
	  
	  b.quaternion.x += dt * 0.5 * wq.x;
	  b.quaternion.y += dt * 0.5 * wq.y;
	  b.quaternion.z += dt * 0.5 * wq.z;
	  b.quaternion.w += dt * 0.5 * wq.w;
	  if(world.stepnumber % 3 === 0)
              b.quaternion.normalizeFast();
      }
    }
    b.force.set(0,0,0);
    b.tau.set(0,0,0);
  }

  // Update world time
  world.time += dt;
  world.stepnumber += 1;

  that.dispatchEvent({type:"postStep"});

  // Invoke post-step callbacks
  for(var i in bodies){
    var bi = bodies[i];
    bi.postStep && bi.postStep.call(bi);
  }

  // Sleeping update
  if(world.allowSleep){
      for(var i=0; i<N; i++){
	  var bi = bodies[i];
	  bi.sleepTick();
      }
  }
};

