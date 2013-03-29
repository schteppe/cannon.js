/**
 * @class CANNON.SPHSystem
 * @brief Smoothed-particle hydrodynamics system
 */
CANNON.SPHSystem = function(){
    this.particles = [];
    this.density = 1; // kg/m3
    this.smoothingRadius = 1; // Adjust so there are about 15-20 neighbor particles within this radius
    this.speedOfSound = 1;
    this.viscosity = 0.01;
    this.eps = 0.000001;

    // Stuff Computed per particle
    this.pressures = [];
    this.densities = [];
    this.neighbors = [];
}

CANNON.SPHSystem.prototype.add = function(particle){
    this.particles.push(particle);
    if(this.neighbors.length < this.particles.length)
        this.neighbors.push([]);
};

CANNON.SPHSystem.prototype.remove = function(particle){
    var idx = this.particles.indexOf(particle);
    if(idx !== -1){
        this.particles.splice(idx,1);
        if(this.neighbors.length > this.particles.length)
            this.neighbors.pop();
    }
};

/**
 * Get neighbors within smoothing volume, save in the array neighbors
 * @param CANNON.Body particle
 * @param Array neighbors
 */
var SPHSystem_getNeighbors_dist = vec3.create();
CANNON.SPHSystem.prototype.getNeighbors = function(particle,neighbors){
    var N = this.particles.length,
        id = particle.id,
        R2 = this.smoothingRadius * this.smoothingRadius,
        dist = SPHSystem_getNeighbors_dist;
    for(var i=0; i!==N; i++){  
        var p = this.particles[i];
        vec3.subtract(dist, p.position, particle.position); //p.position.vsub(particle.position,dist);
        if(id!==p.id && vec3.squaredLength(dist) < R2){
            neighbors.push(p);
        }
    }
};

// Temp vectors for calculation
var SPHSystem_update_dist = vec3.create(),
    SPHSystem_update_a_pressure = vec3.create(),
    SPHSystem_update_a_visc = vec3.create(),
    SPHSystem_update_gradW = vec3.create(),
    SPHSystem_update_r_vec = vec3.create(),
    SPHSystem_update_u = vec3.create(); // Relative velocity
CANNON.SPHSystem.prototype.update = function(){
    var N = this.particles.length,
        dist = SPHSystem_update_dist,
        cs = this.speedOfSound,
        eps = this.eps;

    for(var i=0; i!==N; i++){
        var p = this.particles[i]; // Current particle
        var neighbors = this.neighbors[i];

        // Get neighbors
        neighbors.length = 0;
        this.getNeighbors(p,neighbors);
        neighbors.push(this.particles[i]); // Add current too
        var numNeighbors = neighbors.length;
        
        // Accumulate density for the particle
        var sum = 0.0;
        for(var j=0; j!==numNeighbors; j++){
            
            //printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
            vec3.subtract(dist, p.position, neighbors[j].position); //p.position.vsub(neighbors[j].position, dist);
            var len = vec3.length(dist);//dist.norm();

            var weight = this.w(len);
            sum += neighbors[j].mass * weight;
        }

        // Save 
        this.densities[i] = sum;
        this.pressures[i] = cs * cs * (this.densities[i] - this.density);
    }

    // Add forces

    // Sum to these accelerations
    var a_pressure= SPHSystem_update_a_pressure;
    var a_visc =    SPHSystem_update_a_visc;
    var gradW =     SPHSystem_update_gradW;
    var r_vec =     SPHSystem_update_r_vec;
    var u =         SPHSystem_update_u;

    for(var i=0; i!==N; i++){
        
        var particle = this.particles[i];

        vec3.set(a_pressure,0,0,0);
        vec3.set(a_visc,0,0,0);
        
        // Init vars
        var Pij;
        var nabla;
        var Vij;
        
        // Sum up for all other neighbors
        var neighbors = this.neighbors[i];
        var numNeighbors = neighbors.length;

        //printf("Neighbors: ");
        for(var j=0; j!==numNeighbors; j++){
            
            var neighbor = neighbors[j];
            //printf("%d ",nj);
            
            // Get r once for all..
            vec3.subtract(r_vec, particle.position, neighbor.position);//particle.position.vsub(neighbor.position,r_vec);
            var r = vec3.length(r_vec);//.norm();
            
            // Pressure contribution
            Pij = -neighbor.mass * (this.pressures[i] / (this.densities[i]*this.densities[i] + eps) + this.pressures[j] / (this.densities[j]*this.densities[j] + eps));
            this.gradw(r_vec, gradW);
            // Add to pressure acceleration
            vec3.scale(gradW, gradW, Pij);//gradW.mult(Pij , gradW)
            vec3.add(a_pressure, a_pressure, gradW);//a_pressure.vadd(gradW, a_pressure);
            
            // Viscosity contribution
            vec3.subtract(u, neighbor.velocity, particle.velocity);// neighbor.velocity.vsub(particle.velocity, u);
            vec3.scale(u, u, 1.0 / (0.0001+this.densities[i] * this.densities[j]) * this.viscosity * neighbor.mass);//u.mult( 1.0 / (0.0001+this.densities[i] * this.densities[j]) * this.viscosity * neighbor.mass , u );
            nabla = this.nablaw(r);
            vec3.scale(u,u,nabla);//u.mult(nabla,u);
            // Add to viscosity acceleration
            vec3.add(a_visc, a_visc, u);//a_visc.vadd( u, a_visc );
        }
        
        // Calculate force
        vec3.scale(a_visc, a_visc, particle.mass); //a_visc.mult(particle.mass, a_visc);
        vec3.scale(a_pressure,a_pressure,particle.mass);//a_pressure.mult(particle.mass, a_pressure);

        // Add force to particles
        vec3.add(particle.force, particle.force, a_visc );//particle.force.vadd(a_visc, particle.force);
        vec3.add(particle.force,particle.force,a_pressure);//particle.force.vadd(a_pressure, particle.force);
    }
};

// Calculate the weight using the W(r) weightfunction
CANNON.SPHSystem.prototype.w = function(r){
    // 315
    var h = this.smoothingRadius;
    return 315.0/(64.0*Math.PI*Math.pow(h,9)) * Math.pow(h*h-r*r,3);
};

// calculate gradient of the weight function
CANNON.SPHSystem.prototype.gradw = function(rVec,resultVec){
    var r = vec3.length(rVec);//.norm(),
        h = this.smoothingRadius;
    vec3.scale(resultVec, rVec, 945.0/(32.0*Math.PI*Math.pow(h,9)) * Math.pow((h*h-r*r),2)); //rVec.mult(945.0/(32.0*Math.PI*Math.pow(h,9)) * Math.pow((h*h-r*r),2) , resultVec);
};

// Calculate nabla(W)
CANNON.SPHSystem.prototype.nablaw = function(r){
    var h = this.smoothingRadius;
    var nabla = 945.0/(32.0*Math.PI*Math.pow(h,9)) * (h*h-r*r)*(7*r*r - 3*h*h);
    return nabla;
};
