import { Vector3 } from 'feng3d';
import { ConvexPolyhedron } from './ConvexPolyhedron';

export class Cylinder extends ConvexPolyhedron
{
    /**
     * @param radiusTop
     * @param radiusBottom
     * @param height
     * @param numSegments The number of segments to build the cylinder out of
     *
     * @author schteppe / https://github.com/schteppe
     */
    constructor(radiusTop: number, radiusBottom: number, height: number, numSegments: number)
    {
        const N = numSegments;
        const verts = [];
        const axes = [];
        const faces = [];
        const bottomface = [];
        const topface = [];
        const cos = Math.cos;
        const sin = Math.sin;

        // First bottom point
        verts.push(new Vector3(radiusBottom * cos(0),
            radiusBottom * sin(0),
            -height * 0.5));
        bottomface.push(0);

        // First top point
        verts.push(new Vector3(radiusTop * cos(0),
            radiusTop * sin(0),
            height * 0.5));
        topface.push(1);

        for (let i = 0; i < N; i++)
        {
            const theta = 2 * Math.PI / N * (i + 1);
            const thetaN = 2 * Math.PI / N * (i + 0.5);
            if (i < N - 1)
            {
                // Bottom
                verts.push(new Vector3(radiusBottom * cos(theta),
                    radiusBottom * sin(theta),
                    -height * 0.5));
                bottomface.push(2 * i + 2);
                // Top
                verts.push(new Vector3(radiusTop * cos(theta),
                    radiusTop * sin(theta),
                    height * 0.5));
                topface.push(2 * i + 3);

                // Face
                faces.push([2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i]);
            }
            else
            {
                faces.push([0, 1, 2 * i + 1, 2 * i]); // Connect
            }

            // Axis: we can cut off half of them if we have even number of segments
            if (N % 2 === 1 || i < N / 2)
            {
                axes.push(new Vector3(cos(thetaN), sin(thetaN), 0));
            }
        }
        faces.push(topface);
        axes.push(new Vector3(0, 0, 1));

        // Reorder bottom face
        const temp = [];
        for (let i = 0; i < bottomface.length; i++)
        {
            temp.push(bottomface[bottomface.length - i - 1]);
        }
        faces.push(temp);

        super(verts, faces, axes);
    }
}
