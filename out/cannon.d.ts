declare namespace CANNON {
    class Vec3 {
        x: number;
        y: number;
        z: number;
        /**
         * 3-dimensional vector
         *
         * @param x
         * @param y
         * @param z
         *
         * @author schteppe
         * @example
         *     var v = new Vec3(1, 2, 3);
         *     console.log('x=' + v.x); // x=1
         */
        constructor(x?: number, y?: number, z?: number);
        static ZERO: Vec3;
        static UNIT_X: Vec3;
        static UNIT_Y: Vec3;
        static UNIT_Z: Vec3;
        /**
         * Vector cross product
         *
         * @param v
         * @param target Target to save in.
         */
        cross(v: Vec3, target?: Vec3): Vec3;
        /**
         * Set the vectors' 3 elements
         * @param x
         * @param y
         * @param z
         */
        set(x: number, y: number, z: number): this;
        /**
         * Set all components of the vector to zero.
         */
        setZero(): void;
        /**
         * Vector addition
         * @param v
         * @param target
         */
        vadd(v: Vec3, target?: Vec3): Vec3;
        /**
         * Vector subtraction
         * @param v
         * @param target Target to save in.
         */
        vsub(v: Vec3, target?: Vec3): Vec3;
        /**
         * Get the cross product matrix a_cross from a vector, such that a x b = a_cross * b = c
         * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
         */
        crossmat(): Mat3;
        /**
         * Normalize the vector. Note that this changes the values in the vector.
         * @returns Returns the norm of the vector
         */
        normalize(): number;
        /**
         * Get the version of this vector that is of length 1.
         * @param target target to save in
         */
        unit(target?: Vec3): Vec3;
        /**
         * Get the length of the vector
         * @deprecated Use .length() instead
         */
        norm(): number;
        /**
         * Get the length of the vector
         */
        length(): number;
        /**
         * Get the squared length of the vector
         * @deprecated Use .lengthSquared() instead.
         */
        norm2(): number;
        /**
         * Get the squared length of the vector
         */
        lengthSquared(): number;
        /**
         * Get distance from this point to another point
         * @param p
         */
        distanceTo(p: Vec3): number;
        /**
         * Get squared distance from this point to another point
         * @param p
         */
        distanceSquared(p: Vec3): number;
        /**
         * Multiply all the components of the vector with a scalar.
         * @param scalar
         * @param  target The vector to save the result in.
         * @deprecated Use .scale() instead
         */
        mult(scalar: number, target?: Vec3): Vec3;
        /**
         * Multiply all the components of the vector with a scalar.
         * @param scalar
         * @param  target The vector to save the result in.
         */
        scale(scalar: number, target?: Vec3): Vec3;
        /**
         * Multiply the vector with an other vector, component-wise.
         * @param  vector
         * @param  target The vector to save the result in.
         */
        vmul(vector: Vec3, target?: Vec3): Vec3;
        /**
         * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        addScaledVector(scalar: number, vector: Vec3, target?: Vec3): Vec3;
        /**
         * Calculate dot product
         * @param {Vec3} v
         */
        dot(v: Vec3): number;
        isZero(): boolean;
        /**
         * Make the vector point in the opposite direction.
         * @param target Optional target to save in
         */
        negate(target: Vec3): Vec3;
        tangents(t1: Vec3, t2: Vec3): void;
        /**
         * Converts to a more readable format
         */
        toString(): string;
        /**
         * Converts to an array
         */
        toArray(): number[];
        /**
         * Copies value of source to this vector.
         * @param source
         */
        copy(source: Vec3): this;
        /**
         * Do a linear interpolation between two vectors
         *
         * @param v
         * @param t A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
         */
        lerp(v: Vec3, t: number, target: Vec3): void;
        /**
         * Check if a vector equals is almost equal to another one.
         * @param v
         * @param  precision
         */
        almostEquals(v: Vec3, precision?: number): boolean;
        /**
         * Check if a vector is almost zero
         * @param precision
         */
        almostZero(precision?: number): boolean;
        /**
         * Check if the vector is anti-parallel to another vector.
         * @param  v
         * @param  precision Set to zero for exact comparisons
         */
        isAntiparallelTo(v: Vec3, precision?: number): boolean;
        /**
         * Clone the vector
         */
        clone(): Vec3;
    }
}
declare namespace CANNON {
    class Mat3 {
        /**
         * A vector of length 9, containing all matrix elements
         */
        elements: [number, number, number, number, number, number, number, number, number];
        /**
         * A 3x3 matrix.
         * @class Mat3
         * @constructor
         * @param array elements Array of nine elements. Optional.
         * @author schteppe / http://github.com/schteppe
         */
        constructor(elements?: [number, number, number, number, number, number, number, number, number]);
        /**
         * Sets the matrix to identity
         * @todo Should perhaps be renamed to setIdentity() to be more clear.
         * @todo Create another function that immediately creates an identity matrix eg. eye()
         */
        identity(): void;
        /**
         * Set all elements to zero
         */
        setZero(): void;
        /**
         * Sets the matrix diagonal elements from a Vec3
         * @param vec3
         */
        setTrace(vec3: Vec3): void;
        /**
         * Gets the matrix diagonal elements
         */
        getTrace(target?: Vec3): void;
        /**
         * Matrix-Vector multiplication
         * @param v The vector to multiply with
         * @param target Optional, target to save the result in.
         */
        vmult(v: Vec3, target?: Vec3): Vec3;
        /**
         * Matrix-scalar multiplication
         * @param s
         */
        smult(s: number): void;
        /**
         * Matrix multiplication
         * @param  m Matrix to multiply with from left side.
         */
        mmult(m: Mat3, target?: Mat3): Mat3;
        /**
         * Scale each column of the matrix
         * @param v
         */
        scale(v: Vec3, target?: Mat3): Mat3;
        /**
         * Solve Ax=b
         * @param b The right hand side
         * @param target Optional. Target vector to save in.
         * @todo should reuse arrays
         */
        solve(b: Vec3, target?: Vec3): Vec3;
        /**
         * Get an element in the matrix by index. Index starts at 0, not 1!!!
         * @param row
         * @param column
         * @param value Optional. If provided, the matrix element will be set to this value.
         */
        e(row: number, column: number, value: number): number;
        /**
         * Copy another matrix into this matrix object.
         * @param source
         */
        copy(source: Mat3): this;
        /**
         * Returns a string representation of the matrix.
         */
        toString(): string;
        /**
         * reverse the matrix
         * @param target Optional. Target matrix to save in.
         */
        reverse(target?: Mat3): Mat3;
        /**
         * Set the matrix from a quaterion
         * @param q
         */
        setRotationFromQuaternion(q: Quaternion): this;
        /**
         * Transpose the matrix
         * @param target Where to store the result.
         * @return The target Mat3, or a new Mat3 if target was omitted.
         */
        transpose(target?: Mat3): Mat3;
    }
}
declare namespace CANNON {
    class Quaternion {
        /**
         * Multiplier of the imaginary basis vector i.
         */
        x: number;
        /**
         * Multiplier of the imaginary basis vector j.
         */
        y: number;
        /**
         * Multiplier of the imaginary basis vector k.
         */
        z: number;
        /**
         * Multiplier of the real part.
         */
        w: number;
        /**
         * A Quaternion describes a rotation in 3D space. The Quaternion is mathematically defined as Q = x*i + y*j + z*k + w, where (i,j,k) are imaginary basis vectors. (x,y,z) can be seen as a vector related to the axis of rotation, while the real multiplier, w, is related to the amount of rotation.
         *
         * @param x Multiplier of the imaginary basis vector i.
         * @param y Multiplier of the imaginary basis vector j.
         * @param z Multiplier of the imaginary basis vector k.
         * @param w Multiplier of the real part.
         * @see http://en.wikipedia.org/wiki/Quaternion
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * Set the value of the quaternion.
         * @param x
         * @param y
         * @param z
         * @param w
         */
        set(x: number, y: number, z: number, w: number): this;
        /**
         * Convert to a readable format
         */
        toString(): string;
        /**
         * Convert to an Array
         */
        toArray(): number[];
        /**
         * Set the quaternion components given an axis and an angle.
         * @param axis
         * @param angle in radians
         */
        setFromAxisAngle(axis: Vec3, angle: number): this;
        /**
         * Converts the quaternion to axis/angle representation.
         * @param targetAxis A vector object to reuse for storing the axis.
         * @return An array, first elemnt is the axis and the second is the angle in radians.
         */
        toAxisAngle(targetAxis?: Vec3): (number | Vec3)[];
        /**
         * Set the quaternion value given two vectors. The resulting rotation will be the needed rotation to rotate u to v.
         * @param u
         * @param v
         */
        setFromVectors(u: Vec3, v: Vec3): this;
        /**
         * Quaternion multiplication
         * @param q
         * @param target
         */
        mult(q: Quaternion, target?: Quaternion): Quaternion;
        /**
         * Get the inverse quaternion rotation.
         * @param target
         */
        inverse(target: Quaternion): Quaternion;
        /**
         * Get the quaternion conjugate
         * @param target
         */
        conjugate(target?: Quaternion): Quaternion;
        /**
         * Normalize the quaternion. Note that this changes the values of the quaternion.
         */
        normalize(): this;
        /**
         * Approximation of quaternion normalization. Works best when quat is already almost-normalized.
         * @see http://jsperf.com/fast-quaternion-normalization
         * @author unphased, https://github.com/unphased
         */
        normalizeFast(): this;
        /**
         * Multiply the quaternion by a vector
         * @param v
         * @param target Optional
         */
        vmult(v: Vec3, target?: Vec3): Vec3;
        /**
         * Copies value of source to this quaternion.
         * @param source
         */
        copy(source: Quaternion): this;
        /**
         * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: http://www.euclideanspace.com/maths/standards/index.htm
         * @param target
         * @param order Three-character string e.g. "YZX", which also is default.
         */
        toEuler(target: Vec3, order: string): void;
        /**
         * See http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
         * @param x
         * @param y
         * @param z
         * @param order The order to apply angles: 'XYZ' or 'YXZ' or any other combination
         */
        setFromEuler(x: number, y: number, z: number, order: string): this;
        clone(): Quaternion;
        /**
         * Performs a spherical linear interpolation between two quat
         *
         * @param toQuat second operand
         * @param t interpolation amount between the self quaternion and toQuat
         * @param target A quaternion to store the result in. If not provided, a new one will be created.
         * @returns The "target" object
         */
        slerp(toQuat: Quaternion, t: number, target?: Quaternion): Quaternion;
        /**
         * Rotate an absolute orientation quaternion given an angular velocity and a time step.
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         * @param  target
         * @return The "target" object
         */
        integrate(angularVelocity: Vec3, dt: number, angularFactor: Vec3, target: Quaternion): Quaternion;
    }
}
declare namespace CANNON {
    class Transform {
        position: Vec3;
        quaternion: Quaternion;
        constructor(options?: any);
        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        static pointToLocalFrame(position: Vec3, quaternion: Quaternion, worldPoint: Vec3, result?: Vec3): Vec3;
        /**
         * Get a global point in local transform coordinates.
         * @param worldPoint
         * @param result
         * @returnThe "result" vector object
         */
        pointToLocal(worldPoint: Vec3, result: Vec3): Vec3;
        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        static pointToWorldFrame(position: Vec3, quaternion: Quaternion, localPoint: Vec3, result?: Vec3): Vec3;
        /**
         * Get a local point in global transform coordinates.
         * @param point
         * @param result
         * @return The "result" vector object
         */
        pointToWorld(localPoint: Vec3, result: Vec3): Vec3;
        vectorToWorldFrame(localVector: Vec3, result?: Vec3): Vec3;
        static vectorToWorldFrame(quaternion: Quaternion, localVector: Vec3, result: Vec3): Vec3;
        static vectorToLocalFrame(position: Vec3, quaternion: Quaternion, worldVector: Vec3, result?: Vec3): Vec3;
    }
}
declare namespace CANNON {
    class JacobianElement {
        spatial: Vec3;
        rotational: Vec3;
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
        multiplyVectors(spatial: Vec3, rotational: Vec3): number;
    }
}
declare namespace CANNON {
    /**
     * Base class for objects that dispatches events.
     */
    class EventTarget {
        private _listeners;
        /**
         * Add an event listener
         * @param  type
         * @param  listener
         * @return The self object, for chainability.
         */
        addEventListener(type: string, listener: Function): this;
        /**
         * Check if an event listener is added
         * @param type
         * @param listener
         */
        hasEventListener(type: string, listener: Function): boolean;
        /**
         * Check if any event listener of the given type is added
         * @param type
         */
        hasAnyEventListener(type: string): boolean;
        /**
         * Remove an event listener
         * @param type
         * @param listener
         * @return The self object, for chainability.
         */
        removeEventListener(type: string, listener: Function): this;
        /**
         * Emit an event.
         * @param event
         * @return The self object, for chainability.
         */
        dispatchEvent(event: {
            type: string;
            target?: EventTarget;
        }): this;
    }
}
declare namespace CANNON {
    /**
     * For pooling objects that can be reused.
     */
    class Pool {
        /**
         * The pooled objects
         */
        objects: any[];
        /**
         * Constructor of the objects
         */
        type: Object;
        constructor();
        /**
         * Release an object after use
         */
        release(...args: any[]): this;
        /**
         * Get an object
         */
        get(): any;
        /**
         * Construct an object. Should be implmented in each subclass.
         */
        constructObject(): void;
        /**
         * @param size
         * @return Self, for chaining
         */
        resize(size: number): this;
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
        static defaults(options: Object, defaults?: Object): Object;
    }
}
declare namespace CANNON {
    class Vec3Pool extends Pool {
        constructor();
        /**
         * Construct a vector
         */
        constructObject(): Vec3;
    }
}
declare namespace CANNON {
    class TupleDictionary {
        /**
         * The data storage
         */
        data: {
            keys: any[];
        };
        /**
         * @param i
         * @param j
         */
        get(i: number, j: number): any;
        set(i: number, j: number, value: any): void;
        reset(): void;
    }
}
declare namespace CANNON {
    class Constraint {
        /**
         * Equations to be solved in this constraint
         */
        equations: any[];
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
        distance: any;
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
        pivotA: Vec3;
        /**
         * Pivot, defined locally in bodyB.
         */
        pivotB: Vec3;
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
         *     var localPivotA = new Vec3(1, 0, 0);
         *     var localPivotB = new Vec3(-1, 0, 0);
         *     var constraint = new PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB);
         *     world.addConstraint(constraint);
         */
        constructor(bodyA: Body, pivotA: Vec3, bodyB: Body, pivotB: Vec3, maxForce?: number);
        update(): void;
    }
}
declare namespace CANNON {
    class ConeTwistConstraint extends PointToPointConstraint {
        axisA: Vec3;
        axisB: Vec3;
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
            pivotA?: Vec3;
            pivotB?: Vec3;
            maxForce?: number;
            axisA?: Vec3;
            axisB?: Vec3;
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
        axisA: Vec3;
        /**
         * Rotation axis, defined locally in bodyB.
         */
        axisB: Vec3;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        motorEquation: RotationalMotorEquation;
        /**
         * Equations to be fed to the solver
         */
        equations: Equation[];
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
            pivotA?: Vec3;
            pivotB?: Vec3;
            maxForce?: number;
            axisA?: Vec3;
            axisB?: Vec3;
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
        xA: Vec3;
        xB: any;
        yA: Vec3;
        yB: any;
        zA: Vec3;
        zB: any;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        rotationalEquation3: RotationalEquation;
        motorEquation: any;
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
        vertices: Vec3[];
        faceNormals: Vec3[];
        convexPolyhedronRepresentation: Shape;
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
            material?: any;
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
        calculateLocalInertia(mass: number, target: Vec3): void;
        calculateWorldAABB(pos: any, quat: any, min: any, max: any): void;
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
        vertices: Vec3[];
        worldVertices: Vec3[];
        worldVerticesNeedsUpdate: boolean;
        /**
         * Array of integer arrays, indicating which vertices each face consists of
         */
        faces: ({
            connectedFaces: number[];
        } & (number[]))[];
        faceNormals: Vec3[];
        worldFaceNormalsNeedsUpdate: boolean;
        worldFaceNormals: Vec3[];
        uniqueEdges: Vec3[];
        /**
         * If given, these locally defined, normalized axes are the only ones being checked when doing separating axis check.
         */
        uniqueAxes: any[];
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
        constructor(points?: Vec3[], faces?: number[][], uniqueAxes?: any[]);
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
        static computeNormal(va: Vec3, vb: Vec3, vc: Vec3, target: Vec3): void;
        /**
         * Compute the normal of a face from its vertices
         *
         * @param i
         * @param target
         */
        getFaceNormal(i: number, target: Vec3): void;
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
        clipAgainstHull(posA: Vec3, quatA: Quaternion, hullB: ConvexPolyhedron, posB: Vec3, quatB: Quaternion, separatingNormal: Vec3, minDist: number, maxDist: number, result: number[]): void;
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
        findSeparatingAxis(hullB: ConvexPolyhedron, posA: Vec3, quatA: Quaternion, posB: Vec3, quatB: Quaternion, target: Vec3, faceListA: number[], faceListB: number[]): boolean;
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
        testSepAxis(axis: Vec3, hullB: ConvexPolyhedron, posA: Vec3, quatA: Quaternion, posB: Vec3, quatB: Quaternion): number | false;
        /**
         *
         * @param mass
         * @param target
         */
        calculateLocalInertia(mass: number, target: Vec3): void;
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
        clipFaceAgainstHull(separatingNormal: Vec3, posA: Vec3, quatA: Quaternion, worldVertsB1: Vec3[], minDist: number, maxDist: number, result: any[]): void;
        /**
         * Clip a face in a hull against the back of a plane.
         *
         * @param inVertices
         * @param outVertices
         * @param planeNormal
         * @param planeConstant The constant in the mathematical plane equation
         */
        clipFaceAgainstPlane(inVertices: Vec3[], outVertices: Vec3[], planeNormal: Vec3, planeConstant: number): Vec3[];
        computeWorldVertices(position: Vec3, quat: Quaternion): void;
        computeLocalAABB(aabbmin: any, aabbmax: any): void;
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
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
        /**
         * Get approximate convex volume
         */
        volume(): number;
        /**
         * Get an average of all the vertices positions
         *
         * @param target
         */
        getAveragePointLocal(target: Vec3): Vec3;
        /**
         * Transform all local points. Will change the .vertices
         *
         * @param  offset
         * @param quat
         */
        transformAllPoints(offset: Vec3, quat: Quaternion): void;
        /**
         * Checks whether p is inside the polyhedra. Must be in local coords. The point lies outside of the convex hull of the other points if and only if the direction of all the vectors from it to those other points are on less than one half of a sphere around it.
         *
         * @param p      A point given in local coordinates
         */
        pointIsInside(p: Vec3): false | 1 | -1;
        /**
         * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis. Results are saved in the array maxmin.
         *
         * @param hull
         * @param axis
         * @param pos
         * @param quat
         * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
         */
        static project(hull: ConvexPolyhedron, axis: Vec3, pos: Vec3, quat: Quaternion, result: number[]): void;
    }
}
declare namespace CANNON {
    class Box extends Shape {
        halfExtents: Vec3;
        /**
         * Used by the contact generator to make contacts with other convex polyhedra for example
         */
        convexPolyhedronRepresentation: ConvexPolyhedron;
        /**
         * A 3d box shape.
         * @param halfExtents
         * @author schteppe
         */
        constructor(halfExtents: Vec3);
        /**
         * Updates the local convex polyhedron representation used for some collisions.
         */
        updateConvexPolyhedronRepresentation(): void;
        calculateLocalInertia(mass: number, target?: Vec3): Vec3;
        static calculateInertia(halfExtents: Vec3, mass: number, target: Vec3): void;
        /**
         * Get the box 6 side normals
         * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
         * @param quat             Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
         */
        getSideNormals(sixTargetVectors: Vec3[], quat: Quaternion): Vec3[];
        volume(): number;
        updateBoundingSphereRadius(): void;
        forEachWorldCorner(pos: Vec3, quat: Quaternion, callback: Function): void;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
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
        data: any[];
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
        pillarOffset: Vec3;
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
        constructor(data: any[], options?: {
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
        getRectMinMax(iMinX: number, iMinY: number, iMaxX: number, iMaxY: number, result: any[]): void;
        /**
         * Get the index of a local position on the heightfield. The indexes indicate the rectangles, so if your terrain is made of N x N height data points, you will have rectangle indexes ranging from 0 to N-1.
         *
         * @param x
         * @param y
         * @param result Two-element array
         * @param clamp If the position should be clamped to the heightfield edge.
         */
        getIndexOfPosition(x: number, y: number, result: any[], clamp: boolean): boolean;
        getTriangleAt(x: number, y: number, edgeClamp: boolean, a: Vec3, b: Vec3, c: Vec3): boolean;
        getNormalAt(x: number, y: number, edgeClamp: boolean, result: Vec3): void;
        /**
         * Get an AABB of a square in the heightfield
         *
         * @param xi
         * @param yi
         * @param result
         */
        getAabbAtIndex(xi: number, yi: number, result: AABB): void;
        /**
         * Get the height in the heightfield at a given position
         *
         * @param x
         * @param y
         * @param edgeClamp
         */
        getHeightAt(x: number, y: number, edgeClamp: boolean): number;
        getCacheConvexTrianglePillarKey(xi: number, yi: number, getUpperTriangle: boolean): string;
        getCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): any;
        setCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean, convex: ConvexPolyhedron, offset: Vec3): void;
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
        getTriangle(xi: number, yi: number, upper: boolean, a: Vec3, b: Vec3, c: Vec3): void;
        /**
         * Get a triangle in the terrain in the form of a triangular convex shape.
         *
         * @param i
         * @param j
         * @param getUpperTriangle
         */
        getConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean): void;
        calculateLocalInertia(mass: number, target?: Vec3): Vec3;
        volume(): number;
        calculateWorldAABB(pos: Vec3, quat: Quaternion, min: Vec3, max: Vec3): void;
        updateBoundingSphereRadius(): void;
        /**
         * Sets the height values from an image. Currently only supported in browser.
         *
         * @param image
         * @param scale
         */
        setHeightsFromImage(image: HTMLImageElement, scale: Vec3): void;
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
        calculateLocalInertia(mass: number, target: Vec3): Vec3;
        volume(): number;
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: any, quat: any, min: any, max: any): void;
    }
}
declare namespace CANNON {
    class Plane extends Shape {
        worldNormal: Vec3;
        worldNormalNeedsUpdate: boolean;
        /**
         * A plane, facing in the Z direction. The plane has its surface at z=0 and everything below z=0 is assumed to be solid plane. To make the plane face in some other direction than z, you must put it inside a Body and rotate that body. See the demos.
         *
         * @author schteppe
         */
        constructor();
        computeWorldNormal(quat: any): void;
        calculateLocalInertia(mass: any, target: any): any;
        volume(): number;
        calculateWorldAABB(pos: any, quat: any, min: any, max: any): void;
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
        calculateLocalInertia(mass: any, target: any): any;
        volume(): number;
        updateBoundingSphereRadius(): void;
        calculateWorldAABB(pos: any, quat: any, min: any, max: any): void;
    }
}
declare namespace CANNON {
    class AABB {
        /**
         * The lower bound of the bounding box.
         */
        lowerBound: Vec3;
        /**
         * The upper bound of the bounding box.
         */
        upperBound: Vec3;
        /**
         *
         * @param options
         *
         * Axis aligned bounding box class.
         */
        constructor(options?: {
            lowerBound?: Vec3;
            upperBound?: Vec3;
        });
        /**
         * Set the AABB bounds from a set of points.
         * @param points An array of Vec3's.
         * @param position
         * @param quaternion
         * @param skinSize
         * @return The self object
         */
        setFromPoints(points: Vec3[], position?: Vec3, quaternion?: Quaternion, skinSize?: number): this;
        /**
         * Copy bounds from an AABB to this AABB
         * @param aabb Source to copy from
         * @return The this object, for chainability
         */
        copy(aabb: AABB): this;
        /**
         * Clone an AABB
         */
        clone(): AABB;
        /**
         * Extend this AABB so that it covers the given AABB too.
         * @param aabb
         */
        extend(aabb: AABB): void;
        /**
         * Returns true if the given AABB overlaps this AABB.
         * @param aabb
         */
        overlaps(aabb: AABB): boolean;
        /**
         * Mostly for debugging
         */
        volume(): number;
        /**
         * Returns true if the given AABB is fully contained in this AABB.
         * @param aabb
         */
        contains(aabb: AABB): boolean;
        getCorners(a: Vec3, b: Vec3, c: Vec3, d: Vec3, e: Vec3, f: Vec3, g: Vec3, h: Vec3): void;
        /**
         * Get the representation of an AABB in another frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        toLocalFrame(frame: Transform, target: AABB): AABB;
        /**
         * Get the representation of an AABB in the global frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        toWorldFrame(frame: Transform, target: AABB): AABB;
        /**
         * Check if the AABB is hit by a ray.
         */
        overlapsRay(ray: Ray): boolean;
    }
}
declare namespace CANNON {
    class Trimesh extends Shape {
        /**
         * The normals data.
         */
        normals: Float32Array;
        /**
         * The local AABB of the mesh.
         */
        aabb: AABB;
        /**
         * References to vertex pairs, making up all unique edges in the trimesh.
         */
        edges: any[];
        /**
         * Local scaling of the mesh. Use .setScale() to set it.
         */
        scale: Vec3;
        /**
         * The indexed triangles. Use .updateTree() to update it.
         */
        tree: Octree;
        /**
         * @class Trimesh
         * @constructor
         * @param {array} vertices
         * @param {array} indices
         * @extends Shape
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
        constructor(vertices: Float32Array, indices: any);
        updateTree(): void;
        /**
         * Get triangles in a local AABB from the trimesh.
         *
         * @param aabb
         * @param result An array of integers, referencing the queried triangles.
         */
        getTrianglesInAABB(aabb: AABB, result: any[]): any;
        /**
         * @method setScale
         * @param {Vec3} scale
         */
        setScale(scale: Vec3): void;
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
         * @method getEdgeVertex
         * @param  {number} edgeIndex
         * @param  {number} firstOrSecond 0 or 1, depending on which one of the vertices you need.
         * @param  {Vec3} vertexStore Where to store the result
         */
        getEdgeVertex(edgeIndex: any, firstOrSecond: any, vertexStore: any): void;
        /**
         * Get a vector along an edge.
         * @method getEdgeVector
         * @param  {number} edgeIndex
         * @param  {Vec3} vectorStore
         */
        getEdgeVector(edgeIndex: any, vectorStore: any): void;
        /**
         * Get face normal given 3 vertices
         * @static
         * @method computeNormal
         * @param {Vec3} va
         * @param {Vec3} vb
         * @param {Vec3} vc
         * @param {Vec3} target
         */
        static computeNormal(va: any, vb: any, vc: any, target: any): void;
        /**
         * Get vertex i.
         * @method getVertex
         * @param  {number} i
         * @param  {Vec3} out
         * @return {Vec3} The "out" vector object
         */
        getVertex(i: any, out: any): any;
        /**
         * Get raw vertex i
         * @private
         * @method _getUnscaledVertex
         * @param  {number} i
         * @param  {Vec3} out
         * @return {Vec3} The "out" vector object
         */
        private _getUnscaledVertex;
        /**
         * Get a vertex from the trimesh,transformed by the given position and quaternion.
         * @method getWorldVertex
         * @param  {number} i
         * @param  {Vec3} pos
         * @param  {Quaternion} quat
         * @param  {Vec3} out
         * @return {Vec3} The "out" vector object
         */
        getWorldVertex(i: any, pos: any, quat: any, out: any): any;
        /**
         * Get the three vertices for triangle i.
         * @method getTriangleVertices
         * @param  {number} i
         * @param  {Vec3} a
         * @param  {Vec3} b
         * @param  {Vec3} c
         */
        getTriangleVertices(i: any, a: any, b: any, c: any): void;
        /**
         * Compute the normal of triangle i.
         * @method getNormal
         * @param  {Number} i
         * @param  {Vec3} target
         * @return {Vec3} The "target" vector object
         */
        getNormal(i: any, target: any): any;
        /**
         * @method calculateLocalInertia
         * @param  {Number} mass
         * @param  {Vec3} target
         * @return {Vec3} The "target" vector object
         */
        calculateLocalInertia(mass: any, target: any): any;
        /**
         * Compute the local AABB for the trimesh
         * @method computeLocalAABB
         * @param  {AABB} aabb
         */
        computeLocalAABB(aabb: any): void;
        /**
         * Update the .aabb property
         * @method updateAABB
         */
        updateAABB(): void;
        /**
         * Will update the .boundingSphereRadius property
         * @method updateBoundingSphereRadius
         */
        updateBoundingSphereRadius(): void;
        /**
         * @method calculateWorldAABB
         * @param {Vec3}        pos
         * @param {Quaternion}  quat
         * @param {Vec3}        min
         * @param {Vec3}        max
         */
        calculateWorldAABB(pos: any, quat: any, min: any, max: any): void;
        /**
         * Get approximate volume
         * @method volume
         * @return {Number}
         */
        volume(): number;
        /**
         * Create a Trimesh instance, shaped as a torus.
         * @static
         * @method createTorus
         * @param  {number} [radius=1]
         * @param  {number} [tube=0.5]
         * @param  {number} [radialSegments=8]
         * @param  {number} [tubularSegments=6]
         * @param  {number} [arc=6.283185307179586]
         * @return {Trimesh} A torus
         */
        static createTorus(radius: any, tube: any, radialSegments: any, tubularSegments: any, arc: any): Trimesh;
    }
}
declare namespace CANNON {
    class OctreeNode {
        /**
         * The root node
         */
        root: OctreeNode;
        /**
         * Boundary of this node
         */
        aabb: AABB;
        /**
         * Contained data at the current node level.
         * @property {Array} data
         */
        data: any[];
        /**
         * Children to this node
         */
        children: OctreeNode[];
        maxDepth: number;
        /**
         * @class OctreeNode
         * @param {object} [options]
         * @param {Octree} [options.root]
         * @param {AABB} [options.aabb]
         */
        constructor(options: any);
        reset(aabb?: any, options?: any): void;
        /**
         * Insert data into this node
         * @method insert
         * @param  {AABB} aabb
         * @param  {object} elementData
         * @return {boolean} True if successful, otherwise false
         */
        insert(aabb: any, elementData: any, level?: number): boolean;
        /**
         * Create 8 equally sized children nodes and put them in the .children array.
         */
        subdivide(): void;
        /**
         * Get all data, potentially within an AABB
         * @method aabbQuery
         * @param  {AABB} aabb
         * @param  {array} result
         * @return {array} The "result" object
         */
        aabbQuery(aabb: any, result: any): any;
        /**
         * Get all data, potentially intersected by a ray.
         * @method rayQuery
         * @param  {Ray} ray
         * @param  {Transform} treeTransform
         * @param  {array} result
         * @return {array} The "result" object
         */
        rayQuery(ray: any, treeTransform: any, result: any): any;
        removeEmptyNodes(): void;
    }
    class Octree extends OctreeNode {
        /**
         * Maximum subdivision depth
         */
        maxDepth: number;
        /**
         * @class Octree
         * @param {AABB} aabb The total AABB of the tree
         * @param {object} [options]
         * @param {number} [options.maxDepth=8]
         * @extends OctreeNode
         */
        constructor(aabb?: AABB, options?: {
            root?: any;
            aabb?: AABB;
            maxDepth?: number;
        });
    }
}
declare namespace CANNON {
    class ArrayCollisionMatrix {
        matrix: number[];
        /**
         * Collision "matrix". It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
         */
        constructor();
        /**
         * Get an element
         *
         * @param i
         * @param j
         */
        get(i0: {
            index: number;
        }, j0: {
            index: number;
        }): number;
        /**
         * Set an element
         *
         * @param i0
         * @param j0
         * @param value
         */
        set(i0: {
            index: number;
        }, j0: {
            index: number;
        }, value: boolean): void;
        /**
         * Sets all elements to zero
         */
        reset(): void;
        /**
         * Sets the max number of objects
         */
        setNumObjects(n: number): void;
    }
}
declare namespace CANNON {
    class ObjectCollisionMatrix {
        /**
         * The matrix storage
         */
        matrix: {};
        /**
         * Records what objects are colliding with each other
         */
        constructor();
        get(i0: {
            id: number;
        }, j0: {
            id: number;
        }): boolean;
        set(i0: {
            id: number;
        }, j0: {
            id: number;
        }, value: number): void;
        /**
         * Empty the matrix
         */
        reset(): void;
        /**
         * Set max number of objects
         *
         * @param n
         */
        setNumObjects(n: number): void;
    }
}
declare namespace CANNON {
    class OverlapKeeper {
        current: any[];
        previous: any[];
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
        rayFromWorld: Vec3;
        rayToWorld: Vec3;
        hitNormalWorld: Vec3;
        hitPointWorld: Vec3;
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
        directionWorld: Vec3;
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
        set(rayFromWorld: Vec3, rayToWorld: Vec3, hitNormalWorld: Vec3, hitPointWorld: Vec3, shape: Shape, body: Body, distance: number): void;
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
        collisionPairs(world: World, p1: any[], p2: any[]): void;
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
        intersectionTest(bodyA: Body, bodyB: Body, pairs1: any[], pairs2: any[]): void;
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
        makePairsUnique(pairs1: any[], pairs2: any[]): void;
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
        aabbQuery(world: World, aabb: AABB, result: any[]): any[];
    }
}
declare namespace CANNON {
    class GridBroadphase extends Broadphase {
        nx: number;
        ny: number;
        nz: number;
        aabbMin: Vec3;
        aabbMax: Vec3;
        bins: any[];
        binLengths: any[];
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
        constructor(aabbMin: Vec3, aabbMax: Vec3, nx: number, ny: number, nz: number);
        /**
         * Get all the collision pairs in the physics world
         *
         * @param world
         * @param pairs1
         * @param pairs2
         */
        collisionPairs(world: World, pairs1: any[], pairs2: any[]): void;
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
        collisionPairs(world: World, pairs1: any[], pairs2: any[]): void;
        /**
         * Returns all the bodies within an AABB.
         * @param world
         * @param aabb
         * @param result An array to store resulting bodies in.
         */
        aabbQuery(world: World, aabb: AABB, result: any[]): any[];
    }
}
declare namespace CANNON {
    class SAPBroadphase extends Broadphase {
        /**
         * List of bodies currently in the broadphase.
         */
        axisList: any[];
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
        static insertionSortX(a: any[]): any[];
        static insertionSortY(a: any[]): any[];
        static insertionSortZ(a: any[]): any[];
        /**
         * Collect all collision pairs
         * @param world
         * @param p1
         * @param p2
         */
        collisionPairs(world: World, p1: any[], p2: any[]): void;
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
        aabbQuery(world: World, aabb: AABB, result: any[]): any[];
    }
}
declare namespace CANNON {
    class Ray {
        from: Vec3;
        to: Vec3;
        _direction: Vec3;
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
        constructor(from?: Vec3, to?: Vec3);
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
            from?: Vec3;
            to?: Vec3;
            callback?: Function;
        }): boolean;
        /**
         * Shoot a ray at a body, get back information about the hit.
         * @param body
         * @param result Deprecated - set the result property of the Ray instead.
         */
        private intersectBody;
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
        getAABB(result: AABB): void;
        private intersectHeightfield;
        private intersectSphere;
        private intersectConvex;
        /**
         * @method intersectTrimesh
         * @private
         * @param  {Shape} shape
         * @param  {Quaternion} quat
         * @param  {Vec3} position
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
        static pointInTriangle(p: Vec3, a: Vec3, b: Vec3, c: Vec3): boolean;
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
        constructor(m1: Material, m2: Material, options?: {
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
    class Body extends EventTarget {
        id: number;
        /**
         * Reference to the world the body is living in
         */
        world: World;
        /**
         * Callback function that is used BEFORE stepping the system. Use it to apply forces, for example. Inside the function, "this" will refer to this Body object.
         * @deprecated Use World events instead
         */
        preStep: Function;
        /**
         * Callback function that is used AFTER stepping the system. Inside the function, "this" will refer to this Body object.
         * @deprecated Use World events instead
         */
        postStep: Function;
        vlambda: Vec3;
        collisionFilterGroup: number;
        collisionFilterMask: number;
        /**
         * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
         */
        collisionResponse: boolean;
        /**
         * World space position of the body.
         */
        position: Vec3;
        previousPosition: Vec3;
        /**
         * Interpolated position of the body.
         */
        interpolatedPosition: Vec3;
        /**
         * Initial position of the body
         */
        initPosition: Vec3;
        /**
         * World space velocity of the body.
         */
        velocity: Vec3;
        initVelocity: Vec3;
        /**
         * Linear force on the body in world space.
         */
        force: Vec3;
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
        private _wakeUpAfterNarrowphase;
        /**
         * World space rotational force on the body, around center of mass.
         */
        torque: Vec3;
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
        angularVelocity: Vec3;
        initAngularVelocity: Vec3;
        shapes: Shape[];
        /**
         * Position of each Shape in the body, given in local Body space.
         */
        shapeOffsets: Vec3[];
        /**
         * Orientation of each Shape, given in local Body space.
         */
        shapeOrientations: Quaternion[];
        inertia: Vec3;
        invInertia: Vec3;
        invInertiaWorld: Mat3;
        invMassSolve: number;
        invInertiaSolve: Vec3;
        invInertiaWorldSolve: Mat3;
        /**
         * Set to true if you don't want the body to rotate. Make sure to run .updateMassProperties() after changing this.
         */
        fixedRotation: boolean;
        angularDamping: number;
        /**
         * Use this property to limit the motion along any world axis. (1,1,1) will allow motion along all axes while (0,0,0) allows none.
         */
        linearFactor: Vec3;
        /**
         * Use this property to limit the rotational motion along any world axis. (1,1,1) will allow rotation along all axes while (0,0,0) allows none.
         */
        angularFactor: Vec3;
        /**
         * World space bounding box of the body and its shapes.
         */
        aabb: AABB;
        /**
         * Indicates if the AABB needs to be updated before use.
         */
        aabbNeedsUpdate: boolean;
        /**
         * Total bounding radius of the Body including its shapes, relative to body.position.
         */
        boundingRadius: number;
        wlambda: Vec3;
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
            position?: Vec3;
            velocity?: Vec3;
            material?: Material;
            mass?: number;
            linearDamping?: number;
            type?: number;
            allowSleep?: boolean;
            sleepSpeedLimit?: number;
            sleepTimeLimit?: number;
            quaternion?: Quaternion;
            angularVelocity?: Vec3;
            fixedRotation?: boolean;
            angularDamping?: number;
            linearFactor?: Vec3;
            angularFactor?: Vec3;
            shape?: Shape;
        }, a?: any);
        static COLLIDE_EVENT_NAME: string;
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
         * Dispatched after a sleeping body has woken up.
         */
        static wakeupEvent: {
            type: string;
        };
        /**
         * Wake the body up.
         */
        wakeUp(): void;
        /**
         * Force body sleep
         */
        sleep(): void;
        /**
         * Dispatched after a body has gone in to the sleepy state.
         */
        static sleepyEvent: {
            type: string;
        };
        /**
         * Dispatched after a body has fallen asleep.
         * @event sleep
         */
        static sleepEvent: {
            type: string;
        };
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
        pointToLocalFrame(worldPoint: Vec3, result: Vec3): Vec3;
        /**
         * Convert a world vector to local body frame.
         *
         * @param worldPoint
         * @param result
         */
        vectorToLocalFrame(worldVector: any, result?: Vec3): Vec3;
        /**
         * Convert a local body point to world frame.
         *
         * @param localPoint
         * @param result
         */
        pointToWorldFrame(localPoint: Vec3, result: Vec3): Vec3;
        /**
         * Convert a local body point to world frame.
         *
         * @param localVector
         * @param result
         */
        vectorToWorldFrame(localVector: Vec3, result: Vec3): Vec3;
        /**
         * Add a shape to the body with a local offset and orientation.
         *
         * @param shape
         * @param _offset
         * @param_orientation
         * @return The body object, for chainability.
         */
        addShape(shape: Shape, _offset?: Vec3, _orientation?: Quaternion): this;
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
        applyForce(force: Vec3, relativePoint: Vec3): void;
        /**
         * Apply force to a local point in the body.
         *
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        applyLocalForce(localForce: Vec3, localPoint: Vec3): void;
        /**
         * Apply impulse to a world point. This could for example be a point on the Body surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
         *
         * @param impulse The amount of impulse to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        applyImpulse(impulse: Vec3, relativePoint: Vec3): void;
        /**
         * Apply locally-defined impulse to a local point in the body.
         *
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        applyLocalImpulse(localImpulse: Vec3, localPoint: Vec3): void;
        /**
         * Should be called whenever you change the body shape or mass.
         */
        updateMassProperties(): void;
        /**
         * Get world velocity of a point in the body.
         * @method getVelocityAtWorldPoint
         * @param  {Vec3} worldPoint
         * @param  {Vec3} result
         * @return {Vec3} The result vector.
         */
        getVelocityAtWorldPoint(worldPoint: any, result: any): any;
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
        localAnchorA: Vec3;
        /**
         * Anchor for bodyB in local bodyB coordinates.
         */
        localAnchorB: Vec3;
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
            localAnchorA?: Vec3;
            localAnchorB?: Vec3;
            worldAnchorA?: Vec3;
            worldAnchorB?: Vec3;
        });
        /**
         * Set the anchor point on body A, using world coordinates.
         * @param worldAnchorA
         */
        setWorldAnchorA(worldAnchorA: Vec3): void;
        /**
         * Set the anchor point on body B, using world coordinates.
         * @param worldAnchorB
         */
        setWorldAnchorB(worldAnchorB: Vec3): void;
        /**
         * Get the anchor point on body A, in world coordinates.
         * @param result The vector to store the result in.
         */
        getWorldAnchorA(result: Vec3): void;
        /**
         * Get the anchor point on body B, in world coordinates.
         * @param result The vector to store the result in.
         */
        getWorldAnchorB(result: Vec3): void;
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
        maxSuspensionTravel: any;
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
        chassisConnectionPointLocal: Vec3;
        chassisConnectionPointWorld: Vec3;
        directionLocal: Vec3;
        directionWorld: Vec3;
        axleLocal: Vec3;
        axleWorld: Vec3;
        suspensionRestLength: number;
        suspensionMaxLength: number;
        radius: number;
        suspensionStiffness: number;
        dampingCompression: number;
        dampingRelaxation: number;
        frictionSlip: any;
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
            chassisConnectionPointLocal?: Vec3;
            chassisConnectionPointWorld?: Vec3;
            directionLocal?: Vec3;
            directionWorld?: Vec3;
            axleLocal?: Vec3;
            axleWorld?: Vec3;
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
        preStepCallback: Function;
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
        /**
         * Get one of the wheel axles, world-oriented.
         * @param axisIndex
         * @param result
         */
        getVehicleAxisWorld(axisIndex: number, result: Vec3): void;
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
        wheelBodies: any[];
        coordinateSystem: any;
        chassisBody: any;
        constraints: any[];
        wheelAxes: any[];
        wheelForces: any[];
        /**
         * Simple vehicle helper class with spherical rigid body wheels.
         *
         * @param options
         */
        constructor(options?: {
            coordinateSystem?: any;
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
            position?: Vec3;
            axis?: Vec3;
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
        getWheelSpeed(wheelIndex: number): any;
    }
}
declare namespace CANNON {
    class SPHSystem {
        particles: any[];
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
        pressures: any[];
        densities: any[];
        neighbors: any[];
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
        getNeighbors(particle: Body, neighbors: any[]): void;
        update(): void;
        w(r: number): number;
        gradw(rVec: Vec3, resultVec: Vec3): void;
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
        constructor(bi: Body, bj: Body, minForce: number, maxForce: number);
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
        axisA: Vec3;
        axisB: Vec3;
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
            axisA?: Vec3;
            axisB?: Vec3;
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
        ri: Vec3;
        /**
         * World-oriented vector that starts in body j position and goes to the contact point.
         */
        rj: Vec3;
        /**
         * Contact normal, pointing out of body i.
         */
        ni: Vec3;
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
        ri: Vec3;
        rj: Vec3;
        t: Vec3;
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
        axisA: Vec3;
        axisB: Vec3;
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
            axisA?: Vec3;
            axisB?: Vec3;
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
        axisA: Vec3;
        /**
         * World oriented rotational axis
         */
        axisB: Vec3;
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
        solve(dt: number, world: World): number;
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
         * The number of solver iterations determines quality of the constraints in the world. The more iterations, the more correct simulation. More iterations need more computations though. If you have a large gravity force in your world, you will need more iterations.
         * @todo write more about solver and iterations in the wiki
         */
        iterations: number;
        /**
         * When tolerance is reached, the system is assumed to be converged.
         */
        tolerance: number;
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
    class SplitSolver extends Solver {
        iterations: number;
        tolerance: number;
        subsolver: any;
        nodes: any[];
        nodePool: any[];
        /**
         * Splits the equations into islands and solves them independently. Can improve performance.
         * @class SplitSolver
         * @constructor
         * @extends Solver
         * @param {Solver} subsolver
         */
        constructor(subsolver: any);
        createNode(): {
            body: any;
            children: any[];
            eqs: any[];
            visited: boolean;
        };
        /**
         * Solve the subsystems
         * @method solve
         * @param  {Number} dt
         * @param  {World} world
         */
        solve(dt: number, world: World): number;
    }
}
declare namespace CANNON {
    class World extends EventTarget {
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
        contacts: any[];
        frictionEquations: any[];
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
        gravity: Vec3;
        /**
         * The broadphase algorithm to use. Default is NaiveBroadphase
         */
        broadphase: Broadphase;
        bodies: any[];
        /**
         * The solver algorithm to use. Default is GSSolver
         */
        solver: Solver;
        constraints: any[];
        narrowphase: Narrowphase;
        collisionMatrix: ArrayCollisionMatrix;
        /**
         * CollisionMatrix from the previous step.
         */
        collisionMatrixPrevious: ArrayCollisionMatrix;
        bodyOverlapKeeper: OverlapKeeper;
        shapeOverlapKeeper: OverlapKeeper;
        /**
         * All added materials
         */
        materials: Material[];
        contactmaterials: any[];
        /**
         * Used to look up a ContactMaterial given two instances of Material.
         */
        contactMaterialTable: TupleDictionary;
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
        subsystems: any[];
        /**
         * Dispatched after a body has been added to the world.
         */
        addBodyEvent: {
            type: string;
            body: any;
        };
        /**
         * Dispatched after a body has been removed from the world.
         */
        removeBodyEvent: {
            type: string;
            body: any;
        };
        idToBodyMap: {};
        /**
         * The physics world
         * @class World
         * @constructor
         * @extends EventTarget
         * @param {object} [options]
         * @param {Vec3} [options.gravity]
         * @param {boolean} [options.allowSleep]
         * @param {Broadphase} [options.broadphase]
         * @param {Solver} [options.solver]
         * @param {boolean} [options.quatNormalizeFast]
         * @param {number} [options.quatNormalizeSkip]
         */
        constructor(options?: {
            gravity?: Vec3;
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
        getContactMaterial(m1: Material, m2: Material): any;
        /**
         * Get number of objects in the world.
         * @deprecated
         */
        numObjects(): number;
        /**
         * Store old collision state info
         */
        collisionMatrixTick(): void;
        /**
         * Add a rigid body to the simulation.
         * @param body
         *
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
         * @deprecated Use .addBody instead
         */
        add(body: Body): void;
        /**
         * Add a rigid body to the simulation.
         * @method add
         * @param {Body} body
         * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
         * @todo Adding an array of bodies should be possible. This would save some loops too
         * @deprecated Use .addBody instead
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
         * Raycast test
         * @param from
         * @param to
         * @param result
         * @deprecated Use .raycastAll, .raycastClosest or .raycastAny instead.
         */
        rayTest(from: Vec3, to: Vec3, result: RaycastResult): void;
        /**
         * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
         * @param from
         * @param to
         * @param options
         * @param callback
         * @return True if any body was hit.
         */
        raycastAll(from: Vec3, to: Vec3, options: {
            collisionFilterMask?: number;
            collisionFilterGroup?: number;
            skipBackfaces?: boolean;
            checkCollisionResponse?: boolean;
            mode?: number;
            from?: Vec3;
            to?: Vec3;
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
        raycastAny(from: Vec3, to: Vec3, options: {
            collisionFilterMask?: number;
            collisionFilterGroup?: number;
            skipBackfaces?: boolean;
            checkCollisionResponse?: boolean;
            mode?: number;
            from?: Vec3;
            to?: Vec3;
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
        raycastClosest(from: Vec3, to: Vec3, options: {
            collisionFilterMask?: number;
            collisionFilterGroup?: number;
            skipBackfaces?: boolean;
            checkCollisionResponse?: boolean;
            mode?: number;
            from?: Vec3;
            to?: Vec3;
            callback?: Function;
            result?: RaycastResult;
        }, result: RaycastResult): boolean;
        /**
         * Remove a rigid body from the simulation.
         * @param body
         * @deprecated Use .removeBody instead
         */
        remove(body: Body): void;
        /**
         * Remove a rigid body from the simulation.
         * @param body
         */
        removeBody(body: Body): void;
        getBodyById(id: number): any;
        getShapeById(id: number): any;
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
        step(dt: number, timeSinceLastCalled: number, maxSubSteps: number): void;
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
        contactPointPool: any[];
        frictionEquationPool: any[];
        result: any[];
        frictionResult: any[];
        /**
         * Pooled vectors.
         */
        v3pool: Vec3Pool;
        world: World;
        currentContactMaterial: any;
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
         * @method createContactEquation
         * @param {Body} bi
         * @param {Body} bj
         * @param {Shape} si
         * @param {Shape} sj
         * @param {Shape} overrideShapeA
         * @param {Shape} overrideShapeB
         * @return {ContactEquation}
         */
        createContactEquation(bi: any, bj: any, si: any, sj: any, overrideShapeA: any, overrideShapeB: any): any;
        createFrictionEquationsFromContact(contactEquation: any, outArray: any): boolean;
        createFrictionFromAverage(numContacts: any): void;
        /**
         * Generate all contacts between a list of body pairs
         * @method getContacts
         * @param {array} p1 Array of body indices
         * @param {array} p2 Array of body indices
         * @param {World} world
         * @param {array} result Array to store generated contacts
         * @param {array} oldcontacts Optional. Array of reusable contact objects
         */
        getContacts(p1: any, p2: any, world: any, result: any, oldcontacts: any, frictionResult: any, frictionPool: any): void;
        boxBox(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        boxConvex(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        boxParticle(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method sphereSphere
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        sphereSphere(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method planeTrimesh
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        planeTrimesh(planeShape: any, trimeshShape: any, planePos: any, trimeshPos: any, planeQuat: any, trimeshQuat: any, planeBody: any, trimeshBody: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method sphereTrimesh
         * @param  {Shape}      sphereShape
         * @param  {Shape}      trimeshShape
         * @param  {Vec3}       spherePos
         * @param  {Vec3}       trimeshPos
         * @param  {Quaternion} sphereQuat
         * @param  {Quaternion} trimeshQuat
         * @param  {Body}       sphereBody
         * @param  {Body}       trimeshBody
         */
        sphereTrimesh(sphereShape: any, trimeshShape: any, spherePos: any, trimeshPos: any, sphereQuat: any, trimeshQuat: any, sphereBody: any, trimeshBody: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method spherePlane
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        spherePlane(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method sphereBox
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        sphereBox(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method sphereConvex
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        sphereConvex(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method planeBox
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        planeBox(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method planeConvex
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        planeConvex(planeShape: any, convexShape: any, planePosition: any, convexPosition: any, planeQuat: any, convexQuat: any, planeBody: any, convexBody: any, si: any, sj: any, justTest: any): boolean;
        /**
         * @method convexConvex
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        convexConvex(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any, faceListA?: any, faceListB?: any): boolean;
        /**
         * @method convexTrimesh
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        /**
         * @method particlePlane
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        planeParticle(sj: any, si: any, xj: any, xi: any, qj: any, qi: any, bj: any, bi: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method particleSphere
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        sphereParticle(sj: any, si: any, xj: any, xi: any, qj: any, qi: any, bj: any, bi: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method convexParticle
         * @param  {Array}      result
         * @param  {Shape}      si
         * @param  {Shape}      sj
         * @param  {Vec3}       xi
         * @param  {Vec3}       xj
         * @param  {Quaternion} qi
         * @param  {Quaternion} qj
         * @param  {Body}       bi
         * @param  {Body}       bj
         */
        convexParticle(sj: any, si: any, xj: any, xi: any, qj: any, qi: any, bj: any, bi: any, rsi: any, rsj: any, justTest: any): boolean;
        boxHeightfield(si: any, sj: any, xi: any, xj: any, qi: any, qj: any, bi: any, bj: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method convexHeightfield
         */
        convexHeightfield(convexShape: any, hfShape: any, convexPos: any, hfPos: any, convexQuat: any, hfQuat: any, convexBody: any, hfBody: any, rsi: any, rsj: any, justTest: any): boolean;
        /**
         * @method sphereHeightfield
         */
        sphereHeightfield(sphereShape: any, hfShape: any, spherePos: any, hfPos: any, sphereQuat: any, hfQuat: any, sphereBody: any, hfBody: any, rsi: any, rsj: any, justTest: any): boolean;
    }
}
//# sourceMappingURL=cannon.d.ts.map