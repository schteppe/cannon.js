/*global CANNON:true */

CANNON.SplitSolver = function(subsolver){
    CANNON.Solver.call(this);
    this.subsolver = subsolver;
};
CANNON.SplitSolver.prototype = new CANNON.Solver();

CANNON.SplitSolver.prototype.solve = function(dt,world){
    var islands=[], subsolver=this.subsolver;

    for(var i=0; i<this.equations.length; i++){
        var eq = this.equations[i];

        // Is any of the bodies inside an island?
        var island_bi, island_bj, STATIC = CANNON.Body.STATIC;
        for(var j=0; j<islands.length && !island_bi && !island_bj; j++){
            var island = islands[j];
            //if(!(eq.bi.motionstate & STATIC) && !(eq.bj.motionstate & STATIC)){
                if(island.bodies.indexOf(eq.bi) != -1) island_bi = island;
                if(island.bodies.indexOf(eq.bj) != -1) island_bj = island;
            //}
        }

        if(island_bi && island_bj && island_bi.id!=island_bj.id){
            console.log("Merge");
            // Merge the two islands and add the constraint to that
            var island = island_bi;
            island.bodies = island.bodies.concat(island_bj.bodies);
            island.equations = island.equations.concat(island_bj.equations);
            island.equations.push(eq);
            if(island.bodies.indexOf(eq.bi) == -1) island.bodies.push(eq.bi);
            if(island.bodies.indexOf(eq.bj) == -1) island.bodies.push(eq.bj);
            // Kill the old
            islands.splice(islands.indexOf(island_bj),1);

        } else if(island_bi && island_bj){
            //console.log("Add, found bodies "+eq.bi.id+" and "+eq.bj.id+" in same island",island_bi,island_bj);
            // Found both bodies in the same island. Add the constraint to there
            var island = island_bi;

            // Check if the same bodies are participating in the constraint
            var found = false;
            for(var k=0; k<island.equations.length; k++){
                var eqj = island.equations[k];
                // If there is an equation with the same body pair, add!
                if( (eqj.bi.id == eq.bi.id && eqj.bj.id == eq.bj.id) ||  (eqj.bi.id == eq.bj.id && eqj.bj.id == eq.bi.id)){
                    found = true;
                }
            }
            if(found){
                console.log("Pair bodies!",eq);
                island.equations.push(eq);
                if(island.bodies.indexOf(eq.bi) == -1) island.bodies.push(eq.bi);
                if(island.bodies.indexOf(eq.bj) == -1) island.bodies.push(eq.bj);
            } else {
                console.log("Non Pair bodies!",eq);
                // add new island
                var island2 = {equations:[eq],bodies:[eq.bi,eq.bj],id:islands.length};
                islands.push(island2);
            }


        } else if((island_bi && !island_bj) || (!island_bi && island_bj)){
            //console.log("Add",island_bi,island_bj);
            // Found one body in one island. Add the constraint to there
            var island = island_bi || island_bj;
            island.equations.push(eq);
            if(island.bodies.indexOf(eq.bi) == -1) island.bodies.push(eq.bi);
            if(island.bodies.indexOf(eq.bj) == -1) island.bodies.push(eq.bj);
        } else {
            //console.log("Create");
            // Didn't find the constraint anywhere... Add a new island
            var island = {equations:[eq],bodies:[eq.bi,eq.bj],id:islands.length};
            islands.push(island);
        }
    }

    // Solve each island
    console.log(islands.length+" islands");

    for(var i=0; i<islands.length; i++){
        var island = islands[i];
        // Add all equations
        for(var j=0; j<island.equations.length; j++)
            subsolver.addEquation(island.equations[j]);
        var iter = subsolver.solve(dt,{bodies:island.bodies});
        //console.log(iter);
        subsolver.removeAllEquations();
    }

    //if(islands.length) console.log(islands);

    return 0;
};
