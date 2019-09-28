namespace CANNON
{
    export class Transform
    {

        position: Vec3;
        quaternion: Quaternion;

        constructor(options: any = {})
        {
            this.position = new Vec3();
            if (options.position)
            {
                this.position.copy(options.position);
            }
            this.quaternion = new Quaternion();
            if (options.quaternion)
            {
                this.quaternion.copy(options.quaternion);
            }
        }

        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        static pointToLocalFrame(position: Vec3, quaternion: Quaternion, worldPoint: Vec3, result = new Vec3())
        {
            worldPoint.vsub(position, result);
            quaternion.conjugate(tmpQuat);
            tmpQuat.vmult(result, result);
            return result;
        }

        /**
         * Get a global point in local transform coordinates.
         * @param worldPoint
         * @param result
         * @returnThe "result" vector object
         */
        pointToLocal(worldPoint: Vec3, result: Vec3)
        {
            return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result);
        }

        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        static pointToWorldFrame(position: Vec3, quaternion: Quaternion, localPoint: Vec3, result = new Vec3())
        {
            quaternion.vmult(localPoint, result);
            result.vadd(position, result);
            return result;
        }

        /**
         * Get a local point in global transform coordinates.
         * @param point
         * @param result
         * @return The "result" vector object
         */
        pointToWorld(localPoint: Vec3, result: Vec3)
        {
            return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result);
        }

        vectorToWorldFrame(localVector: Vec3, result = new Vec3())
        {
            this.quaternion.vmult(localVector, result);
            return result;
        }

        static vectorToWorldFrame(quaternion: Quaternion, localVector: Vec3, result: Vec3)
        {
            quaternion.vmult(localVector, result);
            return result;
        }

        static vectorToLocalFrame(position: Vec3, quaternion: Quaternion, worldVector: Vec3, result = new Vec3())
        {
            quaternion.w *= -1;
            quaternion.vmult(worldVector, result);
            quaternion.w *= -1;
            return result;
        }
    }

    var tmpQuat = new Quaternion();
}