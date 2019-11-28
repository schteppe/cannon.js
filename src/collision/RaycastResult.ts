namespace CANNON
{
	export class RaycastResult
	{
		rayFromWorld = new Vector3();

		rayToWorld = new Vector3();

		hitNormalWorld = new Vector3();

		hitPointWorld = new Vector3();

		hasHit = false;

		shape: Shape = null;

		body: Body = null;

		/**
		 * The index of the hit triangle, if the hit shape was a trimesh.
		 */
		hitFaceIndex = -1;

		/**
		 * Distance to the hit. Will be set to -1 if there was no hit.
		 */
		distance = -1;

		suspensionLength: number;
		directionWorld: Vector3;

		/**
		 * If the ray should stop traversing the bodies.
		 */
		_shouldStop = false;
        groundObject: number;

		/**
		 * Storage for Ray casting data.
		 */
		constructor()
		{

		}

		/**
		 * Reset all result data.
		 */
		reset()
		{
			this.rayFromWorld.setZero();
			this.rayToWorld.setZero();
			this.hitNormalWorld.setZero();
			this.hitPointWorld.setZero();
			this.hasHit = false;
			this.shape = null;
			this.body = null;
			this.hitFaceIndex = -1;
			this.distance = -1;
			this._shouldStop = false;
		}

		abort()
		{
			this._shouldStop = true;
		}

		set(
			rayFromWorld: Vector3,
			rayToWorld: Vector3,
			hitNormalWorld: Vector3,
			hitPointWorld: Vector3,
			shape: Shape,
			body: Body,
			distance: number
		)
		{
			this.rayFromWorld.copy(rayFromWorld);
			this.rayToWorld.copy(rayToWorld);
			this.hitNormalWorld.copy(hitNormalWorld);
			this.hitPointWorld.copy(hitPointWorld);
			this.shape = shape;
			this.body = body;
			this.distance = distance;
		}
	}
}