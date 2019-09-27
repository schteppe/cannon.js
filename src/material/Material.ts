namespace cannon
{
    export class Material
    {

        name: string;

        /**
         * material id.
         */
        id: number;

        /**
         * Friction for this material. If non-negative, it will be used instead of the friction given by ContactMaterials. If there's no matching ContactMaterial, the value from .defaultContactMaterial in the World will be used.
         */
        friction: number;

        /**
         * Restitution for this material. If non-negative, it will be used instead of the restitution given by ContactMaterials. If there's no matching ContactMaterial, the value from .defaultContactMaterial in the World will be used.
         */
        restitution: number;

        /**
         * Defines a physics material.
         * 
         * @param options 
         * @author schteppe
         */
        constructor(options: { friction?: number, restitution?: number } = {})
        {
            var name = '';

            // Backwards compatibility fix
            if (typeof (options) === 'string')
            {
                name = options;
                options = {};
            } else if (typeof (options) === 'object')
            {
                name = '';
            }

            this.name = name;
            this.id = Material.idCounter++;
            this.friction = typeof (options.friction) !== 'undefined' ? options.friction : -1;
            this.restitution = typeof (options.restitution) !== 'undefined' ? options.restitution : -1;
        }

        static idCounter = 0;

    }
}