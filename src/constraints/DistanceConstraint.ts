namespace CANNON
{
    export class DistanceConstraint extends Constraint
    {
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
        constructor(bodyA: Body, bodyB: Body, distance?: number, maxForce?: number)
        {
            super(bodyA, bodyB);

            if (typeof (distance) === "undefined")
            {
                distance = bodyA.position.distance(bodyB.position);
            }

            if (typeof (maxForce) === "undefined")
            {
                maxForce = 1e6;
            }

            this.distance = distance;

            /**
             * @property {ContactEquation} distanceEquation
             */
            var eq = this.distanceEquation = new ContactEquation(bodyA, bodyB);
            this.equations.push(eq);

            // Make it bidirectional
            eq.minForce = -maxForce;
            eq.maxForce = maxForce;
        }

        update()
        {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var eq = this.distanceEquation;
            var halfDist = this.distance * 0.5;
            var normal = eq.ni;

            bodyB.position.subTo(bodyA.position, normal);
            normal.normalize();
            normal.scaleNumberTo(halfDist, eq.ri);
            normal.scaleNumberTo(-halfDist, eq.rj);
        }
    }
}