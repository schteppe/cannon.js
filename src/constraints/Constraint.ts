export class Constraint
{
    /**
     * Equations to be solved in this constraint
     */
    equations: Equation[];
    bodyA: Body;
    id: number;
    /**
     * Set to true if you want the bodies to collide when they are connected.
     */
    collideConnected: boolean;
    bodyB: Body;

    /**
     * Constraint base class
     * 
     * @param bodyA 
     * @param bodyB 
     * @param options 
     * 
     * @author schteppe
     */
    constructor(bodyA: Body, bodyB: Body, options: { collideConnected?: boolean, wakeUpBodies?: boolean } = {})
    {
        options = Utils.defaults(options, {
            collideConnected: true,
            wakeUpBodies: true,
        });

        this.equations = [];

        this.bodyA = bodyA;

        this.bodyB = bodyB;

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
    update()
    {
        throw new Error("method update() not implmemented in this Constraint subclass!");
    }

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
    }

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
    }

    static idCounter = 0;
}
