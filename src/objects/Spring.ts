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
    localAnchorA: Vector3;

    /**
     * Anchor for bodyB in local bodyB coordinates.
     */
    localAnchorB: Vector3;

    /**
     * A spring, connecting two bodies.
     * 
     * @param bodyA 
     * @param bodyB 
     * @param options 
     */
    constructor(bodyA: Body, bodyB: Body, options: { restLength?: number, stiffness?: number, damping?: number, localAnchorA?: Vector3, localAnchorB?: Vector3, worldAnchorA?: Vector3, worldAnchorB?: Vector3 } = {})
    {
        this.restLength = typeof (options.restLength) === "number" ? options.restLength : 1;

        this.stiffness = options.stiffness || 100;

        this.damping = options.damping || 1;

        this.bodyA = bodyA;

        this.bodyB = bodyB;

        this.localAnchorA = new Vector3();
        this.localAnchorB = new Vector3();

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
    setWorldAnchorA(worldAnchorA: Vector3)
    {
        this.bodyA.pointToLocalFrame(worldAnchorA, this.localAnchorA);
    }

    /**
     * Set the anchor point on body B, using world coordinates.
     * @param worldAnchorB
     */
    setWorldAnchorB(worldAnchorB: Vector3)
    {
        this.bodyB.pointToLocalFrame(worldAnchorB, this.localAnchorB);
    }

    /**
     * Get the anchor point on body A, in world coordinates.
     * @param result The vector to store the result in.
     */
    getWorldAnchorA(result: Vector3)
    {
        this.bodyA.pointToWorldFrame(this.localAnchorA, result);
    }

    /**
     * Get the anchor point on body B, in world coordinates.
     * @param result The vector to store the result in.
     */
    getWorldAnchorB(result: Vector3)
    {
        this.bodyB.pointToWorldFrame(this.localAnchorB, result);
    }

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
        worldAnchorA.subTo(bodyA.position, ri);
        worldAnchorB.subTo(bodyB.position, rj);

        // Compute distance vector between world anchor points
        worldAnchorB.subTo(worldAnchorA, r);
        var rlen = r.length;
        r_unit.copy(r);
        r_unit.normalize();

        // Compute relative velocity of the anchor points, u
        bodyB.velocity.subTo(bodyA.velocity, u);
        // Add rotational velocity

        bodyB.angularVelocity.crossTo(rj, tmp);
        u.addTo(tmp, u);
        bodyA.angularVelocity.crossTo(ri, tmp);
        u.subTo(tmp, u);

        // F = - k * ( x - L ) - D * ( u )
        r_unit.scaleNumberTo(-k * (rlen - l) - d * u.dot(r_unit), f);

        // Add forces to bodies
        bodyA.force.subTo(f, bodyA.force);
        bodyB.force.addTo(f, bodyB.force);

        // Angular force
        ri.crossTo(f, ri_x_f);
        rj.crossTo(f, rj_x_f);
        bodyA.torque.subTo(ri_x_f, bodyA.torque);
        bodyB.torque.addTo(rj_x_f, bodyB.torque);
    }

}

var applyForce_r = new Vector3();
var applyForce_r_unit = new Vector3();
var applyForce_u = new Vector3();
var applyForce_f = new Vector3();
var applyForce_worldAnchorA = new Vector3();
var applyForce_worldAnchorB = new Vector3();
var applyForce_ri = new Vector3();
var applyForce_rj = new Vector3();
var applyForce_ri_x_f = new Vector3();
var applyForce_rj_x_f = new Vector3();
var applyForce_tmp = new Vector3();

