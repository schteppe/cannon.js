namespace cannon
{
    export class ArrayCollisionMatrix
    {
        matrix: number[];

        /**
         * Collision "matrix". It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
         */
        constructor()
        {
            this.matrix = [];
        }

        /**
         * Get an element
         * @method get
         * @param  {Number} i
         * @param  {Number} j
         * @return {Number}
         */
        get(i0: { index: number }, j0: { index: number })
        {
            var i = i0.index;
            var j = j0.index;
            if (j > i)
            {
                var temp = j;
                j = i;
                i = temp;
            }
            return this.matrix[(i * (i + 1) >> 1) + j - 1];
        };

        /**
         * Set an element
         * @param i0 
         * @param j0 
         * @param value 
         */
        set(i0: { index: number }, j0: { index: number }, value: boolean)
        {
            var i = i0.index;
            var j = j0.index;
            if (j > i)
            {
                var temp = j;
                j = i;
                i = temp;
            }
            this.matrix[(i * (i + 1) >> 1) + j - 1] = value ? 1 : 0;
        };

        /**
         * Sets all elements to zero
         */
        reset()
        {
            for (var i = 0, l = this.matrix.length; i !== l; i++)
            {
                this.matrix[i] = 0;
            }
        };

        /**
         * Sets the max number of objects
         */
        setNumObjects(n: number)
        {
            this.matrix.length = n * (n - 1) >> 1;
        };
    }
}