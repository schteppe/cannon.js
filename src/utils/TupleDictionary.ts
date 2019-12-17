namespace CANNON
{
    export class TupleDictionary<T>
    {

        /**
         * The data storage
         */
        data = {};

        /**
         * @param i
         * @param j
         */
        get(i: number, j: number): T
        {
            if (i > j)
            {
                // swap
                var temp = j;
                j = i;
                i = temp;
            }
            return this.data[i + '-' + j];
        }

        set(i: number, j: number, value: T)
        {
            if (i > j)
            {
                var temp = j;
                j = i;
                i = temp;
            }
            var key = i + '-' + j;

            this.data[key] = value;
        }

        reset()
        {
            this.data = {};
        }
    }
}