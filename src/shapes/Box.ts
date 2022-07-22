import { Quaternion, Vector3 } from '@feng3d/math';
import { ConvexPolyhedron } from './ConvexPolyhedron';
import { Shape } from './Shape';

export class Box extends Shape
{
    halfExtents: Vector3;

    /**
     * Used by the contact generator to make contacts with other convex polyhedra for example
     */
    declare convexPolyhedronRepresentation: ConvexPolyhedron;

    /**
     * A 3d box shape.
     * @param halfExtents
     * @author schteppe
     */
    constructor(halfExtents: Vector3)
    {
        super({
            type: Shape.types.BOX
        });

        this.halfExtents = halfExtents;
        this.convexPolyhedronRepresentation = null;

        this.updateConvexPolyhedronRepresentation();
        this.updateBoundingSphereRadius();
    }

    /**
     * Updates the local convex polyhedron representation used for some collisions.
     */
    updateConvexPolyhedronRepresentation()
    {
        const sx = this.halfExtents.x;
        const sy = this.halfExtents.y;
        const sz = this.halfExtents.z;
        const V = Vector3;

        const vertices = [
            new V(-sx, -sy, -sz),
            new V(sx, -sy, -sz),
            new V(sx, sy, -sz),
            new V(-sx, sy, -sz),
            new V(-sx, -sy, sz),
            new V(sx, -sy, sz),
            new V(sx, sy, sz),
            new V(-sx, sy, sz)
        ];

        const indices = [
            [3, 2, 1, 0], // -z
            [4, 5, 6, 7], // +z
            [5, 4, 0, 1], // -y
            [2, 3, 7, 6], // +y
            [0, 4, 7, 3], // -x
            [1, 2, 6, 5], // +x
        ];

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const axes = [
            new V(0, 0, 1),
            new V(0, 1, 0),
            new V(1, 0, 0)
        ];

        const h = new ConvexPolyhedron(vertices, indices);
        this.convexPolyhedronRepresentation = h;
        h.material = this.material;
    }

    calculateLocalInertia(mass: number, target = new Vector3())
    {
        Box.calculateInertia(this.halfExtents, mass, target);

        return target;
    }

    static calculateInertia(halfExtents: Vector3, mass: number, target: Vector3)
    {
        const e = halfExtents;
        target.x = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.z * 2 * e.z);
        target.y = 1.0 / 12.0 * mass * (2 * e.x * 2 * e.x + 2 * e.z * 2 * e.z);
        target.z = 1.0 / 12.0 * mass * (2 * e.y * 2 * e.y + 2 * e.x * 2 * e.x);
    }

    /**
     * Get the box 6 side normals
     * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
     * @param quat             Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
     */
    getSideNormals(sixTargetVectors: Vector3[], quat: Quaternion)
    {
        const sides = sixTargetVectors;
        const ex = this.halfExtents;
        sides[0].set(ex.x, 0, 0);
        sides[1].set(0, ex.y, 0);
        sides[2].set(0, 0, ex.z);
        sides[3].set(-ex.x, 0, 0);
        sides[4].set(0, -ex.y, 0);
        sides[5].set(0, 0, -ex.z);

        if (quat !== undefined)
        {
            for (let i = 0; i !== sides.length; i++)
            {
                quat.vmult(sides[i], sides[i]);
            }
        }

        return sides;
    }

    volume()
    {
        return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
    }

    updateBoundingSphereRadius()
    {
        this.boundingSphereRadius = this.halfExtents.length;
    }

    forEachWorldCorner(pos: Vector3, quat: Quaternion, callback: Function)
    {
        const e = this.halfExtents;
        const corners = [[e.x, e.y, e.z],
        [-e.x, e.y, e.z],
        [-e.x, -e.y, e.z],
        [-e.x, -e.y, -e.z],
        [e.x, -e.y, -e.z],
        [e.x, e.y, -e.z],
        [-e.x, e.y, -e.z],
        [e.x, -e.y, e.z]];
        for (let i = 0; i < corners.length; i++)
        {
            worldCornerTempPos.set(corners[i][0], corners[i][1], corners[i][2]);
            quat.vmult(worldCornerTempPos, worldCornerTempPos);
            pos.addTo(worldCornerTempPos, worldCornerTempPos);
            callback(worldCornerTempPos.x,
                worldCornerTempPos.y,
                worldCornerTempPos.z);
        }
    }

    calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3)
    {
        const e = this.halfExtents;
        worldCornersTemp[0].set(e.x, e.y, e.z);
        worldCornersTemp[1].set(-e.x, e.y, e.z);
        worldCornersTemp[2].set(-e.x, -e.y, e.z);
        worldCornersTemp[3].set(-e.x, -e.y, -e.z);
        worldCornersTemp[4].set(e.x, -e.y, -e.z);
        worldCornersTemp[5].set(e.x, e.y, -e.z);
        worldCornersTemp[6].set(-e.x, e.y, -e.z);
        worldCornersTemp[7].set(e.x, -e.y, e.z);

        let wc = worldCornersTemp[0];
        quat.vmult(wc, wc);
        pos.addTo(wc, wc);
        max.copy(wc);
        min.copy(wc);
        for (let i = 1; i < 8; i++)
        {
            wc = worldCornersTemp[i];
            quat.vmult(wc, wc);
            pos.addTo(wc, wc);
            const x = wc.x;
            const y = wc.y;
            const z = wc.z;
            if (x > max.x)
            {
                max.x = x;
            }
            if (y > max.y)
            {
                max.y = y;
            }
            if (z > max.z)
            {
                max.z = z;
            }

            if (x < min.x)
            {
                min.x = x;
            }
            if (y < min.y)
            {
                min.y = y;
            }
            if (z < min.z)
            {
                min.z = z;
            }
        }

        // Get each axis max
        // min.set(Infinity,Infinity,Infinity);
        // max.set(-Infinity,-Infinity,-Infinity);
        // this.forEachWorldCorner(pos,quat,function(x,y,z){
        //     if(x > max.x){
        //         max.x = x;
        //     }
        //     if(y > max.y){
        //         max.y = y;
        //     }
        //     if(z > max.z){
        //         max.z = z;
        //     }

        //     if(x < min.x){
        //         min.x = x;
        //     }
        //     if(y < min.y){
        //         min.y = y;
        //     }
        //     if(z < min.z){
        //         min.z = z;
        //     }
        // });
    }
}

const worldCornerTempPos = new Vector3();
// const worldCornerTempNeg = new Vector3();

const worldCornersTemp = [
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3()
];
