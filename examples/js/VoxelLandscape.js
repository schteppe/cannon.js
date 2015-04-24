/**
 * @author schteppe / https://github.com/schteppe
 */
var VoxelLandscape = function ( world, nx, ny, nz, sx, sy, sz ) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;

    this.sx = sx;
    this.sy = sy;
    this.sz = sz;

    this.world = world;
    this.map = [];
    this.boxified = [];
    this.boxes = [];
    this.boxShape = new CANNON.Box(new CANNON.Vec3(sx*0.5,sy*0.5,sz*0.5));

    var map = this.map,
        boxes = this.boxes,
        boxified = this.boxified;

    // Prepare map
    for(var i=0; i!==nx; i++){
        for(var j=0; j!==ny; j++){
            for(var k=0; k!==nz; k++){
                map.push(true);
                boxified.push(false);
            }
        }
    }

    // User must manually update the map for the first time.
};

VoxelLandscape.prototype.getBoxIndex = function(xi,yi,zi){
    var nx = this.nx,
        ny = this.ny,
        nz = this.nz;
    if( xi>=0 && xi<nx &&
        yi>=0 && yi<ny &&
        zi>=0 && zi<nz)
        return xi + nx * yi + nx * ny * zi;
    else
        return -1;
};

VoxelLandscape.prototype.setFilled = function(xi,yi,zi,filled){
    var i = this.getBoxIndex(xi,yi,zi);
    if(i!==-1)
        this.map[ i ] = !!filled;
};

VoxelLandscape.prototype.isFilled = function(xi,yi,zi){
    var i = this.getBoxIndex(xi,yi,zi);
    if(i!==-1)
        return this.map[ i ];
    else
        return false;
};

VoxelLandscape.prototype.isBoxified = function(xi,yi,zi){
    var i = this.getBoxIndex(xi,yi,zi);
    if(i!==-1)
        return this.boxified[ i ];
    else
        return false;
};

VoxelLandscape.prototype.setBoxified = function(xi,yi,zi,boxified){
    return this.boxified[ this.getBoxIndex(xi,yi,zi) ] = !!boxified;
};

// Updates "boxes"
VoxelLandscape.prototype.update = function(){
    var map = this.map,
        boxes = this.boxes,
        world = this.world,
        boxified = this.boxified,
        nx = this.nx,
        ny = this.ny,
        nz = this.nz;

    // Remove all old boxes
    for(var i=0; i!==boxes.length; i++){
        world.remove(boxes[i]);
    }
    boxes.length = 0;

    // Set whole map to unboxified
    for(var i=0; i!==boxified.length; i++){
        boxified[i] = false;
    }

    while(true){
        var box;

        // 1. Get a filled box that we haven't boxified yet
        for(var i=0; !box && i<nx; i++){
            for(var j=0; !box && j<ny; j++){
                for(var k=0; !box && k<nz; k++){
                    if(this.isFilled(i,j,k) && !this.isBoxified(i,j,k)){
                        box = new CANNON.Body({ mass: 0 });
                        box.xi = i; // Position
                        box.yi = j;
                        box.zi = k;
                        box.nx = 0; // Size
                        box.ny = 0;
                        box.nz = 0;
                        this.boxes.push(box);
                    }
                }
            }
        }

        // 2. Check if we can merge it with its neighbors
        if(box){

            // Check what can be merged
            var xi = box.xi,
                yi = box.yi,
                zi = box.zi;
            box.nx = nx, // merge=1 means merge just with the self box
            box.ny = ny,
            box.nz = nz;

            // Merge in x
            for(var i=xi; i<nx+1; i++){
                if(!this.isFilled(i,yi,zi) || (this.isBoxified(i,yi,zi) && this.getBoxIndex(i,yi,zi)!==-1)){
                    // Can't merge this box. Make sure we limit the mergeing
                    box.nx = i-xi;
                    break;
                }
            }

            // Merge in y
            var found = false;
            for(var i=xi; !found && i<xi+box.nx; i++){
                for(var j=yi; !found && j<ny+1; j++){
                    if(!this.isFilled(i,j,zi) || (this.isBoxified(i,j,zi) && this.getBoxIndex(i,j,zi)!==-1)){
                        // Can't merge this box. Make sure we limit the mergeing
                        if(box.ny>j-yi) box.ny = j-yi;
                    }
                }
            }

            // Merge in z
            found = false;
            for(var i=xi; !found && i<xi+box.nx; i++){
                for(var j=yi; !found && j<yi+box.ny; j++){
                    for(var k=zi; k<nz+1; k++){
                        if(!this.isFilled(i,j,k) || (this.isBoxified(i,j,k) && this.getBoxIndex(i,j,k)!==-1)){
                            // Can't merge this box. Make sure we limit the mergeing
                            if(box.nz>k-zi) box.nz = k-zi;
                        }
                    }
                }
            }

            if(box.nx==0) box.nx = 1;
            if(box.ny==0) box.ny = 1;
            if(box.nz==0) box.nz = 1;

            // Set the merged boxes as boxified
            for(var i=xi; i<xi+box.nx; i++){
                for(var j=yi; j<yi+box.ny; j++){
                    for(var k=zi; k<zi+box.nz; k++){
                        if( i >= xi && i<=xi+box.nx &&
                            j >= yi && j<=yi+box.ny &&
                            k >= zi && k<=zi+box.nz){
                            this.setBoxified(i,j,k,true);
                        }
                    }
                }
            }

            box = false;
        } else {
            break;
        }
    }

    // Set box positions
    var sx = this.sx,
        sy = this.sy,
        sz = this.sz;
    for(var i=0; i<this.boxes.length; i++){
        var b = this.boxes[i];
        b.position.set(
            b.xi * sx + b.nx*sx*0.5,
            b.yi * sy + b.ny*sy*0.5,
            b.zi * sz + b.nz*sz*0.5
        );

        // Replace box shapes
        b.addShape(new CANNON.Box(new CANNON.Vec3(b.nx*sx*0.5, b.ny*sy*0.5, b.nz*sz*0.5)));
        //b.aabbNeedsUpdate = true;
        world.addBody(b);
        //this.boxes.push(box);
    }
};
