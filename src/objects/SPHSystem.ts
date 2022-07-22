import { Vector3 } from '@feng3d/math';

export class SPHSystem
{
    particles: Body[];
    /**
     * Density of the system (kg/m3).
     */
    density: number;
    /**
     * Distance below which two particles are considered to be neighbors.
     * It should be adjusted so there are about 15-20 neighbor particles within this radius.
     */
    smoothingRadius: number;
    speedOfSound: number;
    /**
     * Viscosity of the system.
     */
    viscosity: number;
    eps: number;
    pressures: number[];
    densities: number[];
    neighbors: Body[][];

    /**
     * Smoothed-particle hydrodynamics system
     */
    constructor()
    {
        this.particles = [];

        this.density = 1;

        this.smoothingRadius = 1;
        this.speedOfSound = 1;

        this.viscosity = 0.01;
        this.eps = 0.000001;

        // Stuff Computed per particle
        this.pressures = [];
        this.densities = [];
        this.neighbors = [];
    }

    /**
     * Add a particle to the system.
     *
     * @param particle
     */
    add(particle: Body)
    {
        this.particles.push(particle);
        if (this.neighbors.length < this.particles.length)
        {
            this.neighbors.push([]);
        }
    }

    /**
     * Remove a particle from the system.
     *
     * @param particle
     */
    remove(particle: Body)
    {
        const idx = this.particles.indexOf(particle);
        if (idx !== -1)
        {
            this.particles.splice(idx, 1);
            if (this.neighbors.length > this.particles.length)
            {
                this.neighbors.pop();
            }
        }
    }

    /**
     * Get neighbors within smoothing volume, save in the array neighbors
     *
     * @param particle
     * @param neighbors
     */
    getNeighbors(particle: Body, neighbors: Body[])
    {
        const N = this.particles.length;
        const id = particle.id;
        const R2 = this.smoothingRadius * this.smoothingRadius;
        const dist = SPHSystemGetNeighborsDist;
        for (let i = 0; i !== N; i++)
        {
            const p = this.particles[i];
            p.position.subTo(particle.position, dist);
            if (id !== p.id && dist.lengthSquared < R2)
            {
                neighbors.push(p);
            }
        }
    }

    update()
    {
        const N = this.particles.length;
        const dist = SPHSystemUpdateDist;
        const cs = this.speedOfSound;
        const eps = this.eps;

        for (let i = 0; i !== N; i++)
        {
            const p = this.particles[i]; // Current particle
            const neighbors = this.neighbors[i];

            // Get neighbors
            neighbors.length = 0;
            this.getNeighbors(p, neighbors);
            neighbors.push(this.particles[i]); // Add current too
            const numNeighbors = neighbors.length;

            // Accumulate density for the particle
            let sum = 0.0;
            for (let j = 0; j !== numNeighbors; j++)
            {
                // printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
                p.position.subTo(neighbors[j].position, dist);
                const len = dist.length;

                const weight = this.w(len);
                sum += neighbors[j].mass * weight;
            }

            // Save
            this.densities[i] = sum;
            this.pressures[i] = cs * cs * (this.densities[i] - this.density);
        }

        // Add forces

        // Sum to these accelerations
        const aPressure = SPHSystemUpdateAPressure;
        const aVisc = SPHSystemUpdateAVisc;
        const gradW = SPHSystemUpdateGradW;
        const rVec = SPHSystemUpdateRVec;
        const u = SPHSystemUpdateU;

        for (let i = 0; i !== N; i++)
        {
            const particle = this.particles[i];

            aPressure.set(0, 0, 0);
            aVisc.set(0, 0, 0);

            // Init vars
            let Pij;
            let nabla;
            // var Vij;

            // Sum up for all other neighbors
            const neighbors = this.neighbors[i];
            const numNeighbors = neighbors.length;

            // printf("Neighbors: ");
            for (let j = 0; j !== numNeighbors; j++)
            {
                const neighbor = neighbors[j];
                // printf("%d ",nj);

                // Get r once for all..
                particle.position.subTo(neighbor.position, rVec);
                const r = rVec.length;

                // Pressure contribution
                Pij = -neighbor.mass * (this.pressures[i] / (this.densities[i] * this.densities[i] + eps) + this.pressures[j] / (this.densities[j] * this.densities[j] + eps));
                this.gradw(rVec, gradW);
                // Add to pressure acceleration
                gradW.scaleNumberTo(Pij, gradW);
                aPressure.addTo(gradW, aPressure);

                // Viscosity contribution
                neighbor.velocity.subTo(particle.velocity, u);
                u.scaleNumberTo(1.0 / (0.0001 + this.densities[i] * this.densities[j]) * this.viscosity * neighbor.mass, u);
                nabla = this.nablaw(r);
                u.scaleNumberTo(nabla, u);
                // Add to viscosity acceleration
                aVisc.addTo(u, aVisc);
            }

            // Calculate force
            aVisc.scaleNumberTo(particle.mass, aVisc);
            aPressure.scaleNumberTo(particle.mass, aPressure);

            // Add force to particles
            particle.force.addTo(aVisc, particle.force);
            particle.force.addTo(aPressure, particle.force);
        }
    }

    // Calculate the weight using the W(r) weightfunction
    w(r: number)
    {
        // 315
        const h = this.smoothingRadius;

        return 315.0 / (64.0 * Math.PI * Math.pow(h, 9)) * Math.pow(h * h - r * r, 3);
    }

    // calculate gradient of the weight function
    gradw(rVec: Vector3, resultVec: Vector3)
    {
        const r = rVec.length;
        const h = this.smoothingRadius;
        rVec.scaleNumberTo(945.0 / (32.0 * Math.PI * Math.pow(h, 9)) * Math.pow((h * h - r * r), 2), resultVec);
    }

    // Calculate nabla(W)
    nablaw(r: number)
    {
        const h = this.smoothingRadius;
        const nabla = 945.0 / (32.0 * Math.PI * Math.pow(h, 9)) * (h * h - r * r) * (7 * r * r - 3 * h * h);

        return nabla;
    }
}

const SPHSystemGetNeighborsDist = new Vector3();
const SPHSystemUpdateDist = new Vector3();
const SPHSystemUpdateAPressure = new Vector3();
const SPHSystemUpdateAVisc = new Vector3();
const SPHSystemUpdateGradW = new Vector3();
const SPHSystemUpdateRVec = new Vector3();
const SPHSystemUpdateU = new Vector3(); // Relative velocity
