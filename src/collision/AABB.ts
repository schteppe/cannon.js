namespace CANNON
{
    export class Box3
    {
        /**
         * The lower bound of the bounding box.
         */
        min = new Vector3();

        /**
         * The upper bound of the bounding box.
         */
        max = new Vector3();

        /**
         * 
         * @param options 
         * 
         * Axis aligned bounding box class.
         */
        constructor(lowerBound = new Vector3(), upperBound = new Vector3())
        {
            this.min = lowerBound;
            this.max = upperBound;
        }

        /**
         * Set the AABB bounds from a set of points.
         * @param points An array of Vec3's.
         * @param position
         * @param quaternion
         * @param skinSize
         * @return The self object
         */
        fromPoints(points: Vector3[])
        {
            var l = this.min,
                u = this.max;

            // Set to the first point
            l.copy(points[0]);
            u.copy(l);

            for (var i = 1; i < points.length; i++)
            {
                var p = points[i];

                if (p.x > u.x) { u.x = p.x; }
                if (p.x < l.x) { l.x = p.x; }
                if (p.y > u.y) { u.y = p.y; }
                if (p.y < l.y) { l.y = p.y; }
                if (p.z > u.z) { u.z = p.z; }
                if (p.z < l.z) { l.z = p.z; }
            }

            return this;
        }

        /**
         * Copy bounds from an AABB to this AABB
         * @param aabb Source to copy from
         * @return The this object, for chainability
         */
        copy(aabb: Box3)
        {
            this.min.copy(aabb.min);
            this.max.copy(aabb.max);
            return this;
        }

        /**
         * Clone an AABB
         */
        clone()
        {
            return new Box3().copy(this);
        }

        /**
         * Extend this AABB so that it covers the given AABB too.
         * @param aabb
         */
        extend(aabb: Box3)
        {
            this.min.x = Math.min(this.min.x, aabb.min.x);
            this.max.x = Math.max(this.max.x, aabb.max.x);
            this.min.y = Math.min(this.min.y, aabb.min.y);
            this.max.y = Math.max(this.max.y, aabb.max.y);
            this.min.z = Math.min(this.min.z, aabb.min.z);
            this.max.z = Math.max(this.max.z, aabb.max.z);
        }

        /**
         * Returns true if the given AABB overlaps this AABB.
         * @param aabb
         */
        overlaps(aabb: Box3)
        {
            var l1 = this.min,
                u1 = this.max,
                l2 = aabb.min,
                u2 = aabb.max;

            //      l2        u2
            //      |---------|
            // |--------|
            // l1       u1

            var overlapsX = ((l2.x <= u1.x && u1.x <= u2.x) || (l1.x <= u2.x && u2.x <= u1.x));
            var overlapsY = ((l2.y <= u1.y && u1.y <= u2.y) || (l1.y <= u2.y && u2.y <= u1.y));
            var overlapsZ = ((l2.z <= u1.z && u1.z <= u2.z) || (l1.z <= u2.z && u2.z <= u1.z));

            return overlapsX && overlapsY && overlapsZ;
        }

        /**
         * Mostly for debugging
         */
        volume()
        {
            var l = this.min,
                u = this.max;
            return (u.x - l.x) * (u.y - l.y) * (u.z - l.z);
        }


        /**
         * Returns true if the given AABB is fully contained in this AABB.
         * @param aabb
         */
        contains(aabb: Box3)
        {
            var l1 = this.min,
                u1 = this.max,
                l2 = aabb.min,
                u2 = aabb.max;

            //      l2        u2
            //      |---------|
            // |---------------|
            // l1              u1

            return (
                (l1.x <= l2.x && u1.x >= u2.x) &&
                (l1.y <= l2.y && u1.y >= u2.y) &&
                (l1.z <= l2.z && u1.z >= u2.z)
            );
        }

        getCorners(a: Vector3, b: Vector3, c: Vector3, d: Vector3, e: Vector3, f: Vector3, g: Vector3, h: Vector3)
        {
            var l = this.min,
                u = this.max;

            a.copy(l);
            b.set(u.x, l.y, l.z);
            c.set(u.x, u.y, l.z);
            d.set(l.x, u.y, u.z);
            e.set(u.x, l.y, l.z);
            f.set(l.x, u.y, l.z);
            g.set(l.x, l.y, u.z);
            h.copy(u);
        }

        /**
         * Get the representation of an AABB in another frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        toLocalFrame(frame: Transform, target: Box3)
        {
            var corners = transformIntoFrame_corners;
            var a = corners[0];
            var b = corners[1];
            var c = corners[2];
            var d = corners[3];
            var e = corners[4];
            var f = corners[5];
            var g = corners[6];
            var h = corners[7];

            // Get corners in current frame
            this.getCorners(a, b, c, d, e, f, g, h);

            // Transform them to new local frame
            for (var i = 0; i !== 8; i++)
            {
                var corner = corners[i];
                frame.pointToLocal(corner, corner);
            }

            return target.fromPoints(corners);
        }

        /**
         * Get the representation of an AABB in the global frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        toWorldFrame(frame: Transform, target: Box3)
        {

            var corners = transformIntoFrame_corners;
            var a = corners[0];
            var b = corners[1];
            var c = corners[2];
            var d = corners[3];
            var e = corners[4];
            var f = corners[5];
            var g = corners[6];
            var h = corners[7];

            // Get corners in current frame
            this.getCorners(a, b, c, d, e, f, g, h);

            // Transform them to new local frame
            for (var i = 0; i !== 8; i++)
            {
                var corner = corners[i];
                frame.pointToWorld(corner, corner);
            }

            return target.fromPoints(corners);
        }

        /**
         * Check if the AABB is hit by a ray.
         */
        overlapsRay(ray: Ray)
        {
            var t = 0;

            // ray.direction is unit direction vector of ray
            var dirFracX = 1 / ray._direction.x;
            var dirFracY = 1 / ray._direction.y;
            var dirFracZ = 1 / ray._direction.z;

            // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
            var t1 = (this.min.x - ray.from.x) * dirFracX;
            var t2 = (this.max.x - ray.from.x) * dirFracX;
            var t3 = (this.min.y - ray.from.y) * dirFracY;
            var t4 = (this.max.y - ray.from.y) * dirFracY;
            var t5 = (this.min.z - ray.from.z) * dirFracZ;
            var t6 = (this.max.z - ray.from.z) * dirFracZ;

            // var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)));
            // var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)));
            var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
            var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

            // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
            if (tmax < 0)
            {
                //t = tmax;
                return false;
            }

            // if tmin > tmax, ray doesn't intersect AABB
            if (tmin > tmax)
            {
                //t = tmax;
                return false;
            }

            return true;
        }

    }

    var tmp = new Vector3();
    var transformIntoFrame_corners = [
        new Vector3(),
        new Vector3(),
        new Vector3(),
        new Vector3(),
        new Vector3(),
        new Vector3(),
        new Vector3(),
        new Vector3()
    ];
}