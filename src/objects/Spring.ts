namespace cannon
{
    export class Spring
    {

        /**
         * Rest length of the spring.
         */
        restLength: number;

        /**
         * Stiffness of the spring.
         */
        stiffness: number;

        /**
         * Damping of the spring.
         */
        damping: number;

        /**
         * First connected body.
         */
        bodyA: Body;

        /**
         * Second connected body.
         */
        bodyB: Body;

        /**
         * Anchor for bodyA in local bodyA coordinates.
         */
        localAnchorA: Vec3;

        /**
         * Anchor for bodyB in local bodyB coordinates.
         */
        localAnchorB: Vec3;

        /**
         * A spring, connecting two bodies.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         */
        constructor(bodyA: Body, bodyB: Body, options: { restLength?: number, stiffness?: number, damping?: number, localAnchorA?: Vec3, localAnchorB?: Vec3, worldAnchorA?: Vec3, worldAnchorB?: Vec3 } = {})
        {
            this.restLength = typeof (options.restLength) === "number" ? options.restLength : 1;

            this.stiffness = options.stiffness || 100;

            this.damping = options.damping || 1;

            this.bodyA = bodyA;

            this.bodyB = bodyB;

            this.localAnchorA = new Vec3();
            this.localAnchorB = new Vec3();

            if (options.localAnchorA)
            {
                this.localAnchorA.copy(options.localAnchorA);
            }
            if (options.localAnchorB)
            {
                this.localAnchorB.copy(options.localAnchorB);
            }
            if (options.worldAnchorA)
            {
                this.setWorldAnchorA(options.worldAnchorA);
            }
            if (options.worldAnchorB)
            {
                this.setWorldAnchorB(options.worldAnchorB);
            }
        }

        /**
         * Set the anchor point on body A, using world coordinates.
         * @param worldAnchorA
         */
        setWorldAnchorA(worldAnchorA: Vec3)
        {
            this.bodyA.pointToLocalFrame(worldAnchorA, this.localAnchorA);
        };

        /**
         * Set the anchor point on body B, using world coordinates.
         * @param worldAnchorB
         */
        setWorldAnchorB(worldAnchorB: Vec3)
        {
            this.bodyB.pointToLocalFrame(worldAnchorB, this.localAnchorB);
        };

        /**
         * Get the anchor point on body A, in world coordinates.
         * @param result The vector to store the result in.
         */
        getWorldAnchorA(result: Vec3)
        {
            this.bodyA.pointToWorldFrame(this.localAnchorA, result);
        };

        /**
         * Get the anchor point on body B, in world coordinates.
         * @param result The vector to store the result in.
         */
        getWorldAnchorB(result: Vec3)
        {
            this.bodyB.pointToWorldFrame(this.localAnchorB, result);
        };

        /**
         * Apply the spring force to the connected bodies.
         */
        applyForce()
        {
            var k = this.stiffness,
                d = this.damping,
                l = this.restLength,
                bodyA = this.bodyA,
                bodyB = this.bodyB,
                r = applyForce_r,
                r_unit = applyForce_r_unit,
                u = applyForce_u,
                f = applyForce_f,
                tmp = applyForce_tmp;

            var worldAnchorA = applyForce_worldAnchorA,
                worldAnchorB = applyForce_worldAnchorB,
                ri = applyForce_ri,
                rj = applyForce_rj,
                ri_x_f = applyForce_ri_x_f,
                rj_x_f = applyForce_rj_x_f;

            // Get world anchors
            this.getWorldAnchorA(worldAnchorA);
            this.getWorldAnchorB(worldAnchorB);

            // Get offset points
            worldAnchorA.vsub(bodyA.position, ri);
            worldAnchorB.vsub(bodyB.position, rj);

            // Compute distance vector between world anchor points
            worldAnchorB.vsub(worldAnchorA, r);
            var rlen = r.norm();
            r_unit.copy(r);
            r_unit.normalize();

            // Compute relative velocity of the anchor points, u
            bodyB.velocity.vsub(bodyA.velocity, u);
            // Add rotational velocity

            bodyB.angularVelocity.cross(rj, tmp);
            u.vadd(tmp, u);
            bodyA.angularVelocity.cross(ri, tmp);
            u.vsub(tmp, u);

            // F = - k * ( x - L ) - D * ( u )
            r_unit.mult(-k * (rlen - l) - d * u.dot(r_unit), f);

            // Add forces to bodies
            bodyA.force.vsub(f, bodyA.force);
            bodyB.force.vadd(f, bodyB.force);

            // Angular force
            ri.cross(f, ri_x_f);
            rj.cross(f, rj_x_f);
            bodyA.torque.vsub(ri_x_f, bodyA.torque);
            bodyB.torque.vadd(rj_x_f, bodyB.torque);
        };

    }

    var applyForce_r = new Vec3();
    var applyForce_r_unit = new Vec3();
    var applyForce_u = new Vec3();
    var applyForce_f = new Vec3();
    var applyForce_worldAnchorA = new Vec3();
    var applyForce_worldAnchorB = new Vec3();
    var applyForce_ri = new Vec3();
    var applyForce_rj = new Vec3();
    var applyForce_ri_x_f = new Vec3();
    var applyForce_rj_x_f = new Vec3();
    var applyForce_tmp = new Vec3();

}

