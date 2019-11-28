namespace CANNON
{
    export class Vec3Pool extends Pool<Vector3>
    {
        constructor()
        {
            super();
            this.type = Vector3;
        }

        /**
         * Construct a vector
         */
        constructObject()
        {
            return new Vector3();
        }
    }
}