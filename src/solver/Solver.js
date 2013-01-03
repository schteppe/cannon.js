/*global CANNON:true */

/**
 * @class CANNON.Solver
 * @brief Constraint solver.
 * @todo The spook parameters should be specified for each constraint, not globally.
 * @author schteppe / https://github.com/schteppe
 * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
 */
CANNON.Solver = function(){

    /**
    * @property int iterations
    * @brief The number of solver iterations determines quality of the constraints in the world. The more iterations, the more correct simulation. More iterations need more computations though. If you have a large gravity force in your world, you will need more iterations.
    * @todo write more about solver and iterations in the wiki
    * @memberof CANNON.Solver
    */
    this.iterations = 10;

    /**
    * @property float h
    * @brief Time step size. The larger timestep, the less computationally heavy will your simulation be. But watch out, you don't want your bodies to tunnel each instead of colliding!
    * @memberof CANNON.Solver
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
    * @memberof CANNON.Solver
    */
    this.d = 5;

    /**
    * @property float a
    * @brief SPOOK parameter
    * @memberof CANNON.Solver
    */
    this.a = 0.0;

    /**
    * @property float b
    * @brief SPOOK parameter
    * @memberof CANNON.Solver
    */
    this.b = 0.0;

    /**
    * @property float eps
    * @brief SPOOK parameter
    * @memberof CANNON.Solver
    */
    this.eps = 0.0;

    /**
     * When tolerance is reached, the system is assumed to be converged.
     * @property float tolerance
     */
    this.tolerance = 0;
    this.constraints = [];

    this.setSpookParams(this.k,this.d);

    /**
    * @property bool debug
    * @brief Debug flag, will output solver data to console if true
    * @memberof CANNON.Solver
    */
    this.debug = false;

    if(this.debug)
        console.log("a:",this.a,"b",this.b,"eps",this.eps,"k",this.k,"d",this.d);
};

/**
 * @method setSpookParams
 * @memberof CANNON.Solver
 * @brief Sets the SPOOK parameters k and d, and updates the other parameters a, b and eps accordingly.
 * @param float k
 * @param float d
 */
CANNON.Solver.prototype.setSpookParams = function(k,d){
    var h=this.h;
    this.k = k;
    this.d = d;
    this.a = 4.0 / (h * (1 + 4 * d));
    this.b = (4.0 * d) / (1 + 4 * d);
    this.eps = 4.0 / (h * h * k * (1 + 4 * d));
};


CANNON.Solver.prototype.solve = function(dt,world){

    var d = this.d;
    var ks = this.k;
    var iter = 0;
    var maxIter = this.iterations;
    var tol = this.tolerance;
    var a = this.a;
    var b = this.b;
    var eps = this.eps;
    var constraints = this.constraints;
    var Nc = constraints.length;
    var bodies = world.bodies;
    var h = dt;

    // Things that does not change during iteration can be computed once
    var Cs = [];
    var Bs = [];

    // Create array for lambdas
    var lambda = [];
    for(var i=0; i<Nc; i++){
        var c = constraints[i];
        lambda.push(0.0);
        Bs.push(c.computeB(a,b,h));
        Cs.push(c.computeC(eps));
    }

    // Each body has a lambdaVel property that we will delete later..
    var q;               //Penetration depth
    var B;
    var deltalambda;
    var deltalambdaTot;

    if(Nc > 0){

        // Reset vlambda
        for(var i=0; i<bodies.length; i++){
            var b = bodies[i];
            b.vlambda.set(0,0,0);
            if(b.wlambda) b.wlambda.set(0,0,0);
        }

        // Iterate over constraints
        for(iter=0; iter<maxIter; iter++){

            // Accumulate the total error for each iteration.
            deltalambdaTot = 0.0;

            for(var j=0; j<Nc; j++){

                var c = constraints[j];

                // Compute iteration
                B = Bs[j];
                var C = Cs[j];
                var GWlambda = c.computeGWlambda(eps);
                deltalambda = ( 1.0 / C ) * ( B - GWlambda - eps * lambda[j] );

                if(lambda[j] + deltalambda < c.minForce || lambda[j] + deltalambda > c.maxForce){
                    deltalambda = -lambda[j];
                }
                lambda[j] += deltalambda;

                deltalambdaTot += Math.abs(deltalambda);

                c.addToWlambda(deltalambda);
            }

            // If the total error is small enough - stop iterate
            if(deltalambdaTot < tol) break;
        }

        // Add result to velocity
        for(var i=0; i<bodies.length; i++){
            var b = bodies[i];
            b.velocity.vadd(b.vlambda, b.velocity);
            if(b.angularVelocity)
                b.angularVelocity.vadd(b.wlambda, b.angularVelocity);
        }
    }

    errorTot = deltalambdaTot;

    return iter; 
};

CANNON.Solver.prototype.addConstraint = function(constraint){
    this.constraints.push(constraint);
};

CANNON.Solver.prototype.removeConstraint = function(constraint){
    var i = this.constraints.indexOf(constraint);
    if(i!=-1)
        this.constraints.splice(i,1);
};

CANNON.Solver.prototype.removeAllConstraints = function(){
    this.constraints = [];
};

