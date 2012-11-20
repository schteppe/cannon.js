/*global CANNON:true */

/**
 * @class CANNON.World
 * @brief The physics world
 */
CANNON.World = function(){

    CANNON.EventTarget.apply(this);

    /// Makes bodies go to sleep when they've been inactive
    this.allowSleep = false;

    /**
     * @property bool enableImpulses
     * @brief Whether to enable impulses or not. This is a quite unstable feature for now.
     * @memberof CANNON.World
     */
    this.enableImpulses = false;

    /**
     * @property int quatNormalizeSkip
     * @brief How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.
     * @memberof CANNON.World
     */
    this.quatNormalizeSkip = 2;

    /**
     * @property bool quatNormalizeFast
     * @brief Whether to use fast quaternion normalization or normal (slower, but more accurate) normalization.
     * @memberof CANNON.World
     * @see CANNON.Quaternion.normalizeFast
     * @see CANNON.Quaternion.normalize
     */
    this.quatNormalizeFast = true;

    /**
     * @property float time
     * @brief The wall-clock time since simulation start
     * @memberof CANNON.World
     */
    this.time = 0.0;

    /**
     * @property int stepnumber
     * @brief Number of timesteps taken since start
     * @memberof CANNON.World
     */
    this.stepnumber = 0;

    /// Default and last timestep sizes
    this.default_dt = 1/60;
    this.last_dt = this.default_dt;

    this.nextId = 0;
    /**
     * @property CANNON.Vec3 gravity
     * @memberof CANNON.World
     */
    this.gravity = new CANNON.Vec3();
    this.broadphase = null;

    /**
     * @property Array bodies
     * @memberof CANNON.World
     */
    this.bodies = [];

    var th = this;

    /**
     * @property CANNON.Solver solver
     * @memberof CANNON.World
     */
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

    this.doProfiling = false;

    // Profiling data in milliseconds
    this.profile = {
        broadphase:0,
        integrate:0,
        nearphase:0,
        solve:0,
        makeContactConstraints:0,
    };
};

/**
 * @method getContactMaterial
 * @memberof CANNON.World
 * @brief Get the contact material between materials m1 and m2
 * @param CANNON.Material m1
 * @param CANNON.Material m2
 * @return CANNON.Contactmaterial The contact material if it was found.
 */
CANNON.World.prototype.getContactMaterial = function(m1,m2){
    if((m1 instanceof CANNON.Material) &&  (m2 instanceof CANNON.Material)){

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
 * @method _addImpulse
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
CANNON.World.prototype.addCollisionImpulse = function(c,e,mu){
    var ri = c.ri,
        rj = c.rj,
        ni = c.ni,
        bi = c.bi
        bj = c.bj;
    var vi = bi.velocity,
        vj = bj.velocity,
        ui = vj.vsub(vi);
    var ri_star = ri.crossmat();
    var rj_star = rj.crossmat();

    // Inverse inertia matrices
    var ii = bi.inertia && bi.inertia.x>0 ? 1.0/bi.inertia.x : 0.0;
    var Iinv_i = new CANNON.Mat3([ii,0,0,
                                  0,ii,0,
                                  0,0,ii]);
    ii = bj.inertia && bj.inertia.x>0 ? 1.0/bj.inertia.x : 0.0;
    var Iinv_j = new CANNON.Mat3([ii,0,0,
                                  0,ii,0,
                                  0,0,ii]);

    // Collision matrix:
    // K = 1/mi + 1/mj - ri_star*I_inv_i*ri_star - rj_star*I_inv_j*rj_star;
    var im = bi.invMass + bj.invMass;
    var K = new CANNON.Mat3([im,0,0,
                             0,im,0,
                             0,0,im]);
    var rIr_i = ri_star.mmult(Iinv_i.mmult(ri_star));
    var rIr_j = rj_star.mmult(Iinv_j.mmult(rj_star));

    // @todo add back when this works
    for(var el = 0; el<9; el++)
        K.elements[el] -= (rIr_i.elements[el] + rIr_j.elements[el]);

    // First assume stick friction
    // Final velocity if stick:
    var v_f = ni.mult(-e * ui.dot(ni));

    var J =  K.solve(v_f.vsub(ui));

    // Check if slide mode (J_t > J_n) - outside friction cone
    if(mu>0){
        var J_n = ni.mult(J.dot(ni));
        var J_t = J.vsub(J_n);
        if(J_t.norm2() > J_n.mult(mu).norm2()){
            // Calculate impulse j = -(1+e)u_n / nK(n-mu*t)
            var v_tang = ui.vsub(ni.mult(ui.dot(ni)));
            var tangent = v_tang.mult(1.0/(v_tang.norm() + 0.0001));
            var impulse = -(1+e)*(ui.dot(ni))/(ni.dot(K.vmult((ni.vsub(tangent.mult(mu))))));
            J = ni.mult(impulse).vsub(tangent.mult(mu * impulse));
        }
    }

    // Add to velocities
    var imi = bi.invMass;
    var imj = bj.invMass;

    if(imi){
        vi.x =  vi.x - J.x * imi;
        vi.y =  vi.y - J.y * imi;
        vi.z =  vi.z - J.z * imi;
    }
    if(imj) {
        vj.x =  vj.x + J.x * imj;
        vj.y =  vj.y + J.y * imj;
        vj.z =  vj.z + J.z * imj;
    }

    if(bi.inertia || bj.inertia){
        // Add rotational impulses
        var wi = bi.angularVelocity,
            wj = bj.angularVelocity;
        if(bi.inertia){
            var cr = ri.cross(J);
            var wadd = cr.mult(bi.inertia.x ? 1.0/bi.inertia.x : 0.0);
            wi.vsub(wadd,wi);
        }
        if(bj.inertia){
            cr = rj.cross(J);
            wadd = cr.mult(bj.inertia.x ? 1.0/bj.inertia.x : 0.0); // @todo fix to suit asymmetric inertia
            wj.vadd(wadd,wj);
        }
    }
};

/**
 * @method numObjects
 * @memberof CANNON.World
 * @brief Get number of objects in the world.
 * @return int
 */
CANNON.World.prototype.numObjects = function(){
  return this.bodies.length;
};

/**
 * @method clearCollisionState
 * @memberof CANNON.World
 * @brief Clear the contact state for a body.
 * @param CANNON.Body body
 */
CANNON.World.prototype.clearCollisionState = function(body){
    var n = this.numObjects();
    var i = body.id;
    for(var idx=0; idx<n; idx++){
        var j = idx;
        if(i>j) cm[j+i*n] = 0;
        else    cm[i+j*n] = 0;
    }
};



// Keep track of contacts for current and previous timestep
// 0: No contact between i and j
// 1: Contact
CANNON.World.prototype.collisionMatrixGet = function(i,j,current){
    var N = this.bodies.length;
    if(typeof(current)=="undefined") current = true;
    // i == column
    // j == row
    if((current && i<j) || // Current uses upper part of the matrix
       (!current && i>j)){ // Previous uses lower part of the matrix
        var temp = j;
        j = i;
        i = temp;
    }
    return this.collision_matrix[i+j*N];
}

CANNON.World.prototype.collisionMatrixSet = function(i,j,value,current){
    var N = this.bodies.length;
    if(typeof(current)==="undefined") current = true;
    if( (current && i<j) || // Current uses upper part of the matrix
        (!current && i>j)){ // Previous uses lower part of the matrix
        var temp = j;
        j = i;
        i = temp;
    }
    this.collision_matrix[i+j*N] = value;
}

// transfer old contact state data to T-1
CANNON.World.prototype.collisionMatrixTick = function(){
    var N = this.bodies.length
    for(var i=0; i<N; i++){
        for(var j=0; j<i; j++){
            var currentState = this.collisionMatrixGet(i,j,true);
            this.collisionMatrixSet(i,j,currentState,false);
            this.collisionMatrixSet(i,j,0,true);
        }
    }
}


/**
 * @method add
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
 * @method addConstraint
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
 * @method removeConstraint
 * @memberof CANNON.World
 * @brief Removes a constraint
 * @param CANNON.Constraint c
 */
CANNON.World.prototype.removeConstraint = function(c){
    var idx = this.constraints.indexOf(c);
    if(idx!=-1)
        this.constraints.splice(idx,1);
};

/**
 * @method id
 * @memberof CANNON.World
 * @brief Generate a new unique integer identifyer
 * @return int
 */
CANNON.World.prototype.id = function(){
  return this.nextId++;
};

/**
 * @method remove
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
 * @method addMaterial
 * @memberof CANNON.World
 * @brief Adds a material to the World. A material can only be added once, it's added more times then nothing will happen.
 * @param CANNON.Material m
 */
CANNON.World.prototype.addMaterial = function(m){
    if(m.id==-1){
        this.materials.push(m);
        m.id = this.materials.length-1;

        // Enlarge matrix
        var newcm = new Int16Array((this.materials.length) * (this.materials.length));
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
 * @method addContactMaterial
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

CANNON.World.prototype._now = function(){
    if(window.performance.webkitNow)
        return window.performance.webkitNow();
    else
        return Date.now();
}

/**
 * @method step
 * @memberof CANNON.World
 * @brief Step the simulation
 * @param float dt
 */
CANNON.World.prototype.step = function(dt){
    var world = this,
        that = this,
        N = this.numObjects(),
        bodies = this.bodies,
        solver = this.solver,
        gravity = this.gravity,
        doProfiling = this.doProfiling,
        profile = this.profile,
        DYNAMIC = CANNON.Body.DYNAMIC,
        now = this._now,
        profilingStart,
        cm = this.collision_matrix;

    if(doProfiling) profilingStart = now();

    if(dt==undefined){
        if(this.last_dt) dt = this.last_dt;
        else             dt = this.default_dt;
    }

    // Add gravity to all objects
    var gx = gravity.x,
        gy = gravity.y,
        gz = gravity.z;
    for(var i=0; i<N; i++){
        var bi = bodies[i];
        if(bi.motionstate & DYNAMIC){ // Only for dynamic bodies
            var f = bi.force, m = bi.mass;
            f.x += m*gx;
            f.y += m*gy;
            f.z += m*gz;
        }
    }


    // 1. Collision detection
    if(doProfiling) profilingStart = now();
    var pairs = this.broadphase.collisionPairs(this);
    var p1 = pairs[0];
    var p2 = pairs[1];
    if(doProfiling) profile.broadphase = now() - profilingStart;

    this.collisionMatrixTick();

    // Reset contact solver
    solver.reset(N);

    // Generate contacts
    if(doProfiling) profilingStart = now();
    var oldcontacts = this.contacts;
    this.contacts = [];
    this.contactgen.getContacts(p1,p2,
                                this,
                                this.contacts,
                                oldcontacts // To be reused
                                );
    if(doProfiling) profile.nearphase = now() - profilingStart;

    // Loop over all collisions
    if(doProfiling) profilingStart = now();
    var temp = this.temp;
    var contacts = this.contacts;
    var ncontacts = contacts.length;
    for(var k=0; k<ncontacts; k++){

        // Current contact
        var c = contacts[k];


        // Get current collision indeces
        var bi=c.bi, bj=c.bj;

        // Resolve indeces
        var i = bodies.indexOf(bi), j = bodies.indexOf(bj);
        
        // Check last step stats
        var lastCollisionState = this.collisionMatrixGet(i,j,false);

        // Get collision properties
        var mu = 0.3, e = 0.2;
        var cm = this.getContactMaterial(bi.material,bj.material);
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
            this.collisionMatrixSet(i,j,1,true);

            if(this.collisionMatrixGet(i,j,true)!=this.collisionMatrixGet(i,j,false)){
                // First contact!
                bi.dispatchEvent({type:"collide", "with":bj});
                bj.dispatchEvent({type:"collide", "with":bi});
                bi.wakeUp();
                bj.wakeUp();
                if(this.enableImpulses)
                    this.addCollisionImpulse(c,e,mu);
            }

            var vi = bi.velocity;
            var wi = bi.angularVelocity;
            var vj = bj.velocity;
            var wj = bj.angularVelocity;

            var n = c.ni;
            var tangents = [temp.t1, temp.t2];
            n.tangents(tangents[0],tangents[1]);

            var v_contact_i;
            if(wi) v_contact_i = vi.vadd(wi.cross(c.ri));
            else   v_contact_i = vi.copy();

            var v_contact_j;
            if(wj) v_contact_j = vj.vadd(wj.cross(c.rj));
            else   v_contact_j = vj.copy();

            var u_rel = v_contact_j.vsub(v_contact_i)
            var w_rel;

            if(wj && wi) w_rel = wj.cross(c.rj).vsub(wi.cross(c.ri));
            else if(wi)  w_rel = wi.cross(c.ri).negate();
            else if(wj)  w_rel = wj.cross(c.rj);

            var u = (vj.vsub(vi)); // Contact velo
            var uw;
            if(wj && wi) uw = (c.rj.cross(wj)).vsub(c.ri.cross(wi));
            else if(wi)  uw = c.ri.cross(wi).negate();
            else if(wj)  uw = (c.rj.cross(wj));
            u.vsub(uw,u);

            // Get mass properties
            var iMi = bi.invMass;
            var iMj = bj.invMass;
            var iIxi = bi.invInertia ? bi.invInertia.x : 0.0;
            var iIyi = bi.invInertia ? bi.invInertia.y : 0.0;
            var iIzi = bi.invInertia ? bi.invInertia.z : 0.0;
            var iIxj = bj.invInertia ? bj.invInertia.x : 0.0;
            var iIyj = bj.invInertia ? bj.invInertia.y : 0.0;
            var iIzj = bj.invInertia ? bj.invInertia.z : 0.0;

            // Add contact constraint
            var rixn = temp.rixn;
            var rjxn = temp.rjxn;
            c.ri.cross(n,rixn);
            c.rj.cross(n,rjxn);

            var un_rel = n.mult(u_rel.dot(n)*0.5);
            var u_rixn_rel = rixn.unit().mult(w_rel.dot(rixn.unit()));
            var u_rjxn_rel = rjxn.unit().mult(-w_rel.dot(rjxn.unit()));

            var gn = c.ni.mult(g);

            // Rotational forces
            var tauxi, tauyi, tauzi;
            if(bi.tau){
                tauxi = bi.tau.x;
                tauyi = bi.tau.y;
                tauzi = bi.tau.z;
            } else {
                tauxi = 0;
                tauyi = 0;
                tauzi = 0;
            }
            var tauxj, tauyj, tauzj;
            if(bj.tau){
                tauxj = bj.tau.x;
                tauyj = bj.tau.y;
                tauzj = bj.tau.z;
            } else {
                tauxj = 0;
                tauyj = 0;
                tauzj = 0;
            }

            solver
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
                        tauxi,tauyi,tauzi,
                        -bj.force.x,-bj.force.y,-bj.force.z,
                        -tauxj,-tauyi,-tauzi],
                       0,
                       'inf',
                       i, // These are id's, not indeces...
                       j);

            // Friction constraints
            if(mu>0.0){
                var g = gravity.norm();
                for(var ti=0; ti<tangents.length; ti++){
                    var t = tangents[ti];
                    var rixt = c.ri.cross(t);
                    var rjxt = c.rj.cross(t);

                    var ut_rel = t.mult(u_rel.dot(t));
                    var u_rixt_rel = rixt.unit().mult(u_rel.dot(rixt.unit()));
                    var u_rjxt_rel = rjxt.unit().mult(-u_rel.dot(rjxt.unit()));
                    solver
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
                            tauxi,tauyi,tauzi,
                            bj.force.x,bj.force.y,bj.force.z,
                            tauxj,tauyj,tauzj],
                             
                           -mu*100*(bi.mass+bj.mass),
                           mu*100*(bi.mass+bj.mass),

                           i, // id, not index
                           j);
                }
            }
        }
    }
    if(doProfiling) profile.makeContactConstraints = now() - profilingStart;

    // Add user-defined constraints
    var constraints = this.constraints;
    var nconstraints = constraints.length;
    for(var i=0; i<nconstraints; i++){
        // Preliminary - ugly but works
        var bj=-1, bi=-1;
        for(var j=0; j<N; j++)
            if(bodies[j].id === constraints[i].body_i.id)
                bi = j;
            else if(bodies[j].id === constraints[i].body_j.id)
                bj = j;
            solver.addConstraint2(constraints[i],bi,bj);
    }

    var bi;

    if(doProfiling) profilingStart = now();
    if(solver.n){

        solver.h = dt;
        solver.solve();
        var vxlambda = solver.vxlambda,
        vylambda = solver.vylambda,
        vzlambda = solver.vzlambda;
        var wxlambda = solver.wxlambda,
        wylambda = solver.wylambda,
        wzlambda = solver.wzlambda;

        // Apply constraint velocities
        for(var i=0; i<N; i++){
            bi = bodies[i];
            if(bi.motionstate & DYNAMIC){ // Only for dynamic bodies
                var b = bodies[i];
                var velo = b.velocity,
                avelo = b.angularVelocity;
                velo.x += vxlambda[i],
                velo.y += vylambda[i],
                velo.z += vzlambda[i];
                if(b.angularVelocity){
                    avelo.x += wxlambda[i];
                    avelo.y += wylambda[i];
                    avelo.z += wzlambda[i];
                }
            }
        }
    }
    if(doProfiling) profile.solve = now() - profilingStart;

    // Apply damping
    for(var i=0; i<N; i++){
        bi = bodies[i];
        if(bi.motionstate & DYNAMIC){ // Only for dynamic bodies
            var ld = 1.0 - bi.linearDamping,
            ad = 1.0 - bi.angularDamping,
            v = bi.velocity,
            av = bi.angularVelocity;
            v.mult(ld,v);
            if(av)
                av.mult(ad,av);
        }
    }

    that.dispatchEvent({type:"preStep"});

    // Invoke pre-step callbacks
    for(var i=0; i<N; i++){
        var bi = bodies[i];
        bi.preStep && bi.preStep.call(bi);
    }

    // Leap frog
    // vnew = v + h*f/m
    // xnew = x + h*vnew
    if(doProfiling) profilingStart = now();
    var q = temp.step_q; 
    var w = temp.step_w;
    var wq = temp.step_wq;
    var stepnumber = world.stepnumber;
    var DYNAMIC_OR_KINEMATIC = CANNON.Body.DYNAMIC | CANNON.Body.KINEMATIC;
    var quatNormalize = stepnumber % (this.quatNormalizeSkip+1) === 0;
    var quatNormalizeFast = this.quatNormalizeFast;
    var half_dt = dt * 0.5;
    for(var i=0; i<N; i++){
        var b = bodies[i],
            force = b.force,
            tau = b.tau;
        if((b.motionstate & DYNAMIC_OR_KINEMATIC)){ // Only for dynamic
            var velo = b.velocity,
                angularVelo = b.angularVelocity,
                pos = b.position,
                quat = b.quaternion,
                invMass = b.invMass,
                invInertia = b.invInertia;
            velo.x += force.x * invMass * dt;
            velo.y += force.y * invMass * dt;
            velo.z += force.z * invMass * dt;
          
            if(b.angularVelocity){
                angularVelo.x += tau.x * invInertia.x * dt;
                angularVelo.y += tau.y * invInertia.y * dt;
                angularVelo.z += tau.z * invInertia.z * dt;
            }
          
            // Use new velocity  - leap frog
            if(!b.isSleeping()){
                pos.x += velo.x * dt;
                pos.y += velo.y * dt;
                pos.z += velo.z * dt;

                if(b.angularVelocity){
                    w.set(  angularVelo.x, angularVelo.y, angularVelo.z, 0);
                    w.mult(quat,wq);
                    quat.x += half_dt * wq.x;
                    quat.y += half_dt * wq.y;
                    quat.z += half_dt * wq.z;
                    quat.w += half_dt * wq.w;
                    if(quatNormalize){
                        if(quatNormalizeFast)
                            quat.normalizeFast();
                        else
                            quat.normalize();
                    }
                }
            }
        }
        b.force.set(0,0,0);
        if(b.tau) b.tau.set(0,0,0);
    }
    if(doProfiling) profile.integrate = now() - profilingStart;

    // Update world time
    world.time += dt;
    world.stepnumber += 1;

    that.dispatchEvent({type:"postStep"});

    // Invoke post-step callbacks
    for(var i=0; i<N; i++){
        var bi = bodies[i];
        var postStep = bi.postStep;
        postStep && postStep.call(bi);
    }

    // Sleeping update
    if(world.allowSleep){
        for(var i=0; i<N; i++){
           bodies[i].sleepTick();
        }
    }
};
