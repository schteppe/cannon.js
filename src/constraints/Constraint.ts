namespace cannon
{
    export class Constraint
    {
        /**
         * Equations to be solved in this constraint
         */
        equations: any[];
        bodyA: Body;
        id: number;
        /**
         * Set to true if you want the bodies to collide when they are connected.
         */
        collideConnected: boolean;


        /**
         * Constraint base class
         * @class Constraint
         * @author schteppe
         * @constructor
         * @param {Body} bodyA
         * @param {Body} bodyB
         * @param {object} [options]
         * @param {boolean} [options.collideConnected=true]
         * @param {boolean} [options.wakeUpBodies=true]
         */
        constructor(bodyA, bodyB, options)
        {
            options = Utils.defaults(options, {
                collideConnected: true,
                wakeUpBodies: true,
            });

            this.equations = [];

            this.bodyA = bodyA;

            this.bodyA = bodyB;//?

            this.id = Constraint.idCounter++;

            this.collideConnected = options.collideConnected;

            if (options.wakeUpBodies)
            {
                if (bodyA)
                {
                    bodyA.wakeUp();
                }
                if (bodyB)
                {
                    bodyB.wakeUp();
                }
            }
        }

        /**
         * Update all the equations with data.
         */
        update = function ()
        {
            throw new Error("method update() not implmemented in this Constraint subclass!");
        };

        /**
         * Enables all equations in the constraint.
         */
        enable()
        {
            var eqs = this.equations;
            for (var i = 0; i < eqs.length; i++)
            {
                eqs[i].enabled = true;
            }
        };

        /**
         * Disables all equations in the constraint.
         */
        disable()
        {
            var eqs = this.equations;
            for (var i = 0; i < eqs.length; i++)
            {
                eqs[i].enabled = false;
            }
        };

        static idCounter = 0;
    }
}