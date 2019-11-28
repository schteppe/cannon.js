namespace CANNON
{
    export class Transform
    {

        position: Vector3;
        quaternion: Quaternion;

        constructor(position = new Vector3(), quaternion = new Quaternion())
        {
            this.position = position;
            this.quaternion = quaternion;
        }

        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        static pointToLocalFrame(position: Vector3, quaternion: Quaternion, worldPoint: Vector3, result = new Vector3())
        {
            worldPoint.subTo(position, result);
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
        pointToLocal(worldPoint: Vector3, result: Vector3)
        {
            return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result);
        }

        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        static pointToWorldFrame(position: Vector3, quaternion: Quaternion, localPoint: Vector3, result = new Vector3())
        {
            quaternion.vmult(localPoint, result);
            result.addTo(position, result);
            return result;
        }

        /**
         * Get a local point in global transform coordinates.
         * @param point
         * @param result
         * @return The "result" vector object
         */
        pointToWorld(localPoint: Vector3, result: Vector3)
        {
            return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result);
        }

        vectorToWorldFrame(localVector: Vector3, result = new Vector3())
        {
            this.quaternion.vmult(localVector, result);
            return result;
        }

        static vectorToWorldFrame(quaternion: Quaternion, localVector: Vector3, result: Vector3)
        {
            quaternion.vmult(localVector, result);
            return result;
        }

        static vectorToLocalFrame(position: Vector3, quaternion: Quaternion, worldVector: Vector3, result = new Vector3())
        {
            quaternion.w *= -1;
            quaternion.vmult(worldVector, result);
            quaternion.w *= -1;
            return result;
        }
    }

    var tmpQuat = new Quaternion();
}