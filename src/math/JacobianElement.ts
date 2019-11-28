namespace CANNON
{
    export class JacobianElement
    {
        spatial: Vector3;
        rotational: Vector3;

        /**
         * An element containing 6 entries, 3 spatial and 3 rotational degrees of freedom.
         */
        constructor()
        {
            this.spatial = new Vector3();
            this.rotational = new Vector3();
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
        multiplyVectors(spatial: Vector3, rotational: Vector3)
        {
            return spatial.dot(this.spatial) + rotational.dot(this.rotational);
        }
    }
}