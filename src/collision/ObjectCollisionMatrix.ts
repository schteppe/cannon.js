namespace CANNON
{
    export class ObjectCollisionMatrix
    {

        /**
         * The matrix storage
         */
        matrix = {};

        /**
         * Records what objects are colliding with each other
         */
        constructor()
        {
            this.matrix = {};
        }

        get(i0: { id: number }, j0: { id: number })
        {
            var i = i0.id;
            var j = j0.id;
            if (j > i)
            {
                var temp = j;
                j = i;
                i = temp;
            }
            return i + '-' + j in this.matrix;
        }

        set(i0: { id: number }, j0: { id: number }, value: number)
        {
            var i = i0.id;
            var j = j0.id;
            if (j > i)
            {
                var temp = j;
                j = i;
                i = temp;
            }
            if (value)
            {
                this.matrix[i + '-' + j] = true;
            }
            else
            {
                delete this.matrix[i + '-' + j];
            }
        }

        /**
         * Empty the matrix
         */
        reset()
        {
            this.matrix = {};
        }

        /**
         * Set max number of objects
         * 
         * @param n 
         */
        setNumObjects(n: number)
        {
        }

    }
}