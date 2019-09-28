namespace CANNON
{
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
        calculateLocalInertia(mass: number, target: Vec3)
        {
            target = target || new Vec3();
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

        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3)
        {
            // Get each axis max
            min.copy(pos);
            max.copy(pos);
        }
    }

}