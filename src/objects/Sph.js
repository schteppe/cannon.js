/*global CANNON:true */






/*
  --- Warning: work in progress! ---
  Quickly copy/pasted and javascriptified from my C++ version.
  Ideas: 
  * Create class SPHParticle that inherits from Body or even Particle
  * Possibly create an utilities class for SPH too, or perhaps this should be handled by the World?
  
*/






/**
 * @class CANNON.SPH
 * @brief Smoothed-particle hydrodynamics liquid
 */
CANNON.SPH = function(){
    
}

// add an SPH fluid to the simulation
// Belongs to world?
CANNON.SPH.prototype.addSPH(l, u, nx, ny, nz, density, dyn_visc, speed_of_sound){

    var num_particles = nx*ny*nz;
    
    // Create broadphase
    sph_broadphase = new BroadPhase(5,5,5,l.x(),l.y(),l.z(),u.x(),u.y(),u.z());
    w.addSPHBroadPhase(sph_broadphase);
    
    // calc total volume
    var V = (u.x()-l.x())*(u.y()-l.y())*(u.z()-l.z());
    
    // mass
    var m=density*V/num_particles;
    
    // calculate radius of smoothing volume
    var smoothing_volume_r = pow(20*3*V/(num_particles*4*PI),0.33333);
    w.setSPHSmoothingVolumeRadius(smoothing_volume_r);
    w.setSPHSoundSpeed(speed_of_sound);
    w.setSPHDensity(density);
    w.setSPHViscosity(dyn_visc);
    
    // Create geometry
    Geode * particleGeode = createSphere(0.01);
    
    // Distance between particles	
    var dx = Vec3(0,0,0);
    var dy = Vec3(0,0,0);
    var dz = Vec3(0,0,0);
    if(nx>1) dx = Vec3((u.x()-l.x())/(nx-1),0,0);
    if(ny>1) dy = Vec3(0,(u.y()-l.y())/(ny-1),0);
    if(nz>1) dz = Vec3(0,0,(u.z()-l.z())/(nz-1));
    
    var oid;
    for (var i=0; i<nx; i++){
	for (var j=0; j<ny; j++){
	    for (var k=0; k<nz; k++){
		// Create particle transform and add to scenegraph
		PositionAttitudeTransform * t = new PositionAttitudeTransform;	
		t.addChild(particleGeode);
		root.addChild(t);
		
		// Add to updating list and set current pos
		transforms.push_back(t);
		Vec3 pos = l+dx*i+dy*j+dz*k;
		t.setPosition(pos);
		
		// Add particle to world
		w.addObject(&oid,OBJECT_TYPE_SPH_PARTICLE);
		
		// add particle to broadphase
	        sph_broadphase.addParticle(oid,pos);
		
		// Set properties
		w.setPos(oid,pos);
		w.setMass(oid,m);
		
		// Add to object list
		object_ids.push_back(oid);
	    }
	}
    }
}

// Get neighbors in smoothing volume
CANNON.SPH.prototype.getNeighbors = function(id, sph_h){
    var r = [];
    var no = numObjects();
    for(var i=0; i<no; i++){  
	//printf("check OK: %f %f %f , %f %f %f, h=%f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z(),objects[i].pos.x(),objects[i].pos.y(),objects[i].pos.z(),h);
	if(objects[i].type==OBJECT_TYPE_SPH_PARTICLE && i!=id && (objects[id].pos-objects[i].pos).length()<sph_h){
	    r.push(i);
	}
    }
    return r;
}

CANNON.SPH.prototype.updateDensityAndPressure = function(id, sph_h, cs, fluid_density){
    var n = [];
    n = sph_getNeighbors(id,sph_h);
    n.push_back(id);
    var nn = n.size();
    //printf("\n--- P%d has %d neighbors within h=%f ---\n",id,nn,sph_h);
    //for(var i=0; i<nn; i++) printf("%d ",n[i]);
    //printf("\n");
    var sum = 0.0;
    for(var i=0; i<nn; i++){
	//printf("\nN%d: ",n[i]);
	
	//printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
	var length = (objects[id].pos-objects[n[i]].pos).length();
	var sphw = sph_w(sph_h,length);
	sum += objects[n[i]].m * sphw;
	
	//if(length<0.00001 && length>0.0) printf("Contribution from %d to %d's density: %f (r=%f)\n",n[i],id,objects[n[i]].m * sphw,length);
	//printf("check mass=%f, sp_w = %f, h=%f, r=%f\n",objects[n[i]].m,sphw,sph_h,length);
	//printf("r=%f, m=%f, ",length,objects[n[i]].m);
    }

    // Save	
    objects[id].sph_density = sum;
    //if(objects[id].sph_density<0.001) objects[id].sph_density = fluid_density;
    objects[id].sph_pressure = cs*cs*(objects[id].sph_density-fluid_density);
    //printf("Density: %f, Pressure: %f\n", objects[id].sph_density,objects[id].sph_pressure);
    //printf("dens=%f, press=%f\n",objects[id].sph_density,objects[id].sph_pressure);

    // save maximum pressure
    if(sph_max_pressure<objects[id].sph_pressure)
	sph_max_pressure = objects[id].sph_pressure;
}

// Calculate the weight using the W(r) weightfunction
CANNON.SPH.prototype.w = function(smoothing_volume_r, r){
    // 315
    return 315.0/(64.0*PI*pow(smoothing_volume_r,9)) * pow(smoothing_volume_r*smoothing_volume_r-r*r,3);
}

// calculate gradient of the weight function
CANNON.SPH.prototype.gradw = function(smoothing_volume_r, r_vector){
    var r = r_vector.norm();
    var val = r_vector * 945.0/(32.0*PI*pow(smoothing_volume_r,9)) * pow((smoothing_volume_r*smoothing_volume_r-r*r),2);
    /*
      Vec3 n = r_vector;
      n.normalize();
      Vec3 val = -n * 3*15.0/(PI*pow(smoothing_volume_r,6)) * pow((smoothing_volume_r-r),2);
    */

    //printf("Smoothing volume R: %f... r=%f\n",smoothing_volume_r, r);
    //printf("GradW: %f %f %f\n",val.x(),val.y(),val.z());
    return val;
}

// Calculate nabla(W)
CANNON.SPH.prototype.nablaw = function(h, r){
    var nabla = 945.0/(32.0*PI*pow(h,9)) * (h*h-r*r)*(7*r*r - 3*h*h);
    //	printf("Smoothing volume R: %f... r=%f\n",h, r);
    //	printf("NablaW: %f\n",nabla);
    return nabla;
}

// Calculate accelerations and add velocities to all sph particles
CANNON.SPH.prototype.addForces = function(){
    
    var no = numObjects();
    //printf("numobj = %d\n",no);

    // Update pressure and density for all sph particles
    for(var i=0; i<no; i++){
	if(objects[i].type==OBJECT_TYPE_SPH_PARTICLE){
	    sph_updateDensityAndPressure(i, sph_smoothing_volume_r, sph_cs, sph_density);
	}
    }

    // Loop over all particles
    for(var i=0; i<no; i++){
	if(objects[i].type==OBJECT_TYPE_SPH_PARTICLE){
	    
	    objects[i].temp_velo.set(0,0,0);
	    
	    //printf("\n\n--- Particle %d ---\n",i);
	    
	    // Sum to these accelerations
	    var a_pressure = new CANNON.Vec3(0,0,0);
	    var a_visc = new CANNON.Vec3(0,0,0);
	    
	    // Init vars
	    var Pij;
	    var gradW;
	    var nabla;
	    var Vij;
	    
	    // Sum up for all other neighbors
	    var neighbors = sph_getNeighbors(i, sph_smoothing_volume_r);
	    var numneighbors = neighbors.size();
	    //printf("Neighbors: ");
	    for(j=0; j<numneighbors; j++){
		
		var nj = neighbors[j];
		//printf("%d ",nj);
		if(objects[nj].type==OBJECT_TYPE_SPH_PARTICLE){
		    
		    // Get r once for all..
		    Vec3 r_vec = (objects[i].pos - objects[nj].pos);
		    var r = r_vec.length();
		    
		    //printf("Check nonzero: %f %f\n",objects[i].sph_density,objects[j].sph_density);
		    
		    // Pressure contribution
		    //printf("m=%f, pressure=%f, density=%f\n",objects[nj].m,objects[i].sph_pressure,objects[i].sph_density);
		    Pij = -objects[nj].m*(objects[i].sph_pressure/(objects[i].sph_density*objects[i].sph_density+0.000001) + objects[nj].sph_pressure/(objects[nj].sph_density*objects[nj].sph_density+0.000001));
		    gradW = sph_gradw(sph_smoothing_volume_r, r_vec);
		    //printf("gradW=(%f,%f,%f), Pij=%f\n",gradW.x(),gradW.y(),gradW.z(),Pij);
		    a_pressure = a_pressure +gradW*Pij;
		    
		    // Viscosity contribution
		    Vij = (objects[nj].v-objects[i].v)/(0.0001+objects[i].sph_density*objects[nj].sph_density)*sph_visc*objects[nj].m;
		    nabla = sph_nablaw(sph_smoothing_volume_r, r);
		    a_visc = a_visc + Vij*nabla;
		    
		    // Check for extreme values
		    if(0 && (isnan(a_visc.length()) || isnan(Vij.length()))){
			printf("Extreme val of a_visc 1! Vij=(%f,%f,%f) and nabla=%f and p1=%f and p2=%f\n",Vij.x(),Vij.y(),Vij.z(),nabla,objects[i].sph_density,objects[nj].sph_density);
			exit(0);
		    }
		    
		    //printf("Pressure : %f, gradW: %f %f %f\n",Pij,gradW.x(),gradW.y(),gradW.z());
		    //printf("Viscosity: %f %f %f, nabla: %f\n",Vij.x(),Vij.y(),Vij.z(),nabla);

		    // Prvar out valuable info.
		    if(0 && r<0.00001 && r>0.0) printf("\n--- Pair (%d,%d), r=%f ---\nParticle %d\n  m=%f\n  dens=%f\n  press=%f\nParticle %d\n  m=%f\n  dens=%f\n  press=%f\n",i,nj,r,i,objects[i].m,objects[i].sph_density,objects[i].sph_pressure,nj,objects[nj].m,objects[nj].sph_density,objects[nj].sph_pressure);
		}
	    }
	    
	    // Gravity contribution
	    Vec3 a_gravity;
	    a_gravity.set(0,0,-GRAVITY);
	    
	    // Calculate velocities
	    addForce(i,(a_visc + a_pressure + a_gravity)*objects[i].m); // F=ma
	    //printf("Visc acc components: %f %f %f\n",a_visc.x(),a_visc.y(),a_visc.z(),a_pressure.x(),a_pressure.y(),a_pressure.z());
	    //printf("Added acc: %f %f %f + %f %f %f\n",a_visc.x(),a_visc.y(),a_visc.z(),a_pressure.x(),a_pressure.y(),a_pressure.z());
	    
	    // Check for extreme values
	    if(0 && isnan(a_visc.length())){
		printf("Extreme val of a_visc!\n");
		exit(0);
	    }
	}
    }
    
    // add all velocities
    for(var i=0; i<no; i++){
	if(objects[i].type==OBJECT_TYPE_SPH_PARTICLE){
	    //objects[i].v = objects[i].v + objects[i].temp_velo;
	}
    }
    
    if(no>0){
	//printf("\n --- end of timestep ---\n\n");
	//exit(0);
    }
}

CANNON.SPH.prototype.addSPHBroadPhase(bphase){
    sph_bp = bphase;
}

CANNON.SPH.prototype.setSPHSmoothingVolumeRadius(r){
    sph_smoothing_volume_r = r;
}

CANNON.SPH.prototype.setSPHSoundSpeed(cs){
    sph_cs = cs;
}

CANNON.SPH.prototype.setSPHDensity(d){
    sph_density = d;
}

CANNON.SPH.prototype.setSPHViscosity(v){
    sph_visc = v;
}

CANNON.SPH.prototype.setNumIterations(n){
    niterations = n;
}

CANNON.SPH.prototype.setNormal(id, x, y, z){
    objects[id].n.set(x,y,z);
    objects[id].n.normalize();
}

CANNON.SPH.prototype.setNormal(id, n){
    setNormal(id, n.x(), n.y(), n.z());
}

CANNON.SPH.prototype.addForce(id, f){
    addForce(id, f.x(), f.y(), f.z());
}

CANNON.SPH.prototype.addForce(id,x,y,z){
    Vec3 force = getForce(id);
    if(!objects[id].fixed) objects[id].f.set(force.x()+x,force.y()+y,force.z()+z);
}

CANNON.SPH.prototype.setForce(id, f){
    if(!objects[id].fixed) objects[id].f.set(f.x(),f.y(),f.z());
}

CANNON.SPH.prototype.setForce(id, x, y, z){
    if(!objects[id].fixed) objects[id].f.set(x,y,z);
}

CANNON.SPH.prototype.setElasticity(id,e){
    objects[id].e = e;
}

CANNON.SPH.prototype.getForce(id){
    return objects[id].f;
}

CANNON.SPH.prototype.getRef(id){
    return objects[id].ref;
}

CANNON.SPH.prototype.getNumber(id){
    return objects[id].number;
}

CANNON.SPH.prototype.setBounce(id, bool a){
    objects[id].bounce=a;
}

CANNON.SPH.prototype.fix(id){
    objects[id].fixed=1;
}

CANNON.SPH.prototype.setMass(id, mass){
    objects[id].m = mass;
    objects[id].invm = 1.0/mass;
}

CANNON.SPH.prototype.setNeighbors(id, n1, n2){
    objects[id].neighbor = n1;
    objects[id].neighbor2 = n2;
}

CANNON.SPH.prototype.areNeighbors(id1, id2){
    if(objects[id1].neighbor==id2 || objects[id2].neighbor==id1 || objects[id1].neighbor2==id2 || objects[id2].neighbor2==id1)
	return true;
    return false;
}

CANNON.SPH.prototype.setDist(id, d){
    objects[id].dist = d;
}

CANNON.SPH.prototype.setRef(id, ref_id){
    objects[id].ref = ref_id;
}

CANNON.SPH.prototype.getMass(id){
    return objects[id].m;
}

CANNON.SPH.prototype.getInvMass(id){
    return objects[id].invm;
}

CANNON.SPH.prototype.getRadius(id){
    return objects[id].r;
}

CANNON.SPH.prototype.getPos(id){
    return objects[id].pos;
}

CANNON.SPH.prototype.getNormal(id){
    return objects[id].n;
}

CANNON.SPH.prototype.getVelo(id){
    return objects[id].v;
}

CANNON.SPH.prototype.setPos = function(id, x, y, z){
    if(!objects[id].fixed)
	objects[id].pos.set(x,y,z);
}

CANNON.SPH.prototype.setVelo = function(id, x, y, z){
    if(!objects[id].fixed) objects[id].v.set(x,y,z);
}

CANNON.SPH.prototype.setPos = function(id,pos){
    setPos(id, pos.x(), pos.y(), pos.z());
}

CANNON.SPH.prototype.setVelo = function(id,v){
    setVelo(id, v.x(), v.y(), v.z());
}

CANNON.SPH.prototype.setPressure = function(id,p){
    objects[id].sph_pressure = p;
}

CANNON.SPH.prototype.getPressure = function(id){
    return objects[id].sph_pressure;
}

CANNON.SPH.prototype.setDensity = function(id , d){
    objects[id].sph_density = d;
}

CANNON.SPH.prototype.getDensity = function(id){
    return objects[id].sph_density;
}

CANNON.SPH.prototype.step(timestep){
    sph_max_pressure = 0;

    // SPH velocity update
    sph_addForces();

    // Add gravity to all objects
    for(var i=0; i<numObjects(); i++){
	if(!objects[i].fixed && objects[i].type!=OBJECT_TYPE_SPH_PARTICLE)
	    addForce(i,g*getMass(i));
	addAge(i,timestep);
    }

    // Dissipative forces
    for(var i=0; i<numObjects(); i++){
	Vec3 v = getVelo(i);
	v.normalize();
	var u = v.length();
	var f;
	f.set(-v.x()*AIR_FRICTION_CONSTANT*u*u,-v.y()*AIR_FRICTION_CONSTANT*u*u,-v.z()*AIR_FRICTION_CONSTANT*u*u);
	addForce(i,f);
    }

    // Leap frog
    // vnew = v + h*f/m
    // xnew = x + h*vnew
    var vnew, xnew;
    for(var i=0; i<numObjects(); i++){
	Vec3 test = getForce(i)*(getInvMass(i)*timestep);
	vnew = getVelo(i) + getForce(i)*(getInvMass(i)*timestep);
	xnew = getPos(i) + vnew*timestep;
	setVelo(i,vnew);
	setPos(i,xnew);
    }
}
