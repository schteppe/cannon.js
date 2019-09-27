namespace cannon
{
    export class Vec3Pool extends Pool
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