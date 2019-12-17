namespace CANNON
{
    export class ArrayCollisionMatrix
    {
        matrix = {};

        /**
         * Get an element
         * 
         * @param i
         * @param j
         */
        get(i0: { index: number }, j0: { index: number })
        {
            var i = i0.index;
            var j = j0.index;
            return this.matrix[i + "_" + j];
        }

        /**
         * Set an element
         * 
         * @param i0 
         * @param j0 
         * @param value 
         */
        set(i0: { index: number }, j0: { index: number }, value: boolean)
        {
            var i = i0.index;
            var j = j0.index;
            this.matrix[i + "_" + j] = this.matrix[j + "_" + i] = value ? 1 : 0;
        }

        /**
         * Sets all elements to zero
         */
        reset()
        {
            this.matrix = {};
        }
    }
}