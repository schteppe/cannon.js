export class Particle extends Shape
{

    /**
     * Particle shape.
     * 
     * @author schteppe
     */
    constructor()
    {
        super({
            type: Shape.types.PARTICLE
        });
    }

    /**
     * @param mass
     * @param target
     */
    calculateLocalInertia(mass: number, target: Vector3)
    {
        target = target || new Vector3();
        target.set(0, 0, 0);
        return target;
    }

    volume()
    {
        return 0;
    }

    updateBoundingSphereRadius()
    {
        this.boundingSphereRadius = 0;
    }

    calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3)
    {
        // Get each axis max
        min.copy(pos);
        max.copy(pos);
    }
}
