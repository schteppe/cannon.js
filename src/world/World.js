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
    this.solver = new CANNON.GSSolver();

    // User defined constraints
    this.constraints = [];

    // Contact generator
    this.contactgen = new CANNON.ContactGenerator();

    // Collision matrix, size N*N
    this.collision_matrix = [];

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
        solve:0,
        makeContactConstraints:0,
        broadphase:0,
        integrate:0,
        nearphase:0,
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
    
    // Increase size of collision matrix to (n+1)*(n+1)=n*n+2*n+1 elements, it was n*n last.
    for(var i=0; i<2*n+1; i++)
        this.collision_matrix.push(0);
    //this.collision_matrix = new Int16Array((n+1)*(n+1));
};

/**
 * @method addConstraint
 * @memberof CANNON.World
 * @brief Add a constraint to the simulation.
 * @param CANNON.Constraint c
 */
CANNON.World.prototype.addConstraint = function(c){
    this.constraints.push(c);
    c.id = this.id();
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


    // Reduce size of collision matrix to (n-1)*(n-1)=n*n-2*n+1 elements, it was n*n last.
    for(var i=0; i<2*n-1; i++)
        this.collision_matrix.pop();

    // Reset collision matrix
    //this.collision_matrix = new Int16Array((n-1)*(n-1));
};

/**
 * @method addMaterial
 * @memberof CANNON.World
 * @brief Adds a material to the World. A material can only be added once, it's added more times then nothing will happen.
 * @param CANNON.Material m
 */
CANNON.World.prototype.addMaterial = function(m){
    if(m.id==-1){
        var n = this.materials.length;
        this.materials.push(m);
        m.id = this.materials.length-1;

        if(true){
            // Increase size of collision matrix to (n+1)*(n+1)=n*n+2*n+1 elements, it was n*n last.
            for(var i=0; i<2*n+1; i++)
                this.mats2cmat.push(-1);
            //this.mats2cmat[];
        } else {
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
        cm = this.collision_matrix,
        constraints = this.constraints,
        FrictionEquation = CANNON.FrictionEquation;

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
            c.penetration = g;
            solver.addEquation(c);

            // Add friction constraint equation
            if(mu > 0){

                // Create 2 tangent equations
                var mug = mu*gravity.norm();
                var reducedMass = (bi.invMass + bj.invMass);
                if(reducedMass != 0) reducedMass = 1/reducedMass;
                var c1 = new FrictionEquation(bi,bj,mug*reducedMass);
                var c2 = new FrictionEquation(bi,bj,mug*reducedMass);

                // Copy over the relative vectors
                c.ri.copy(c1.ri);
                c.rj.copy(c1.rj);
                c.ri.copy(c2.ri);
                c.rj.copy(c2.rj);

                // Construct tangents
                c.ni.tangents(c1.t,c2.t);

                // Add equations to solver
                solver.addEquation(c1);
                solver.addEquation(c2);
            }

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
        }
    }
    if(doProfiling) profile.makeContactConstraints = now() - profilingStart;

    var bi;

    if(doProfiling) profilingStart = now();
    
    // Add user-added constraints
    for(var i=0; i<constraints.length; i++){
        var c = constraints[i];
        c.update();
        for(var name in c.equations){
            var eq = c.equations[name];
            solver.addEquation(eq);
        }
    }

    // Solve the constrained system
    solver.solve(dt,world);

    if(doProfiling) profile.solve = now() - profilingStart;

    // Remove all contacts from solver
    solver.removeAllEquations();

    // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
    var pow = Math.pow;
    for(var i=0; i<N; i++){
        bi = bodies[i];
        if(bi.motionstate & DYNAMIC){ // Only for dynamic bodies
            var ld = pow(1.0 - bi.linearDamping,dt);
            var v = bi.velocity;
            v.mult(ld,v);
	    var av = bi.angularVelocity;
            if(av){	
		var ad = pow(1.0 - bi.angularDamping,dt);
                av.mult(ad,av);
	    }
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

    // Update world inertias
    for(var i=0; i<N; i++){
        var b = bodies[i];
        if(b.inertiaWorldAutoUpdate)
            b.quaternion.vmult(b.inertia,b.inertiaWorld);
        if(b.invInertiaWorldAutoUpdate)
            b.quaternion.vmult(b.invInertia,b.invInertiaWorld);
    }

    // Sleeping update
    if(world.allowSleep){
        for(var i=0; i<N; i++){
           bodies[i].sleepTick();
        }
    }
};
