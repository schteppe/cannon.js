/**
 * @class CANNON.GridBroadphase
 * @brief Axis aligned uniform grid broadphase.
 * @extends CANNON.Broadphase
 * @todo Needs support for more than just planes and spheres.
 * @param CANNON.Vec3 aabbMin
 * @param CANNON.Vec3 aabbMax
 * @param int nx Number of boxes along x
 * @param int ny Number of boxes along y
 * @param int nz Number of boxes along z
 */
CANNON.GridBroadphase = function(aabbMin,aabbMax,nx,ny,nz){
    CANNON.Broadphase.apply(this);
    this.nx = nx || 10;
    this.ny = ny || 10;
    this.nz = nz || 10;
    this.aabbMin = aabbMin || new CANNON.Vec3(100,100,100);
    this.aabbMax = aabbMax || new CANNON.Vec3(-100,-100,-100);
    this.bins = [];
};
CANNON.GridBroadphase.prototype = new CANNON.Broadphase();
CANNON.GridBroadphase.prototype.constructor = CANNON.GridBroadphase;

/**
 * @method collisionPairs
 * @memberof CANNON.GridBroadphase
 * @brief Get all the collision pairs in the physics world
 * @param CANNON.World world
 * @param Array pairs1
 * @param Array pairs2
 */
var GridBroadphase_collisionPairs_d = new CANNON.Vec3();
var GridBroadphase_collisionPairs_binPos = new CANNON.Vec3();
CANNON.GridBroadphase.prototype.collisionPairs = function(world,pairs1,pairs2){
    var N = world.numObjects(),
        bodies = world.bodies;

    var max = this.aabbMax,
        min = this.aabbMin,
        nx = this.nx,
        ny = this.ny,
        nz = this.nz;

    var xmax = max.x,
        ymax = max.y,
        zmax = max.z,
        xmin = min.x,
        ymin = min.y,
        zmin = min.z;

    var xmult = nx / (xmax-xmin),
        ymult = ny / (ymax-ymin),
        zmult = nz / (zmax-zmin);

    var binsizeX = (xmax - xmin) / nx,
        binsizeY = (ymax - ymin) / ny,
        binsizeZ = (zmax - zmin) / nz;

    var types = CANNON.Shape.types;
    var SPHERE =            types.SPHERE,
        PLANE =             types.PLANE,
        BOX =               types.BOX,
        COMPOUND =          types.COMPOUND,
        CONVEXPOLYHEDRON =  types.CONVEXPOLYHEDRON;

    var bins=this.bins,
        Nbins=nx*ny*nz;

    // Reset bins
    for(var i=bins.length-1; i!==Nbins; i++){
        bins.push([]);
    }
    for(var i=0; i!==Nbins; i++){
        bins[i].length = 0;
    }

    var floor = Math.floor;

    // Put all bodies into the bins
    for(var i=0; i!==N; i++){
        var bi = bodies[i];
        var si = bi.shape;

        switch(si.type){
        case SPHERE:
            // Put in bin
            // check if overlap with other bins
            var x = bi.position.x,
                y = bi.position.y,
                z = bi.position.z;
            var r = si.radius;

            var xi1 = floor(xmult * (x-r - xmin)),
                yi1 = floor(ymult * (y-r - ymin)),
                zi1 = floor(zmult * (z-r - zmin)),
                xi2 = floor(xmult * (x+r - xmin)),
                yi2 = floor(ymult * (y+r - ymin)),
                zi2 = floor(zmult * (z+r - zmin));

            for(var j=xi1; j!==xi2+1; j++){
                for(var k=yi1; k!==yi2+1; k++){
                    for(var l=zi1; l!==zi2+1; l++){
                        var xi = j,
                            yi = k,
                            zi = l;
                        var idx = xi * ( ny - 1 ) * ( nz - 1 ) + yi * ( nz - 1 ) + zi;
                        if(idx >= 0 && idx < Nbins){
                            bins[ idx ].push( bi );
                        }
                    }
                }
            }
            break;

        case PLANE:
            // Put in all bins for now
            // @todo put only in bins that are actually intersecting the plane
            var d = GridBroadphase_collisionPairs_d;
            var binPos = GridBroadphase_collisionPairs_binPos;
            var binRadiusSquared = (binsizeX*binsizeX + binsizeY*binsizeY + binsizeZ*binsizeZ) * 0.25;

            var planeNormal = si.worldNormal;
            if(si.worldNormalNeedsUpdate){
                si.computeWorldNormal(bi.quaternion);
            }

            for(var j=0; j!==nx; j++){
                for(var k=0; k!==ny; k++){
                    for(var l=0; l!==nz; l++){
                        var xi = j,
                            yi = k,
                            zi = l;

                        binPos.set(xi*binsizeX+xmin, yi*binsizeY+ymin, zi*binsizeZ+zmin);
                        binPos.vsub(bi.position, d);

                        if(d.dot(planeNormal) < binRadiusSquared){
                            var idx = xi * ( ny - 1 ) * ( nz - 1 ) + yi * ( nz - 1 ) + zi;
                            bins[ idx ].push( bi );
                        }
                    }
                }
            }
            break;

        default:
            console.warn("Shape "+si.type+" not supported in GridBroadphase!");
            break;
        }
    }

    // Check each bin
    for(var i=0; i!==Nbins; i++){
        var bin = bins[i];

        // Do N^2 broadphase inside
        for(var j=0, NbodiesInBin=bin.length; j!==NbodiesInBin; j++){
            var bi = bin[j];

            for(var k=0; k!==j; k++){
                var bj = bin[k];
                if(this.needBroadphaseCollision(bi,bj)){
                    this.intersectionTest(bi,bj,pairs1,pairs2);
                }
            }
        }
    }

    this.makePairsUnique(pairs1,pairs2);
};
