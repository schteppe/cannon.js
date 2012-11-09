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
    this.k = 1000;

    /**
    * @property float d
    * @brief SPOOK parameter, similar to damping
    * @memberof CANNON.Solver
    */
    this.d = 4;

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

    this.setSpookParams(this.k,this.d);
    this.reset(0);

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

/**
 * @method reset
 * @memberof CANNON.Solver
 * @brief Resets the solver, removes all constraints and prepares for a new round of solving
 * @param int numbodies The number of bodies in the new system
 * @todo vlambda does not need to be instantiated again if the number of bodies is the same. Set to zero instead.
 */
CANNON.Solver.prototype.reset = function(numbodies){

    // Don't know number of constraints yet... Use dynamic arrays
    this.G = [];
    this.MinvTrace = [];
    this.Fext = [];
    this.q = [];
    this.qdot = [];
    this.n = 0;
    this.upper = [];
    this.lower = [];
    this.hasupper = [];
    this.haslower = [];
    this.i = []; // To keep track of body id's
    this.j = [];

    this.vxlambda = [];
    this.vylambda = [];
    this.vzlambda = [];
    this.wxlambda = [];
    this.wylambda = [];
    this.wzlambda = [];
    for(var i=0; i<numbodies; i++){
        this.vxlambda.push(0);
        this.vylambda.push(0);
        this.vzlambda.push(0);
        this.wxlambda.push(0);
        this.wylambda.push(0);
        this.wzlambda.push(0);
    }
};

/**
 * @method addConstraint
 * @memberof CANNON.Solver
 * @brief Add a constraint to the solver
 * @param array G Jacobian vector, 12 elements (6 dof per body)
 * @param array MinvTrace The trace of the Inverse mass matrix (12 elements). The mass matrix is 12x12 elements from the beginning and 6x6 matrix per body (mass matrix and inertia matrix).
 * @param array q The constraint violation vector in generalized coordinates (12 elements)
 * @param array qdot The time-derivative of the constraint violation vector q.
 * @param array Fext External forces (12 elements)
 * @param float lower Lower constraint force bound
 * @param float upper Upper constraint force bound
 * @param int body_i The first body index
 * @param int body_j The second body index - set to -1 if none
 * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
 */
CANNON.Solver.prototype.addConstraint = function(G,MinvTrace,q,qdot,Fext,lower,upper,body_i,body_j){
    if(this.debug){
        console.log("Adding constraint l=",this.n," between body ",body_i," and ",body_j);
        console.log("G:",G);
        console.log("q:",q);
        console.log("qdot:",qdot);
        console.log("Fext:",Fext);
        console.log("lower:",lower);
        console.log("upper:",upper);
    }

    for(var i=0; i<12; i++){
        this.q.push(q[i]);
        this.qdot.push(qdot[i]);
        this.MinvTrace.push(MinvTrace[i]);
        this.G.push(G[i]);
        this.Fext.push(Fext[i]);
    }

    this.upper.push(upper);
    this.hasupper.push(!isNaN(upper));
    this.lower.push(lower);
    this.haslower.push(!isNaN(lower));

    this.i.push(body_i);
    this.j.push(body_j);

    this.n += 1;

    // Return result index
    return this.n - 1; 
};

/**
 * @method addConstraint2
 * @memberof CANNON.Solver
 * @brief New version of the addConstraint function, still experimental
 * @param CANNON.Constraint c
 * @param int i
 * @param int j
 */
CANNON.Solver.prototype.addConstraint2 = function(c,i,j){
  c.update();
  for(var k=0; k<c.equations.length; k++){
    var e = c.equations[k];
    this.addConstraint([e.G1.x,e.G1.y,e.G1.z,
                        e.G2.x,e.G2.y,e.G2.z,
                        e.G3.x,e.G3.y,e.G3.z,
                        e.G4.x,e.G4.y,e.G4.z],

                        [e.iM1.x,e.iM1.y,e.iM1.z,
                        e.iM2.x,e.iM2.y,e.iM2.z,
                        e.iM3.x,e.iM3.y,e.iM3.z,
                        e.iM4.x,e.iM4.y,e.iM4.z],

                        [e.g1.x,e.g1.y,e.g1.z,
                        e.g2.x,e.g2.y,e.g2.z,
                        e.g3.x,e.g3.y,e.g3.z,
                        e.g4.x,e.g4.y,e.g4.z],

                        [e.W1.x,e.W1.y,e.W1.z,
                        e.W2.x,e.W2.y,e.W2.z,
                        e.W3.x,e.W3.y,e.W3.z,
                        e.W4.x,e.W4.y,e.W4.z],

                        [e.f1.x,e.f1.y,e.f1.z,
                        e.f2.x,e.f2.y,e.f2.z,
                        e.f3.x,e.f3.y,e.f3.z,
                        e.f4.x,e.f4.y,e.f4.z],

                        e.lambdamin,
                        e.lambdamax,

                        i,
                        j);
    }
};


/**
 * @method addNonPenetrationConstraint
 * @memberof CANNON.Solver
 * @brief Add a non-penetration constraint to the solver
 * @param CANNON.Vec3 ni
 * @param CANNON.Vec3 ri
 * @param CANNON.Vec3 rj
 * @param CANNON.Vec3 iMi
 * @param CANNON.Vec3 iMj
 * @param CANNON.Vec3 iIi
 * @param CANNON.Vec3 iIj
 * @param CANNON.Vec3 v1
 * @param CANNON.Vec3 v2
 * @param CANNON.Vec3 w1
 * @param CANNON.Vec3 w2
 */
CANNON.Solver.prototype.addNonPenetrationConstraint = function(i,j,xi,xj,ni,ri,rj,iMi,iMj,iIi,iIj,vi,vj,wi,wj,fi,fj,taui,tauj){
  
    var rxn = ri.cross(ni);
    var u = vj.vsub(vi); // vj.vadd(rj.cross(wj)).vsub(vi.vadd(ri.cross(wi)));

    // g = ( xj + rj - xi - ri ) .dot ( ni )
    var qvec = xj.vadd(rj).vsub(xi.vadd(ri));
    var q = qvec.dot(ni);

    if(q<0.0){
        if(this.debug){
          console.log("i:",i,"j",j,"xi",xi.toString(),"xj",xj.toString());
          console.log("ni",ni.toString(),"ri",ri.toString(),"rj",rj.toString());
          console.log("iMi",iMi.toString(),"iMj",iMj.toString(),"iIi",iIi.toString(),"iIj",iIj.toString(),"vi",vi.toString(),"vj",vj.toString(),"wi",wi.toString(),"wj",wj.toString(),"fi",fi.toString(),"fj",fj.toString(),"taui",taui.toString(),"tauj",tauj.toString());
        }
        this.addConstraint( // Non-penetration constraint jacobian
                            [ -ni.x,  -ni.y,  -ni.z,
                              -rxn.x, -rxn.y, -rxn.z,
                              ni.x,   ni.y,   ni.z,
                              rxn.x,  rxn.y,  rxn.z],
                            
                            // Inverse mass matrix & inertia
                            [iMi.x, iMi.y, iMi.z,
                             iIi.z, iIi.y, iIi.z,
                             iMj.x, iMj.y, iMj.z,
                             iIj.z, iIj.y, iIj.z],
                            
                            // q - constraint violation
                            [-qvec.x,-qvec.y,-qvec.z,
                             0,0,0,
                             qvec.x,qvec.y,qvec.z,
                             0,0,0],
                            
                            // qdot - motion along penetration normal
                            [-u.x, -u.y, -u.z,
                             0,0,0,
                             u.x, u.y, u.z,
                             0,0,0],
                            
                            // External force - forces & torques
                            [fi.x,fi.y,fi.z,
                             taui.x,taui.y,taui.z,
                             fj.x,fj.y,fj.z,
                             tauj.x,tauj.y,tauj.z],
                            
                            0,
                            'inf',
                            i,
                            j);
    }
};

/**
 * @method solve
 * @memberof CANNON.Solver
 * @brief Solves the system, and sets the vlambda and wlambda properties of the Solver object
 */
CANNON.Solver.prototype.solve = function(){
    var n = this.n,
        lambda = [],
        dlambda = [],
        ulambda = [],
        B = [],
        c = [],
        precomp = [],
        iterations = this.iterations,
        G = this.G,
        debug = this.debug,
        a = this.a,
        eps = this.eps;

    var lower = this.lower,
        haslower = this.haslower,
        upper = this.upper,
        hasupper = this.hasupper;

    var vxlambda = this.vxlambda,
        vylambda = this.vylambda,
        vzlambda = this.vzlambda,
        wxlambda = this.wxlambda,
        wylambda = this.wylambda,
        wzlambda = this.wzlambda;
    var MinvTrace = this.MinvTrace;

    for(var i=0; i<n; i++){
        lambda.push(0);
        dlambda.push(0);
        B.push(0);
        c.push(0);
        precomp.push(0);
        for(var j=0; j<12; j++)
            dlambda.push(0);
    }

    for(var k = 0; k<iterations; k++){
        for(var l=0; l<n; l++){

            // Bodies participating in constraint
            var body_i = this.i[l];
            var body_j = this.j[l];

            var l12 = 12*l;

            if(!precomp[l]){
                // Precompute constants c[l] and B[l] for contact l
                var G_Minv_Gt = 0.0;
                var Gq = 0.0;
                var GW = 0.0;
                var GMinvf = 0.0;
                // Only add normal contributions here? See eq. 27 in spooknotes
                for(var i=0; i<12; i++){
                    var addi = l12+i;
                    G_Minv_Gt += G[addi] * MinvTrace[addi] * G[addi];
                    Gq +=        G[addi] * this.q[addi];
                    GW +=        G[addi] * this.qdot[addi];
                    GMinvf +=    G[addi] * MinvTrace[addi] * this.Fext[addi];
                }
                c[l] = 1.0 / (G_Minv_Gt + eps); // 1.0 / ( G*Minv*Gt + eps)
                B[l] = ( - a * Gq
                         - this.b * GW
                         - this.h * GMinvf);
                precomp[l] = 1;

                if(debug){
                    console.log("G_Minv_Gt[l="+l+"]:",G_Minv_Gt);
                    console.log("Gq[l="+l+"]:",Gq);
                    console.log("GW[l="+l+"]:",GW);
                    console.log("GMinvf[l="+l+"]:",GMinvf);
                }
            }

            var Gulambda = 0.0;

            //console.log("debuuug2.1",vxlambda[0],Gulambda,body_i);
            if(body_i>=0){
                Gulambda += G[0+l12] * vxlambda[body_i]; // previuously calculated lambdas
                Gulambda += G[1+l12] * vylambda[body_i];
                Gulambda += G[2+l12] * vzlambda[body_i];
                Gulambda += G[3+l12] * wxlambda[body_i];
                Gulambda += G[4+l12] * wylambda[body_i];
                Gulambda += G[5+l12] * wzlambda[body_i];
                if(debug && isNaN(Gulambda))
                    console.log("found NaN Gulambda",vxlambda);
            }

            if(body_j!==-1){
                Gulambda += G[6+l12] * vxlambda[body_j];
                Gulambda += G[7+l12] * vylambda[body_j];
                Gulambda += G[8+l12] * vzlambda[body_j];
                Gulambda += G[9+l12] * wxlambda[body_j];
                Gulambda += G[10+l12] * wylambda[body_j];
                Gulambda += G[11+l12] * wzlambda[body_j];
            }

            dlambda[l] = c[l] * ( B[l] - Gulambda - eps * lambda[l]);
            if(debug)
                console.log("dlambda["+l+"]=",dlambda[l],"rest = ",c[l],B[l],Gulambda,eps,lambda[l],l,body_i,body_j);
            lambda[l] = lambda[l] + dlambda[l];

            // Clamp lambda if out of bounds
            // @todo check if limits are numbers
            if(haslower[l] && lambda[l]<lower[l]){
                if(debug)
                    console.log("hit lower bound for constraint "+l+", truncating "+lambda[l]+" to the bound "+lower[l]);
                lambda[l] = lower[l];
                dlambda[l] = lower[l]-lambda[l];
            }
            if(hasupper && lambda[l]>upper[l]){
                if(debug)
                    console.log("hit upper bound for constraint "+l+", truncating "+lambda[l]+" to the bound "+upper[l]);
                lambda[l] = upper[l];
                dlambda[l] = upper[l]-lambda[l];
            }

            // Add velocity changes to keep track of them
            if(body_i!==-1){
                vxlambda[body_i] += dlambda[l] * MinvTrace[l12+0] * G[l12+0];
                vylambda[body_i] += dlambda[l] * MinvTrace[l12+1] * G[l12+1];
                vzlambda[body_i] += dlambda[l] * MinvTrace[l12+2] * G[l12+2];
                wxlambda[body_i] += dlambda[l] * MinvTrace[l12+3] * G[l12+3];
                wylambda[body_i] += dlambda[l] * MinvTrace[l12+4] * G[l12+4];
                wzlambda[body_i] += dlambda[l] * MinvTrace[l12+5] * G[l12+5];
            }
            if(body_j!==-1){
                vxlambda[body_j] += dlambda[l] * MinvTrace[l12+6] * G[l12+6];
                vylambda[body_j] += dlambda[l] * MinvTrace[l12+7] * G[l12+7];
                vzlambda[body_j] += dlambda[l] * MinvTrace[l12+8] * G[l12+8];
                wxlambda[body_j] += dlambda[l] * MinvTrace[l12+9] * G[l12+9];
                wylambda[body_j] += dlambda[l] * MinvTrace[l12+10] * G[l12+10];
                wzlambda[body_j] += dlambda[l] * MinvTrace[l12+11] * G[l12+11];
            }
        }
    }

    if(debug)
        for(var i=0; i<this.vxlambda.length; i++)
            console.log("dv["+i+"]=",
                          vxlambda[i],
                          vylambda[i],
                          vzlambda[i],
                          wxlambda[i],
                          wylambda[i],
                          wzlambda[i]);
};
