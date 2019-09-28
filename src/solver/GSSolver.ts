namespace CANNON
{
    export class GSSolver extends Solver
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
         * Constraint equation Gauss-Seidel solver.
         * @todo The spook parameters should be specified for each constraint, not globally.
         * @author schteppe / https://github.com/schteppe
         * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
         */
        constructor()
        {
            super();

            this.iterations = 10;
            this.tolerance = 1e-7;
        }

        solve(dt: number, world: World)
        {
            var iter = 0,
                maxIter = this.iterations,
                tolSquared = this.tolerance * this.tolerance,
                equations = this.equations,
                Neq = equations.length,
                bodies = world.bodies,
                Nbodies = bodies.length,
                h = dt,
                q, B, invC, deltalambda, deltalambdaTot, GWlambda, lambdaj;

            // Update solve mass
            if (Neq !== 0)
            {
                for (var i = 0; i !== Nbodies; i++)
                {
                    bodies[i].updateSolveMassProperties();
                }
            }

            // Things that does not change during iteration can be computed once
            var invCs = GSSolver_solve_invCs,
                Bs = GSSolver_solve_Bs,
                lambda = GSSolver_solve_lambda;
            invCs.length = Neq;
            Bs.length = Neq;
            lambda.length = Neq;
            for (var i = 0; i !== Neq; i++)
            {
                var c = equations[i];
                lambda[i] = 0.0;
                Bs[i] = c.computeB(h, 0, 0);
                invCs[i] = 1.0 / c.computeC();
            }

            if (Neq !== 0)
            {

                // Reset vlambda
                for (var i = 0; i !== Nbodies; i++)
                {
                    var b = bodies[i],
                        vlambda = b.vlambda,
                        wlambda = b.wlambda;
                    vlambda.set(0, 0, 0);
                    wlambda.set(0, 0, 0);
                }

                // Iterate over equations
                for (iter = 0; iter !== maxIter; iter++)
                {

                    // Accumulate the total error for each iteration.
                    deltalambdaTot = 0.0;

                    for (var j = 0; j !== Neq; j++)
                    {

                        var c = equations[j];

                        // Compute iteration
                        B = Bs[j];
                        invC = invCs[j];
                        lambdaj = lambda[j];
                        GWlambda = c.computeGWlambda();
                        deltalambda = invC * (B - GWlambda - c.eps * lambdaj);

                        // Clamp if we are not within the min/max interval
                        if (lambdaj + deltalambda < c.minForce)
                        {
                            deltalambda = c.minForce - lambdaj;
                        } else if (lambdaj + deltalambda > c.maxForce)
                        {
                            deltalambda = c.maxForce - lambdaj;
                        }
                        lambda[j] += deltalambda;

                        deltalambdaTot += deltalambda > 0.0 ? deltalambda : -deltalambda; // abs(deltalambda)

                        c.addToWlambda(deltalambda);
                    }

                    // If the total error is small enough - stop iterate
                    if (deltalambdaTot * deltalambdaTot < tolSquared)
                    {
                        break;
                    }
                }

                // Add result to velocity
                for (var i = 0; i !== Nbodies; i++)
                {
                    var b = bodies[i],
                        v = b.velocity,
                        w = b.angularVelocity;

                    b.vlambda.vmul(b.linearFactor, b.vlambda);
                    v.vadd(b.vlambda, v);

                    b.wlambda.vmul(b.angularFactor, b.wlambda);
                    w.vadd(b.wlambda, w);
                }

                // Set the .multiplier property of each equation
                var l = equations.length;
                var invDt = 1 / h;
                while (l--)
                {
                    equations[l].multiplier = lambda[l] * invDt;
                }
            }

            return iter;
        }

    }

    var GSSolver_solve_lambda = []; // Just temporary number holders that we want to reuse each solve.
    var GSSolver_solve_invCs = [];
    var GSSolver_solve_Bs = [];
}