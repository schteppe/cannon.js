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
        union(aabb: Box3)
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

        toPoints(points?: Vector3[])
        {
            if (!points)
            {
                points = [
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                ];
            }

            var min = this.min;
            var max = this.max;
            points[0].set(min.x, min.y, min.z);
            points[1].set(max.x, min.y, min.z);
            points[2].set(min.x, max.y, min.z);
            points[3].set(min.x, min.y, max.z);
            points[4].set(min.x, max.y, max.z);
            points[5].set(max.x, min.y, max.z);
            points[6].set(max.x, max.y, min.z);
            points[7].set(max.x, max.y, max.z);

            return points;
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

            // Get corners in current frame
            this.toPoints(corners);

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

            // Get corners in current frame
            this.toPoints(corners);

            // Transform them to new local frame
            for (var i = 0; i !== 8; i++)
            {
                var corner = corners[i];
                frame.pointToWorld(corner, corner);
            }

            return target.fromPoints(corners);
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