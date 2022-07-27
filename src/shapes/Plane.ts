import { Quaternion, Vector3 } from 'feng3d';
import { World } from '../world/World';
import { Shape } from './Shape';

export class Plane extends Shape
{
    worldNormal: Vector3;
    worldNormalNeedsUpdate: boolean;

    /**
     * A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a Body and rotate that body. See the demos.
     *
     * @author schteppe
     */
    constructor()
    {
        super({
            type: Shape.types.PLANE
        });

        // World oriented normal
        this.worldNormal = new Vector3();
        this.worldNormalNeedsUpdate = true;

        this.boundingSphereRadius = Number.MAX_VALUE;
    }

    computeWorldNormal(quat: Quaternion)
    {
        const n = this.worldNormal;
        n.copy(World.worldNormal);
        quat.vmult(n, n);
        this.worldNormalNeedsUpdate = false;
    }

    calculateLocalInertia(mass: number, target = new Vector3())
    {
        return target;
    }

    volume()
    {
        return Number.MAX_VALUE; // The plane is infinite...
    }

    calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3)
    {
        // The plane AABB is infinite, except if the normal is pointing along any axis
        tempNormal.copy(World.worldNormal); // Default plane normal is z
        quat.vmult(tempNormal, tempNormal);
        const maxVal = Number.MAX_VALUE;
        min.set(-maxVal, -maxVal, -maxVal);
        max.set(maxVal, maxVal, maxVal);

        if (tempNormal.x === 1) { max.x = pos.x; }
        if (tempNormal.y === 1) { max.y = pos.y; }
        if (tempNormal.z === 1) { max.z = pos.z; }

        if (tempNormal.x === -1) { min.x = pos.x; }
        if (tempNormal.y === -1) { min.y = pos.y; }
        if (tempNormal.z === -1) { min.z = pos.z; }
    }

    updateBoundingSphereRadius()
    {
        this.boundingSphereRadius = Number.MAX_VALUE;
    }
}

const tempNormal = new Vector3();

