export class Solver
{

    /**
     * The number of solver iterations determines quality of the constraints in the world. The more iterations, the more correct simulation. More iterations need more computations though. If you have a large gravity force in your world, you will need more iterations.
     * @todo write more about solver and iterations in the wiki
     */
    iterations: number;

    /**
     * When tolerance is reached, the system is assumed to be converged.
     */
    tolerance: number;

    /**
     * All equations to be solved
     */
    equations: Equation[];

    /**
     * Constraint equation solver base class.
     * @author schteppe / https://github.com/schteppe
     */
    constructor()
    {
        this.equations = [];
    }

    /**
     * Should be implemented in subclasses!
     * @param dt
     * @param world
     */
    solve(dt: number, world: { bodies: Body[] })
    {
        // Should return the number of iterations done!
        return 0;
    }

    /**
     * Add an equation
     * @param eq
     */
    addEquation(eq: Equation)
    {
        if (eq.enabled)
        {
            this.equations.push(eq);
        }
    }

    /**
     * Remove an equation
     * @param eq
     */
    removeEquation(eq: Equation)
    {
        var eqs = this.equations;
        var i = eqs.indexOf(eq);
        if (i !== -1)
        {
            eqs.splice(i, 1);
        }
    }

    /**
     * Add all equations
     */
    removeAllEquations()
    {
        this.equations.length = 0;
    }

}
