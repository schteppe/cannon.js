namespace CANNON
{
    export class World extends EventTarget
    {
        static worldNormal = new Vec3(0, 0, 1);

        /**
         * Currently / last used timestep. Is set to -1 if not available. This value is updated before each internal step, which means that it is "fresh" inside event callbacks.
         */
        dt: number;

        /**
         * Makes bodies go to sleep when they've been inactive
         */
        allowSleep: boolean;

        /**
         * All the current contacts (instances of ContactEquation) in the world.
         */
        contacts: any[];
        frictionEquations: any[];

        /**
         * How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.. A larger value increases performance. If bodies tend to explode, set to a smaller value (zero to be sure nothing can go wrong).
         */
        quatNormalizeSkip: number;

        /**
         * Set to true to use fast quaternion normalization. It is often enough accurate to use. If bodies tend to explode, set to false.
         */
        quatNormalizeFast: boolean;

        /**
         * The wall-clock time since simulation start
         */
        time: number;

        /**
         * Number of timesteps taken since start
         */
        stepnumber: number;

        /// Default and last timestep sizes
        default_dt: number;

        nextId: number;
        gravity: Vec3;

        /**
         * The broadphase algorithm to use. Default is NaiveBroadphase
         */
        broadphase: Broadphase;

        bodies: any[];

        /**
         * The solver algorithm to use. Default is GSSolver
         */
        solver: Solver;

        constraints: any[];

        narrowphase: Narrowphase;

        collisionMatrix: ArrayCollisionMatrix;

        /**
         * CollisionMatrix from the previous step.
         */
        collisionMatrixPrevious: ArrayCollisionMatrix;

        bodyOverlapKeeper: OverlapKeeper;
        shapeOverlapKeeper: OverlapKeeper;

        /**
         * All added materials
         */
        materials: Material[];

        contactmaterials: any[];

        /**
         * Used to look up a ContactMaterial given two instances of Material.
         */
        contactMaterialTable: TupleDictionary;

        defaultMaterial: Material;

        /**
         * This contact material is used if no suitable contactmaterial is found for a contact.
         */
        defaultContactMaterial: ContactMaterial;

        doProfiling: boolean;

        profile = {
            solve: 0,
            makeContactConstraints: 0,
            broadphase: 0,
            integrate: 0,
            narrowphase: 0,
        };

        /**
         * Time accumulator for interpolation. See http://gafferongames.com/game-physics/fix-your-timestep/
         */
        accumulator: number;

        subsystems: any[];

        /**
         * Dispatched after a body has been added to the world.
         */
        addBodyEvent = {
            type: "addBody",
            body: null
        };

        /**
         * Dispatched after a body has been removed from the world.
         */
        removeBodyEvent = {
            type: "removeBody",
            body: null
        };

        idToBodyMap = {};

        /**
         * The physics world
         * @param options 
         */
        constructor(options: { gravity?: Vec3, allowSleep?: boolean, broadphase?: Broadphase, solver?: Solver, quatNormalizeFast?: boolean, quatNormalizeSkip?: number } = {})
        {
            super();

            this.dt = -1;
            this.allowSleep = !!options.allowSleep;
            this.contacts = [];
            this.frictionEquations = [];
            this.quatNormalizeSkip = options.quatNormalizeSkip !== undefined ? options.quatNormalizeSkip : 0;
            this.quatNormalizeFast = options.quatNormalizeFast !== undefined ? options.quatNormalizeFast : false;
            this.time = 0.0;
            this.stepnumber = 0;
            this.default_dt = 1 / 60;
            this.nextId = 0;
            this.gravity = new Vec3();
            if (options.gravity)
            {
                this.gravity.copy(options.gravity);
            }
            this.broadphase = options.broadphase !== undefined ? options.broadphase : new NaiveBroadphase();
            this.bodies = [];
            this.solver = options.solver !== undefined ? options.solver : new GSSolver();
            this.constraints = [];
            this.narrowphase = new Narrowphase(this);
            this.collisionMatrix = new ArrayCollisionMatrix();
            this.collisionMatrixPrevious = new ArrayCollisionMatrix();

            this.bodyOverlapKeeper = new OverlapKeeper();
            this.shapeOverlapKeeper = new OverlapKeeper();
            this.materials = [];
            this.contactmaterials = [];
            this.contactMaterialTable = new TupleDictionary();

            this.defaultMaterial = new Material("default");
            this.defaultContactMaterial = new ContactMaterial(this.defaultMaterial, this.defaultMaterial, { friction: 0.3, restitution: 0.0 });
            this.doProfiling = false;
            this.profile = {
                solve: 0,
                makeContactConstraints: 0,
                broadphase: 0,
                integrate: 0,
                narrowphase: 0,
            };
            this.accumulator = 0;
            this.subsystems = [];
            this.addBodyEvent = {
                type: "addBody",
                body: null
            };
            this.removeBodyEvent = {
                type: "removeBody",
                body: null
            };

            this.idToBodyMap = {};

            this.broadphase.setWorld(this);
        }

        /**
         * Get the contact material between materials m1 and m2
         * @param m1
         * @param m2
         * @return  The contact material if it was found.
         */
        getContactMaterial(m1: Material, m2: Material)
        {
            return this.contactMaterialTable.get(m1.id, m2.id); //this.contactmaterials[this.mats2cmat[i+j*this.materials.length]];
        }

        /**
         * Get number of objects in the world.
         * @deprecated
         */
        numObjects()
        {
            return this.bodies.length;
        }

        /**
         * Store old collision state info
         */
        collisionMatrixTick()
        {
            var temp = this.collisionMatrixPrevious;
            this.collisionMatrixPrevious = this.collisionMatrix;
            this.collisionMatrix = temp;
            this.collisionMatrix.reset();

            this.bodyOverlapKeeper.tick();
            this.shapeOverlapKeeper.tick();
        }

        /**
         * Add a rigid body to the simulation.
         * @param body
         * 
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
         * @deprecated Use .addBody instead
         */
        add(body: Body)
        {
            if (this.bodies.indexOf(body) !== -1)
            {
                return;
            }
            body.index = this.bodies.length;
            this.bodies.push(body);
            body.world = this;
            body.initPosition.copy(body.position);
            body.initVelocity.copy(body.velocity);
            body.timeLastSleepy = this.time;
            if (body instanceof Body)
            {
                body.initAngularVelocity.copy(body.angularVelocity);
                body.initQuaternion.copy(body.quaternion);
            }
            this.collisionMatrix.setNumObjects(this.bodies.length);
            this.addBodyEvent.body = body;
            this.idToBodyMap[body.id] = body;
            this.dispatchEvent(this.addBodyEvent);
        }

        /**
         * Add a rigid body to the simulation.
         * @method add
         * @param {Body} body
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
         * @deprecated Use .addBody instead
         */
        addBody(body: Body)
        {
            if (this.bodies.indexOf(body) !== -1)
            {
                return;
            }
            body.index = this.bodies.length;
            this.bodies.push(body);
            body.world = this;
            body.initPosition.copy(body.position);
            body.initVelocity.copy(body.velocity);
            body.timeLastSleepy = this.time;
            if (body instanceof Body)
            {
                body.initAngularVelocity.copy(body.angularVelocity);
                body.initQuaternion.copy(body.quaternion);
            }
            this.collisionMatrix.setNumObjects(this.bodies.length);
            this.addBodyEvent.body = body;
            this.idToBodyMap[body.id] = body;
            this.dispatchEvent(this.addBodyEvent);
        }

        /**
         * Add a constraint to the simulation.
         * @param c
         */
        addConstraint(c: Constraint)
        {
            this.constraints.push(c);
        }

        /**
         * Removes a constraint
         * @param c
         */
        removeConstraint(c: Constraint)
        {
            var idx = this.constraints.indexOf(c);
            if (idx !== -1)
            {
                this.constraints.splice(idx, 1);
            }
        }

        /**
         * Raycast test
         * @param from
         * @param to
         * @param result
         * @deprecated Use .raycastAll, .raycastClosest or .raycastAny instead.
         */
        rayTest(from: Vec3, to: Vec3, result: RaycastResult)
        {
            if (result instanceof RaycastResult)
            {
                // Do raycastclosest
                this.raycastClosest(from, to, {
                    skipBackfaces: true
                }, result);
            } else
            {
                // Do raycastAll
                this.raycastAll(from, to, {
                    skipBackfaces: true
                }, result);
            }
        }

        /**
         * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
         * @param from 
         * @param to 
         * @param options 
         * @param callback 
         * @return True if any body was hit.
         */
        raycastAll(from: Vec3, to: Vec3, options: { collisionFilterMask?: number, collisionFilterGroup?: number, skipBackfaces?: boolean, checkCollisionResponse?: boolean, mode?: number, from?: Vec3, to?: Vec3, callback?: Function } = {}, callback: Function)
        {
            options.mode = Ray.ALL;
            options.from = from;
            options.to = to;
            options.callback = callback;
            return tmpRay.intersectWorld(this, options);
        }

        /**
         * Ray cast, and stop at the first result. Note that the order is random - but the method is fast.
         * 
         * @param from 
         * @param to 
         * @param options 
         * @param result 
         * 
         * @return True if any body was hit.
         */
        raycastAny(from: Vec3, to: Vec3, options: { collisionFilterMask?: number, collisionFilterGroup?: number, skipBackfaces?: boolean, checkCollisionResponse?: boolean, mode?: number, from?: Vec3, to?: Vec3, callback?: Function, result?: RaycastResult }, result: RaycastResult)
        {
            options.mode = Ray.ANY;
            options.from = from;
            options.to = to;
            options.result = result;
            return tmpRay.intersectWorld(this, options);
        }

        /**
         * Ray cast, and return information of the closest hit.
         * 
         * @param from 
         * @param to 
         * @param options 
         * @param result 
         * 
         * @return True if any body was hit.
         */
        raycastClosest(from: Vec3, to: Vec3, options: { collisionFilterMask?: number, collisionFilterGroup?: number, skipBackfaces?: boolean, checkCollisionResponse?: boolean, mode?: number, from?: Vec3, to?: Vec3, callback?: Function, result?: RaycastResult }, result: RaycastResult)
        {
            options.mode = Ray.CLOSEST;
            options.from = from;
            options.to = to;
            options.result = result;
            return tmpRay.intersectWorld(this, options);
        }

        /**
         * Remove a rigid body from the simulation.
         * @param body
         * @deprecated Use .removeBody instead
         */
        remove(body: Body)
        {
            body.world = null;
            var n = this.bodies.length - 1,
                bodies = this.bodies,
                idx = bodies.indexOf(body);
            if (idx !== -1)
            {
                bodies.splice(idx, 1); // Todo: should use a garbage free method

                // Recompute index
                for (var i = 0; i !== bodies.length; i++)
                {
                    bodies[i].index = i;
                }

                this.collisionMatrix.setNumObjects(n);
                this.removeBodyEvent.body = body;
                delete this.idToBodyMap[body.id];
                this.dispatchEvent(this.removeBodyEvent);
            }
        }

        /**
         * Remove a rigid body from the simulation.
         * @param body
         */
        removeBody(body: Body)
        {
            body.world = null;
            var n = this.bodies.length - 1,
                bodies = this.bodies,
                idx = bodies.indexOf(body);
            if (idx !== -1)
            {
                bodies.splice(idx, 1); // Todo: should use a garbage free method

                // Recompute index
                for (var i = 0; i !== bodies.length; i++)
                {
                    bodies[i].index = i;
                }

                this.collisionMatrix.setNumObjects(n);
                this.removeBodyEvent.body = body;
                delete this.idToBodyMap[body.id];
                this.dispatchEvent(this.removeBodyEvent);
            }
        }


        getBodyById(id: number)
        {
            return this.idToBodyMap[id];
        }

        // TODO Make a faster map
        getShapeById(id: number)
        {
            var bodies = this.bodies;
            for (var i = 0, bl = bodies.length; i < bl; i++)
            {
                var shapes = bodies[i].shapes;
                for (var j = 0, sl = shapes.length; j < sl; j++)
                {
                    var shape = shapes[j];
                    if (shape.id === id)
                    {
                        return shape;
                    }
                }
            }
        }

        /**
         * Adds a material to the World.
         * @param m
         * @todo Necessary?
         */
        addMaterial(m: Material)
        {
            this.materials.push(m);
        }

        /**
         * Adds a contact material to the World
         * @param cmat
         */
        addContactMaterial(cmat: ContactMaterial)
        {

            // Add contact material
            this.contactmaterials.push(cmat);

            // Add current contact material to the material table
            this.contactMaterialTable.set(cmat.materials[0].id, cmat.materials[1].id, cmat);
        }

        /**
         * Step the physics world forward in time.
         *
         * There are two modes. The simple mode is fixed timestepping without interpolation. In this case you only use the first argument. The second case uses interpolation. In that you also provide the time since the function was last used, as well as the maximum fixed timesteps to take.
         *
         * @param dt                       The fixed time step size to use.
         * @param timeSinceLastCalled    The time elapsed since the function was last called.
         * @param maxSubSteps         Maximum number of fixed steps to take per function call.
         *
         * @example
         *     // fixed timestepping without interpolation
         *     world.step(1/60);
         *
         * @see http://bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World
         */
        step(dt: number, timeSinceLastCalled = 0, maxSubSteps = 10)
        {
            if (timeSinceLastCalled === 0)
            { // Fixed, simple stepping

                this.internalStep(dt);

                // Increment time
                this.time += dt;

            } else
            {

                this.accumulator += timeSinceLastCalled;
                var substeps = 0;
                while (this.accumulator >= dt && substeps < maxSubSteps)
                {
                    // Do fixed steps to catch up
                    this.internalStep(dt);
                    this.accumulator -= dt;
                    substeps++;
                }

                var t = (this.accumulator % dt) / dt;
                for (var j = 0; j !== this.bodies.length; j++)
                {
                    var b = this.bodies[j];
                    b.previousPosition.lerp(b.position, t, b.interpolatedPosition);
                    b.previousQuaternion.slerp(b.quaternion, t, b.interpolatedQuaternion);
                    b.previousQuaternion.normalize();
                }
                this.time += timeSinceLastCalled;
            }
        }

        internalStep(dt: number)
        {
            this.dt = dt;

            var world = this,
                that = this,
                contacts = this.contacts,
                p1 = World_step_p1,
                p2 = World_step_p2,
                N = this.numObjects(),
                bodies = this.bodies,
                solver = this.solver,
                gravity = this.gravity,
                doProfiling = this.doProfiling,
                profile = this.profile,
                DYNAMIC = Body.DYNAMIC,
                profilingStart,
                constraints = this.constraints,
                frictionEquationPool = World_step_frictionEquationPool,
                gnorm = gravity.norm(),
                gx = gravity.x,
                gy = gravity.y,
                gz = gravity.z,
                i = 0;

            if (doProfiling)
            {
                profilingStart = performance.now();
            }

            // Add gravity to all objects
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];
                if (bi.type === DYNAMIC)
                { // Only for dynamic bodies
                    var f = bi.force, m = bi.mass;
                    f.x += m * gx;
                    f.y += m * gy;
                    f.z += m * gz;
                }
            }

            // Update subsystems
            for (var i = 0, Nsubsystems = this.subsystems.length; i !== Nsubsystems; i++)
            {
                this.subsystems[i].update();
            }

            // Collision detection
            if (doProfiling) { profilingStart = performance.now(); }
            p1.length = 0; // Clean up pair arrays from last step
            p2.length = 0;
            this.broadphase.collisionPairs(this, p1, p2);
            if (doProfiling) { profile.broadphase = performance.now() - profilingStart; }

            // Remove constrained pairs with collideConnected == false
            var Nconstraints = constraints.length;
            for (i = 0; i !== Nconstraints; i++)
            {
                var c = constraints[i];
                if (!c.collideConnected)
                {
                    for (var j = p1.length - 1; j >= 0; j -= 1)
                    {
                        if ((c.bodyA === p1[j] && c.bodyB === p2[j]) ||
                            (c.bodyB === p1[j] && c.bodyA === p2[j]))
                        {
                            p1.splice(j, 1);
                            p2.splice(j, 1);
                        }
                    }
                }
            }

            this.collisionMatrixTick();

            // Generate contacts
            if (doProfiling) { profilingStart = performance.now(); }
            var oldcontacts = World_step_oldContacts;
            var NoldContacts = contacts.length;

            for (i = 0; i !== NoldContacts; i++)
            {
                oldcontacts.push(contacts[i]);
            }
            contacts.length = 0;

            // Transfer FrictionEquation from current list to the pool for reuse
            var NoldFrictionEquations = this.frictionEquations.length;
            for (i = 0; i !== NoldFrictionEquations; i++)
            {
                frictionEquationPool.push(this.frictionEquations[i]);
            }
            this.frictionEquations.length = 0;

            this.narrowphase.getContacts(
                p1,
                p2,
                this,
                contacts,
                oldcontacts, // To be reused
                this.frictionEquations,
                frictionEquationPool
            );

            if (doProfiling)
            {
                profile.narrowphase = performance.now() - profilingStart;
            }

            // Loop over all collisions
            if (doProfiling)
            {
                profilingStart = performance.now();
            }

            // Add all friction eqs
            for (var i = 0; i < this.frictionEquations.length; i++)
            {
                solver.addEquation(this.frictionEquations[i]);
            }

            var ncontacts = contacts.length;
            for (var k = 0; k !== ncontacts; k++)
            {

                // Current contact
                var c = contacts[k];

                // Get current collision indeces
                var bi = c.bi,
                    bj = c.bj,
                    si = c.si,
                    sj = c.sj;

                // Get collision properties
                var cm;
                if (bi.material && bj.material)
                {
                    cm = this.getContactMaterial(bi.material, bj.material) || this.defaultContactMaterial;
                } else
                {
                    cm = this.defaultContactMaterial;
                }

                // c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;

                var mu = cm.friction;
                // c.restitution = cm.restitution;

                // If friction or restitution were specified in the material, use them
                if (bi.material && bj.material)
                {
                    if (bi.material.friction >= 0 && bj.material.friction >= 0)
                    {
                        mu = bi.material.friction * bj.material.friction;
                    }

                    if (bi.material.restitution >= 0 && bj.material.restitution >= 0)
                    {
                        c.restitution = bi.material.restitution * bj.material.restitution;
                    }
                }

                // c.setSpookParams(
                //           cm.contactEquationStiffness,
                //           cm.contactEquationRelaxation,
                //           dt
                //       );

                solver.addEquation(c);

                // // Add friction constraint equation
                // if(mu > 0){

                // 	// Create 2 tangent equations
                // 	var mug = mu * gnorm;
                // 	var reducedMass = (bi.invMass + bj.invMass);
                // 	if(reducedMass > 0){
                // 		reducedMass = 1/reducedMass;
                // 	}
                // 	var pool = frictionEquationPool;
                // 	var c1 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                // 	var c2 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                // 	this.frictionEquations.push(c1, c2);

                // 	c1.bi = c2.bi = bi;
                // 	c1.bj = c2.bj = bj;
                // 	c1.minForce = c2.minForce = -mug*reducedMass;
                // 	c1.maxForce = c2.maxForce = mug*reducedMass;

                // 	// Copy over the relative vectors
                // 	c1.ri.copy(c.ri);
                // 	c1.rj.copy(c.rj);
                // 	c2.ri.copy(c.ri);
                // 	c2.rj.copy(c.rj);

                // 	// Construct tangents
                // 	c.ni.tangents(c1.t, c2.t);

                //           // Set spook params
                //           c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);
                //           c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);

                //           c1.enabled = c2.enabled = c.enabled;

                // 	// Add equations to solver
                // 	solver.addEquation(c1);
                // 	solver.addEquation(c2);
                // }

                if (bi.allowSleep &&
                    bi.type === Body.DYNAMIC &&
                    bi.sleepState === Body.SLEEPING &&
                    bj.sleepState === Body.AWAKE &&
                    bj.type !== Body.STATIC
                )
                {
                    var speedSquaredB = bj.velocity.norm2() + bj.angularVelocity.norm2();
                    var speedLimitSquaredB = Math.pow(bj.sleepSpeedLimit, 2);
                    if (speedSquaredB >= speedLimitSquaredB * 2)
                    {
                        bi._wakeUpAfterNarrowphase = true;
                    }
                }

                if (bj.allowSleep &&
                    bj.type === Body.DYNAMIC &&
                    bj.sleepState === Body.SLEEPING &&
                    bi.sleepState === Body.AWAKE &&
                    bi.type !== Body.STATIC
                )
                {
                    var speedSquaredA = bi.velocity.norm2() + bi.angularVelocity.norm2();
                    var speedLimitSquaredA = Math.pow(bi.sleepSpeedLimit, 2);
                    if (speedSquaredA >= speedLimitSquaredA * 2)
                    {
                        bj._wakeUpAfterNarrowphase = true;
                    }
                }

                // Now we know that i and j are in contact. Set collision matrix state
                this.collisionMatrix.set(bi, bj, true);

                if (!this.collisionMatrixPrevious.get(bi, bj))
                {
                    // First contact!
                    // We reuse the collideEvent object, otherwise we will end up creating new objects for each new contact, even if there's no event listener attached.
                    World_step_collideEvent.body = bj;
                    World_step_collideEvent.contact = c;
                    bi.dispatchEvent(World_step_collideEvent);

                    World_step_collideEvent.body = bi;
                    bj.dispatchEvent(World_step_collideEvent);
                }

                this.bodyOverlapKeeper.set(bi.id, bj.id);
                this.shapeOverlapKeeper.set(si.id, sj.id);
            }

            this.emitContactEvents();

            if (doProfiling)
            {
                profile.makeContactConstraints = performance.now() - profilingStart;
                profilingStart = performance.now();
            }

            // Wake up bodies
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];
                if (bi._wakeUpAfterNarrowphase)
                {
                    bi.wakeUp();
                    bi._wakeUpAfterNarrowphase = false;
                }
            }

            // Add user-added constraints
            var Nconstraints = constraints.length;
            for (i = 0; i !== Nconstraints; i++)
            {
                var c = constraints[i];
                c.update();
                for (var j = 0, Neq = c.equations.length; j !== Neq; j++)
                {
                    var eq = c.equations[j];
                    solver.addEquation(eq);
                }
            }

            // Solve the constrained system
            solver.solve(dt, this);

            if (doProfiling)
            {
                profile.solve = performance.now() - profilingStart;
            }

            // Remove all contacts from solver
            solver.removeAllEquations();

            // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
            var pow = Math.pow;
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];
                if (bi.type & DYNAMIC)
                { // Only for dynamic bodies
                    var ld = pow(1.0 - bi.linearDamping, dt);
                    var v = bi.velocity;
                    v.mult(ld, v);
                    var av = bi.angularVelocity;
                    if (av)
                    {
                        var ad = pow(1.0 - bi.angularDamping, dt);
                        av.mult(ad, av);
                    }
                }
            }

            this.dispatchEvent(World_step_preStepEvent);

            // Invoke pre-step callbacks
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];
                if (bi.preStep)
                {
                    bi.preStep.call(bi);
                }
            }

            // Leap frog
            // vnew = v + h*f/m
            // xnew = x + h*vnew
            if (doProfiling)
            {
                profilingStart = performance.now();
            }
            var stepnumber = this.stepnumber;
            var quatNormalize = stepnumber % (this.quatNormalizeSkip + 1) === 0;
            var quatNormalizeFast = this.quatNormalizeFast;

            for (i = 0; i !== N; i++)
            {
                bodies[i].integrate(dt, quatNormalize, quatNormalizeFast);
            }
            this.clearForces();

            this.broadphase.dirty = true;

            if (doProfiling)
            {
                profile.integrate = performance.now() - profilingStart;
            }

            // Update world time
            this.time += dt;
            this.stepnumber += 1;

            this.dispatchEvent(World_step_postStepEvent);

            // Invoke post-step callbacks
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];
                var postStep = bi.postStep;
                if (postStep)
                {
                    postStep.call(bi);
                }
            }

            // Sleeping update
            if (this.allowSleep)
            {
                for (i = 0; i !== N; i++)
                {
                    bodies[i].sleepTick(this.time);
                }
            }
        }

        emitContactEvents = (function ()
        {
            var additions = [];
            var removals = [];
            var beginContactEvent = {
                type: 'beginContact',
                bodyA: null,
                bodyB: null
            };
            var endContactEvent = {
                type: 'endContact',
                bodyA: null,
                bodyB: null
            };
            var beginShapeContactEvent = {
                type: 'beginShapeContact',
                bodyA: null,
                bodyB: null,
                shapeA: null,
                shapeB: null
            };
            var endShapeContactEvent = {
                type: 'endShapeContact',
                bodyA: null,
                bodyB: null,
                shapeA: null,
                shapeB: null
            };
            return function ()
            {
                var hasBeginContact = this.hasAnyEventListener('beginContact');
                var hasEndContact = this.hasAnyEventListener('endContact');

                if (hasBeginContact || hasEndContact)
                {
                    this.bodyOverlapKeeper.getDiff(additions, removals);
                }

                if (hasBeginContact)
                {
                    for (var i = 0, l = additions.length; i < l; i += 2)
                    {
                        beginContactEvent.bodyA = this.getBodyById(additions[i]);
                        beginContactEvent.bodyB = this.getBodyById(additions[i + 1]);
                        this.dispatchEvent(beginContactEvent);
                    }
                    beginContactEvent.bodyA = beginContactEvent.bodyB = null;
                }

                if (hasEndContact)
                {
                    for (var i = 0, l = removals.length; i < l; i += 2)
                    {
                        endContactEvent.bodyA = this.getBodyById(removals[i]);
                        endContactEvent.bodyB = this.getBodyById(removals[i + 1]);
                        this.dispatchEvent(endContactEvent);
                    }
                    endContactEvent.bodyA = endContactEvent.bodyB = null;
                }

                additions.length = removals.length = 0;

                var hasBeginShapeContact = this.hasAnyEventListener('beginShapeContact');
                var hasEndShapeContact = this.hasAnyEventListener('endShapeContact');

                if (hasBeginShapeContact || hasEndShapeContact)
                {
                    this.shapeOverlapKeeper.getDiff(additions, removals);
                }

                if (hasBeginShapeContact)
                {
                    for (var i = 0, l = additions.length; i < l; i += 2)
                    {
                        var shapeA = this.getShapeById(additions[i]);
                        var shapeB = this.getShapeById(additions[i + 1]);
                        beginShapeContactEvent.shapeA = shapeA;
                        beginShapeContactEvent.shapeB = shapeB;
                        beginShapeContactEvent.bodyA = shapeA.body;
                        beginShapeContactEvent.bodyB = shapeB.body;
                        this.dispatchEvent(beginShapeContactEvent);
                    }
                    beginShapeContactEvent.bodyA = beginShapeContactEvent.bodyB = beginShapeContactEvent.shapeA = beginShapeContactEvent.shapeB = null;
                }

                if (hasEndShapeContact)
                {
                    for (var i = 0, l = removals.length; i < l; i += 2)
                    {
                        var shapeA = this.getShapeById(removals[i]);
                        var shapeB = this.getShapeById(removals[i + 1]);
                        endShapeContactEvent.shapeA = shapeA;
                        endShapeContactEvent.shapeB = shapeB;
                        endShapeContactEvent.bodyA = shapeA.body;
                        endShapeContactEvent.bodyB = shapeB.body;
                        this.dispatchEvent(endShapeContactEvent);
                    }
                    endShapeContactEvent.bodyA = endShapeContactEvent.bodyB = endShapeContactEvent.shapeA = endShapeContactEvent.shapeB = null;
                }

            };
        })();

        /**
         * Sets all body forces in the world to zero.
         * @method clearForces
         */
        clearForces()
        {
            var bodies = this.bodies;
            var N = bodies.length;
            for (var i = 0; i !== N; i++)
            {
                var b = bodies[i],
                    force = b.force,
                    tau = b.torque;

                b.force.set(0, 0, 0);
                b.torque.set(0, 0, 0);
            }
        }
    }


    // Temp stuff
    var tmpAABB1 = new AABB();
    var tmpArray1 = [];
    var tmpRay = new Ray();


    // performance.now()
    if (typeof performance === 'undefined')
    {
        throw "performance"

        // performance = {};
    }
    if (!performance.now)
    {
        var nowOffset = Date.now();
        if (performance.timing && performance.timing.navigationStart)
        {
            nowOffset = performance.timing.navigationStart;
        }
        performance.now = function ()
        {
            return Date.now() - nowOffset;
        };
    }

    var step_tmp1 = new Vec3();

    /**
     * Dispatched after the world has stepped forward in time.
     */
    var World_step_postStepEvent = { type: "postStep" }; // Reusable event objects to save memory
    /**
     * Dispatched before the world steps forward in time.
     */
    var World_step_preStepEvent = { type: "preStep" };
    var World_step_collideEvent = { type: Body.COLLIDE_EVENT_NAME, body: null, contact: null };
    var World_step_oldContacts = [];// Pools for unused objects
    var World_step_frictionEquationPool = [];
    var World_step_p1 = []; // Reusable arrays for collision pairs
    var World_step_p2 = [];
    var World_step_gvec = new Vec3(); // Temporary vectors and quats
    var World_step_vi = new Vec3();
    var World_step_vj = new Vec3();
    var World_step_wi = new Vec3();
    var World_step_wj = new Vec3();
    var World_step_t1 = new Vec3();
    var World_step_t2 = new Vec3();
    var World_step_rixn = new Vec3();
    var World_step_rjxn = new Vec3();
    var World_step_step_q = new Quaternion();
    var World_step_step_w = new Quaternion();
    var World_step_step_wq = new Quaternion();
    var invI_tau_dt = new Vec3();
}