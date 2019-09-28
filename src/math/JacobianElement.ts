namespace CANNON
{
    export class JacobianElement
    {
        spatial: Vec3;
        rotational: Vec3;

        /**
         * An element containing 6 entries, 3 spatial and 3 rotational degrees of freedom.
         */
        constructor()
        {
            this.spatial = new Vec3();
            this.rotational = new Vec3();
        }

        /**
         * Multiply with other JacobianElement
         * @param element
         */
        multiplyElement(element: JacobianElement)
        {
            return element.spatial.dot(this.spatial) + element.rotational.dot(this.rotational);
        }

        /**
         * Multiply with two vectors
         * @param spatial
         * @param rotational
         */
        multiplyVectors(spatial: Vec3, rotational: Vec3)
        {
            return spatial.dot(this.spatial) + rotational.dot(this.rotational);
        }
    }
}