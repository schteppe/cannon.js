import { Vector3 } from 'feng3d';
import { Body } from '../objects/Body';

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
        this.restLength = typeof (options.restLength) === 'number' ? options.restLength : 1;

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
        const k = this.stiffness;
        const d = this.damping;
        const l = this.restLength;
        const bodyA = this.bodyA;
        const bodyB = this.bodyB;
        const r = applyForceR;
        const rUnit = applyForceRUnit;
        const u = applyForceU;
        const f = applyForceF;
        const tmp = applyForceTmp;

        const worldAnchorA = applyForceWorldAnchorA;
        const worldAnchorB = applyForceWorldAnchorB;
        const ri = applyForceRi;
        const rj = applyForceRj;
        const riXF = applyForceRiXF;
        const rjXF = applyForceRjXF;

        // Get world anchors
        this.getWorldAnchorA(worldAnchorA);
        this.getWorldAnchorB(worldAnchorB);

        // Get offset points
        worldAnchorA.subTo(bodyA.position, ri);
        worldAnchorB.subTo(bodyB.position, rj);

        // Compute distance vector between world anchor points
        worldAnchorB.subTo(worldAnchorA, r);
        const rlen = r.length;
        rUnit.copy(r);
        rUnit.normalize();

        // Compute relative velocity of the anchor points, u
        bodyB.velocity.subTo(bodyA.velocity, u);
        // Add rotational velocity

        bodyB.angularVelocity.crossTo(rj, tmp);
        u.addTo(tmp, u);
        bodyA.angularVelocity.crossTo(ri, tmp);
        u.subTo(tmp, u);

        // F = - k * ( x - L ) - D * ( u )
        rUnit.scaleNumberTo(-k * (rlen - l) - d * u.dot(rUnit), f);

        // Add forces to bodies
        bodyA.force.subTo(f, bodyA.force);
        bodyB.force.addTo(f, bodyB.force);

        // Angular force
        ri.crossTo(f, riXF);
        rj.crossTo(f, rjXF);
        bodyA.torque.subTo(riXF, bodyA.torque);
        bodyB.torque.addTo(rjXF, bodyB.torque);
    }
}

const applyForceR = new Vector3();
const applyForceRUnit = new Vector3();
const applyForceU = new Vector3();
const applyForceF = new Vector3();
const applyForceWorldAnchorA = new Vector3();
const applyForceWorldAnchorB = new Vector3();
const applyForceRi = new Vector3();
const applyForceRj = new Vector3();
const applyForceRiXF = new Vector3();
const applyForceRjXF = new Vector3();
const applyForceTmp = new Vector3();
