namespace CANNON
{
    /**
     * For pooling objects that can be reused.
     */
    export class Pool
    {

        /**
         * The pooled objects
         */
        objects: any[];

        /**
         * Constructor of the objects
         */
        type: Object;

        constructor()
        {
            this.objects = [];
            this.type = Object;
        }

        /**
         * Release an object after use
         */
        release(...args)
        {
            var Nargs = arguments.length;
            for (var i = 0; i !== Nargs; i++)
            {
                this.objects.push(arguments[i]);
            }
            return this;
        }

        /**
         * Get an object
         */
        get()
        {
            if (this.objects.length === 0)
            {
                return this.constructObject();
            } else
            {
                return this.objects.pop();
            }
        }

        /**
         * Construct an object. Should be implmented in each subclass.
         */
        constructObject()
        {
            throw new Error("constructObject() not implemented in this Pool subclass yet!");
        }

        /**
         * @param size
         * @return Self, for chaining
         */
        resize(size: number)
        {
            var objects = this.objects;

            while (objects.length > size)
            {
                objects.pop();
            }

            while (objects.length < size)
            {
                objects.push(this.constructObject());
            }

            return this;
        }

    }
}