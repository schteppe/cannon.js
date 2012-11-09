/**
 * @class CANNON.ContactConstraint
 * @brief Contact constraint class
 * @author schteppe
 * @param CANNON.RigidBody bodyA
 * @param CANNON.RigidBody bodyB
 * @param float friction
 * @extends CANNON.Constraint
 * @todo integrate with the World class
 */
CANNON.ContactConstraint = function(bodyA,bodyB,slipForce){
    CANNON.Constraint.call(this);
    this.body_i = bodyA;
    this.body_j = bodyB;
    this.contact = contact;
    this.slipForce = slipForce;
    this.unused_equations = [];
    this.temp = {
        rixn:new CANNON.Vec3(),
        rjxn:new CANNON.Vec3(),
        t1:new CANNON.Vec3(),
        t2:new CANNON.Vec3()
    };
};

CANNON.ContactConstraint.prototype = new CANNON.Constraint();
CANNON.ContactConstraint.prototype.constructor = CANNON.ContactConstraint;

CANNON.ContactConstraint.prototype.update = function(){

    /*
    if(friction>0.0){
    for(var i=0; i<3; i++)
    this.equations.push(new CANNON.Equation(bodyA,bodyB)); // Normal+2tangents
    } else
    this.equations.push(new CANNON.Equation(bodyA,bodyB)); // Normal
    */

    var bi = this.body_i,
        bj = this.body_j;

    var vi = bi.velocity,
        wi = bi.angularVelocity,
        vj = bj.velocity,
        wj = bj.angularVelocity;

    var tangents = [this.temp.t1, this.temp.t2];
    for(var i in bi.contacts){
        for(var j in bj.contacts){
            if(bi.contacts[i].to.id==bj.id && bj.contacts[j].to.id==bi.id){
                var ri = bi.contacts[i].r,
                    rj = bj.contacts[j].r,
                    ni = bi.contacts[i].n; // normals should be the same anyways

                n.tangents(tangents[0],tangents[1]);
                
                var v_contact_i = vi.vadd(wi.cross(c.ri));
                var v_contact_j = vj.vadd(wj.cross(c.rj));
                var u_rel = v_contact_j.vsub(v_contact_i);
                var w_rel = wj.cross(c.rj).vsub(wi.cross(c.ri));
                
                var u = (vj.vsub(vi));
                var uw = (c.rj.cross(wj)).vsub(c.ri.cross(wi));
                u.vsub(uw,u);
                
                // Get mass properties
                var iMi = bi.invMass;
                var iMj = bj.invMass;
                var iIxi = bi.invInertia.x;
                var iIyi = bi.invInertia.y;
                var iIzi = bi.invInertia.z;
                var iIxj = bj.invInertia.x;
                var iIyj = bj.invInertia.y;
                var iIzj = bj.invInertia.z;
                
                // Add contact constraint
                var rixn = this.temp.rixn;
                var rjxn = this.temp.rjxn;
                c.ri.cross(n,rixn);
                c.rj.cross(n,rjxn);
                
                var un_rel = n.mult(u_rel.dot(n));
                var u_rixn_rel = rixn.unit().mult(w_rel.dot(rixn.unit()));
                var u_rjxn_rel = rjxn.unit().mult(-w_rel.dot(rjxn.unit()));
                
                var gn = c.ni.mult(g);
                
                // Jacobian, eq. 25 in spooknotes
                n.negate(eq.G1);
                rixn.negate(eq.G2);
                n.copy(eq.G3);
                rjxn.copy(eq.G4);
                
                eq.setDefaultMassProps();
                
                // g - constraint violation / gap
                gn.negate(eq.g1);
                gn.copy(eq.g3);
                
                // W
                un_rel.negate(eq.W1);
                un_rel.copy(eq.W3);

                // External force - forces & torques
                bi.force.copy(eq.f1);
                bi.tau.copy(eq.f2);
                bj.force.copy(eq.f3);
                bj.tau.copy(eq.f4);

                eq.lambdamin = 0;
                eq.lambdamax = 'inf';
                /*
              // Friction constraints
              if(mu>0.0){
                var g = that.gravity.norm();
                for(var ti=0; ti<tangents.length; ti++){
                  var t = tangents[ti];
                  var rixt = c.ri.cross(t);
                  var rjxt = c.rj.cross(t);
                  
                  var ut_rel = t.mult(u_rel.dot(t));
                  var u_rixt_rel = rixt.unit().mult(u_rel.dot(rixt.unit()));
                  var u_rjxt_rel = rjxt.unit().mult(-u_rel.dot(rjxt.unit()));
                  this.solver
                .addConstraint( // Non-penetration constraint jacobian
                           [-t.x,-t.y,-t.z,
                        -rixt.x,-rixt.y,-rixt.z,
                        t.x,t.y,t.z,
                        rjxt.x,rjxt.y,rjxt.z
                        ],
                           
                           // Inverse mass matrix
                           [iMi,iMi,iMi,
                        iIxi,iIyi,iIzi,
                        iMj,iMj,iMj,
                        iIxj,iIyj,iIzj],
                           
                           // g - constraint violation / gap
                           [0,0,0,
                              0,0,0,
                        0,0,0,
                        0,0,0],
                           
                           [-ut_rel.x,-ut_rel.y,-ut_rel.z,
                        0,0,0,//-u_rixt_rel.x,-u_rixt_rel.y,-u_rixt_rel.z,
                        ut_rel.x,ut_rel.y,ut_rel.z,
                              0,0,0//u_rjxt_rel.x,u_rjxt_rel.y,u_rjxt_rel.z
                        ],
                           
                           // External force - forces & torques
                           [bi.force.x,bi.force.y,bi.force.z,
                        bi.tau.x,bi.tau.y,bi.tau.z,
                        bj.force.x,bj.force.y,bj.force.z,
                        bj.tau.x,bj.tau.y,bj.tau.z],
                           
                           -mu*g*(bi.mass+bj.mass),
                           mu*g*(bi.mass+bj.mass),
                           
                           i,
                           j);
                           }
                           }
                */
            }
        }
    }
};
