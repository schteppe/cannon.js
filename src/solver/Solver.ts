namespace CANNON
{
    export class Solver
    {
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
        solve(dt: number, world: World)
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
}