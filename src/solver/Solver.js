/**
 * Constraint solver.
 * @todo The spook parameters should be specified for each constraint, not globally.
 * @author schteppe / https://github.com/schteppe
 */
CANNON.Solver = function(a,b,eps,k,d,iter,h){
  this.iter = iter || 10;
  this.h = h || 1.0/60.0;
  this.a = a;
  this.b = b;
  this.eps = eps;
  this.k = k;
  this.d = d;
  this.reset(0);
  this.debug = false;

  if(this.debug)
    console.log("a:",a,"b",b,"eps",eps,"k",k,"d",d);
};

/**
 * Resets the solver, removes all constraints and prepares for a new round of solving
 * @param int numbodies The number of bodies in the new system
 * @todo vlambda does not need to be instantiated again if the number of bodies is the same. Set to zero instead.
 */
CANNON.Solver.prototype.reset = function(numbodies){
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

  // Create new arrays or reuse the ones that exists?
  if(numbodies && (this.vxlambda==undefined || this.vxlambda.length!=numbodies)){
    this.vxlambda = new Float32Array(numbodies);
    this.vylambda = new Float32Array(numbodies);
    this.vzlambda = new Float32Array(numbodies);
    this.wxlambda = new Float32Array(numbodies);
    this.wylambda = new Float32Array(numbodies);
    this.wzlambda = new Float32Array(numbodies);
  } else if(this.vxlambda!=undefined && this.vxlambda.length==numbodies){
    for(var i=0; i<this.vxlambda.length; i++){
      this.vxlambda[i] = 0.0;
      this.vylambda[i] = 0.0;
      this.vzlambda[i] = 0.0;
      this.wxlambda[i] = 0.0;
      this.wylambda[i] = 0.0;
      this.wzlambda[i] = 0.0;
    }
  }
};

/**
 * Add a constraint to the solver
 * @param array G Jacobian vector, 12 elements (6 dof per body)
 * @param array MinvTrace The trace of the Inverse mass matrix (12 elements). The mass matrix is 12x12 elements from the beginning and 6x6 matrix per body (mass matrix and inertia matrix).
 * @param array q The constraint violation vector in generalized coordinates (12 elements)
 * @param array qdot The time-derivative of the constraint violation vector q.
 * @param array Fext External forces (12 elements)
 * @param float lower Lower constraint force bound
 * @param float upper Upper constraint force bound
 * @param int body_i The first rigid body index
 * @param int body_j The second rigid body index - set to -1 if none
 * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
 */
CANNON.Solver.prototype.addConstraint = function(G,MinvTrace,q,qdot,Fext,lower,upper,body_i,body_j){
  if(this.debug){
    console.log("Adding constraint ",this.n);
    console.log("G:",G);
    console.log("q:",q);
    console.log("qdot:",qdot);
    console.log("Fext:",Fext);
  }
  
  for(var i=0; i<12; i++){
    this.q.push(q[i]);
    this.qdot.push(qdot[i]);
    this.MinvTrace.push(MinvTrace[i]);
    this.G.push(G[i]);
    this.Fext.push(Fext[i]);

    this.upper.push(upper);
    this.hasupper.push(!isNaN(upper));
    this.lower.push(lower);
    this.haslower.push(!isNaN(lower));
  }

  this.i.push(body_i);
  this.j.push(body_j);

  this.n += 1;

  // Return result index
  return this.n - 1; 
};

/**
 * Add a non-penetration constraint to the solver
 * @param Vec3 ni
 * @param Vec3 ri
 * @param Vec3 rj
 * @param Vec3 iMi
 * @param Vec3 iMj
 * @param Vec3 iIi
 * @param Vec3 iIj
 * @param Vec3 v1
 * @param Vec3 v2
 * @param Vec3 w1
 * @param Vec3 w2
 */
CANNON.Solver.prototype.addNonPenetrationConstraint
  = function(i,j,xi,xj,ni,ri,rj,iMi,iMj,iIi,iIj,vi,vj,wi,wj,fi,fj,taui,tauj){
  
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
 * Solves the system, and sets the vlambda and wlambda properties of the Solver object
 */
CANNON.Solver.prototype.solve = function(){
  this.i = new Int16Array(this.i);
  var n = this.n;
  var lambda = new Float32Array(n);
  var dlambda = new Float32Array(n);
  var ulambda = new Float32Array(12*n); // 6 dof per constraint, and 2 bodies
  var B = new Float32Array(n);
  var c = new Float32Array(n);
  var precomp = new Int16Array(n);
  var G = new Float32Array(this.G);
  for(var k = 0; k<this.iter; k++){
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
	for(var i=0; i<12; i++){
	  var addi = l12+i;
	  G_Minv_Gt += G[addi] * this.MinvTrace[addi] * G[addi];
	  Gq +=        G[addi] * this.q[addi];
	  GW +=        G[addi] * this.qdot[addi];
	  GMinvf +=    G[addi] * this.MinvTrace[addi] * this.Fext[addi];
	}
	c[l] = 1.0 / (G_Minv_Gt + this.eps); // 1.0 / ( G*Minv*Gt + eps)
	B[l] = ( - this.a * Gq
		 - this.b * GW
		 - this.h * GMinvf);
	precomp[l] = 1;

	if(this.debug){
	  console.log("G_Minv_Gt["+l+"]:",G_Minv_Gt);
	  console.log("Gq["+l+"]:",Gq);
	  console.log("GW["+l+"]:",GW);
	  console.log("GMinvf["+l+"]:",GMinvf);
	}
      }

      var Gulambda = 0.0;
      /*
      for(var i=0; i<12; i++)
	Gulambda +=  this.G[i + l12] * ulambda[i + l12];
      */
      Gulambda += G[0+l12] * this.vxlambda[body_i]; // previuously calculated lambdas
      Gulambda += G[1+l12] * this.vylambda[body_i];
      Gulambda += G[2+l12] * this.vzlambda[body_i];
      Gulambda += G[3+l12] * this.wxlambda[body_i];
      Gulambda += G[4+l12] * this.wylambda[body_i];
      Gulambda += G[5+l12] * this.wzlambda[body_i];

      Gulambda += G[6+l12] * this.vxlambda[body_j];
      Gulambda += G[7+l12] * this.vylambda[body_j];
      Gulambda += G[8+l12] * this.vzlambda[body_j];
      Gulambda += G[9+l12] * this.wxlambda[body_j];
      Gulambda += G[10+l12] * this.wylambda[body_j];
      Gulambda += G[11+l12] * this.wzlambda[body_j];

      dlambda[l] = c[l] * ( B[l] - Gulambda - this.eps * lambda[l]);
      if(this.debug)
	console.log("dlambda["+l+"]=",dlambda[l]);
      lambda[l] = lambda[l] + dlambda[l];

      // Clamp lambda if out of bounds
      // @todo check if limits are numbers
      if(this.haslower[l] && lambda[l]<this.lower[l]){
	if(this.debug)
	  console.log("hit lower bound for constraint "+l+", truncating "+lambda[l]+" to "+this.lower[l]);
	lambda[l] = this.lower[l];
	dlambda[l] = this.lower[l]-lambda[l];
      }
      if(this.hasupper && lambda[l]>this.upper[l]){
	if(this.debug)
	  console.log("hit upper bound for constraint "+l+", truncating "+lambda[l]+" to "+this.upper[l]);
	lambda[l] = this.upper[l];
	dlambda[l] = this.upper[l]-lambda[l];
      }

      // Add velocity changes to keep track of them
      /*
      for(var i=0; i<12; i++)
	ulambda[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
      */
      this.vxlambda[body_i] += dlambda[l] * this.MinvTrace[l12+0] * G[l12+0];
      this.vylambda[body_i] += dlambda[l] * this.MinvTrace[l12+1] * G[l12+1];
      this.vzlambda[body_i] += dlambda[l] * this.MinvTrace[l12+2] * G[l12+2];
      this.wxlambda[body_i] += dlambda[l] * this.MinvTrace[l12+3] * G[l12+3];
      this.wylambda[body_i] += dlambda[l] * this.MinvTrace[l12+4] * G[l12+4];
      this.wzlambda[body_i] += dlambda[l] * this.MinvTrace[l12+5] * G[l12+5];

      this.vxlambda[body_j] += dlambda[l] * this.MinvTrace[l12+6] * G[l12+6];
      this.vylambda[body_j] += dlambda[l] * this.MinvTrace[l12+7] * G[l12+7];
      this.vzlambda[body_j] += dlambda[l] * this.MinvTrace[l12+8] * G[l12+8];
      this.wxlambda[body_j] += dlambda[l] * this.MinvTrace[l12+9] * G[l12+9];
      this.wylambda[body_j] += dlambda[l] * this.MinvTrace[l12+10] * G[l12+10];
      this.wzlambda[body_j] += dlambda[l] * this.MinvTrace[l12+11] * G[l12+11];

        /*
	ulambda_i[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
	ulambda_j[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
	*/
    }
  }

  if(this.debug)
    for(var l=0; l<n; l++)
      console.log("ulambda["+l+"]=",
		  ulambda[l*12+0],
		  ulambda[l*12+1],
		  ulambda[l*12+2],
		  ulambda[l*12+3],
		  ulambda[l*12+4],
		  ulambda[l*12+5],
		  ulambda[l*12+6],
		  ulambda[l*12+7],
		  ulambda[l*12+8],
		  ulambda[l*12+9],
		  ulambda[l*12+10],
		  ulambda[l*12+11]);
  this.result = ulambda;
};
