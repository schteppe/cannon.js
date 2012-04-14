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
 * @return array An array containing two arrays of integers. The integers corresponds to the body indeces.
 */
CANNON.NaiveBroadphase.prototype.collisionPairs = function(){
  var world = this.world;
  var pairs1 = [];
  var pairs2 = [];
  var n = world.numObjects();

  // Local fast access
  var SPHERE =   CANNON.Shape.types.SPHERE;
  var PLANE =    CANNON.Shape.types.PLANE;
  var BOX =      CANNON.Shape.types.BOX;
  var COMPOUND = CANNON.Shape.types.COMPOUND;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var qx = world.qx;
  var qy = world.qy;
  var qz = world.qz;
  var qw = world.qw;
  var type = world.type;
  var body = world.body;

  // Temp vecs
  var r = this.temp.r;
  var normal = this.temp.normal;
  var quat = this.temp.quat;

  // Naive N^2 ftw!
  for(var i=0; i<n; i++){
    for(var j=0; j<i; j++){

      // --- Box / sphere / compound collision ---
      if((type[i]==BOX      && type[j]==BOX) ||
	 (type[i]==BOX      && type[j]==COMPOUND) ||
	 (type[i]==BOX      && type[j]==SPHERE) ||
	 (type[i]==SPHERE   && type[j]==BOX) ||
	 (type[i]==SPHERE   && type[j]==SPHERE) ||
	 (type[i]==SPHERE   && type[j]==COMPOUND) ||
	 (type[i]==COMPOUND && type[j]==COMPOUND) ||
	 (type[i]==COMPOUND && type[j]==SPHERE) ||
	 (type[i]==COMPOUND && type[j]==BOX)){
	// Rel. position
	r.set(x[j]-x[i],
	      y[j]-y[i],
	      z[j]-z[i]);
	var boundingRadius1 = body[i]._shape.boundingSphereRadius();
	var boundingRadius2 = body[j]._shape.boundingSphereRadius();
	if(r.norm()<(boundingRadius1+boundingRadius2)){
	  pairs1.push(i);
	  pairs2.push(j);
	}

      // --- Sphere/box/compound versus plane ---
      } else if((type[i]==SPHERE && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==SPHERE) ||

		(type[i]==BOX && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==BOX) ||

		(type[i]==COMPOUND && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==COMPOUND)){

	var pi = type[i]==PLANE ? i : j, // Plane
	  oi = type[i]!=PLANE ? i : j; // Other
	  
	  // Rel. position
	r.set(x[oi]-x[pi],
	      y[oi]-y[pi],
	      z[oi]-z[pi]);
	quat.set(qx[pi],qy[pi],qz[pi],qw[pi]);
	quat.vmult(body[pi]._shape.normal,normal);
	var q = r.dot(normal)-body[oi]._shape.boundingSphereRadius();
	if(q<0.0){
	  pairs1.push(i);
	  pairs2.push(j);
	}
      }
    }
  }
  return [pairs1,pairs2];
};
