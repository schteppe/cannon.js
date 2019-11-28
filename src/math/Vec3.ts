namespace CANNON
{
    export class Vec3
    {
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
        constructor(x = 0.0, y = 0.0, z = 0.0)
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        static ZERO = new Vec3(0, 0, 0);

        static X_AXIS = new Vec3(1, 0, 0);

        static Y_AXIS = new Vec3(0, 1, 0);

        static Z_AXIS = new Vec3(0, 0, 1);

        /**
         * Vector cross product
         * 
         * @param v 
         * @param target Target to save in.
         */
        crossTo(v: Vec3, target = new Vec3())
        {
            var vx = v.x, vy = v.y, vz = v.z, x = this.x, y = this.y, z = this.z;
            target = target;

            target.x = (y * vz) - (z * vy);
            target.y = (z * vx) - (x * vz);
            target.z = (x * vy) - (y * vx);

            return target;
        }

        /**
         * Set the vectors' 3 elements
         * @param x 
         * @param y 
         * @param z 
         */
        set(x: number, y: number, z: number)
        {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        /**
         * Set all components of the vector to zero.
         */
        setZero()
        {
            this.x = this.y = this.z = 0;
        }

        /**
         * Vector addition
         * @param v 
         * @param target 
         */
        addTo(v: Vec3, target: Vec3 = null)
        {
            if (target)
            {
                target.x = v.x + this.x;
                target.y = v.y + this.y;
                target.z = v.z + this.z;
            } else
            {
                return new Vec3(this.x + v.x,
                    this.y + v.y,
                    this.z + v.z);
            }
        }

        /**
         * Vector subtraction
         * @param v 
         * @param target Target to save in.
         */
        subTo(v: Vec3, target: Vec3 = null)
        {
            if (target)
            {
                target.x = this.x - v.x;
                target.y = this.y - v.y;
                target.z = this.z - v.z;
            } else
            {
                return new Vec3(this.x - v.x,
                    this.y - v.y,
                    this.z - v.z);
            }
        }

        /**
         * Get the cross product matrix a_cross from a vector, such that a x b = a_cross * b = c
         * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
         */
        crossmat()
        {
            return new Mat3([0, -this.z, this.y,
                this.z, 0, -this.x,
                -this.y, this.x, 0]);
        }

        /**
         * Normalize the vector. Note that this changes the values in the vector.
         * @returns Returns the norm of the vector
         */
        normalize()
        {
            var x = this.x, y = this.y, z = this.z;
            var n = Math.sqrt(x * x + y * y + z * z);
            if (n > 0.0)
            {
                var invN = 1 / n;
                this.x *= invN;
                this.y *= invN;
                this.z *= invN;
            } else
            {
                // Make something up
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }
            return n;
        }

        /**
         * Get the version of this vector that is of length 1.
         * @param target target to save in
         */
        unit(target: Vec3 = new Vec3())
        {
            target = target;
            var x = this.x, y = this.y, z = this.z;
            var ninv = Math.sqrt(x * x + y * y + z * z);
            if (ninv > 0.0)
            {
                ninv = 1.0 / ninv;
                target.x = x * ninv;
                target.y = y * ninv;
                target.z = z * ninv;
            } else
            {
                target.x = 1;
                target.y = 0;
                target.z = 0;
            }
            return target;
        }

        /**
         * Get the length of the vector
         */
        get length()
        {
            var x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        }

        /**
         * Get the squared length of the vector
         */
        get lengthSquared()
        {
            return this.dot(this);
        }

        /**
         * Get distance from this point to another point
         * @param p 
         */
        distance(p: Vec3)
        {
            var x = this.x, y = this.y, z = this.z;
            var px = p.x, py = p.y, pz = p.z;
            return Math.sqrt((px - x) * (px - x) +
                (py - y) * (py - y) +
                (pz - z) * (pz - z));
        }

        /**
         * Get squared distance from this point to another point
         * @param p 
         */
        distanceSquared(p: Vec3)
        {
            var x = this.x, y = this.y, z = this.z;
            var px = p.x, py = p.y, pz = p.z;
            return (px - x) * (px - x) + (py - y) * (py - y) + (pz - z) * (pz - z);
        }

        /**
         * Multiply all the components of the vector with a scalar.
         * @param scalar
         * @param  target The vector to save the result in.
         */
        scaleNumberTo(scalar: number, target = new Vec3())
        {
            var x = this.x,
                y = this.y,
                z = this.z;
            target.x = scalar * x;
            target.y = scalar * y;
            target.z = scalar * z;
            return target;
        }

        /**
         * Multiply the vector with an other vector, component-wise.
         * @param  vector
         * @param  target The vector to save the result in.
         */
        scaleTo(vector: Vec3, target = new Vec3())
        {
            target.x = vector.x * this.x;
            target.y = vector.y * this.y;
            target.z = vector.z * this.z;
            return target;
        }

        /**
         * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        addScaledVectorTo(scalar: number, vector: Vec3, target = new Vec3())
        {
            target.x = this.x + scalar * vector.x;
            target.y = this.y + scalar * vector.y;
            target.z = this.z + scalar * vector.z;
            return target;
        }

        /**
         * Calculate dot product
         * @param {Vec3} v
         */
        dot(v: Vec3)
        {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        }

        isZero()
        {
            return this.x === 0 && this.y === 0 && this.z === 0;
        };

        /**
         * Make the vector point in the opposite direction.
         * @param target Optional target to save in
         */
        negateTo(target: Vec3)
        {
            target = target || new Vec3();
            target.x = -this.x;
            target.y = -this.y;
            target.z = -this.z;
            return target;
        }

        tangents(t1: Vec3, t2: Vec3)
        {
            var norm = this.length;
            if (norm > 0.0)
            {
                var n = Vec3_tangents_n;
                var inorm = 1 / norm;
                n.set(this.x * inorm, this.y * inorm, this.z * inorm);
                var randVec = Vec3_tangents_randVec;
                if (Math.abs(n.x) < 0.9)
                {
                    randVec.set(1, 0, 0);
                    n.crossTo(randVec, t1);
                } else
                {
                    randVec.set(0, 1, 0);
                    n.crossTo(randVec, t1);
                }
                n.crossTo(t1, t2);
            } else
            {
                // The normal length is zero, make something up
                t1.set(1, 0, 0);
                t2.set(0, 1, 0);
            }
        }

        /**
         * Converts to a more readable format
         */
        toString()
        {
            return this.x + "," + this.y + "," + this.z;
        }

        /**
         * Converts to an array
         */
        toArray()
        {
            return [this.x, this.y, this.z];
        }

        /**
         * Copies value of source to this vector.
         * @param source
         */
        copy(source: Vec3)
        {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
            return this;
        }

        /**
         * Do a linear interpolation between two vectors
         * 
         * @param v
         * @param t A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
         */
        lerpNumberTo(v: Vec3, t: number, target: Vec3)
        {
            var x = this.x, y = this.y, z = this.z;
            target.x = x + (v.x - x) * t;
            target.y = y + (v.y - y) * t;
            target.z = z + (v.z - z) * t;
        }

        /**
         * Check if a vector equals is almost equal to another one.
         * @param v
         * @param  precision
         */
        equals(v: Vec3, precision = 1e-6)
        {
            if (Math.abs(this.x - v.x) > precision ||
                Math.abs(this.y - v.y) > precision ||
                Math.abs(this.z - v.z) > precision)
            {
                return false;
            }
            return true;
        }

        /**
         * Check if the vector is anti-parallel to another vector.
         * @param  v
         * @param  precision Set to zero for exact comparisons
         */
        isAntiparallelTo(v: Vec3, precision = 1e-6)
        {
            this.negateTo(antip_neg);
            return antip_neg.equals(v, precision);
        }

        /**
         * Clone the vector
         */
        clone()
        {
            return new Vec3(this.x, this.y, this.z);
        }
    }

    /**
     * Compute two artificial tangents to the vector
     * @method tangents
     * @param {Vec3} t1 Vector object to save the first tangent in
     * @param {Vec3} t2 Vector object to save the second tangent in
     */
    var Vec3_tangents_n = new Vec3();
    var Vec3_tangents_randVec = new Vec3();

    var antip_neg = new Vec3();
}