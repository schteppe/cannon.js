module.exports = Solver;

/**
 * Constraint equation solver base class.
 * @class Solver
 * @constructor
 * @author schteppe / https://github.com/schteppe
 */
function Solver(){
    // All equations to be solved
    this.equations = [];
};

// Should be implemented in subclasses!
Solver.prototype.solve = function(dt,world){
    // Should return the number of iterations done!
    return 0;
};

Solver.prototype.addEquation = function(eq){
    this.equations.push(eq);
};

Solver.prototype.removeEquation = function(eq){
    var eqs = this.equations;
    var i = eqs.indexOf(eq);
    if(i !== -1){
        eqs.splice(i,1);
    }
};

Solver.prototype.removeAllEquations = function(){
    this.equations.length = 0;
};

