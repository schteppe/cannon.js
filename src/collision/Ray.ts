import { Box3, Quaternion, Sphere, Triangle3, Vector3 } from '@feng3d/math';
import { worldNormal } from '../common';
import { Transform } from '../math/Transform';
import { Body } from '../objects/Body';
import { Heightfield } from '../shapes/Heightfield';
import { Shape } from '../shapes/Shape';
import { Trimesh } from '../shapes/Trimesh';
import { World } from '../world/World';
import { RaycastResult } from './RaycastResult';

export class Ray
{
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
    constructor(from?: Vector3, to?: Vector3)
    {
        this.from = from ? from.clone() : new Vector3();
        this.to = to ? to.clone() : new Vector3();
        this._direction = new Vector3();
        this.precision = 0.0001;
        this.checkCollisionResponse = true;
        this.skipBackfaces = false;
        this.collisionFilterMask = -1;
        this.collisionFilterGroup = -1;
        this.mode = Ray.ANY;
        this.result = new RaycastResult();
        this.hasHit = false;
        this.callback = function (_result) { };
    }

    static CLOSEST = 1;
    static ANY = 2;
    static ALL = 4;

    /**
     * Do itersection against all bodies in the given World.
     * @param world
     * @param options
     * @return True if the ray hit anything, otherwise false.
     */
    intersectWorld(world: World, options: {
        mode?: number, result?: RaycastResult, skipBackfaces?: boolean, collisionFilterMask?: number,
        collisionFilterGroup?: number, from?: Vector3, to?: Vector3, callback?: Function
    })
    {
        this.mode = options.mode || Ray.ANY;
        this.result = options.result || new RaycastResult();
        this.skipBackfaces = !!options.skipBackfaces;
        this.collisionFilterMask = typeof (options.collisionFilterMask) !== 'undefined' ? options.collisionFilterMask : -1;
        this.collisionFilterGroup = typeof (options.collisionFilterGroup) !== 'undefined' ? options.collisionFilterGroup : -1;
        if (options.from)
        {
            this.from.copy(options.from);
        }
        if (options.to)
        {
            this.to.copy(options.to);
        }
        this.callback = options.callback || function () { };
        this.hasHit = false;

        this.result.reset();
        this._updateDirection();

        this.getAABB(tmpAABB);
        tmpArray.length = 0;
        world.broadphase.aabbQuery(world, tmpAABB, tmpArray);
        this.intersectBodies(tmpArray);

        return this.hasHit;
    }

    /**
     * Shoot a ray at a body, get back information about the hit.
     * @param body
     * @param result Deprecated - set the result property of the Ray instead.
     */
    intersectBody(body: Body, result?: RaycastResult)
    {
        if (result)
        {
            this.result = result;
            this._updateDirection();
        }
        const checkCollisionResponse = this.checkCollisionResponse;

        if (checkCollisionResponse && !body.collisionResponse)
        {
            return;
        }

        if ((this.collisionFilterGroup & body.collisionFilterMask) === 0 || (body.collisionFilterGroup & this.collisionFilterMask) === 0)
        {
            return;
        }

        const xi = intersectBodyXi;
        const qi = intersectBodyQi;

        for (let i = 0, N = body.shapes.length; i < N; i++)
        {
            const shape = body.shapes[i];

            if (checkCollisionResponse && !shape.collisionResponse)
            {
                continue; // Skip
            }

            body.quaternion.multTo(body.shapeOrientations[i], qi);
            body.quaternion.vmult(body.shapeOffsets[i], xi);
            xi.addTo(body.position, xi);

            this.intersectShape(
                shape,
                qi,
                xi,
                body
            );

            if (this.result._shouldStop)
            {
                break;
            }
        }
    }

    /**
     * @param bodies An array of Body objects.
     * @param result Deprecated
     */
    intersectBodies(bodies: Body[], result?: RaycastResult)
    {
        if (result)
        {
            this.result = result;
            this._updateDirection();
        }

        for (let i = 0, l = bodies.length; !this.result._shouldStop && i < l; i++)
        {
            this.intersectBody(bodies[i]);
        }
    }

    /**
     * Updates the _direction vector.
     */
    private _updateDirection()
    {
        this.to.subTo(this.from, this._direction);
        this._direction.normalize();
    }

    private intersectShape(shape: Shape, quat: Quaternion, position: Vector3, body: Body)
    {
        const from = this.from;

        // Checking boundingSphere
        const distance = distanceFromIntersection(from, this._direction, position);
        if (distance > shape.boundingSphereRadius)
        {
            return;
        }

        const intersectMethod = this[shape.type];
        if (intersectMethod)
        {
            intersectMethod.call(this, shape, quat, position, body, shape);
        }
    }

    private intersectBox(shape: Shape, quat: Quaternion, position: Vector3, body: Body, reportedShape: Shape)
    {
        return this.intersectConvex(shape.convexPolyhedronRepresentation, quat, position, body, reportedShape);
    }

    private intersectPlane(_shape: Shape, quat: Quaternion, position: Vector3, body: Body, reportedShape: Shape)
    {
        const from = this.from;
        const to = this.to;
        const direction = this._direction;

        // Get plane normal
        const worldNormal1 = worldNormal.clone();
        quat.vmult(worldNormal1, worldNormal1);

        const len = new Vector3();
        from.subTo(position, len);
        const planeToFrom = len.dot(worldNormal1);
        to.subTo(position, len);
        const planeToTo = len.dot(worldNormal1);

        if (planeToFrom * planeToTo > 0)
        {
            // "from" and "to" are on the same side of the plane... bail out
            return;
        }

        if (from.distance(to) < planeToFrom)
        {
            return;
        }

        const nDotDir = worldNormal1.dot(direction);

        if (Math.abs(nDotDir) < this.precision)
        {
            // No intersection
            return;
        }

        const planePointToFrom = new Vector3();
        const dirScaledWithT = new Vector3();
        const hitPointWorld = new Vector3();

        from.subTo(position, planePointToFrom);
        const t = -worldNormal1.dot(planePointToFrom) / nDotDir;
        direction.scaleNumberTo(t, dirScaledWithT);
        from.addTo(dirScaledWithT, hitPointWorld);

        this.reportIntersection(worldNormal1, hitPointWorld, reportedShape, body, -1);
    }

    /**
     * Get the world AABB of the ray.
     */
    getAABB(result: Box3)
    {
        const to = this.to;
        const from = this.from;
        result.min.x = Math.min(to.x, from.x);
        result.min.y = Math.min(to.y, from.y);
        result.min.z = Math.min(to.z, from.z);
        result.max.x = Math.max(to.x, from.x);
        result.max.y = Math.max(to.y, from.y);
        result.max.z = Math.max(to.z, from.z);
    }

    private intersectHeightfield(shape: Heightfield, quat: Quaternion, position: Vector3, body: Body, reportedShape: Shape)
    {
        // const data = shape.data;
        // const w = shape.elementSize;

        // Convert the ray to local heightfield coordinates
        const localRay = intersectHeightfieldLocalRay; // new Ray(this.from, this.to);
        localRay.from.copy(this.from);
        localRay.to.copy(this.to);
        Transform.pointToLocalFrame(position, quat, localRay.from, localRay.from);
        Transform.pointToLocalFrame(position, quat, localRay.to, localRay.to);
        localRay._updateDirection();

        // Get the index of the data points to test against
        const index = intersectHeightfieldIndex;
        let iMinX; let iMinY; let iMaxX; let
            iMaxY;

        // Set to max
        iMinX = iMinY = 0;
        iMaxX = iMaxY = shape.data.length - 1;

        const aabb = new Box3();
        localRay.getAABB(aabb);

        shape.getIndexOfPosition(aabb.min.x, aabb.min.y, index, true);
        iMinX = Math.max(iMinX, index[0]);
        iMinY = Math.max(iMinY, index[1]);
        shape.getIndexOfPosition(aabb.max.x, aabb.max.y, index, true);
        iMaxX = Math.min(iMaxX, index[0] + 1);
        iMaxY = Math.min(iMaxY, index[1] + 1);

        for (let i = iMinX; i < iMaxX; i++)
        {
            for (let j = iMinY; j < iMaxY; j++)
            {
                if (this.result._shouldStop)
                {
                    return;
                }

                shape.getAabbAtIndex(i, j, aabb);
                if (!localRay.overlapsBox3(aabb))
                {
                    continue;
                }

                // Lower triangle
                shape.getConvexTrianglePillar(i, j, false);
                Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
                this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);

                if (this.result._shouldStop)
                {
                    return;
                }

                // Upper triangle
                shape.getConvexTrianglePillar(i, j, true);
                Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
                this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
            }
        }
    }

    private intersectSphere(shape: Sphere, _quat: Quaternion, position: Vector3, body: Body, reportedShape: Shape)
    {
        const from = this.from;
        const to = this.to;
        const r = shape.radius;

        const a = Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2) + Math.pow(to.z - from.z, 2);
        const b = 2 * ((to.x - from.x) * (from.x - position.x) + (to.y - from.y) * (from.y - position.y) + (to.z - from.z) * (from.z - position.z));
        const c = Math.pow(from.x - position.x, 2) + Math.pow(from.y - position.y, 2) + Math.pow(from.z - position.z, 2) - Math.pow(r, 2);

        const delta = Math.pow(b, 2) - 4 * a * c;

        const intersectionPoint = RayIntersectSphereIntersectionPoint;
        const normal = RayIntersectSphereNormal;

        if (delta < 0)
        {
            // No intersection
            return;
        }
        else if (delta === 0)
        {
            // single intersection point
            from.lerpNumberTo(to, delta, intersectionPoint);

            intersectionPoint.subTo(position, normal);
            normal.normalize();

            this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
        }
        else
        {
            const d1 = (-b - Math.sqrt(delta)) / (2 * a);
            const d2 = (-b + Math.sqrt(delta)) / (2 * a);

            if (d1 >= 0 && d1 <= 1)
            {
                from.lerpNumberTo(to, d1, intersectionPoint);
                intersectionPoint.subTo(position, normal);
                normal.normalize();
                this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
            }

            if (this.result._shouldStop)
            {
                return;
            }

            if (d2 >= 0 && d2 <= 1)
            {
                from.lerpNumberTo(to, d2, intersectionPoint);
                intersectionPoint.subTo(position, normal);
                normal.normalize();
                this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
            }
        }
    }

    private intersectConvex(
        shape: Shape,
        quat: Quaternion,
        position: Vector3,
        body: Body,
        reportedShape: Shape,
        options: { faceList?: number[] } = {}
    )
    {
        // const minDistNormal = intersectConvexMinDistNormal;
        const normal = intersectConvexNormal;
        const vector = intersectConvexVector;
        // const minDistIntersect = intersectConvexMinDistIntersect;
        const faceList = (options && options.faceList) || null;

        // Checking faces
        const faces = shape.faces;
        const vertices = <Vector3[]>shape.vertices;
        const normals = shape.faceNormals;
        const direction = this._direction;

        const from = this.from;
        const to = this.to;
        const fromToDistance = from.distance(to);

        // const minDist = -1;
        const Nfaces = faceList ? faceList.length : faces.length;
        const result = this.result;

        for (let j = 0; !result._shouldStop && j < Nfaces; j++)
        {
            const fi = faceList ? faceList[j] : j;

            const face = faces[fi];
            const faceNormal = normals[fi];
            const q = quat;
            const x = position;

            // determine if ray intersects the plane of the face
            // note: this works regardless of the direction of the face normal

            // Get plane point in world coordinates...
            vector.copy(vertices[face[0]]);
            q.vmult(vector, vector);
            vector.addTo(x, vector);

            // ...but make it relative to the ray from. We'll fix this later.
            vector.subTo(from, vector);

            // Get plane normal
            q.vmult(faceNormal, normal);

            // If this dot product is negative, we have something interesting
            const dot = direction.dot(normal);

            // Bail out if ray and plane are parallel
            if (Math.abs(dot) < this.precision)
            {
                continue;
            }

            // calc distance to plane
            const scalar = normal.dot(vector) / dot;

            // if negative distance, then plane is behind ray
            if (scalar < 0)
            {
                continue;
            }

            // if (dot < 0) {

            // Intersection point is from + direction * scalar
            direction.scaleNumberTo(scalar, intersectPoint);
            intersectPoint.addTo(from, intersectPoint);

            // a is the point we compare points b and c with.
            a.copy(vertices[face[0]]);
            q.vmult(a, a);
            x.addTo(a, a);

            for (let i = 1; !result._shouldStop && i < face.length - 1; i++)
            {
                // Transform 3 vertices to world coords
                b.copy(vertices[face[i]]);
                c.copy(vertices[face[i + 1]]);
                q.vmult(b, b);
                q.vmult(c, c);
                x.addTo(b, b);
                x.addTo(c, c);

                const distance = intersectPoint.distance(from);

                if (!(Triangle3.containsPoint(a, b, c, intersectPoint) || Triangle3.containsPoint(b, a, c, intersectPoint)) || distance > fromToDistance)
                {
                    continue;
                }

                this.reportIntersection(normal, intersectPoint, reportedShape, body, fi);
            }
            // }
        }
    }

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
     * @param _options
     *
     * @todo Optimize by transforming the world to local space first.
     * @todo Use Octree lookup
     */
    private intersectTrimesh(
        mesh: Trimesh,
        quat: Quaternion,
        position: Vector3,
        body: Body,
        reportedShape: Shape,
        _options: { faceList: number[] }
    )
    {
        const normal = intersectTrimeshNormal;
        const triangles = intersectTrimeshTriangles;
        const treeTransform = intersectTrimeshTreeTransform;
        // const minDistNormal = intersectConvex_minDistNormal;
        const vector = intersectConvexVector;
        // const minDistIntersect = intersectConvex_minDistIntersect;
        // const localAABB = intersectTrimesh_localAABB;
        const localDirection = intersectTrimeshLocalDirection;
        const localFrom = intersectTrimeshLocalFrom;
        const localTo = intersectTrimeshLocalTo;
        const worldIntersectPoint = intersectTrimeshWorldIntersectPoint;
        const worldNormal = intersectTrimeshWorldNormal;
        // const faceList = (options && options.faceList) || null;

        // Checking faces
        const indices = mesh.indices;
        // const vertices = mesh.vertices;
        // const normals = mesh.faceNormals;

        const from = this.from;
        const to = this.to;
        const direction = this._direction;

        // const minDist = -1;
        treeTransform.position.copy(position);
        treeTransform.quaternion.copy(quat);

        // Transform ray to local space!
        Transform.vectorToLocalFrame(position, quat, direction, localDirection);
        Transform.pointToLocalFrame(position, quat, from, localFrom);
        Transform.pointToLocalFrame(position, quat, to, localTo);

        localTo.x *= mesh.scale.x;
        localTo.y *= mesh.scale.y;
        localTo.z *= mesh.scale.z;
        localFrom.x *= mesh.scale.x;
        localFrom.y *= mesh.scale.y;
        localFrom.z *= mesh.scale.z;

        localTo.subTo(localFrom, localDirection);
        localDirection.normalize();

        const fromToDistanceSquared = localFrom.distanceSquared(localTo);

        mesh.tree.rayQuery(this, treeTransform, triangles);

        for (let i = 0, N = triangles.length; !this.result._shouldStop && i !== N; i++)
        {
            const trianglesIndex = triangles[i];

            mesh.getNormal(trianglesIndex, normal);

            // determine if ray intersects the plane of the face
            // note: this works regardless of the direction of the face normal

            // Get plane point in world coordinates...
            mesh.getVertex(indices[trianglesIndex * 3], a);

            // ...but make it relative to the ray from. We'll fix this later.
            a.subTo(localFrom, vector);

            // If this dot product is negative, we have something interesting
            const dot = localDirection.dot(normal);

            // Bail out if ray and plane are parallel
            // if (Math.abs( dot ) < this.precision){
            //     continue;
            // }

            // calc distance to plane
            const scalar = normal.dot(vector) / dot;

            // if negative distance, then plane is behind ray
            if (scalar < 0)
            {
                continue;
            }

            // Intersection point is from + direction * scalar
            localDirection.scaleNumberTo(scalar, intersectPoint);
            intersectPoint.addTo(localFrom, intersectPoint);

            // Get triangle vertices
            mesh.getVertex(indices[trianglesIndex * 3 + 1], b);
            mesh.getVertex(indices[trianglesIndex * 3 + 2], c);

            const squaredDistance = intersectPoint.distanceSquared(localFrom);

            if (!(Triangle3.containsPoint(b, a, c, intersectPoint) || Triangle3.containsPoint(a, b, c, intersectPoint)) || squaredDistance > fromToDistanceSquared)
            {
                continue;
            }

            // transform intersectpoint and normal to world
            Transform.vectorToWorldFrame(quat, normal, worldNormal);
            Transform.pointToWorldFrame(position, quat, intersectPoint, worldIntersectPoint);
            this.reportIntersection(worldNormal, worldIntersectPoint, reportedShape, body, trianglesIndex);
        }
        triangles.length = 0;
    }

    private reportIntersection(normal: Vector3, hitPointWorld: Vector3, shape: Shape, body: Body, hitFaceIndex?: number)
    {
        const from = this.from;
        const to = this.to;
        const distance = from.distance(hitPointWorld);
        const result = this.result;

        // Skip back faces?
        if (this.skipBackfaces && normal.dot(this._direction) > 0)
        {
            return;
        }

        result.hitFaceIndex = typeof (hitFaceIndex) !== 'undefined' ? hitFaceIndex : -1;

        switch (this.mode)
        {
            case Ray.ALL:
                this.hasHit = true;
                result.set(
                    from,
                    to,
                    normal,
                    hitPointWorld,
                    shape,
                    body,
                    distance
                );
                result.hasHit = true;
                this.callback(result);
                break;

            case Ray.CLOSEST:

                // Store if closer than current closest
                if (distance < result.distance || !result.hasHit)
                {
                    this.hasHit = true;
                    result.hasHit = true;
                    result.set(
                        from,
                        to,
                        normal,
                        hitPointWorld,
                        shape,
                        body,
                        distance
                    );
                }
                break;

            case Ray.ANY:

                // Report and stop.
                this.hasHit = true;
                result.hasHit = true;
                result.set(
                    from,
                    to,
                    normal,
                    hitPointWorld,
                    shape,
                    body,
                    distance
                );
                result._shouldStop = true;
                break;
        }
    }

    /**
     * Check if the AABB is hit by a ray.
     */
    overlapsBox3(box3: Box3)
    {
        // const t = 0;

        // ray.direction is unit direction vector of ray
        const dirFracX = 1 / this._direction.x;
        const dirFracY = 1 / this._direction.y;
        const dirFracZ = 1 / this._direction.z;

        // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
        const t1 = (box3.min.x - this.from.x) * dirFracX;
        const t2 = (box3.max.x - this.from.x) * dirFracX;
        const t3 = (box3.min.y - this.from.y) * dirFracY;
        const t4 = (box3.max.y - this.from.y) * dirFracY;
        const t5 = (box3.min.z - this.from.z) * dirFracZ;
        const t6 = (box3.max.z - this.from.z) * dirFracZ;

        // let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)));
        // let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)));
        const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
        const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

        // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
        if (tmax < 0)
        {
            // t = tmax;
            return false;
        }

        // if tmin > tmax, ray doesn't intersect AABB
        if (tmin > tmax)
        {
            // t = tmax;
            return false;
        }

        return true;
    }
}

const tmpAABB = new Box3();
const tmpArray = [];

const intersectBodyXi = new Vector3();
const intersectBodyQi = new Quaternion();

const intersectPoint = new Vector3();

const a = new Vector3();
const b = new Vector3();
const c = new Vector3();

const v0 = new Vector3();
const intersect = new Vector3();

const intersectTrimeshNormal = new Vector3();
const intersectTrimeshLocalDirection = new Vector3();
const intersectTrimeshLocalFrom = new Vector3();
const intersectTrimeshLocalTo = new Vector3();
const intersectTrimeshWorldNormal = new Vector3();
const intersectTrimeshWorldIntersectPoint = new Vector3();
// const intersectTrimesh_localAABB = new Box3();
const intersectTrimeshTriangles: number[] = [];
const intersectTrimeshTreeTransform = new Transform();

const intersectConvexOptions = {
    faceList: [0]
};
const worldPillarOffset = new Vector3();
const intersectHeightfieldLocalRay = new Ray();
const intersectHeightfieldIndex = [];

const RayIntersectSphereIntersectionPoint = new Vector3();
const RayIntersectSphereNormal = new Vector3();

const intersectConvexNormal = new Vector3();
// const intersectConvexMinDistNormal = new Vector3();
// const intersectConvexMinDistIntersect = new Vector3();
const intersectConvexVector = new Vector3();

Ray.prototype[Shape.types.BOX] = Ray.prototype['intersectBox'];
Ray.prototype[Shape.types.PLANE] = Ray.prototype['intersectPlane'];

Ray.prototype[Shape.types.HEIGHTFIELD] = Ray.prototype['intersectHeightfield'];
Ray.prototype[Shape.types.SPHERE] = Ray.prototype['intersectSphere'];

Ray.prototype[Shape.types.TRIMESH] = Ray.prototype['intersectTrimesh'];
Ray.prototype[Shape.types.CONVEXPOLYHEDRON] = Ray.prototype['intersectConvex'];

function distanceFromIntersection(from: Vector3, direction: Vector3, position: Vector3)
{
    // v0 is vector from from to position
    position.subTo(from, v0);
    const dot = v0.dot(direction);

    // intersect = direction*dot + from
    direction.scaleNumberTo(dot, intersect);
    intersect.addTo(from, intersect);

    const distance = position.distance(intersect);

    return distance;
}
