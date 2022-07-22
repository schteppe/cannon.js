declare namespace CANNON {
    var Vector3: typeof feng3d.Vector3;
    type Vector3 = feng3d.Vector3;
    var Matrix3x3: typeof feng3d.Matrix3x3;
    type Matrix3x3 = feng3d.Matrix3x3;
    var Quaternion: typeof feng3d.Quaternion;
    type Quaternion = feng3d.Quaternion;
    var Box3: typeof feng3d.Box3;
    type Box3 = feng3d.Box3;
}
declare namespace CANNON {
    class Transform {
        position: Vector3;
        quaternion: Quaternion;
        constructor(position?: feng3d.Vector3, quaternion?: feng3d.Quaternion);
        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        static pointToLocalFrame(position: Vector3, quaternion: Quaternion, worldPoint: Vector3, result?: feng3d.Vector3): feng3d.Vector3;
        /**
         * Get a global point in local transform coordinates.
         * @param worldPoint
         * @param result
         * @returnThe "result" vector object
         */
        pointToLocal(worldPoint: Vector3, result: Vector3): feng3d.Vector3;
        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        static pointToWorldFrame(position: Vector3, quaternion: Quaternion, localPoint: Vector3, result?: feng3d.Vector3): feng3d.Vector3;
        /**
         * Get a local point in global transform coordinates.
         * @param point
         * @param result
         * @return The "result" vector object
         */
        pointToWorld(localPoint: Vector3, result: Vector3): feng3d.Vector3;
        vectorToWorldFrame(localVector: Vector3, result?: feng3d.Vector3): feng3d.Vector3;
        /**
         * Get the representation of an AABB in another frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        toLocalFrameBox3(box3: Box3, target: Box3): feng3d.Box3;
        /**
         * Get the representation of an AABB in the global frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        toWorldFrameBox3(box3: Box3, target: Box3): feng3d.Box3;
        static vectorToWorldFrame(quaternion: Quaternion, localVector: Vector3, result: Vector3): feng3d.Vector3;
        static vectorToLocalFrame(position: Vector3, quaternion: Quaternion, worldVector: Vector3, result?: feng3d.Vector3): feng3d.Vector3;
    }
}
declare namespace CANNON {
    class JacobianElement {
        spatial: Vector3;
        rotational: Vector3;
        /**
         * An element containing 6 entries, 3 spatial and 3 rotational degrees of freedom.
         */
        constructor();
        /**
         * Multiply with other JacobianElement
         * @param element
         */
        multiplyElement(element: JacobianElement): number;
        /**
         * Multiply with two vectors
         * @param spatial
         * @param rotational
         */
        multiplyVectors(spatial: Vector3, rotational: Vector3): number;
    }
}
declare namespace CANNON {
    class Utils {
        /**
         * Extend an options object with default values.
         * @param  options The options object. May be falsy: in this case, a new object is created and returned.
         * @param  defaults An object containing default values.
         * @return The modified options object.
         */
        static defaults(options: Object, defaults: Object): Object;
    }
}
declare namespace CANNON {
    class Constraint {
        /**
         * Equations to be solved in this constraint
         */
        equations: Equation[];
        bodyA: Body;
        id: number;
        /**
         * Set to true if you want the bodies to collide when they are connected.
         */
        collideConnected: boolean;
        bodyB: Body;
        /**
         * Constraint base class
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options?: {
            collideConnected?: boolean;
            wakeUpBodies?: boolean;
        });
        /**
         * Update all the equations with data.
         */
        update(): void;
        /**
         * Enables all equations in the constraint.
         */
        enable(): void;
        /**
         * Disables all equations in the constraint.
         */
        disable(): void;
        static idCounter: number;
    }
}
declare namespace CANNON {
    class DistanceConstraint extends Constraint {
        distance: number;
        distanceEquation: ContactEquation;
        /**
         * Constrains two bodies to be at a constant distance from each others center of mass.
         *
         * @param bodyA
         * @param bodyB
         * @param distance The distance to keep. If undefined, it will be set to the current distance between bodyA and bodyB
         * @param maxForce
         * @param number
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, distance?: number, maxForce?: number);
        update(): void;
    }
}
declare namespace CANNON {
    class PointToPointConstraint extends Constraint {
        /**
         * Pivot, defined locally in bodyA.
         */
        pivotA: Vector3;
        /**
         * Pivot, defined locally in bodyB.
         */
        pivotB: Vector3;
        equationX: ContactEquation;
        equationY: ContactEquation;
        equationZ: ContactEquation;
        /**
         * Connects two bodies at given offset points.
         *
         * @param bodyA
         * @param pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
         * @param bodyB Body that will be constrained in a similar way to the same point as bodyA. We will therefore get a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
         * @param pivotB See pivotA.
         * @param maxForce The maximum force that should be applied to constrain the bodies.
         *
         * @example
         *     var bodyA = new Body({ mass: 1 });
         *     var bodyB = new Body({ mass: 1 });
         *     bodyA.position.set(-1, 0, 0);
         *     bodyB.position.set(1, 0, 0);
         *     bodyA.addShape(shapeA);
         *     bodyB.addShape(shapeB);
         *     world.addBody(bodyA);
         *     world.addBody(bodyB);
         *     var localPivotA = new Vector3(1, 0, 0);
         *     var localPivotB = new Vector3(-1, 0, 0);
         *     var constraint = new PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB);
         *     world.addConstraint(constraint);
         */
        constructor(bodyA: Body, pivotA: Vector3, bodyB: Body, pivotB: Vector3, maxForce?: number);
        update(): void;
    }
}
declare namespace CANNON {
    class ConeTwistConstraint extends PointToPointConstraint {
        axisA: Vector3;
        axisB: Vector3;
        angle: number;
        coneEquation: ConeEquation;
        twistEquation: RotationalEquation;
        twistAngle: number;
        /**
         * @class ConeTwistConstraint
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options?: {
            pivotA?: Vector3;
            pivotB?: Vector3;
            maxForce?: number;
            axisA?: Vector3;
            axisB?: Vector3;
            collideConnected?: boolean;
            angle?: number;
            twistAngle?: number;
        });
        update(): void;
    }
}
declare namespace CANNON {
    class HingeConstraint extends PointToPointConstraint {
        /**
         * Rotation axis, defined locally in bodyA.
         */
        axisA: Vector3;
        /**
         * Rotation axis, defined locally in bodyB.
         */
        axisB: Vector3;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        motorEquation: RotationalMotorEquation;
        /**
         * Equations to be fed to the solver
         */
        equations: Equation[];
        motorTargetVelocity: number;
        /**
         * Hinge constraint. Think of it as a door hinge. It tries to keep the door in the correct place and with the correct orientation.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options?: {
            pivotA?: Vector3;
            pivotB?: Vector3;
            maxForce?: number;
            axisA?: Vector3;
            axisB?: Vector3;
            collideConnected?: boolean;
        });
        enableMotor(): void;
        disableMotor(): void;
        setMotorSpeed(speed: number): void;
        setMotorMaxForce(maxForce: number): void;
        update(): void;
    }
}
declare namespace CANNON {
    class LockConstraint extends PointToPointConstraint {
        xA: Vector3;
        xB: Vector3;
        yA: Vector3;
        yB: Vector3;
        zA: Vector3;
        zB: Vector3;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        rotationalEquation3: RotationalEquation;
        motorEquation: Equation;
        /**
         * Lock constraint. Will remove all degrees of freedom between the bodies.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options?: {
            maxForce?: number;
        });
        update(): void;
    }
}
declare namespace CANNON {
    class Shape {
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
        constructor(options?: {
            type?: number;
            collisionFilterGroup?: number;
            collisionFilterMask?: number;
            collisionResponse?: boolean;
            material?: Material;
        });
        /**
         * Computes the bounding sphere radius. The result is stored in the property .boundingSphereRadius
         */
        updateBoundingSphereRadius(): void;
        /**
         * Get the volume of this shape
         */
        volume(): void;
        /**
         * Calculates the inertia in the local frame for this shape.
         * @param mass
         * @param target
         * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
         */
        calculateLocalInertia(mass: number, target: Vector3): void;
        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3): void;
        static idCounter: number;
        /**
         * The available shape types.
         */
        static types: {
            SPHERE: number;
            PLANE: number;
            BOX: number;
            COMPOUND: number;
            CONVEXPOLYHEDRON: number;
            HEIGHTFIELD: number;
            PARTICLE: number;
            CYLINDER: number;
            TRIMESH: number;
        };
    }
}
declare namespace CANNON {
    class ConvexPolyhedron extends Shape {
        vertices: Vector3[];
        worldVertices: Vector3[];
        worldVerticesNeedsUpdate: boolean;
        /**
         * Array of integer arrays, indicating which vertices each face consists of
         */
        faces: ({
            connectedFaces: number[];
        } & (number[]))[];
        faceNormals: Vector3[];
        worldFaceNormalsNeedsUpdate: boolean;
        worldFaceNormals: Vector3[];
        uniqueEdges: Vector3[];
        /**
         * If given, these locally defined, normalized axes are the only ones being checked when doing separating axis check.
         */
        uniqueAxes: Vector3[];
        /**
         * A set of polygons describing a convex shape.
         * @class ConvexPolyhedron
         * @constructor
         * @extends Shape
         * @description The shape MUST be convex for the code to work properly. No polygons may be coplanar (contained
         * in the same 3D plane), instead these should be merged into one polygon.
         *
         * @param {array} points An array of Vec3's
         * @param {array} faces Array of integer arrays, describing which vertices that is included in each face.
         *
         * @author qiao / https://github.com/qiao (original author, see https://github.com/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9c5108836f)
         * @author schteppe / https://github.com/schteppe
         * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
         * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
         *
         * @todo Move the clipping functions to ContactGenerator?
         * @todo Automatically merge coplanar polygons in constructor.
         */
        constructor(points?: Vector3[], faces?: number[][], uniqueAxes?: Vector3[]);
        /**
         * Computes uniqueEdges
         */
        computeEdges(): void;
        /**
         * Compute the normals of the faces. Will reuse existing Vec3 objects in the .faceNormals array if they exist.
         */
        computeNormals(): void;
        /**
         * Get face normal given 3 vertices
         *
         * @param va
         * @param vb
         * @param vc
         * @param target
         */
        static computeNormal(va: Vector3, vb: Vector3, vc: Vector3, target: Vector3): void;
        /**
         * Compute the normal of a face from its vertices
         *
         * @param i
         * @param target
         */
        getFaceNormal(i: number, target: Vector3): void;
        /**
         * @param posA
         * @param quatA
         * @param hullB
         * @param posB
         * @param quatB
         * @param separatingNormal
         * @param minDist Clamp distance
         * @param maxDist
         * @param result The an array of contact point objects, see clipFaceAgainstHull
         * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
         */
        clipAgainstHull(posA: Vector3, quatA: Quaternion, hullB: ConvexPolyhedron, posB: Vector3, quatB: Quaternion, separatingNormal: Vector3, minDist: number, maxDist: number, result: {
            point: Vector3;
            normal: Vector3;
            depth: number;
        }[]): void;
        /**
         * Find the separating axis between this hull and another
         *
         * @param hullB
         * @param posA
         * @param quatA
         * @param posB
         * @param quatB
         * @param target The target vector to save the axis in
         * @param faceListA
         * @param faceListB
         * @returns Returns false if a separation is found, else true
         */
        findSeparatingAxis(hullB: ConvexPolyhedron, posA: Vector3, quatA: Quaternion, posB: Vector3, quatB: Quaternion, target: Vector3, faceListA?: number[], faceListB?: number[]): boolean;
        /**
         * Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
         *
         * @param axis
         * @param hullB
         * @param posA
         * @param quatA
         * @param posB
         * @param quatB
         * @return The overlap depth, or FALSE if no penetration.
         */
        testSepAxis(axis: Vector3, hullB: ConvexPolyhedron, posA: Vector3, quatA: Quaternion, posB: Vector3, quatB: Quaternion): number | false;
        /**
         *
         * @param mass
         * @param target
         */
        calculateLocalInertia(mass: number, target: Vector3): void;
        /**
         *
         * @param face_i Index of the face
         */
        getPlaneConstantOfFace(face_i: number): number;
        /**
         * Clip a face against a hull.
         *
         * @param separatingNormal
         * @param posA
         * @param quatA
         * @param worldVertsB1 An array of Vec3 with vertices in the world frame.
         * @param minDist Distance clamping
         * @param maxDist
         * @param result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
         */
        clipFaceAgainstHull(separatingNormal: Vector3, posA: Vector3, quatA: Quaternion, worldVertsB1: Vector3[], minDist: number, maxDist: number, result: {
            point: Vector3;
            normal: Vector3;
            depth: number;
        }[]): void;
        /**
         * Clip a face in a hull against the back of a plane.
         *
         * @param inVertices
         * @param outVertices
         * @param planeNormal
         * @param planeConstant The constant in the mathematical plane equation
         */
        clipFaceAgainstPlane(inVertices: Vector3[], outVertices: Vector3[], planeNormal: Vector3, planeConstant: number): feng3d.Vector3[];
        computeWorldVertices(position: Vector3, quat: Quaternion): void;
        computeLocalAABB(aabbmin: Vector3, aabbmax: Vector3): void;
        /**
         * Updates .worldVertices and sets .worldVerticesNeedsUpdate to false.
         *
         * @param quat
         */
        computeWorldFaceNormals(quat: Quaternion): void;
        updateBoundingSphereRadius(): void;
        /**
         *
         * @param  pos
         * @param quat
         * @param min
         * @param max
         */
        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3): void;
        /**
         * Get approximate convex volume
         */
        volume(): number;
        /**
         * Get an average of all the vertices positions
         *
         * @param target
         */
        getAveragePointLocal(target: Vector3): feng3d.Vector3;
        /**
         * Transform all local points. Will change the .vertices
         *
         * @param  offset
         * @param quat
         */
        transformAllPoints(offset: Vector3, quat: Quaternion): void;
        /**
         * Checks whether p is inside the polyhedra. Must be in local coords. The point lies outside of the convex hull of the other points if and only if the direction of all the vectors from it to those other points are on less than one half of a sphere around it.
         *
         * @param p      A point given in local coordinates
         */
        pointIsInside(p: Vector3): false | 1 | -1;
        /**
         * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis. Results are saved in the array maxmin.
         *
         * @param hull
         * @param axis
         * @param pos
         * @param quat
         * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
         */
        static project(hull: ConvexPolyhedron, axis: Vector3, pos: Vector3, quat: Quaternion, result: number[]): void;
    }
}
declare namespace CANNON {
    class Box extends Shape {
        halfExtents: Vector3;
        /**
         * Used by the contact generator to make contacts with other convex polyhedra for example
         */
        convexPolyhedronRepresentation: ConvexPolyhedron;
        /**
         * A 3d box shape.
         * @param halfExtents
         * @author schteppe
         */
        constructor(halfExtents: Vector3);
        /**
         * Updates the local convex polyhedron representation used for some collisions.
         */
        updateConvexPolyhedronRepresentation(): void;
        calculateLocalInertia(mass: number, target?: feng3d.Vector3): feng3d.Vector3;
        static calculateInertia(halfExtents: Vector3, mass: number, target: Vector3): void;
        /**
         * Get the box 6 side normals
         * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
         * @param quat             Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
         */
        getSideNormals(sixTargetVectors: Vector3[], quat: Quaternion): feng3d.Vector3[];
        volume(): number;
        updateBoundingSphereRadius(): void;
        forEachWorldCorner(pos: Vector3, quat: Quaternion, callback: Function): void;
        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3): void;
    }
}
declare namespace CANNON {
    class Cylinder extends ConvexPolyhedron {
        /**
         * @param radiusTop
         * @param radiusBottom
         * @param height
         * @param numSegments The number of segments to build the cylinder out of
         *
         * @author schteppe / https://github.com/schteppe
         */
        constructor(radiusTop: number, radiusBottom: number, height: number, numSegments: number);
    }
}
declare namespace CANNON {
    class Heightfield extends Shape {
        /**
         * An array of numbers, or height values, that are spread out along the x axis.
         * @property {array} data
         */
        data: number[][];
        /**
         * Max value of the data
         */
        maxValue: number;
        /**
         * Max value of the data
         */
        minValue: number;
        /**
          * The width of each element
          * @todo elementSizeX and Y
          */
        elementSize: number;
        cacheEnabled: boolean;
        pillarConvex: ConvexPolyhedron;
        pillarOffset: Vector3;
        private _cachedPillars;
        /**
         * Heightfield shape class. Height data is given as an array. These data points are spread out evenly with a given distance.
         *
         * @param data An array of Y values that will be used to construct the terrain.
         * @param options
         * @param options.minValue] Minimum value of the data points in the data array. Will be computed automatically if not given.
         * @param options.maxValue Maximum value.
         * @param options.elementSize=0.1 World spacing between the data points in X direction.
         * @todo Should be possible to use along all axes, not just y
         * @todo should be possible to scale along all axes
         *
         * @example
         *     // Generate some height data (y-values).
         *     var data = [];
         *     for(var i = 0; i < 1000; i++){
         *         var y = 0.5 * Math.cos(0.2 * i);
         *         data.push(y);
         *     }
         *
         *     // Create the heightfield shape
         *     var heightfieldShape = new Heightfield(data, {
         *         elementSize: 1 // Distance between the data points in X and Y directions
         *     });
         *     var heightfieldBody = new Body();
         *     heightfieldBody.addShape(heightfieldShape);
         *     world.addBody(heightfieldBody);
         */
        /**
         *
         * @param data
         * @param options
         */
        constructor(data: number[][], options?: {
            maxValue?: number;
            minValue?: number;
            elementSize?: number;
        });
        /**
         * Call whenever you change the data array.
         */
        update(): void;
        /**
         * Update the .minValue property
         */
        updateMinValue(): void;
        /**
         * Update the .maxValue property
         */
        updateMaxValue(): void;
        /**
         * Set the height value at an index. Don't forget to update maxValue and minValue after you're done.
         *
         * @param xi
         * @param yi
         * @param value
         */
        setHeightValueAtIndex(xi: number, yi: number, value: number): void;
        /**
         * Get max/min in a rectangle in the matrix data
         *
         * @param iMinX
         * @param iMinY
         * @param iMaxX
         * @param iMaxY
         * @param result An array to store the results in.
         * @return The result array, if it was passed in. Minimum will be at position 0 and max at 1.
         */
        getRectMinMax(iMinX: number, iMinY: number, iMaxX: number, iMaxY: number, result: number[]): void;
        /**
         * Get the index of a local position on the heightfield. The indexes indicate the rectangles, so if your terrain is made of N x N height data points, you will have rectangle indexes ranging from 0 to N-1.
         *
         * @param x
         * @param y
         * @param result Two-element array
         * @param clamp If the position should be clamped to the heightfield edge.
         */
        getIndexOfPosition(x: number, y: number, result: number[], clamp?: boolean): boolean;
        getTriangleAt(x: number, y: number, edgeClamp: boolean, a: Vector3, b: Vector3, c: Vector3): boolean;
        getNormalAt(x: number, y: number, edgeClamp: boolean, result: Vector3): void;
        /**
         * Get an AABB of a square in the heightfield
         *
         * @param xi
         * @param yi
         * @param result
         */
        getAabbAtIndex(xi: number, yi: number, result: Box3): void;
        /**
         * Get the height in the heightfield at a given position
         *
         * @param x
         * @param y
         * @param edgeClamp
         */
        getHeightAt(x: number, y: number, edgeClamp?: boolean): number;
        getCacheConvexTrianglePillarKey(xi: number, yi: number, getUpperTriangle: boolean): string;
        getCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): any;
        setCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean, convex: ConvexPolyhedron, offset: Vector3): void;
        clearCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): void;
        /**
         * Get a triangle from the heightfield
         *
         * @param xi
         * @param yi
         * @param upper
         * @param a
         * @param b
         * @param c
         */
        getTriangle(xi: number, yi: number, upper: boolean, a: Vector3, b: Vector3, c: Vector3): void;
        /**
         * Get a triangle in the terrain in the form of a triangular convex shape.
         *
         * @param i
         * @param j
         * @param getUpperTriangle
         */
        getConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): void;
        calculateLocalInertia(mass: number, target?: feng3d.Vector3): feng3d.Vector3;
        volume(): number;
        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3): void;
        updateBoundingSphereRadius(): void;
        /**
         * Sets the height values from an image. Currently only supported in browser.
         *
         * @param image
         * @param scale
         */
        setHeightsFromImage(image: HTMLImageElement, scale: Vector3): void;
    }
}
declare namespace CANNON {
    class Particle extends Shape {
        /**
         * Particle shape.
         *
         * @author schteppe
         */
        constructor();
        /**
         * @param mass
         * @param target
         */
        calculateLocalInertia(mass: number, target: Vector3): feng3d.Vector3;
        volume(): number;
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3): void;
    }
}
declare namespace CANNON {
    class Plane extends Shape {
        worldNormal: Vector3;
        worldNormalNeedsUpdate: boolean;
        /**
         * A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a Body and rotate that body. See the demos.
         *
         * @author schteppe
         */
        constructor();
        computeWorldNormal(quat: Quaternion): void;
        calculateLocalInertia(mass: number, target?: feng3d.Vector3): feng3d.Vector3;
        volume(): number;
        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3): void;
        updateBoundingSphereRadius(): void;
    }
}
declare namespace CANNON {
    class Sphere extends Shape {
        radius: number;
        /**
         * Spherical shape
         *
         * @param radius The radius of the sphere, a non-negative number.
         * @author schteppe / http://github.com/schteppe
         */
        constructor(radius: number);
        calculateLocalInertia(mass: number, target?: feng3d.Vector3): feng3d.Vector3;
        volume(): number;
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3): void;
    }
}
declare namespace CANNON {
    class Trimesh extends Shape {
        vertices: number[];
        /**
         * The normals data.
         */
        normals: number[];
        /**
         * The local AABB of the mesh.
         */
        aabb: Box3;
        /**
         * References to vertex pairs, making up all unique edges in the trimesh.
         */
        edges: number[];
        /**
         * Local scaling of the mesh. Use .setScale() to set it.
         */
        scale: Vector3;
        /**
         * The indexed triangles. Use .updateTree() to update it.
         */
        tree: Octree<number>;
        /**
         * @param vertices
         * @param indices
         *
         * @example
         *     // How to make a mesh with a single triangle
         *     var vertices = [
         *         0, 0, 0, // vertex 0
         *         1, 0, 0, // vertex 1
         *         0, 1, 0  // vertex 2
         *     ];
         *     var indices = [
         *         0, 1, 2  // triangle 0
         *     ];
         *     var trimeshShape = new Trimesh(vertices, indices);
         */
        constructor(vertices: number[], indices: number[]);
        updateTree(): void;
        /**
         * Get triangles in a local AABB from the trimesh.
         *
         * @param aabb
         * @param result An array of integers, referencing the queried triangles.
         */
        getTrianglesInAABB(aabb: Box3, result: number[]): number[];
        /**
         * @param scale
         */
        setScale(scale: Vector3): void;
        /**
         * Compute the normals of the faces. Will save in the .normals array.
         */
        updateNormals(): void;
        /**
         * Update the .edges property
         */
        updateEdges(): void;
        /**
         * Get an edge vertex
         *
         * @param edgeIndex
         * @param firstOrSecond 0 or 1, depending on which one of the vertices you need.
         * @param vertexStore Where to store the result
         */
        getEdgeVertex(edgeIndex: number, firstOrSecond: number, vertexStore: Vector3): void;
        /**
         * Get a vector along an edge.
         *
         * @param edgeIndex
         * @param vectorStore
         */
        getEdgeVector(edgeIndex: number, vectorStore: Vector3): void;
        /**
         * Get face normal given 3 vertices
         *
         * @param va
         * @param vb
         * @param vc
         * @param target
         */
        static computeNormal(va: Vector3, vb: Vector3, vc: Vector3, target: Vector3): void;
        /**
         * Get vertex i.
         *
         * @param i
         * @param out
         * @return The "out" vector object
         */
        getVertex(i: number, out: Vector3): feng3d.Vector3;
        /**
         * Get raw vertex i
         *
         * @param i
         * @param out
         * @return The "out" vector object
         */
        private _getUnscaledVertex;
        /**
         * Get a vertex from the trimesh,transformed by the given position and quaternion.
         *
         * @param i
         * @param pos
         * @param quat
         * @param out
         * @return The "out" vector object
         */
        getWorldVertex(i: number, pos: Vector3, quat: Quaternion, out: Vector3): feng3d.Vector3;
        /**
         * Get the three vertices for triangle i.
         *
         * @param i
         * @param a
         * @param b
         * @param c
         */
        getTriangleVertices(i: number, a: Vector3, b: Vector3, c: Vector3): void;
        /**
         * Compute the normal of triangle i.
         *
         * @param i
         * @param target
         * @return The "target" vector object
         */
        getNormal(i: number, target: Vector3): feng3d.Vector3;
        /**
         *
         * @param mass
         * @param target
         * @return The "target" vector object
         */
        calculateLocalInertia(mass: number, target: Vector3): feng3d.Vector3;
        /**
         * Compute the local AABB for the trimesh
         *
         * @param aabb
         */
        computeLocalAABB(aabb: Box3): void;
        /**
         * Update the .aabb property
         */
        updateAABB(): void;
        /**
         * Will update the .boundingSphereRadius property
         */
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: Vector3, quat: Quaternion, min: Vector3, max: Vector3): void;
        /**
         * Get approximate volume
         */
        volume(): number;
        /**
         * Create a Trimesh instance, shaped as a torus.
         *
         * @param radius
         * @param tube
         * @param radialSegments
         * @param tubularSegments
         * @param arc
         *
         * @return A torus
         */
        static createTorus(radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number, arc?: number): Trimesh;
    }
}
declare namespace CANNON {
    class OctreeNode<T> {
        /**
         * The root node
         */
        root: OctreeNode<T>;
        /**
         * Boundary of this node
         */
        aabb: Box3;
        /**
         * Contained data at the current node level.
         * @property {Array} data
         */
        data: T[];
        /**
         * Children to this node
         */
        children: OctreeNode<T>[];
        maxDepth: number;
        /**
         *
         * @param options
         */
        constructor(options?: {
            root?: OctreeNode<T>;
            aabb?: Box3;
        });
        reset(): void;
        /**
         * Insert data into this node
         *
         * @param aabb
         * @param elementData
         * @return True if successful, otherwise false
         */
        insert(aabb: Box3, elementData: T, level?: number): boolean;
        /**
         * Create 8 equally sized children nodes and put them in the .children array.
         */
        subdivide(): void;
        /**
         * Get all data, potentially within an AABB
         *
         * @param aabb
         * @param result
         * @return The "result" object
         */
        aabbQuery(aabb: Box3, result: T[]): T[];
        /**
         * Get all data, potentially intersected by a ray.
         *
         * @param ray
         * @param treeTransform
         * @param result
         * @return The "result" object
         */
        rayQuery(ray: Ray, treeTransform: Transform, result: T[]): T[];
        removeEmptyNodes(): void;
    }
    class Octree<T> extends OctreeNode<T> {
        /**
         * Maximum subdivision depth
         */
        maxDepth: number;
        /**
         * @class Octree
         * @param {Box3} aabb The total AABB of the tree
         * @param {object} [options]
         * @param {number} [options.maxDepth=8]
         * @extends OctreeNode
         */
        constructor(aabb?: Box3, options?: {
            root?: OctreeNode<T>;
            aabb?: Box3;
            maxDepth?: number;
        });
    }
}
declare namespace CANNON {
    class OverlapKeeper {
        current: number[];
        previous: number[];
        constructor();
        getKey(i: number, j: number): number;
        set(i: number, j: number): void;
        tick(): void;
        unpackAndPush(array: number[], key: number): void;
        getDiff(additions: number[], removals: number[]): void;
    }
}
declare namespace CANNON {
    class RaycastResult {
        rayFromWorld: feng3d.Vector3;
        rayToWorld: feng3d.Vector3;
        hitNormalWorld: feng3d.Vector3;
        hitPointWorld: feng3d.Vector3;
        hasHit: boolean;
        shape: Shape;
        body: Body;
        /**
         * The index of the hit triangle, if the hit shape was a trimesh.
         */
        hitFaceIndex: number;
        /**
         * Distance to the hit. Will be set to -1 if there was no hit.
         */
        distance: number;
        suspensionLength: number;
        directionWorld: Vector3;
        /**
         * If the ray should stop traversing the bodies.
         */
        _shouldStop: boolean;
        groundObject: number;
        /**
         * Storage for Ray casting data.
         */
        constructor();
        /**
         * Reset all result data.
         */
        reset(): void;
        abort(): void;
        set(rayFromWorld: Vector3, rayToWorld: Vector3, hitNormalWorld: Vector3, hitPointWorld: Vector3, shape: Shape, body: Body, distance: number): void;
    }
}
declare namespace CANNON {
    class Broadphase {
        /**
        * The world to search for collisions in.
        */
        world: World;
        /**
         * If set to true, the broadphase uses bounding boxes for intersection test, else it uses bounding spheres.
         */
        useBoundingBoxes: boolean;
        /**
         * Set to true if the objects in the world moved.
         */
        dirty: boolean;
        /**
         * Base class for broadphase implementations
         *
         * @author schteppe
         */
        constructor();
        /**
         * Get the collision pairs from the world
         *
         * @param world The world to search in
         * @param p1 Empty array to be filled with body objects
         * @param p2 Empty array to be filled with body objects
         */
        collisionPairs(world: World, p1: Body[], p2: Body[]): void;
        /**
         * Check if a body pair needs to be intersection tested at all.
         *
         * @param bodyA
         * @param bodyB
         */
        needBroadphaseCollision(bodyA: Body, bodyB: Body): boolean;
        /**
         * Check if the bounding volumes of two bodies intersect.
          *
          * @param bodyA
          * @param bodyB
          * @param pairs1
          * @param pairs2
          */
        intersectionTest(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[]): void;
        /**
         * Check if the bounding spheres of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1 bodyA is appended to this array if intersection
         * @param pairs2 bodyB is appended to this array if intersection
         */
        doBoundingSphereBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[]): void;
        /**
         * Check if the bounding boxes of two bodies are intersecting.
         * @param bodyA
         * @param bodyB
         * @param pairs1
         * @param pairs2
         */
        doBoundingBoxBroadphase(bodyA: Body, bodyB: Body, pairs1: Body[], pairs2: Body[]): void;
        /**
         * Removes duplicate pairs from the pair arrays.
         * @param pairs1
         * @param pairs2
         */
        makePairsUnique(pairs1: Body[], pairs2: Body[]): void;
        /**
         * To be implemented by subcasses
         * @method setWorld
         * @param {World} world
         */
        setWorld(world: World): void;
        /**
         * Check if the bounding spheres of two bodies overlap.
         * @param bodyA
         * @param bodyB
         */
        static boundingSphereCheck(bodyA: Body, bodyB: Body): boolean;
        /**
         * Returns all the bodies within the AABB.
         *
         * @param world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        aabbQuery(world: World, aabb: Box3, result: Body[]): any[];
    }
}
declare namespace CANNON {
    class GridBroadphase extends Broadphase {
        nx: number;
        ny: number;
        nz: number;
        aabbMin: Vector3;
        aabbMax: Vector3;
        bins: Body[][];
        binLengths: number[];
        /**
         * Axis aligned uniform grid broadphase.
         *
         * @param aabbMin
         * @param aabbMax
         * @param nx Number of boxes along x
         * @param ny Number of boxes along y
         * @param nz Number of boxes along z
         *
         * @todo Needs support for more than just planes and spheres.
         */
        constructor(aabbMin: Vector3, aabbMax: Vector3, nx: number, ny: number, nz: number);
        /**
         * Get all the collision pairs in the physics world
         *
         * @param world
         * @param pairs1
         * @param pairs2
         */
        collisionPairs(world: World, pairs1: Body[], pairs2: Body[]): void;
    }
}
declare namespace CANNON {
    class NaiveBroadphase extends Broadphase {
        /**
         * Naive broadphase implementation, used in lack of better ones.
         * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
         */
        constructor();
        /**
         * Get all the collision pairs in the physics world
         * @param world
         * @param pairs1
         * @param pairs2
         */
        collisionPairs(world: World, pairs1: Body[], pairs2: Body[]): void;
        /**
         * Returns all the bodies within an AABB.
         * @param world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        aabbQuery(world: World, aabb: Box3, result: Body[]): Body<BodyEventMap>[];
    }
}
declare namespace CANNON {
    class SAPBroadphase extends Broadphase {
        /**
         * List of bodies currently in the broadphase.
         */
        axisList: Body[];
        /**
         * Axis to sort the bodies along. Set to 0 for x axis, and 1 for y axis. For best performance, choose an axis that the bodies are spread out more on.
         */
        axisIndex: number;
        private _addBodyHandler;
        private _removeBodyHandler;
        /**
         * Sweep and prune broadphase along one axis.
         *
         * @param world
         */
        constructor(world: World);
        /**
         * Change the world
         * @param world
         */
        setWorld(world: World): void;
        static insertionSortX(a: Body[]): Body<BodyEventMap>[];
        static insertionSortY(a: Body[]): Body<BodyEventMap>[];
        static insertionSortZ(a: Body[]): Body<BodyEventMap>[];
        /**
         * Collect all collision pairs
         * @param world
         * @param p1
         * @param p2
         */
        collisionPairs(world: World, p1: Body[], p2: Body[]): void;
        sortList(): void;
        /**
         * Check if the bounds of two bodies overlap, along the given SAP axis.
         * @param bi
         * @param bj
         * @param axisIndex
         */
        static checkBounds(bi: Body, bj: Body, axisIndex: number): boolean;
        /**
         * Computes the variance of the body positions and estimates the best
         * axis to use. Will automatically set property .axisIndex.
         */
        autoDetectAxis(): void;
        /**
         * Returns all the bodies within an AABB.
         * @param world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        aabbQuery(world: World, aabb: Box3, result: Body[]): Body<BodyEventMap>[];
    }
}
declare namespace CANNON {
    class Ray {
        from: Vector3;
        to: Vector3;
        _direction: Vector3;
        /**
         * The precision of the ray. Used when checking parallelity etc.
         */
        precision: number;
        /**
         * Set to true if you want the Ray to take .collisionResponse flags into account on bodies and shapes.
         */
        checkCollisionResponse: boolean;
        /**
         * If set to true, the ray skips any hits with normal.dot(rayDirection) < 0.
         */
        skipBackfaces: boolean;
        collisionFilterMask: number;
        collisionFilterGroup: number;
        /**
         * The intersection mode. Should be Ray.ANY, Ray.ALL or Ray.CLOSEST.
         */
        mode: number;
        /**
         * Current result object.
         */
        result: RaycastResult;
        /**
         * Will be set to true during intersectWorld() if the ray hit anything.
         */
        hasHit: boolean;
        /**
         * Current, user-provided result callback. Will be used if mode is Ray.ALL.
         */
        callback: Function;
        /**
         * A line in 3D space that intersects bodies and return points.
         * @param from
         * @param to
         */
        constructor(from?: Vector3, to?: Vector3);
        static CLOSEST: number;
        static ANY: number;
        static ALL: number;
        /**
         * Do itersection against all bodies in the given World.
         * @param world
         * @param options
         * @return True if the ray hit anything, otherwise false.
         */
        intersectWorld(world: World, options: {
            mode?: number;
            result?: RaycastResult;
            skipBackfaces?: boolean;
            collisionFilterMask?: number;
            collisionFilterGroup?: number;
            from?: Vector3;
            to?: Vector3;
            callback?: Function;
        }): boolean;
        /**
         * Shoot a ray at a body, get back information about the hit.
         * @param body
         * @param result Deprecated - set the result property of the Ray instead.
         */
        intersectBody(body: Body, result?: RaycastResult): void;
        /**
         * @param bodies An array of Body objects.
         * @param result Deprecated
         */
        intersectBodies(bodies: Body[], result?: RaycastResult): void;
        /**
         * Updates the _direction vector.
         */
        private _updateDirection;
        private intersectShape;
        private intersectBox;
        private intersectPlane;
        /**
         * Get the world AABB of the ray.
         */
        getAABB(result: Box3): void;
        private intersectHeightfield;
        private intersectSphere;
        private intersectConvex;
        /**
         * @method intersectTrimesh
         * @private
         * @param  {Shape} shape
         * @param  {Quaternion} quat
         * @param  {Vector3} position
         * @param  {Body} body
         * @param {object} [options]
         */
        /**
         *
         * @param mesh
         * @param quat
         * @param position
         * @param body
         * @param reportedShape
         * @param options
         *
         * @todo Optimize by transforming the world to local space first.
         * @todo Use Octree lookup
         */
        private intersectTrimesh;
        private reportIntersection;
        /**
         * Check if the AABB is hit by a ray.
         */
        overlapsBox3(box3: Box3): boolean;
    }
}
declare namespace CANNON {
    class Material {
        name: string;
        /**
         * material id.
         */
        id: number;
        /**
         * Friction for this material. If non-negative, it will be used instead of the friction given by ContactMaterials. If there's no matching ContactMaterial, the value from .defaultContactMaterial in the World will be used.
         */
        friction: number;
        /**
         * Restitution for this material. If non-negative, it will be used instead of the restitution given by ContactMaterials. If there's no matching ContactMaterial, the value from .defaultContactMaterial in the World will be used.
         */
        restitution: number;
        /**
         * Defines a physics material.
         *
         * @param options
         * @author schteppe
         */
        constructor(options?: {
            friction?: number;
            restitution?: number;
        } | string);
        static idCounter: number;
    }
}
declare namespace CANNON {
    class ContactMaterial {
        /**
         * Identifier of this material
         */
        id: number;
        /**
         * Participating materials
         * @todo  Should be .materialA and .materialB instead
         */
        materials: Material[];
        /**
         * Friction coefficient
         */
        friction: number;
        /**
         * Restitution coefficient
         */
        restitution: number;
        /**
         * Stiffness of the produced contact equations
         */
        contactEquationStiffness: number;
        /**
         * Relaxation time of the produced contact equations
         */
        contactEquationRelaxation: number;
        /**
         * Stiffness of the produced friction equations
         */
        frictionEquationStiffness: number;
        /**
         * Relaxation time of the produced friction equations
         */
        frictionEquationRelaxation: number;
        /**
         * Defines what happens when two materials meet.
         *
         * @param m1
         * @param m2
         * @param options
         */
        constructor(m1?: Material, m2?: Material, options?: {
            friction?: number;
            restitution?: number;
            contactEquationStiffness?: number;
            contactEquationRelaxation?: number;
            frictionEquationStiffness?: number;
            frictionEquationRelaxation?: number;
        });
        static idCounter: number;
    }
}
declare namespace CANNON {
    interface BodyEventMap {
        wakeup: any;
        sleepy: any;
        sleep: any;
        collide: {
            body: Body;
            contact: ContactEquation;
        };
    }
    class Body<T extends BodyEventMap = BodyEventMap> extends feng3d.EventEmitter<T> {
        id: number;
        /**
         * Reference to the world the body is living in
         */
        world: World;
        vlambda: Vector3;
        collisionFilterGroup: number;
        collisionFilterMask: number;
        /**
         * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
         */
        collisionResponse: boolean;
        /**
         * World space position of the body.
         */
        position: Vector3;
        previousPosition: Vector3;
        /**
         * Interpolated position of the body.
         */
        interpolatedPosition: Vector3;
        /**
         * Initial position of the body
         */
        initPosition: Vector3;
        /**
         * World space velocity of the body.
         */
        velocity: Vector3;
        initVelocity: Vector3;
        /**
         * Linear force on the body in world space.
         */
        force: Vector3;
        mass: number;
        invMass: number;
        material: Material;
        linearDamping: number;
        /**
         * One of: Body.DYNAMIC, Body.STATIC and Body.KINEMATIC.
         */
        type: number;
        /**
         * If true, the body will automatically fall to sleep.
         */
        allowSleep: boolean;
        /**
         * Current sleep state.
         */
        sleepState: number;
        /**
         * If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
         */
        sleepSpeedLimit: number;
        /**
         * If the body has been sleepy for this sleepTimeLimit seconds, it is considered sleeping.
         */
        sleepTimeLimit: number;
        timeLastSleepy: number;
        _wakeUpAfterNarrowphase: boolean;
        /**
         * World space rotational force on the body, around center of mass.
         */
        torque: Vector3;
        /**
         * World space orientation of the body.
         */
        quaternion: Quaternion;
        initQuaternion: Quaternion;
        previousQuaternion: Quaternion;
        /**
         * Interpolated orientation of the body.
         */
        interpolatedQuaternion: Quaternion;
        /**
         * Angular velocity of the body, in world space. Think of the angular velocity as a vector, which the body rotates around. The length of this vector determines how fast (in radians per second) the body rotates.
         */
        angularVelocity: Vector3;
        initAngularVelocity: Vector3;
        shapes: Shape[];
        /**
         * Position of each Shape in the body, given in local Body space.
         */
        shapeOffsets: Vector3[];
        /**
         * Orientation of each Shape, given in local Body space.
         */
        shapeOrientations: Quaternion[];
        inertia: Vector3;
        invInertia: Vector3;
        invInertiaWorld: Matrix3x3;
        invMassSolve: number;
        invInertiaSolve: Vector3;
        invInertiaWorldSolve: Matrix3x3;
        /**
         * Set to true if you don't want the body to rotate. Make sure to run .updateMassProperties() after changing this.
         */
        fixedRotation: boolean;
        angularDamping: number;
        /**
         * Use this property to limit the motion along any world axis. (1,1,1) will allow motion along all axes while (0,0,0) allows none.
         */
        linearFactor: Vector3;
        /**
         * Use this property to limit the rotational motion along any world axis. (1,1,1) will allow rotation along all axes while (0,0,0) allows none.
         */
        angularFactor: Vector3;
        /**
         * World space bounding box of the body and its shapes.
         */
        aabb: Box3;
        /**
         * Indicates if the AABB needs to be updated before use.
         */
        aabbNeedsUpdate: boolean;
        /**
         * Total bounding radius of the Body including its shapes, relative to body.position.
         */
        boundingRadius: number;
        wlambda: Vector3;
        shape: Shape;
        index: number;
        /**
         * Base class for all body types.
         *
         * @param options
         * @param a
         *
         * @example
         *     var body = new Body({
         *         mass: 1
         *     });
         *     var shape = new Sphere(1);
         *     body.addShape(shape);
         *     world.addBody(body);
         */
        constructor(options?: {
            collisionFilterGroup?: number;
            collisionFilterMask?: number;
            position?: Vector3;
            velocity?: Vector3;
            material?: Material;
            mass?: number;
            linearDamping?: number;
            type?: number;
            allowSleep?: boolean;
            sleepSpeedLimit?: number;
            sleepTimeLimit?: number;
            quaternion?: Quaternion;
            angularVelocity?: Vector3;
            fixedRotation?: boolean;
            angularDamping?: number;
            linearFactor?: Vector3;
            angularFactor?: Vector3;
            shape?: Shape;
        });
        /**
         * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
         */
        static DYNAMIC: number;
        /**
         * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
         */
        static STATIC: number;
        /**
         * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
         */
        static KINEMATIC: number;
        static AWAKE: number;
        static SLEEPY: number;
        static SLEEPING: number;
        static idCounter: number;
        /**
         * Wake the body up.
         */
        wakeUp(): void;
        /**
         * Force body sleep
         */
        sleep(): void;
        /**
         * Called every timestep to update internal sleep timer and change sleep state if needed.
         */
        sleepTick(time: number): void;
        /**
         * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
         */
        updateSolveMassProperties(): void;
        /**
         * Convert a world point to local body frame.
         *
         * @param worldPoint
         * @param result
         */
        pointToLocalFrame(worldPoint: Vector3, result?: feng3d.Vector3): feng3d.Vector3;
        /**
         * Convert a world vector to local body frame.
         *
         * @param worldPoint
         * @param result
         */
        vectorToLocalFrame(worldVector: any, result?: feng3d.Vector3): feng3d.Vector3;
        /**
         * Convert a local body point to world frame.
         *
         * @param localPoint
         * @param result
         */
        pointToWorldFrame(localPoint: Vector3, result?: feng3d.Vector3): feng3d.Vector3;
        /**
         * Convert a local body point to world frame.
         *
         * @param localVector
         * @param result
         */
        vectorToWorldFrame(localVector: Vector3, result?: feng3d.Vector3): feng3d.Vector3;
        /**
         * Add a shape to the body with a local offset and orientation.
         *
         * @param shape
         * @param _offset
         * @param_orientation
         * @return The body object, for chainability.
         */
        addShape(shape: Shape, _offset?: Vector3, _orientation?: Quaternion): this;
        /**
         * Update the bounding radius of the body. Should be done if any of the shapes are changed.
         */
        updateBoundingRadius(): void;
        /**
         * Updates the .aabb
         *
         * @todo rename to updateAABB()
         */
        computeAABB(): void;
        /**
         * Update .inertiaWorld and .invInertiaWorld
         */
        updateInertiaWorld(force?: any): void;
        /**
         * Apply force to a world point. This could for example be a point on the Body surface. Applying force this way will add to Body.force and Body.torque.
         *
         * @param force The amount of force to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        applyForce(force: Vector3, relativePoint: Vector3): void;
        /**
         * Apply force to a local point in the body.
         *
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        applyLocalForce(localForce: Vector3, localPoint: Vector3): void;
        /**
         * Apply impulse to a world point. This could for example be a point on the Body surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
         *
         * @param impulse The amount of impulse to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        applyImpulse(impulse: Vector3, relativePoint: Vector3): void;
        /**
         * Apply locally-defined impulse to a local point in the body.
         *
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        applyLocalImpulse(localImpulse: Vector3, localPoint: Vector3): void;
        /**
         * Should be called whenever you change the body shape or mass.
         */
        updateMassProperties(): void;
        /**
         * Get world velocity of a point in the body.
         * @method getVelocityAtWorldPoint
         * @param  {Vector3} worldPoint
         * @param  {Vector3} result
         * @return {Vector3} The result vector.
         */
        getVelocityAtWorldPoint(worldPoint: Vector3, result: Vector3): feng3d.Vector3;
        /**
         * Move the body forward in time.
         * @param dt Time step
         * @param quatNormalize Set to true to normalize the body quaternion
         * @param quatNormalizeFast If the quaternion should be normalized using "fast" quaternion normalization
         */
        integrate(dt: number, quatNormalize: boolean, quatNormalizeFast: boolean): void;
    }
}
declare namespace CANNON {
    class Spring {
        /**
         * Rest length of the spring.
         */
        restLength: number;
        /**
         * Stiffness of the spring.
         */
        stiffness: number;
        /**
         * Damping of the spring.
         */
        damping: number;
        /**
         * First connected body.
         */
        bodyA: Body;
        /**
         * Second connected body.
         */
        bodyB: Body;
        /**
         * Anchor for bodyA in local bodyA coordinates.
         */
        localAnchorA: Vector3;
        /**
         * Anchor for bodyB in local bodyB coordinates.
         */
        localAnchorB: Vector3;
        /**
         * A spring, connecting two bodies.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         */
        constructor(bodyA: Body, bodyB: Body, options?: {
            restLength?: number;
            stiffness?: number;
            damping?: number;
            localAnchorA?: Vector3;
            localAnchorB?: Vector3;
            worldAnchorA?: Vector3;
            worldAnchorB?: Vector3;
        });
        /**
         * Set the anchor point on body A, using world coordinates.
         * @param worldAnchorA
         */
        setWorldAnchorA(worldAnchorA: Vector3): void;
        /**
         * Set the anchor point on body B, using world coordinates.
         * @param worldAnchorB
         */
        setWorldAnchorB(worldAnchorB: Vector3): void;
        /**
         * Get the anchor point on body A, in world coordinates.
         * @param result The vector to store the result in.
         */
        getWorldAnchorA(result: Vector3): void;
        /**
         * Get the anchor point on body B, in world coordinates.
         * @param result The vector to store the result in.
         */
        getWorldAnchorB(result: Vector3): void;
        /**
         * Apply the spring force to the connected bodies.
         */
        applyForce(): void;
    }
}
declare namespace CANNON {
    class WheelInfo {
        /**
         * Max travel distance of the suspension, in meters.
         */
        maxSuspensionTravel: number;
        /**
         * Speed to apply to the wheel rotation when the wheel is sliding.
         */
        customSlidingRotationalSpeed: number;
        /**
         * If the customSlidingRotationalSpeed should be used.
         */
        useCustomSlidingRotationalSpeed: boolean;
        sliding: boolean;
        /**
         * Connection point, defined locally in the chassis body frame.
         */
        chassisConnectionPointLocal: Vector3;
        chassisConnectionPointWorld: Vector3;
        directionLocal: Vector3;
        directionWorld: Vector3;
        axleLocal: Vector3;
        axleWorld: Vector3;
        suspensionRestLength: number;
        suspensionMaxLength: number;
        radius: number;
        suspensionStiffness: number;
        dampingCompression: number;
        dampingRelaxation: number;
        frictionSlip: number;
        steering: number;
        /**
         * Rotation value, in radians.
         */
        rotation: number;
        deltaRotation: number;
        rollInfluence: number;
        maxSuspensionForce: number;
        engineForce: number;
        brake: number;
        isFrontWheel: number;
        clippedInvContactDotSuspension: number;
        suspensionRelativeVelocity: number;
        suspensionForce: number;
        skidInfo: number;
        suspensionLength: number;
        sideImpulse: number;
        forwardImpulse: number;
        /**
         * The result from raycasting
         */
        raycastResult: RaycastResult;
        /**
         * Wheel world transform
         */
        worldTransform: Transform;
        isInContact: boolean;
        slipInfo: number;
        /**
         *
         * @param options
         */
        constructor(options?: {
            maxSuspensionTravel?: number;
            customSlidingRotationalSpeed?: number;
            useCustomSlidingRotationalSpeed?: boolean;
            chassisConnectionPointLocal?: Vector3;
            chassisConnectionPointWorld?: Vector3;
            directionLocal?: Vector3;
            directionWorld?: Vector3;
            axleLocal?: Vector3;
            axleWorld?: Vector3;
            suspensionRestLength?: number;
            suspensionMaxLength?: number;
            radius?: number;
            suspensionStiffness?: number;
            dampingCompression?: number;
            dampingRelaxation?: number;
            frictionSlip?: number;
            rollInfluence?: number;
            maxSuspensionForce?: number;
            isFrontWheel?: number;
        });
        updateWheel(chassis: Body): void;
    }
}
declare namespace CANNON {
    class RaycastVehicle {
        chassisBody: Body;
        /**
         * An array of WheelInfo objects.
         */
        wheelInfos: WheelInfo[];
        /**
         * Will be set to true if the car is sliding.
         */
        sliding: boolean;
        world: World;
        /**
         * Index of the right axis, 0=x, 1=y, 2=z
         */
        indexRightAxis: number;
        /**
         * Index of the forward axis, 0=x, 1=y, 2=z
         */
        indexForwardAxis: number;
        /**
         * Index of the up axis, 0=x, 1=y, 2=z
         */
        indexUpAxis: number;
        currentVehicleSpeedKmHour: number;
        constraints: any;
        /**
         * Vehicle helper class that casts rays from the wheel positions towards the ground and applies forces.
         *
         * @param options
         */
        constructor(options?: {
            chassisBody?: Body;
            indexRightAxis?: number;
            indexForwardAxis?: number;
            indexUpAxis?: number;
        });
        /**
         * Add a wheel. For information about the options, see WheelInfo.
         *
         * @param options
         */
        addWheel(options?: {}): number;
        /**
         * Set the steering value of a wheel.
         *
         * @param value
         * @param wheelIndex
         */
        setSteeringValue(value: number, wheelIndex: number): void;
        /**
         * Set the wheel force to apply on one of the wheels each time step
         *
         * @param value
         * @param wheelIndex
         */
        applyEngineForce(value: number, wheelIndex: number): void;
        /**
         * Set the braking force of a wheel
         *
         * @param brake
         * @param wheelIndex
         */
        setBrake(brake: number, wheelIndex: number): void;
        /**
         * Add the vehicle including its constraints to the world.
         *
         * @param world
         */
        addToWorld(world: World): void;
        _preStepCallback(): void;
        /**
         * Get one of the wheel axles, world-oriented.
         * @param axisIndex
         * @param result
         */
        getVehicleAxisWorld(axisIndex: number, result: Vector3): void;
        updateVehicle(timeStep: number): void;
        updateSuspension(deltaTime: number): void;
        /**
         * Remove the vehicle including its constraints from the world.
         *
         * @param world
         */
        removeFromWorld(world: World): void;
        castRay(wheel: WheelInfo): number;
        updateWheelTransformWorld(wheel: WheelInfo): void;
        /**
         * Update one of the wheel transform.
         * Note when rendering wheels: during each step, wheel transforms are updated BEFORE the chassis; ie. their position becomes invalid after the step. Thus when you render wheels, you must update wheel transforms before rendering them. See raycastVehicle demo for an example.
         *
         * @param wheelIndex The wheel index to update.
         */
        updateWheelTransform(wheelIndex: number): void;
        /**
         * Get the world transform of one of the wheels
         *
         * @param wheelIndex
         */
        getWheelTransformWorld(wheelIndex: number): Transform;
        updateFriction(timeStep: number): void;
    }
}
declare namespace CANNON {
    class RigidVehicle {
        wheelBodies: Body[];
        coordinateSystem: Vector3;
        chassisBody: Body;
        constraints: HingeConstraint[];
        wheelAxes: Vector3[];
        wheelForces: number[];
        /**
         * Simple vehicle helper class with spherical rigid body wheels.
         *
         * @param options
         */
        constructor(options?: {
            coordinateSystem?: Vector3;
            chassisBody?: Body;
        });
        /**
         * Add a wheel
         *
         * @param options
         */
        addWheel(options?: {
            body?: Body;
            isFrontWheel?: boolean;
            position?: Vector3;
            axis?: Vector3;
        }): number;
        /**
         * Set the steering value of a wheel.
         *
         * @param value
         * @param wheelIndex
         *
         * @todo check coordinateSystem
         */
        setSteeringValue(value: number, wheelIndex: number): void;
        /**
         * Set the target rotational speed of the hinge constraint.
         *
         * @param value
         * @param wheelIndex
         */
        setMotorSpeed(value: number, wheelIndex: number): void;
        /**
         * Set the target rotational speed of the hinge constraint.
         *
         * @param wheelIndex
         */
        disableMotor(wheelIndex: number): void;
        /**
         * Set the wheel force to apply on one of the wheels each time step
         *
         * @param value
         * @param wheelIndex
         */
        setWheelForce(value: number, wheelIndex: number): void;
        /**
         * Apply a torque on one of the wheels.
         *
         * @param value
         * @param wheelIndex
         */
        applyWheelForce(value: number, wheelIndex: number): void;
        /**
         * Add the vehicle including its constraints to the world.
         *
         * @param world
         */
        addToWorld(world: World): void;
        private _update;
        /**
         * Remove the vehicle including its constraints from the world.
         * @param world
         */
        removeFromWorld(world: World): void;
        /**
         * Get current rotational velocity of a wheel
         *
         * @param wheelIndex
         */
        getWheelSpeed(wheelIndex: number): number;
    }
}
declare namespace CANNON {
    class SPHSystem {
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
        constructor();
        /**
         * Add a particle to the system.
         *
         * @param particle
         */
        add(particle: Body): void;
        /**
         * Remove a particle from the system.
         *
         * @param particle
         */
        remove(particle: Body): void;
        /**
         * Get neighbors within smoothing volume, save in the array neighbors
         *
         * @param particle
         * @param neighbors
         */
        getNeighbors(particle: Body, neighbors: Body[]): void;
        update(): void;
        w(r: number): number;
        gradw(rVec: Vector3, resultVec: Vector3): void;
        nablaw(r: number): number;
    }
}
declare namespace CANNON {
    class Equation {
        id: number;
        minForce: number;
        maxForce: number;
        bi: Body;
        bj: Body;
        a: number;
        b: number;
        /**
         * SPOOK parameter
         */
        eps: number;
        jacobianElementA: JacobianElement;
        jacobianElementB: JacobianElement;
        enabled: boolean;
        /**
         * A number, proportional to the force added to the bodies.
         * @readonly
         */
        multiplier: number;
        /**
         * Equation base class
         * @class Equation
         * @constructor
         * @author schteppe
         * @param {Body} bi
         * @param {Body} bj
         * @param {Number} minForce Minimum (read: negative max) force to be applied by the constraint.
         * @param {Number} maxForce Maximum (read: positive max) force to be applied by the constraint.
         */
        constructor(bi: Body, bj: Body, minForce?: number, maxForce?: number);
        static id: number;
        /**
         * Recalculates a,b,eps.
         */
        setSpookParams(stiffness: number, relaxation: number, timeStep: number): void;
        /**
         * Computes the RHS of the SPOOK equation
         */
        computeB(a: number, b: number, h: number): number;
        /**
         * Computes G*q, where q are the generalized body coordinates
         */
        computeGq(): number;
        /**
         * Computes G*W, where W are the body velocities
         */
        computeGW(): number;
        /**
         * Computes G*Wlambda, where W are the body velocities
         */
        computeGWlambda(): number;
        /**
         * Computes G*inv(M)*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
         */
        computeGiMf(): number;
        /**
         * Computes G*inv(M)*G'
         */
        computeGiMGt(): number;
        /**
         * Add constraint velocity to the bodies.
         */
        addToWlambda(deltalambda: number): void;
        /**
         * Compute the denominator part of the SPOOK equation: C = G*inv(M)*G' + eps
         */
        computeC(): number;
    }
}
declare namespace CANNON {
    class ConeEquation extends Equation {
        axisA: Vector3;
        axisB: Vector3;
        /**
         * The cone angle to keep
         */
        angle: number;
        /**
         * Cone equation. Works to keep the given body world vectors aligned, or tilted within a given angle from each other.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options?: {
            maxForce?: number;
            axisA?: Vector3;
            axisB?: Vector3;
            angle?: number;
        });
        computeB(h: number): number;
    }
}
declare namespace CANNON {
    class ContactEquation extends Equation {
        restitution: number;
        /**
         * World-oriented vector that goes from the center of bi to the contact point.
         */
        ri: Vector3;
        /**
         * World-oriented vector that starts in body j position and goes to the contact point.
         */
        rj: Vector3;
        /**
         * Contact normal, pointing out of body i.
         */
        ni: Vector3;
        si: Shape;
        sj: Shape;
        bodyA: Body;
        /**
         * Contact/non-penetration constraint equation
         *
         * @param bodyA
         * @param bodyB
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, maxForce?: number);
        computeB(h: number): number;
        /**
         * Get the current relative velocity in the contact point.
         */
        getImpactVelocityAlongNormal(): number;
    }
}
declare namespace CANNON {
    class FrictionEquation extends Equation {
        ri: Vector3;
        rj: Vector3;
        t: Vector3;
        /**
         * Constrains the slipping in a contact along a tangent
         * @class FrictionEquation
         * @constructor
         * @author schteppe
         * @param {Body} bodyA
         * @param {Body} bodyB
         * @param {Number} slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
         * @extends Equation
         */
        constructor(bodyA: Body, bodyB: Body, slipForce: number);
        computeB(h: number): number;
    }
}
declare namespace CANNON {
    class RotationalEquation extends Equation {
        axisA: Vector3;
        axisB: Vector3;
        maxAngle: number;
        /**
         * Rotational constraint. Works to keep the local vectors orthogonal to each other in world space.
         *
         * @param bodyA
         * @param bodyB
         * @param options
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options?: {
            axisA?: Vector3;
            axisB?: Vector3;
            maxForce?: number;
        });
        computeB(h: number): number;
    }
}
declare namespace CANNON {
    class RotationalMotorEquation extends Equation {
        /**
         * World oriented rotational axis
         */
        axisA: Vector3;
        /**
         * World oriented rotational axis
         */
        axisB: Vector3;
        /**
         * Motor velocity
         */
        targetVelocity: number;
        /**
         * Rotational motor constraint. Tries to keep the relative angular velocity of the bodies to a given value.
         *
         * @param bodyA
         * @param bodyB
         * @param maxForce
         *
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, maxForce: number);
        computeB(h: number): number;
    }
}
declare namespace CANNON {
    class Solver {
        /**
         * The number of solver iterations determines quality of the constraints in the world. The more iterations, the more correct simulation. More iterations need more computations though. If you have a large gravity force in your world, you will need more iterations.
         * @todo write more about solver and iterations in the wiki
         */
        iterations: number;
        /**
         * When tolerance is reached, the system is assumed to be converged.
         */
        tolerance: number;
        /**
         * All equations to be solved
         */
        equations: Equation[];
        /**
         * Constraint equation solver base class.
         * @author schteppe / https://github.com/schteppe
         */
        constructor();
        /**
         * Should be implemented in subclasses!
         * @param dt
         * @param world
         */
        solve(dt: number, world: {
            bodies: Body[];
        }): number;
        /**
         * Add an equation
         * @param eq
         */
        addEquation(eq: Equation): void;
        /**
         * Remove an equation
         * @param eq
         */
        removeEquation(eq: Equation): void;
        /**
         * Add all equations
         */
        removeAllEquations(): void;
    }
}
declare namespace CANNON {
    class GSSolver extends Solver {
        /**
         * Constraint equation Gauss-Seidel solver.
         * @todo The spook parameters should be specified for each constraint, not globally.
         * @author schteppe / https://github.com/schteppe
         * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
         */
        constructor();
        solve(dt: number, world: World): number;
    }
}
declare namespace CANNON {
    interface SSNode {
        body: Body;
        children: SSNode[];
        eqs: Equation[];
        visited: boolean;
    }
    export class SplitSolver extends Solver {
        subsolver: Solver;
        nodes: SSNode[];
        nodePool: SSNode[];
        /**
         * Splits the equations into islands and solves them independently. Can improve performance.
         *
         * @param subsolver
         */
        constructor(subsolver: Solver);
        createNode(): SSNode;
        /**
         * Solve the subsystems
         * @method solve
         * @param  {Number} dt
         * @param  {World} world
         */
        solve(dt: number, world: World): number;
    }
    export {};
}
declare namespace CANNON {
    interface WorldEventMap {
        addBody: Body;
        removeBody: Body;
        preStep: any;
        /**
         * Dispatched after the world has stepped forward in time.
         */
        postStep: any;
        beginContact: {
            bodyA: Body;
            bodyB: Body;
        };
        endContact: {
            bodyA: Body;
            bodyB: Body;
        };
        beginShapeContact: {
            bodyA: Body;
            bodyB: Body;
            shapeA: Shape;
            shapeB: Shape;
        };
        endShapeContact: {
            bodyA: Body;
            bodyB: Body;
            shapeA: Shape;
            shapeB: Shape;
        };
    }
    class World<T extends WorldEventMap = WorldEventMap> extends feng3d.EventEmitter<T> {
        static worldNormal: feng3d.Vector3;
        /**
         * Currently / last used timestep. Is set to -1 if not available. This value is updated before each internal step, which means that it is "fresh" inside event callbacks.
         */
        dt: number;
        /**
         * Makes bodies go to sleep when they've been inactive
         */
        allowSleep: boolean;
        /**
         * All the current contacts (instances of ContactEquation) in the world.
         */
        contacts: ContactEquation[];
        frictionEquations: FrictionEquation[];
        /**
         * How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.. A larger value increases performance. If bodies tend to explode, set to a smaller value (zero to be sure nothing can go wrong).
         */
        quatNormalizeSkip: number;
        /**
         * Set to true to use fast quaternion normalization. It is often enough accurate to use. If bodies tend to explode, set to false.
         */
        quatNormalizeFast: boolean;
        /**
         * The wall-clock time since simulation start
         */
        time: number;
        /**
         * Number of timesteps taken since start
         */
        stepnumber: number;
        default_dt: number;
        nextId: number;
        gravity: Vector3;
        /**
         * The broadphase algorithm to use. Default is NaiveBroadphase
         */
        broadphase: Broadphase;
        bodies: Body[];
        /**
         * The solver algorithm to use. Default is GSSolver
         */
        solver: Solver;
        constraints: Constraint[];
        narrowphase: Narrowphase;
        collisionMatrix: {};
        /**
         * CollisionMatrix from the previous step.
         */
        collisionMatrixPrevious: {};
        bodyOverlapKeeper: OverlapKeeper;
        shapeOverlapKeeper: OverlapKeeper;
        /**
         * All added materials
         */
        materials: Material[];
        contactmaterials: ContactMaterial[];
        /**
         * Used to look up a ContactMaterial given two instances of Material.
         */
        contactMaterialTable: {
            [key: string]: ContactMaterial;
        };
        defaultMaterial: Material;
        /**
         * This contact material is used if no suitable contactmaterial is found for a contact.
         */
        defaultContactMaterial: ContactMaterial;
        doProfiling: boolean;
        profile: {
            solve: number;
            makeContactConstraints: number;
            broadphase: number;
            integrate: number;
            narrowphase: number;
        };
        /**
         * Time accumulator for interpolation. See http://gafferongames.com/game-physics/fix-your-timestep/
         */
        accumulator: number;
        subsystems: SPHSystem[];
        idToBodyMap: {
            [id: string]: Body;
        };
        /**
         * The physics world
         * @param options
         */
        constructor(options?: {
            gravity?: Vector3;
            allowSleep?: boolean;
            broadphase?: Broadphase;
            solver?: Solver;
            quatNormalizeFast?: boolean;
            quatNormalizeSkip?: number;
        });
        /**
         * Get the contact material between materials m1 and m2
         * @param m1
         * @param m2
         * @return  The contact material if it was found.
         */
        getContactMaterial(m1: Material, m2: Material): ContactMaterial;
        /**
         * Get number of objects in the world.
         */
        numObjects(): number;
        /**
         * Store old collision state info
         */
        collisionMatrixTick(): void;
        /**
         * Add a rigid body to the simulation.
         * @method add
         * @param {Body} body
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
         */
        addBody(body: Body): void;
        /**
         * Add a constraint to the simulation.
         * @param c
         */
        addConstraint(c: Constraint): void;
        /**
         * Removes a constraint
         * @param c
         */
        removeConstraint(c: Constraint): void;
        /**
         * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
         * @param from
         * @param to
         * @param options
         * @param callback
         * @return True if any body was hit.
         */
        raycastAll(from: Vector3, to: Vector3, options: {
            collisionFilterMask?: number;
            collisionFilterGroup?: number;
            skipBackfaces?: boolean;
            checkCollisionResponse?: boolean;
            mode?: number;
            from?: Vector3;
            to?: Vector3;
            callback?: Function;
        }, callback: Function): boolean;
        /**
         * Ray cast, and stop at the first result. Note that the order is random - but the method is fast.
         *
         * @param from
         * @param to
         * @param options
         * @param result
         *
         * @return True if any body was hit.
         */
        raycastAny(from: Vector3, to: Vector3, options: {
            collisionFilterMask?: number;
            collisionFilterGroup?: number;
            skipBackfaces?: boolean;
            checkCollisionResponse?: boolean;
            mode?: number;
            from?: Vector3;
            to?: Vector3;
            callback?: Function;
            result?: RaycastResult;
        }, result: RaycastResult): boolean;
        /**
         * Ray cast, and return information of the closest hit.
         *
         * @param from
         * @param to
         * @param options
         * @param result
         *
         * @return True if any body was hit.
         */
        raycastClosest(from: Vector3, to: Vector3, options: {
            collisionFilterMask?: number;
            collisionFilterGroup?: number;
            skipBackfaces?: boolean;
            checkCollisionResponse?: boolean;
            mode?: number;
            from?: Vector3;
            to?: Vector3;
            callback?: Function;
            result?: RaycastResult;
        }, result: RaycastResult): any;
        /**
         * Remove a rigid body from the simulation.
         * @param body
         */
        removeBody(body: Body): void;
        getBodyById(id: number): Body<BodyEventMap>;
        getShapeById(id: number): Shape;
        /**
         * Adds a material to the World.
         * @param m
         * @todo Necessary?
         */
        addMaterial(m: Material): void;
        /**
         * Adds a contact material to the World
         * @param cmat
         */
        addContactMaterial(cmat: ContactMaterial): void;
        /**
         * Step the physics world forward in time.
         *
         * There are two modes. The simple mode is fixed timestepping without interpolation. In this case you only use the first argument. The second case uses interpolation. In that you also provide the time since the function was last used, as well as the maximum fixed timesteps to take.
         *
         * @param dt                       The fixed time step size to use.
         * @param timeSinceLastCalled    The time elapsed since the function was last called.
         * @param maxSubSteps         Maximum number of fixed steps to take per function call.
         *
         * @example
         *     // fixed timestepping without interpolation
         *     world.step(1/60);
         *
         * @see http://bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World
         */
        step(dt: number, timeSinceLastCalled?: number, maxSubSteps?: number): void;
        internalStep(dt: number): void;
        emitContactEvents: () => void;
        /**
         * Sets all body forces in the world to zero.
         * @method clearForces
         */
        clearForces(): void;
    }
}
declare namespace CANNON {
    class Narrowphase {
        /**
         * Internal storage of pooled contact points.
         */
        contactPointPool: ContactEquation[];
        frictionEquationPool: FrictionEquation[];
        result: ContactEquation[];
        frictionResult: FrictionEquation[];
        world: World;
        currentContactMaterial: ContactMaterial;
        enableFrictionReduction: boolean;
        /**
         * Helper class for the World. Generates ContactEquations.
         * @class Narrowphase
         * @constructor
         * @todo Sphere-ConvexPolyhedron contacts
         * @todo Contact reduction
         * @todo  should move methods to prototype
         */
        constructor(world: World);
        /**
         * Make a contact object, by using the internal pool or creating a new one.
         *
         * @param bi
         * @param bj
         * @param si
         * @param sj
         * @param overrideShapeA
         * @param overrideShapeB
         */
        createContactEquation(bi: Body, bj: Body, si: Shape, sj: Shape, overrideShapeA: Shape, overrideShapeB: Shape): ContactEquation;
        createFrictionEquationsFromContact(contactEquation: ContactEquation, outArray: FrictionEquation[]): boolean;
        createFrictionFromAverage(numContacts: number): void;
        /**
         * Generate all contacts between a list of body pairs
         * @method getContacts
         * @param {array} p1 Array of body indices
         * @param {array} p2 Array of body indices
         * @param {World} world
         * @param {array} result Array to store generated contacts
         * @param {array} oldcontacts Optional. Array of reusable contact objects
         */
        getContacts(p1: Body[], p2: Body[], world: World, result: ContactEquation[], oldcontacts: ContactEquation[], frictionResult: FrictionEquation[], frictionPool: FrictionEquation[]): void;
        boxBox(si: Box, sj: Box, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        boxConvex(si: Box, sj: ConvexPolyhedron, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        boxParticle(si: Box, sj: Particle, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        sphereSphere(si: Sphere, sj: Sphere, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi?: Shape, rsj?: Shape, justTest?: boolean): boolean;
        /**
         * @method planeTrimesh
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vector3}       xi
         * @param  {Vector3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        planeTrimesh(planeShape: Plane, trimeshShape: Trimesh, planePos: Vector3, trimeshPos: Vector3, planeQuat: Quaternion, trimeshQuat: Quaternion, planeBody: Body, trimeshBody: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        sphereTrimesh(sphereShape: Sphere, trimeshShape: Trimesh, spherePos: Vector3, trimeshPos: Vector3, sphereQuat: Quaternion, trimeshQuat: Quaternion, sphereBody: Body, trimeshBody: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        spherePlane(si: Sphere, sj: Plane, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        sphereBox(si: Sphere, sj: Box, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        sphereConvex(si: Sphere, sj: ConvexPolyhedron, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        planeBox(si: Plane, sj: Box, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        planeConvex(planeShape: Plane, convexShape: ConvexPolyhedron, planePosition: Vector3, convexPosition: Vector3, planeQuat: Quaternion, convexQuat: Quaternion, planeBody: Body, convexBody: Body, si: Shape, sj: Shape, justTest: boolean): boolean;
        convexConvex(si: ConvexPolyhedron, sj: ConvexPolyhedron, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean, faceListA?: number[], faceListB?: number[]): boolean;
        /**
         * @method convexTrimesh
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vector3}       xi
         * @param  {Vector3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        planeParticle(sj: Plane, si: Particle, xj: Vector3, xi: Vector3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        sphereParticle(sj: Sphere, si: Particle, xj: Vector3, xi: Vector3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        convexParticle(sj: ConvexPolyhedron, si: Particle, xj: Vector3, xi: Vector3, qj: Quaternion, qi: Quaternion, bj: Body, bi: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        boxHeightfield(si: Box, sj: Heightfield, xi: Vector3, xj: Vector3, qi: Quaternion, qj: Quaternion, bi: Body, bj: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        convexHeightfield(convexShape: ConvexPolyhedron, hfShape: Heightfield, convexPos: Vector3, hfPos: Vector3, convexQuat: Quaternion, hfQuat: Quaternion, convexBody: Body, hfBody: Body, rsi: Shape, rsj: Shape, justTest: boolean): boolean;
        sphereHeightfield(sphereShape: Sphere, hfShape: Heightfield, spherePos: Vector3, hfPos: Vector3, sphereQuat: Quaternion, hfQuat: Quaternion, sphereBody: Body, hfBody: Body, rsi?: Shape, rsj?: Shape, justTest?: boolean): boolean;
    }
}
//# sourceMappingURL=index.d.ts.map