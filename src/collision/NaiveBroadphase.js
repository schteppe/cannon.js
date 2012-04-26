/*global CANNON:true */

/**
 * @class CANNON.NaiveBroadphase
 * @brief Naive broadphase implementation, used in lack of better ones. The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
 * @extends CANNON.Broadphase
 */
CANNON.NaiveBroadphase = function(){
  this.temp = {
    r: new CANNON.Vec3(),
    normal: new CANNON.Vec3(),
    quat: new CANNON.Quaternion()
  };
};
CANNON.NaiveBroadphase.prototype = new CANNON.Broadphase();
CANNON.NaiveBroadphase.prototype.constructor = CANNON.NaiveBroadphase;

/**
 * @fn collisionPairs
 * @memberof CANNON.NaiveBroadphase
 * @brief Get all the collision pairs in the physics world
 * @param CANNON.World world
 * @return array An array containing two arrays of integers. The integers corresponds to the body indices.
 */
CANNON.NaiveBroadphase.prototype.collisionPairs = function(world){
  var pairs1 = [], pairs2 = [];
  var n = world.numObjects(),
  bodies = world.bodies;

  // Local fast access
  var types = CANNON.Shape.types;
  var BOX_SPHERE_COMPOUND = types.SPHERE | types.BOX | types.COMPOUND,
  PLANE = types.PLANE;

  // Temp vecs
  var r = this.temp.r;
  var normal = this.temp.normal;
  var quat = this.temp.quat;

  // Naive N^2 ftw!
  for(var i=0; i<n; i++){
    for(var j=0; j<i; j++){

      var bi = bodies[i], bj = bodies[j];
      if(bi.fixed && bj.fixed)
	continue; // We do not want to collide two static bodies

      var ti = bi.shape.type, tj = bj.shape.type;

      // --- Box / sphere / compound collision ---
      if((ti & BOX_SPHERE_COMPOUND) && (tj & BOX_SPHERE_COMPOUND)){

	// Rel. position
	bj.position.vsub(bi.position,r);

	var boundingRadius1 = bi.shape.boundingSphereRadius();
	var boundingRadius2 = bj.shape.boundingSphereRadius();
	if(r.norm()<(boundingRadius1+boundingRadius2)){
	  pairs1.push(i);
	  pairs2.push(j);
	}

      // --- Sphere/box/compound versus plane ---
      } else if((ti & BOX_SPHERE_COMPOUND) && (tj & types.PLANE) || 
		(tj & BOX_SPHERE_COMPOUND) && (ti & types.PLANE)){
	var pi = ti==PLANE ? i : j, // Plane
	  oi = ti!=PLANE ? i : j; // Other
	  
	  // Rel. position
	bodies[oi].position.vsub(bodies[pi].position,r);
	bodies[pi].quaternion.vmult(bodies[pi].shape.normal,normal);
	
	var q = r.dot(normal) - bodies[oi].shape.boundingSphereRadius();
	if(q<0.0){
	  pairs1.push(i);
	  pairs2.push(j);
	}
      }
    }
  }
  return [pairs1,pairs2];
};
