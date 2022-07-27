import { World } from '../world/World';
import { Solver } from './Solver';

export class GSSolver extends Solver
{
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
        let iter = 0;
        const maxIter = this.iterations;
        const tolSquared = this.tolerance * this.tolerance;
        const equations = this.equations;
        const Neq = equations.length;
        const bodies = world.bodies;
        const Nbodies = bodies.length;
        const h = dt;
        // let q: any;
        let B: number; let invC: number; let deltalambda: number; let deltalambdaTot: number; let GWlambda: number;
        let lambdaj: number;

        // Update solve mass
        if (Neq !== 0)
        {
            for (let i = 0; i !== Nbodies; i++)
            {
                bodies[i].updateSolveMassProperties();
            }
        }

        // Things that does not change during iteration can be computed once
        const invCs = GSSolverSolveInvCs;
        const Bs = GSSolverSolveBs;
        const lambda = GSSolverSolveLambda;
        invCs.length = Neq;
        Bs.length = Neq;
        lambda.length = Neq;
        for (let i = 0; i !== Neq; i++)
        {
            const c = equations[i];
            lambda[i] = 0.0;
            Bs[i] = c.computeB(h, 0, 0);
            invCs[i] = 1.0 / c.computeC();
        }

        if (Neq !== 0)
        {
            // Reset vlambda
            for (let i = 0; i !== Nbodies; i++)
            {
                const b = bodies[i];
                const vlambda = b.vlambda;
                const wlambda = b.wlambda;
                vlambda.set(0, 0, 0);
                wlambda.set(0, 0, 0);
            }

            // Iterate over equations
            for (iter = 0; iter !== maxIter; iter++)
            {
                // Accumulate the total error for each iteration.
                deltalambdaTot = 0.0;

                for (let j = 0; j !== Neq; j++)
                {
                    const c = equations[j];

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
                    }
                    else if (lambdaj + deltalambda > c.maxForce)
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
            for (let i = 0; i !== Nbodies; i++)
            {
                const b = bodies[i];
                const v = b.velocity;
                const w = b.angularVelocity;

                b.vlambda.scaleTo(b.linearFactor, b.vlambda);
                v.addTo(b.vlambda, v);

                b.wlambda.scaleTo(b.angularFactor, b.wlambda);
                w.addTo(b.wlambda, w);
            }

            // Set the .multiplier property of each equation
            let l = equations.length;
            const invDt = 1 / h;
            while (l--)
            {
                equations[l].multiplier = lambda[l] * invDt;
            }
        }

        return iter;
    }
}

const GSSolverSolveLambda = []; // Just temporary number holders that we want to reuse each solve.
const GSSolverSolveInvCs = [];
const GSSolverSolveBs = [];
