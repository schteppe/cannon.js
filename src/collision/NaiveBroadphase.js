/**
 * Naive broadphase implementation, used in lack of better ones and for
 * comparisons in performance tests.
 *
 * The naive broadphase looks at all possible pairs without restriction,
 * therefore it has complexity N^2 (which is really bad)
 */
CANNON.NaiveBroadphase = function(){
  
};

CANNON.NaiveBroadphase.prototype = new CANNON.Broadphase();
CANNON.NaiveBroadphase.prototype.constructor = CANNON.NaiveBroadphase;

/**
 * Get all the collision pairs in a physics world
 * @param World world
 * @todo Should be placed in a subclass to BroadPhase
 */
CANNON.NaiveBroadphase.prototype.collisionPairs = function(){
  var world = this.world;
  var pairs1 = [];
  var pairs2 = [];
  var n = world.numObjects();

  // Local fast access
  var SPHERE = CANNON.Shape.types.SPHERE;
  var PLANE =  CANNON.Shape.types.PLANE;
  var BOX =    CANNON.Shape.types.BOX;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var type = world.type;
  var body = world.body;

  // Naive N^2 ftw!
  for(var i=0; i<n; i++){
    for(var j=0; j<i; j++){

      // --- Sphere-sphere ---
      if(type[i]==SPHERE && type[j]==SPHERE){
	var r2 = (body[i]._shape.radius + body[j]._shape.radius);
	if(Math.abs(x[i]-x[j]) < r2 && 
	   Math.abs(y[i]-y[j]) < r2 && 
	   Math.abs(z[i]-z[j]) < r2){
	  pairs1.push(i);
	  pairs2.push(j);
	}

      // --- Sphere-plane ---
      } else if((type[i]==SPHERE && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==SPHERE)){
	var si = type[i]==SPHERE ? i : j;
	var pi = type[i]==PLANE ? i : j;
	
	// Rel. position
	var r = new CANNON.Vec3(x[si]-x[pi],
				y[si]-y[pi],
				z[si]-z[pi]);
	var normal = body[pi]._shape.normal;
	var q = r.dot(normal)-body[si]._shape.radius;
	if(q<0.0){
	  pairs1.push(i);
	  pairs2.push(j);
	}
	
	// --- Box-plane ---
      } else if((type[i]==BOX && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==BOX)){
	var bi = type[i]==BOX   ? i : j;
	var pi = type[i]==PLANE ? i : j;
	
	// Rel. position
	var r = new CANNON.Vec3(x[bi]-x[pi],
				y[bi]-y[pi],
				z[bi]-z[pi]);
	var normal = body[pi]._shape.normal;
	var d = r.dot(normal); // Distance from box center to plane
	var boundingRadius = body[bi]._shape.halfExtents.norm();
	var q = d - boundingRadius;
	if(q<0.0){
	  pairs1.push(i);
	  pairs2.push(j);
	}

	// --- Box-box ---
      } else if((type[i]==BOX && type[j]==BOX) ||
		(type[i]==BOX && type[j]==BOX)){
	// Rel. position
	var r = new CANNON.Vec3(x[j]-x[i],
				y[j]-y[i],
				z[j]-z[i]);
	var boundingRadius1 = body[i]._shape.halfExtents.norm();
	var boundingRadius2 = body[j]._shape.halfExtents.norm();
	if(r.norm()<(boundingRadius1+boundingRadius2)){
	  pairs1.push(i);
	  pairs2.push(j);
	}

	// --- box-sphere ---
      } else if((type[i]==BOX && type[j]==SPHERE) ||
		(type[i]==SPHERE && type[j]==BOX)){
	// Rel. position
	var r = new CANNON.Vec3(x[j]-x[i],
				y[j]-y[i],
				z[j]-z[i]);
	if(type[i]==BOX){
	  boundingRadius1 = body[i]._shape.halfExtents.norm();
	  boundingRadius2 = body[j]._shape.radius;
	} else {
	  boundingRadius1 = body[j]._shape.halfExtents.norm();
	  boundingRadius2 = body[i]._shape.radius;
	}
	if(r.norm()<(boundingRadius1+boundingRadius2)){
	  pairs1.push(i);
	  pairs2.push(j);
	}
      }
    }
  }
  return [pairs1,pairs2];
};
