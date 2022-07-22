import { Quaternion, Vector3 } from '@feng3d/math';
import { Material } from '../material/Material';
import { Body } from '../objects/Body';

export class Shape
{
    /**
     * Identifyer of the Shape.
     */
    id: number;

    /**
     * The type of this shape. Must be set to an int > 0 by subclasses.
     */
    type: number;

    /**
     * The local bounding sphere radius of this shape.
     */
    boundingSphereRadius: number;

    /**
     * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
     */
    collisionResponse: boolean;

    collisionFilterGroup: number;

    collisionFilterMask: number;

    material: Material;

    body: Body;

    faces: number[][];
    indices: number[];
    vertices: Vector3[] | number[];
    faceNormals: Vector3[];

    convexPolyhedronRepresentation: Shape;
    radius: number;

    /**
     * Base class for shapes
     *
     * @param options
     * @author schteppe
     */
    constructor(options: { type?: number, collisionFilterGroup?: number, collisionFilterMask?: number, collisionResponse?: boolean, material?: Material } = {})
    {
        this.id = Shape.idCounter++;
        this.type = options.type || 0;

        this.boundingSphereRadius = 0;
        this.collisionResponse = options.collisionResponse ? options.collisionResponse : true;

        this.collisionFilterGroup = options.collisionFilterGroup !== undefined ? options.collisionFilterGroup : 1;

        this.collisionFilterMask = options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1;

        this.material = options.material ? options.material : null;
        this.body = null;
    }

    /**
     * Computes the bounding sphere radius. The result is stored in the property .boundingSphereRadius
     */
    updateBoundingSphereRadius()
    {
        throw `computeBoundingSphereRadius() not implemented for shape type ${this.type}`;
    }

    /**
     * Get the volume of this shape
     */
    volume()
    {
        throw `volume() not implemented for shape type ${this.type}`;
    }

    /**
     * Calculates the inertia in the local frame for this shape.
     * @param _mass
     * @param _target
     * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
     */
    calculateLocalInertia(_mass: number, _target: Vector3)
    {
        throw `calculateLocalInertia() not implemented for shape type ${this.type}`;
    }

    calculateWorldAABB(_pos: Vector3, _quat: Quaternion, _min: Vector3, _max: Vector3)
    {
        throw '未实现';
    }

    static idCounter = 0;

    /**
     * The available shape types.
     */
    static types = {
        SPHERE: 1,
        PLANE: 2,
        BOX: 4,
        COMPOUND: 8,
        CONVEXPOLYHEDRON: 16,
        HEIGHTFIELD: 32,
        PARTICLE: 64,
        CYLINDER: 128,
        TRIMESH: 256
    };
}
