namespace CANNON
{
    export interface WorldEventMap
    {
        addBody: Body
        removeBody: Body
        preStep: any;
        /**
         * Dispatched after the world has stepped forward in time.
         */
        postStep: any;

        beginContact: { bodyA: Body; bodyB: Body; };

        endContact: { bodyA: Body; bodyB: Body; };

        beginShapeContact: { bodyA: Body; bodyB: Body; shapeA: Shape; shapeB: Shape; }

        endShapeContact: { bodyA: Body; bodyB: Body; shapeA: Shape; shapeB: Shape; }

    }

    export class World<T extends WorldEventMap = WorldEventMap> extends feng3d.EventEmitter<T>
    {
        static worldNormal = new Vector3(0, 0, 1);

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
        contacts: ContactEquation[];
        frictionEquations: FrictionEquation[];

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
        gravity: Vector3;

        /**
         * The broadphase algorithm to use. Default is NaiveBroadphase
         */
        broadphase: Broadphase;

        bodies: Body[];

        /**
         * The solver algorithm to use. Default is GSSolver
         */
        solver: Solver;

        constraints: Constraint[];

        narrowphase: Narrowphase;

        collisionMatrix = {};

        /**
         * CollisionMatrix from the previous step.
         */
        collisionMatrixPrevious = {};

        bodyOverlapKeeper: OverlapKeeper;
        shapeOverlapKeeper: OverlapKeeper;

        /**
         * All added materials
         */
        materials: Material[];

        contactmaterials: ContactMaterial[];

        /**
         * Used to look up a ContactMaterial given two instances of Material.
         */
        contactMaterialTable: { [key: string]: ContactMaterial };

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

        subsystems: SPHSystem[];

        idToBodyMap: { [id: string]: Body } = {};

        /**
         * The physics world
         * @param options 
         */
        constructor(options: { gravity?: Vector3, allowSleep?: boolean, broadphase?: Broadphase, solver?: Solver, quatNormalizeFast?: boolean, quatNormalizeSkip?: number } = {})
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
            this.gravity = new Vector3();
            if (options.gravity)
            {
                this.gravity.copy(options.gravity);
            }
            this.broadphase = options.broadphase !== undefined ? options.broadphase : new NaiveBroadphase();
            this.bodies = [];
            this.solver = options.solver !== undefined ? options.solver : new GSSolver();
            this.constraints = [];
            this.narrowphase = new Narrowphase(this);
            this.collisionMatrix = {};
            this.collisionMatrixPrevious = {};

            this.bodyOverlapKeeper = new OverlapKeeper();
            this.shapeOverlapKeeper = new OverlapKeeper();
            this.materials = [];
            this.contactmaterials = [];
            this.contactMaterialTable = {};

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
            return this.contactMaterialTable[m1.id + "_" + m2.id]; //this.contactmaterials[this.mats2cmat[i+j*this.materials.length]];
        }

        /**
         * Get number of objects in the world.
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
            this.collisionMatrix = {};

            this.bodyOverlapKeeper.tick();
            this.shapeOverlapKeeper.tick();
        }

        /**
         * Add a rigid body to the simulation.
         * @method add
         * @param {Body} body
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
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
            this.idToBodyMap[body.id] = body;
            this.emit("addBody", body);
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
         * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
         * @param from 
         * @param to 
         * @param options 
         * @param callback 
         * @return True if any body was hit.
         */
        raycastAll(from: Vector3, to: Vector3, options: { collisionFilterMask?: number, collisionFilterGroup?: number, skipBackfaces?: boolean, checkCollisionResponse?: boolean, mode?: number, from?: Vector3, to?: Vector3, callback?: Function } = {}, callback: Function)
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
        raycastAny(from: Vector3, to: Vector3, options: { collisionFilterMask?: number, collisionFilterGroup?: number, skipBackfaces?: boolean, checkCollisionResponse?: boolean, mode?: number, from?: Vector3, to?: Vector3, callback?: Function, result?: RaycastResult }, result: RaycastResult)
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
        raycastClosest(from: Vector3, to: Vector3, options: { collisionFilterMask?: number, collisionFilterGroup?: number, skipBackfaces?: boolean, checkCollisionResponse?: boolean, mode?: number, from?: Vector3, to?: Vector3, callback?: Function, result?: RaycastResult }, result: RaycastResult)
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

                delete this.idToBodyMap[body.id];
                this.emit("removeBody", body);
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
            this.contactMaterialTable[cmat.materials[0].id + "_" + cmat.materials[1].id] = cmat;
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
                    b.previousPosition.lerpNumberTo(b.position, t, b.interpolatedPosition);
                    b.previousQuaternion.slerpTo(b.quaternion, t, b.interpolatedQuaternion);
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
                gnorm = gravity.length,
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
                let c = contacts[k];

                // Get current collision indeces
                let bi = c.bi,
                    bj = c.bj,
                    si = c.si,
                    sj = c.sj;

                // Get collision properties
                var cm: ContactMaterial;
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
                    var speedSquaredB = bj.velocity.lengthSquared + bj.angularVelocity.lengthSquared;
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
                    var speedSquaredA = bi.velocity.lengthSquared + bi.angularVelocity.lengthSquared;
                    var speedLimitSquaredA = Math.pow(bi.sleepSpeedLimit, 2);
                    if (speedSquaredA >= speedLimitSquaredA * 2)
                    {
                        bj._wakeUpAfterNarrowphase = true;
                    }
                }

                // Now we know that i and j are in contact. Set collision matrix state
                this.collisionMatrix[bi.index + "_" + bj.index] = true;

                if (!this.collisionMatrixPrevious[bi.index + "_" + bj.index])
                {
                    // First contact!
                    // We reuse the collideEvent object, otherwise we will end up creating new objects for each new contact, even if there's no event listener attached.
                    bi.emit("collide", { body: bj, contact: c });
                    bj.emit("collide", { body: bi, contact: c });
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
                    v.scaleNumberTo(ld, v);
                    var av = bi.angularVelocity;
                    if (av)
                    {
                        var ad = pow(1.0 - bi.angularDamping, dt);
                        av.scaleNumberTo(ad, av);
                    }
                }
            }

            this.emit("preStep");

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

            this.emit("postStep");

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
            return function ()
            {
                var _this = <World>this;

                var hasBeginContact = _this.has('beginContact');
                var hasEndContact = _this.has('endContact');

                if (hasBeginContact || hasEndContact)
                {
                    _this.bodyOverlapKeeper.getDiff(additions, removals);
                }

                if (hasBeginContact)
                {
                    for (var i = 0, l = additions.length; i < l; i += 2)
                    {
                        _this.emit("beginContact", {
                            bodyA: _this.getBodyById(additions[i]),
                            bodyB: _this.getBodyById(additions[i + 1])
                        });
                    }
                }

                if (hasEndContact)
                {
                    for (var i = 0, l = removals.length; i < l; i += 2)
                    {
                        _this.emit("endContact", {
                            bodyA: _this.getBodyById(removals[i]),
                            bodyB: _this.getBodyById(removals[i + 1])
                        })
                    }
                }

                additions.length = removals.length = 0;

                var hasBeginShapeContact = _this.has('beginShapeContact');
                var hasEndShapeContact = _this.has('endShapeContact');

                if (hasBeginShapeContact || hasEndShapeContact)
                {
                    _this.shapeOverlapKeeper.getDiff(additions, removals);
                }

                if (hasBeginShapeContact)
                {
                    for (var i = 0, l = additions.length; i < l; i += 2)
                    {
                        var shapeA = _this.getShapeById(additions[i]);
                        var shapeB = _this.getShapeById(additions[i + 1]);

                        _this.emit("beginShapeContact", { shapeA: shapeA, shapeB: shapeB, bodyA: shapeA.body, bodyB: shapeB.body })
                    }
                }

                if (hasEndShapeContact)
                {
                    for (var i = 0, l = removals.length; i < l; i += 2)
                    {
                        var shapeA = _this.getShapeById(removals[i]);
                        var shapeB = _this.getShapeById(removals[i + 1]);

                        _this.emit("endShapeContact", { shapeA: shapeA, shapeB: shapeB, bodyA: shapeA.body, bodyB: shapeB.body });
                    }
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
    var tmpAABB1 = new Box3();
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

    var step_tmp1 = new Vector3();
    /**
     * Dispatched before the world steps forward in time.
     */
    var World_step_oldContacts: ContactEquation[] = [];// Pools for unused objects
    var World_step_frictionEquationPool = [];
    var World_step_p1 = []; // Reusable arrays for collision pairs
    var World_step_p2 = [];
    var World_step_gvec = new Vector3(); // Temporary vectors and quats
    var World_step_vi = new Vector3();
    var World_step_vj = new Vector3();
    var World_step_wi = new Vector3();
    var World_step_wj = new Vector3();
    var World_step_t1 = new Vector3();
    var World_step_t2 = new Vector3();
    var World_step_rixn = new Vector3();
    var World_step_rjxn = new Vector3();
    var World_step_step_q = new Quaternion();
    var World_step_step_w = new Quaternion();
    var World_step_step_wq = new Quaternion();
    var invI_tau_dt = new Vector3();
}