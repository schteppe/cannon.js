namespace CANNON
{
    export class Vec3Pool extends Pool<Vec3>
    {
        constructor()
        {
            super();
            this.type = Vec3;
        }

        /**
         * Construct a vector
         */
        constructObject()
        {
            return new Vec3();
        }
    }
}