namespace cannon
{
    export class TupleDictionary
    {

        /**
         * The data storage
         */
        data = { keys: [] };

        /**
         * @param i
         * @param j
         */
        get(i: number, j: number)
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

        set(i: number, j: number, value: number)
        {
            if (i > j)
            {
                var temp = j;
                j = i;
                i = temp;
            }
            var key = i + '-' + j;

            // Check if key already exists
            if (!this.get(i, j))
            {
                this.data.keys.push(key);
            }

            this.data[key] = value;
        }

        reset()
        {
            var data = this.data,
                keys = data.keys;
            while (keys.length > 0)
            {
                var key = keys.pop();
                delete data[key];
            }
        }
    }
}