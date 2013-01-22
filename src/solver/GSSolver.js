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
    * @property float h
    * @brief Time step size. The larger timestep, the less computationally heavy will your simulation be. But watch out, you don't want your bodies to tunnel each instead of colliding!
    * @memberof CANNON.GSSolver
    */
    this.h = 1.0/60.0;

    /**
    * @property float k
    * @brief SPOOK parameter, spring stiffness
    * @memberof CANNON.Solver
    */
    this.k = 1e7;

    /**
    * @property float d
    * @brief SPOOK parameter, similar to damping
    * @memberof CANNON.GSSolver
    */
    this.d = 5;

    /**
    * @property float a
    * @brief SPOOK parameter
    * @memberof CANNON.GSSolver
    */
    this.a = 0.0;

    /**
    * @property float b
    * @brief SPOOK parameter
    * @memberof CANNON.GSSolver
    */
    this.b = 0.0;

    /**
    * @property float eps
    * @brief SPOOK parameter
    * @memberof CANNON.GSSolver
    */
    this.eps = 0.0;

    /**
     * When tolerance is reached, the system is assumed to be converged.
     * @property float tolerance
     */
    this.tolerance = 0;

    this.setSpookParams(this.k,this.d);

    /**
    * @property bool debug
    * @brief Debug flag, will output solver data to console if true
    * @memberof CANNON.GSSolver
    */
    this.debug = false;

    if(this.debug)
        console.log("a:",this.a,"b",this.b,"eps",this.eps,"k",this.k,"d",this.d);
};
CANNON.GSSolver.prototype = new CANNON.Solver();

/**
 * @method setSpookParams
 * @memberof CANNON.GSSolver
 * @brief Sets the SPOOK parameters k and d, and updates the other parameters a, b and eps accordingly.
 * @param float k
 * @param float d
 */
CANNON.GSSolver.prototype.setSpookParams = function(k,d){
    var h=this.h;
    this.k = k;
    this.d = d;
    this.a = 4.0 / (h * (1 + 4 * d));
    this.b = (4.0 * d) / (1 + 4 * d);
    this.eps = 4.0 / (h * h * k * (1 + 4 * d));
};


CANNON.GSSolver.prototype.solve = function(dt,world){

    var d = this.d,
        ks = this.k,
        iter = 0,
        maxIter = this.iterations,
        tol = this.tolerance,
        a = this.a,
        b = this.b,
        eps = this.eps,
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
    for(var i=0; i<Neq; i++){
        var c = equations[i];
        lambda.push(0.0);
        Bs.push(c.computeB(a,b,h));
        invCs.push(1.0 / c.computeC(eps));
    }

    var q, B, c, invC, deltalambda, deltalambdaTot, GWlambda;

    if(Neq > 0){

        var i,j,abs=Math.abs;

        // Reset vlambda
        for(i=0; i<Nbodies; i++){
            var b = bodies[i];
            b.vlambda.set(0,0,0);
            if(b.wlambda) b.wlambda.set(0,0,0);
        }

        // Iterate over equations
        for(iter=0; iter<maxIter; iter++){

            // Accumulate the total error for each iteration.
            deltalambdaTot = 0.0;

            for(j=0; j<Neq; j++){

                c = equations[j];

                // Compute iteration
                B = Bs[j];
                invC = invCs[j];
                GWlambda = c.computeGWlambda(eps);
                deltalambda = invC * ( B - GWlambda - eps * lambda[j] );

                if(lambda[j] + deltalambda < c.minForce || lambda[j] + deltalambda > c.maxForce){
                    deltalambda = -lambda[j];
                }
                lambda[j] += deltalambda;

                deltalambdaTot += abs(deltalambda);

                c.addToWlambda(deltalambda);
            }

            // If the total error is small enough - stop iterate
            if(deltalambdaTot < tol) break;
        }

        // Add result to velocity
        for(i=0; i<Nbodies; i++){
            var b = bodies[i];
            b.velocity.vadd(b.vlambda, b.velocity);
            if(b.angularVelocity)
                b.angularVelocity.vadd(b.wlambda, b.angularVelocity);
        }
    }

    errorTot = deltalambdaTot;

    return iter; 
};
