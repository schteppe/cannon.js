export class Utils
{
    /**
     * Extend an options object with default values.
     * @param  options The options object. May be falsy: in this case, a new object is created and returned.
     * @param  defaults An object containing default values.
     * @return The modified options object.
     */
    static defaults(options: Object, defaults: Object)
    {
        options = options || {};
        for (const key in defaults)
        {
            if (!(key in options))
            {
                options[key] = defaults[key];
            }
        }

        return options;
    }
}
