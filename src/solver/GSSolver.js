/*global CANNON:true */

/**
 * @class CANNON.Solver
 * @brief Constraint equation Gauss-Seidel solver.
 * @todo The spook parameters should be specified for each constraint, not globally.
 * @author schteppe / https://github.com/schteppe
 * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
 * @extends CANNON.Solver
 */
CANNON.GSSolver = function(){
    CANNON.Solver.call(this);

    /**
    * @property int iterations
    * @brief The number of solver iterations determines quality of the constraints in the world. The more iterations, the more correct simulation. More iterations need more computations though. If you have a large gravity force in your world, you will need more iterations.
    * @todo write more about solver and iterations in the wiki
    * @memberof CANNON.GSSolver
    */
    this.iterations = 10;

    /**
     * When tolerance is reached, the system is assumed to be converged.
     * @property float tolerance
     */
    this.tolerance = 0;
};
CANNON.GSSolver.prototype = new CANNON.Solver();

CANNON.GSSolver.prototype.solve = function(dt,world){

    var d = this.d,
        ks = this.k,
        iter = 0,
        maxIter = this.iterations,
        tolSquared = this.tolerance*this.tolerance,
        a = this.a,
        b = this.b,
        equations = this.equations,
        Neq = equations.length,
        bodies = world.bodies,
        Nbodies = world.bodies.length,
        h = dt;

    // Things that does not change during iteration can be computed once
    var invCs = [];
    var Bs = [];

    // Create array for lambdas
    var lambda = [];
    for(var i=0; i!==Neq; i++){
        var c = equations[i];
        if(c.spookParamsNeedsUpdate){
            c.updateSpookParams(h);
            c.spookParamsNeedsUpdate = false;
        }
        lambda.push(0.0);
        Bs.push(c.computeB(h));
        invCs.push(1.0 / c.computeC());
    }

    var q, B, c, invC, deltalambda, deltalambdaTot, GWlambda, lambdaj;

    if(Neq !== 0){

        var i,j,abs=Math.abs;

        // Reset vlambda
        for(i=0; i!==Nbodies; i++){
            var b=bodies[i],
                vlambda=b.vlambda,
                wlambda=b.wlambda;
            vlambda.set(0,0,0);
            if(wlambda) wlambda.set(0,0,0);
        }

        // Iterate over equations
        for(iter=0; iter!==maxIter; iter++){

            // Accumulate the total error for each iteration.
            deltalambdaTot = 0.0;

            for(j=0; j!==Neq; j++){

                c = equations[j];

                // Compute iteration
                B = Bs[j];
                invC = invCs[j];
                lambdaj = lambda[j];
                GWlambda = c.computeGWlambda(c.eps);
                deltalambda = invC * ( B - GWlambda - c.eps * lambdaj );

                // Clamp if we are not within the min/max interval
                if(lambdaj + deltalambda < c.minForce){
                    deltalambda = c.minForce - lambdaj;
                } else if(lambdaj + deltalambda > c.maxForce){
                    deltalambda = c.maxForce - lambdaj;
                }
                lambda[j] += deltalambda;

                deltalambdaTot += abs(deltalambda);

                c.addToWlambda(deltalambda);
            }

            // If the total error is small enough - stop iterate
            if(deltalambdaTot*deltalambdaTot < tolSquared) break;
        }

        // Add result to velocity
        for(i=0; i!==Nbodies; i++){
            var b=bodies[i], v=b.velocity, w=b.angularVelocity;
            v.vadd(b.vlambda, v);
            if(w)
                w.vadd(b.wlambda, w);
        }
    }

    errorTot = deltalambdaTot;

    return iter; 
};
