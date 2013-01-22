/*global CANNON:true */

CANNON.SplitSolver = function(subsolver){
    CANNON.Solver.call(this);
    this.subsolver = subsolver;
};
CANNON.SplitSolver.prototype = new CANNON.Solver();

// Returns the number of subsystems
CANNON.SplitSolver.prototype.solve = function(dt,world){
    var nodes=[],
        bodies=world.bodies,
        equations=this.equations,
        Neq=equations.length,
        Nbodies=bodies.length,
        subsolver=this.subsolver;
    for(var i=0; i<Nbodies; i++)
        nodes.push({ body:bodies[i], children:[], eqs:[], visited:false });
    for(var k=0; k<Neq; k++){
        var eq=equations[k],
            i=bodies.indexOf(eq.bi),
            j=bodies.indexOf(eq.bj),
            ni=nodes[i],
            nj=nodes[j];
        ni.children.push(nj);
        ni.eqs.push(eq);
        nj.children.push(ni);
        nj.eqs.push(eq);
    }

    var STATIC = CANNON.Body.STATIC;
    function getUnvisitedNode(nodes){
        var N = nodes.length;
        for(var i=0; i<N; i++){
            var node = nodes[i];
            if(!node.visited && !(node.body.motionstate & STATIC))
                return node;
        }
        return false;
    }

    function bfs(root,visitFunc){
        var queue = [];
        queue.push(root);
        root.visited = true;
        visitFunc(root);
        while(queue.length) {
            var node = queue.pop();
            // Loop over unvisited child nodes
            var child;
            while((child = getUnvisitedNode(node.children))) {
                child.visited = true;
                visitFunc(child);
                queue.push(child);
            }
        }
    }

    var child, n=0;
    while((child = getUnvisitedNode(nodes))){
        var eqs=[], bds=[];
        bfs(child,function(node){
            bds.push(node.body);
            for(var i=0; i<node.eqs.length; i++)
                if(eqs.indexOf(node.eqs[i]) == -1)
                    eqs.push(node.eqs[i]);
        });

        for(var i=0; i<eqs.length; i++)
            subsolver.addEquation(eqs[i]);

        var iter = subsolver.solve(dt,{bodies:bds});
        subsolver.removeAllEquations();
        n++;
    }

    return n;
};
