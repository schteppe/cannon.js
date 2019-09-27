var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var cannon;
(function (cannon) {
    var Vec3 = /** @class */ (function () {
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
        function Vec3(x, y, z) {
            if (x === void 0) { x = 0.0; }
            if (y === void 0) { y = 0.0; }
            if (z === void 0) { z = 0.0; }
            this.x = x;
            this.y = y;
            this.z = z;
        }
        /**
         * Vector cross product
         *
         * @param v
         * @param target Target to save in.
         */
        Vec3.prototype.cross = function (v, target) {
            if (target === void 0) { target = new Vec3(); }
            var vx = v.x, vy = v.y, vz = v.z, x = this.x, y = this.y, z = this.z;
            target = target;
            target.x = (y * vz) - (z * vy);
            target.y = (z * vx) - (x * vz);
            target.z = (x * vy) - (y * vx);
            return target;
        };
        /**
         * Set the vectors' 3 elements
         * @param x
         * @param y
         * @param z
         */
        Vec3.prototype.set = function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        };
        /**
         * Set all components of the vector to zero.
         */
        Vec3.prototype.setZero = function () {
            this.x = this.y = this.z = 0;
        };
        /**
         * Vector addition
         * @param v
         * @param target
         */
        Vec3.prototype.vadd = function (v, target) {
            if (target === void 0) { target = null; }
            if (target) {
                target.x = v.x + this.x;
                target.y = v.y + this.y;
                target.z = v.z + this.z;
            }
            else {
                return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
            }
        };
        /**
         * Vector subtraction
         * @param v
         * @param target Target to save in.
         */
        Vec3.prototype.vsub = function (v, target) {
            if (target === void 0) { target = null; }
            if (target) {
                target.x = this.x - v.x;
                target.y = this.y - v.y;
                target.z = this.z - v.z;
            }
            else {
                return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
            }
        };
        /**
         * Get the cross product matrix a_cross from a vector, such that a x b = a_cross * b = c
         * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
         */
        Vec3.prototype.crossmat = function () {
            return new cannon.Mat3([0, -this.z, this.y,
                this.z, 0, -this.x,
                -this.y, this.x, 0]);
        };
        ;
        /**
         * Normalize the vector. Note that this changes the values in the vector.
         * @returns Returns the norm of the vector
         */
        Vec3.prototype.normalize = function () {
            var x = this.x, y = this.y, z = this.z;
            var n = Math.sqrt(x * x + y * y + z * z);
            if (n > 0.0) {
                var invN = 1 / n;
                this.x *= invN;
                this.y *= invN;
                this.z *= invN;
            }
            else {
                // Make something up
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }
            return n;
        };
        /**
         * Get the version of this vector that is of length 1.
         * @param target target to save in
         */
        Vec3.prototype.unit = function (target) {
            if (target === void 0) { target = new Vec3(); }
            target = target;
            var x = this.x, y = this.y, z = this.z;
            var ninv = Math.sqrt(x * x + y * y + z * z);
            if (ninv > 0.0) {
                ninv = 1.0 / ninv;
                target.x = x * ninv;
                target.y = y * ninv;
                target.z = z * ninv;
            }
            else {
                target.x = 1;
                target.y = 0;
                target.z = 0;
            }
            return target;
        };
        ;
        /**
         * Get the length of the vector
         * @deprecated Use .length() instead
         */
        Vec3.prototype.norm = function () {
            var x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        };
        /**
         * Get the length of the vector
         */
        Vec3.prototype.length = function () {
            var x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        };
        /**
         * Get the squared length of the vector
         * @deprecated Use .lengthSquared() instead.
         */
        Vec3.prototype.norm2 = function () {
            return this.dot(this);
        };
        /**
         * Get the squared length of the vector
         */
        Vec3.prototype.lengthSquared = function () {
            return this.dot(this);
        };
        /**
         * Get distance from this point to another point
         * @param p
         */
        Vec3.prototype.distanceTo = function (p) {
            var x = this.x, y = this.y, z = this.z;
            var px = p.x, py = p.y, pz = p.z;
            return Math.sqrt((px - x) * (px - x) +
                (py - y) * (py - y) +
                (pz - z) * (pz - z));
        };
        /**
         * Get squared distance from this point to another point
         * @param p
         */
        Vec3.prototype.distanceSquared = function (p) {
            var x = this.x, y = this.y, z = this.z;
            var px = p.x, py = p.y, pz = p.z;
            return (px - x) * (px - x) + (py - y) * (py - y) + (pz - z) * (pz - z);
        };
        /**
         * Multiply all the components of the vector with a scalar.
         * @param scalar
         * @param  target The vector to save the result in.
         * @deprecated Use .scale() instead
         */
        Vec3.prototype.mult = function (scalar, target) {
            if (target === void 0) { target = new Vec3(); }
            var x = this.x, y = this.y, z = this.z;
            target.x = scalar * x;
            target.y = scalar * y;
            target.z = scalar * z;
            return target;
        };
        /**
         * Multiply all the components of the vector with a scalar.
         * @param scalar
         * @param  target The vector to save the result in.
         */
        Vec3.prototype.scale = function (scalar, target) {
            if (target === void 0) { target = new Vec3(); }
            var x = this.x, y = this.y, z = this.z;
            target.x = scalar * x;
            target.y = scalar * y;
            target.z = scalar * z;
            return target;
        };
        /**
         * Multiply the vector with an other vector, component-wise.
         * @param  vector
         * @param  target The vector to save the result in.
         */
        Vec3.prototype.vmul = function (vector, target) {
            if (target === void 0) { target = new Vec3(); }
            target.x = vector.x * this.x;
            target.y = vector.y * this.y;
            target.z = vector.z * this.z;
            return target;
        };
        /**
         * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        Vec3.prototype.addScaledVector = function (scalar, vector, target) {
            if (target === void 0) { target = new Vec3(); }
            target.x = this.x + scalar * vector.x;
            target.y = this.y + scalar * vector.y;
            target.z = this.z + scalar * vector.z;
            return target;
        };
        /**
         * Calculate dot product
         * @param {Vec3} v
         */
        Vec3.prototype.dot = function (v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        };
        Vec3.prototype.isZero = function () {
            return this.x === 0 && this.y === 0 && this.z === 0;
        };
        ;
        /**
         * Make the vector point in the opposite direction.
         * @param target Optional target to save in
         */
        Vec3.prototype.negate = function (target) {
            target = target || new Vec3();
            target.x = -this.x;
            target.y = -this.y;
            target.z = -this.z;
            return target;
        };
        Vec3.prototype.tangents = function (t1, t2) {
            var norm = this.norm();
            if (norm > 0.0) {
                var n = Vec3_tangents_n;
                var inorm = 1 / norm;
                n.set(this.x * inorm, this.y * inorm, this.z * inorm);
                var randVec = Vec3_tangents_randVec;
                if (Math.abs(n.x) < 0.9) {
                    randVec.set(1, 0, 0);
                    n.cross(randVec, t1);
                }
                else {
                    randVec.set(0, 1, 0);
                    n.cross(randVec, t1);
                }
                n.cross(t1, t2);
            }
            else {
                // The normal length is zero, make something up
                t1.set(1, 0, 0);
                t2.set(0, 1, 0);
            }
        };
        /**
         * Converts to a more readable format
         */
        Vec3.prototype.toString = function () {
            return this.x + "," + this.y + "," + this.z;
        };
        /**
         * Converts to an array
         */
        Vec3.prototype.toArray = function () {
            return [this.x, this.y, this.z];
        };
        /**
         * Copies value of source to this vector.
         * @param source
         */
        Vec3.prototype.copy = function (source) {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
            return this;
        };
        /**
         * Do a linear interpolation between two vectors
         *
         * @param v
         * @param t A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
         */
        Vec3.prototype.lerp = function (v, t, target) {
            var x = this.x, y = this.y, z = this.z;
            target.x = x + (v.x - x) * t;
            target.y = y + (v.y - y) * t;
            target.z = z + (v.z - z) * t;
        };
        /**
         * Check if a vector equals is almost equal to another one.
         * @param v
         * @param  precision
         */
        Vec3.prototype.almostEquals = function (v, precision) {
            if (precision === void 0) { precision = 1e-6; }
            if (Math.abs(this.x - v.x) > precision ||
                Math.abs(this.y - v.y) > precision ||
                Math.abs(this.z - v.z) > precision) {
                return false;
            }
            return true;
        };
        /**
         * Check if a vector is almost zero
         * @param precision
         */
        Vec3.prototype.almostZero = function (precision) {
            if (precision === undefined) {
                precision = 1e-6;
            }
            if (Math.abs(this.x) > precision ||
                Math.abs(this.y) > precision ||
                Math.abs(this.z) > precision) {
                return false;
            }
            return true;
        };
        /**
         * Check if the vector is anti-parallel to another vector.
         * @param  v
         * @param  precision Set to zero for exact comparisons
         */
        Vec3.prototype.isAntiparallelTo = function (v, precision) {
            if (precision === void 0) { precision = 1e-6; }
            this.negate(antip_neg);
            return antip_neg.almostEquals(v, precision);
        };
        ;
        /**
         * Clone the vector
         */
        Vec3.prototype.clone = function () {
            return new Vec3(this.x, this.y, this.z);
        };
        ;
        Vec3.ZERO = new Vec3(0, 0, 0);
        Vec3.UNIT_X = new Vec3(1, 0, 0);
        Vec3.UNIT_Y = new Vec3(0, 1, 0);
        Vec3.UNIT_Z = new Vec3(0, 0, 1);
        return Vec3;
    }());
    cannon.Vec3 = Vec3;
    /**
     * Compute two artificial tangents to the vector
     * @method tangents
     * @param {Vec3} t1 Vector object to save the first tangent in
     * @param {Vec3} t2 Vector object to save the second tangent in
     */
    var Vec3_tangents_n = new Vec3();
    var Vec3_tangents_randVec = new Vec3();
    var antip_neg = new Vec3();
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var Mat3 = /** @class */ (function () {
        /**
         * A 3x3 matrix.
         * @class Mat3
         * @constructor
         * @param array elements Array of nine elements. Optional.
         * @author schteppe / http://github.com/schteppe
         */
        function Mat3(elements) {
            if (elements === void 0) { elements = [0, 0, 0, 0, 0, 0, 0, 0, 0]; }
            if (elements) {
                this.elements = elements;
            }
            else {
                this.elements = [0, 0, 0, 0, 0, 0, 0, 0, 0];
            }
        }
        /**
         * Sets the matrix to identity
         * @todo Should perhaps be renamed to setIdentity() to be more clear.
         * @todo Create another function that immediately creates an identity matrix eg. eye()
         */
        Mat3.prototype.identity = function () {
            var e = this.elements;
            e[0] = 1;
            e[1] = 0;
            e[2] = 0;
            e[3] = 0;
            e[4] = 1;
            e[5] = 0;
            e[6] = 0;
            e[7] = 0;
            e[8] = 1;
        };
        /**
         * Set all elements to zero
         */
        Mat3.prototype.setZero = function () {
            var e = this.elements;
            e[0] = 0;
            e[1] = 0;
            e[2] = 0;
            e[3] = 0;
            e[4] = 0;
            e[5] = 0;
            e[6] = 0;
            e[7] = 0;
            e[8] = 0;
        };
        /**
         * Sets the matrix diagonal elements from a Vec3
         * @param vec3
         */
        Mat3.prototype.setTrace = function (vec3) {
            var e = this.elements;
            e[0] = vec3.x;
            e[4] = vec3.y;
            e[8] = vec3.z;
        };
        /**
         * Gets the matrix diagonal elements
         */
        Mat3.prototype.getTrace = function (target) {
            if (target === void 0) { target = new cannon.Vec3(); }
            var e = this.elements;
            target.x = e[0];
            target.y = e[4];
            target.z = e[8];
        };
        ;
        /**
         * Matrix-Vector multiplication
         * @param v The vector to multiply with
         * @param target Optional, target to save the result in.
         */
        Mat3.prototype.vmult = function (v, target) {
            if (target === void 0) { target = new cannon.Vec3(); }
            var e = this.elements, x = v.x, y = v.y, z = v.z;
            target.x = e[0] * x + e[1] * y + e[2] * z;
            target.y = e[3] * x + e[4] * y + e[5] * z;
            target.z = e[6] * x + e[7] * y + e[8] * z;
            return target;
        };
        /**
         * Matrix-scalar multiplication
         * @param s
         */
        Mat3.prototype.smult = function (s) {
            for (var i = 0; i < this.elements.length; i++) {
                this.elements[i] *= s;
            }
        };
        /**
         * Matrix multiplication
         * @param  m Matrix to multiply with from left side.
         */
        Mat3.prototype.mmult = function (m, target) {
            if (target === void 0) { target = new Mat3(); }
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    var sum = 0.0;
                    for (var k = 0; k < 3; k++) {
                        sum += m.elements[i + k * 3] * this.elements[k + j * 3];
                    }
                    target.elements[i + j * 3] = sum;
                }
            }
            return target;
        };
        /**
         * Scale each column of the matrix
         * @param v
         */
        Mat3.prototype.scale = function (v, target) {
            if (target === void 0) { target = new Mat3(); }
            var e = this.elements, t = target.elements;
            for (var i = 0; i !== 3; i++) {
                t[3 * i + 0] = v.x * e[3 * i + 0];
                t[3 * i + 1] = v.y * e[3 * i + 1];
                t[3 * i + 2] = v.z * e[3 * i + 2];
            }
            return target;
        };
        /**
         * Solve Ax=b
         * @param b The right hand side
         * @param target Optional. Target vector to save in.
         * @todo should reuse arrays
         */
        Mat3.prototype.solve = function (b, target) {
            if (target === void 0) { target = new cannon.Vec3(); }
            // Construct equations
            var nr = 3; // num rows
            var nc = 4; // num cols
            var eqns = [];
            for (var i = 0; i < nr * nc; i++) {
                eqns.push(0);
            }
            var i, j;
            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    eqns[i + nc * j] = this.elements[i + 3 * j];
                }
            }
            eqns[3 + 4 * 0] = b.x;
            eqns[3 + 4 * 1] = b.y;
            eqns[3 + 4 * 2] = b.z;
            // Compute right upper triangular version of the matrix - Gauss elimination
            var n = 3, k = n, np;
            var kp = 4; // num rows
            var p, els;
            do {
                i = k - n;
                if (eqns[i + nc * i] === 0) {
                    // the pivot is null, swap lines
                    for (j = i + 1; j < k; j++) {
                        if (eqns[i + nc * j] !== 0) {
                            np = kp;
                            do { // do ligne( i ) = ligne( i ) + ligne( k )
                                p = kp - np;
                                eqns[p + nc * i] += eqns[p + nc * j];
                            } while (--np);
                            break;
                        }
                    }
                }
                if (eqns[i + nc * i] !== 0) {
                    for (j = i + 1; j < k; j++) {
                        var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                        np = kp;
                        do { // do ligne( k ) = ligne( k ) - multiplier * ligne( i )
                            p = kp - np;
                            eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                        } while (--np);
                    }
                }
            } while (--n);
            // Get the solution
            target.z = eqns[2 * nc + 3] / eqns[2 * nc + 2];
            target.y = (eqns[1 * nc + 3] - eqns[1 * nc + 2] * target.z) / eqns[1 * nc + 1];
            target.x = (eqns[0 * nc + 3] - eqns[0 * nc + 2] * target.z - eqns[0 * nc + 1] * target.y) / eqns[0 * nc + 0];
            if (isNaN(target.x) || isNaN(target.y) || isNaN(target.z) || target.x === Infinity || target.y === Infinity || target.z === Infinity) {
                throw "Could not solve equation! Got x=[" + target.toString() + "], b=[" + b.toString() + "], A=[" + this.toString() + "]";
            }
            return target;
        };
        /**
         * Get an element in the matrix by index. Index starts at 0, not 1!!!
         * @param row
         * @param column
         * @param value Optional. If provided, the matrix element will be set to this value.
         */
        Mat3.prototype.e = function (row, column, value) {
            if (value === undefined) {
                return this.elements[column + 3 * row];
            }
            else {
                // Set value
                this.elements[column + 3 * row] = value;
            }
        };
        /**
         * Copy another matrix into this matrix object.
         * @param source
         */
        Mat3.prototype.copy = function (source) {
            for (var i = 0; i < source.elements.length; i++) {
                this.elements[i] = source.elements[i];
            }
            return this;
        };
        /**
         * Returns a string representation of the matrix.
         */
        Mat3.prototype.toString = function () {
            var r = "";
            var sep = ",";
            for (var i = 0; i < 9; i++) {
                r += this.elements[i] + sep;
            }
            return r;
        };
        /**
         * reverse the matrix
         * @param target Optional. Target matrix to save in.
         */
        Mat3.prototype.reverse = function (target) {
            if (target === void 0) { target = new Mat3(); }
            // Construct equations
            var nr = 3; // num rows
            var nc = 6; // num cols
            var eqns = [];
            for (var i = 0; i < nr * nc; i++) {
                eqns.push(0);
            }
            var i, j;
            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    eqns[i + nc * j] = this.elements[i + 3 * j];
                }
            }
            eqns[3 + 6 * 0] = 1;
            eqns[3 + 6 * 1] = 0;
            eqns[3 + 6 * 2] = 0;
            eqns[4 + 6 * 0] = 0;
            eqns[4 + 6 * 1] = 1;
            eqns[4 + 6 * 2] = 0;
            eqns[5 + 6 * 0] = 0;
            eqns[5 + 6 * 1] = 0;
            eqns[5 + 6 * 2] = 1;
            // Compute right upper triangular version of the matrix - Gauss elimination
            var n = 3, k = n, np;
            var kp = nc; // num rows
            var p;
            do {
                i = k - n;
                if (eqns[i + nc * i] === 0) {
                    // the pivot is null, swap lines
                    for (j = i + 1; j < k; j++) {
                        if (eqns[i + nc * j] !== 0) {
                            np = kp;
                            do { // do line( i ) = line( i ) + line( k )
                                p = kp - np;
                                eqns[p + nc * i] += eqns[p + nc * j];
                            } while (--np);
                            break;
                        }
                    }
                }
                if (eqns[i + nc * i] !== 0) {
                    for (j = i + 1; j < k; j++) {
                        var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                        np = kp;
                        do { // do line( k ) = line( k ) - multiplier * line( i )
                            p = kp - np;
                            eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                        } while (--np);
                    }
                }
            } while (--n);
            // eliminate the upper left triangle of the matrix
            i = 2;
            do {
                j = i - 1;
                do {
                    var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                    np = nc;
                    do {
                        p = nc - np;
                        eqns[p + nc * j] = eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                    } while (--np);
                } while (j--);
            } while (--i);
            // operations on the diagonal
            i = 2;
            do {
                var multiplier = 1 / eqns[i + nc * i];
                np = nc;
                do {
                    p = nc - np;
                    eqns[p + nc * i] = eqns[p + nc * i] * multiplier;
                } while (--np);
            } while (i--);
            i = 2;
            do {
                j = 2;
                do {
                    p = eqns[nr + j + nc * i];
                    if (isNaN(p) || p === Infinity) {
                        throw "Could not reverse! A=[" + this.toString() + "]";
                    }
                    target.e(i, j, p);
                } while (j--);
            } while (i--);
            return target;
        };
        ;
        /**
         * Set the matrix from a quaterion
         * @param q
         */
        Mat3.prototype.setRotationFromQuaternion = function (q) {
            var x = q.x, y = q.y, z = q.z, w = q.w, x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2, e = this.elements;
            e[3 * 0 + 0] = 1 - (yy + zz);
            e[3 * 0 + 1] = xy - wz;
            e[3 * 0 + 2] = xz + wy;
            e[3 * 1 + 0] = xy + wz;
            e[3 * 1 + 1] = 1 - (xx + zz);
            e[3 * 1 + 2] = yz - wx;
            e[3 * 2 + 0] = xz - wy;
            e[3 * 2 + 1] = yz + wx;
            e[3 * 2 + 2] = 1 - (xx + yy);
            return this;
        };
        /**
         * Transpose the matrix
         * @param target Where to store the result.
         * @return The target Mat3, or a new Mat3 if target was omitted.
         */
        Mat3.prototype.transpose = function (target) {
            if (target === void 0) { target = new Mat3(); }
            var Mt = target.elements, M = this.elements;
            for (var i = 0; i !== 3; i++) {
                for (var j = 0; j !== 3; j++) {
                    Mt[3 * i + j] = M[3 * j + i];
                }
            }
            return target;
        };
        return Mat3;
    }());
    cannon.Mat3 = Mat3;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var Quaternion = /** @class */ (function () {
        /**
         * A Quaternion describes a rotation in 3D space. The Quaternion is mathematically defined as Q = x*i + y*j + z*k + w, where (i,j,k) are imaginary basis vectors. (x,y,z) can be seen as a vector related to the axis of rotation, while the real multiplier, w, is related to the amount of rotation.
         *
         * @param x Multiplier of the imaginary basis vector i.
         * @param y Multiplier of the imaginary basis vector j.
         * @param z Multiplier of the imaginary basis vector k.
         * @param w Multiplier of the real part.
         * @see http://en.wikipedia.org/wiki/Quaternion
         */
        function Quaternion(x, y, z, w) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (w === void 0) { w = 1; }
            this.x = x !== undefined ? x : 0;
            this.y = y !== undefined ? y : 0;
            this.z = z !== undefined ? z : 0;
            this.w = w !== undefined ? w : 1;
        }
        /**
         * Set the value of the quaternion.
         * @param x
         * @param y
         * @param z
         * @param w
         */
        Quaternion.prototype.set = function (x, y, z, w) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        };
        /**
         * Convert to a readable format
         */
        Quaternion.prototype.toString = function () {
            return this.x + "," + this.y + "," + this.z + "," + this.w;
        };
        /**
         * Convert to an Array
         */
        Quaternion.prototype.toArray = function () {
            return [this.x, this.y, this.z, this.w];
        };
        ;
        /**
         * Set the quaternion components given an axis and an angle.
         * @param axis
         * @param angle in radians
         */
        Quaternion.prototype.setFromAxisAngle = function (axis, angle) {
            var s = Math.sin(angle * 0.5);
            this.x = axis.x * s;
            this.y = axis.y * s;
            this.z = axis.z * s;
            this.w = Math.cos(angle * 0.5);
            return this;
        };
        /**
         * Converts the quaternion to axis/angle representation.
         * @param targetAxis A vector object to reuse for storing the axis.
         * @return An array, first elemnt is the axis and the second is the angle in radians.
         */
        Quaternion.prototype.toAxisAngle = function (targetAxis) {
            if (targetAxis === void 0) { targetAxis = new cannon.Vec3(); }
            this.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
            var angle = 2 * Math.acos(this.w);
            var s = Math.sqrt(1 - this.w * this.w); // assuming quaternion normalised then w is less than 1, so term always positive.
            if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
                // if s close to zero then direction of axis not important
                targetAxis.x = this.x; // if it is important that axis is normalised then replace with x=1; y=z=0;
                targetAxis.y = this.y;
                targetAxis.z = this.z;
            }
            else {
                targetAxis.x = this.x / s; // normalise axis
                targetAxis.y = this.y / s;
                targetAxis.z = this.z / s;
            }
            return [targetAxis, angle];
        };
        /**
         * Set the quaternion value given two vectors. The resulting rotation will be the needed rotation to rotate u to v.
         * @param u
         * @param v
         */
        Quaternion.prototype.setFromVectors = function (u, v) {
            if (u.isAntiparallelTo(v)) {
                var t1 = sfv_t1;
                var t2 = sfv_t2;
                u.tangents(t1, t2);
                this.setFromAxisAngle(t1, Math.PI);
            }
            else {
                var a = u.cross(v);
                this.x = a.x;
                this.y = a.y;
                this.z = a.z;
                this.w = Math.sqrt(Math.pow(u.norm(), 2) * Math.pow(v.norm(), 2)) + u.dot(v);
                this.normalize();
            }
            return this;
        };
        /**
         * Quaternion multiplication
         * @param q
         * @param target
         */
        Quaternion.prototype.mult = function (q, target) {
            if (target === void 0) { target = new Quaternion(); }
            var ax = this.x, ay = this.y, az = this.z, aw = this.w, bx = q.x, by = q.y, bz = q.z, bw = q.w;
            target.x = ax * bw + aw * bx + ay * bz - az * by;
            target.y = ay * bw + aw * by + az * bx - ax * bz;
            target.z = az * bw + aw * bz + ax * by - ay * bx;
            target.w = aw * bw - ax * bx - ay * by - az * bz;
            return target;
        };
        ;
        /**
         * Get the inverse quaternion rotation.
         * @param target
         */
        Quaternion.prototype.inverse = function (target) {
            var x = this.x, y = this.y, z = this.z, w = this.w;
            target = target || new Quaternion();
            this.conjugate(target);
            var inorm2 = 1 / (x * x + y * y + z * z + w * w);
            target.x *= inorm2;
            target.y *= inorm2;
            target.z *= inorm2;
            target.w *= inorm2;
            return target;
        };
        ;
        /**
         * Get the quaternion conjugate
         * @param target
         */
        Quaternion.prototype.conjugate = function (target) {
            target = target || new Quaternion();
            target.x = -this.x;
            target.y = -this.y;
            target.z = -this.z;
            target.w = this.w;
            return target;
        };
        ;
        /**
         * Normalize the quaternion. Note that this changes the values of the quaternion.
         */
        Quaternion.prototype.normalize = function () {
            var l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
            if (l === 0) {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 0;
            }
            else {
                l = 1 / l;
                this.x *= l;
                this.y *= l;
                this.z *= l;
                this.w *= l;
            }
            return this;
        };
        ;
        /**
         * Approximation of quaternion normalization. Works best when quat is already almost-normalized.
         * @see http://jsperf.com/fast-quaternion-normalization
         * @author unphased, https://github.com/unphased
         */
        Quaternion.prototype.normalizeFast = function () {
            var f = (3.0 - (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)) / 2.0;
            if (f === 0) {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 0;
            }
            else {
                this.x *= f;
                this.y *= f;
                this.z *= f;
                this.w *= f;
            }
            return this;
        };
        ;
        /**
         * Multiply the quaternion by a vector
         * @param v
         * @param target Optional
         */
        Quaternion.prototype.vmult = function (v, target) {
            if (target === void 0) { target = new cannon.Vec3(); }
            var x = v.x, y = v.y, z = v.z;
            var qx = this.x, qy = this.y, qz = this.z, qw = this.w;
            // q*v
            var ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
            target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return target;
        };
        ;
        /**
         * Copies value of source to this quaternion.
         * @param source
         */
        Quaternion.prototype.copy = function (source) {
            this.x = source.x;
            this.y = source.y;
            this.z = source.z;
            this.w = source.w;
            return this;
        };
        ;
        /**
         * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: http://www.euclideanspace.com/maths/standards/index.htm
         * @param target
         * @param order Three-character string e.g. "YZX", which also is default.
         */
        Quaternion.prototype.toEuler = function (target, order) {
            order = order || "YZX";
            var heading, attitude, bank;
            var x = this.x, y = this.y, z = this.z, w = this.w;
            switch (order) {
                case "YZX":
                    var test = x * y + z * w;
                    if (test > 0.499) { // singularity at north pole
                        heading = 2 * Math.atan2(x, w);
                        attitude = Math.PI / 2;
                        bank = 0;
                    }
                    if (test < -0.499) { // singularity at south pole
                        heading = -2 * Math.atan2(x, w);
                        attitude = -Math.PI / 2;
                        bank = 0;
                    }
                    if (isNaN(heading)) {
                        var sqx = x * x;
                        var sqy = y * y;
                        var sqz = z * z;
                        heading = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz); // Heading
                        attitude = Math.asin(2 * test); // attitude
                        bank = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz); // bank
                    }
                    break;
                default:
                    throw new Error("Euler order " + order + " not supported yet.");
            }
            target.y = heading;
            target.z = attitude;
            target.x = bank;
        };
        ;
        /**
         * See http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
         * @param x
         * @param y
         * @param z
         * @param order The order to apply angles: 'XYZ' or 'YXZ' or any other combination
         */
        Quaternion.prototype.setFromEuler = function (x, y, z, order) {
            order = order || "XYZ";
            var c1 = Math.cos(x / 2);
            var c2 = Math.cos(y / 2);
            var c3 = Math.cos(z / 2);
            var s1 = Math.sin(x / 2);
            var s2 = Math.sin(y / 2);
            var s3 = Math.sin(z / 2);
            if (order === 'XYZ') {
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if (order === 'YXZ') {
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
            }
            else if (order === 'ZXY') {
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if (order === 'ZYX') {
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
            }
            else if (order === 'YZX') {
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if (order === 'XZY') {
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
            }
            return this;
        };
        ;
        Quaternion.prototype.clone = function () {
            return new Quaternion(this.x, this.y, this.z, this.w);
        };
        ;
        /**
         * Performs a spherical linear interpolation between two quat
         *
         * @param toQuat second operand
         * @param t interpolation amount between the self quaternion and toQuat
         * @param target A quaternion to store the result in. If not provided, a new one will be created.
         * @returns The "target" object
         */
        Quaternion.prototype.slerp = function (toQuat, t, target) {
            if (target === void 0) { target = new Quaternion(); }
            var ax = this.x, ay = this.y, az = this.z, aw = this.w, bx = toQuat.x, by = toQuat.y, bz = toQuat.z, bw = toQuat.w;
            var omega, cosom, sinom, scale0, scale1;
            // calc cosine
            cosom = ax * bx + ay * by + az * bz + aw * bw;
            // adjust signs (if necessary)
            if (cosom < 0.0) {
                cosom = -cosom;
                bx = -bx;
                by = -by;
                bz = -bz;
                bw = -bw;
            }
            // calculate coefficients
            if ((1.0 - cosom) > 0.000001) {
                // standard case (slerp)
                omega = Math.acos(cosom);
                sinom = Math.sin(omega);
                scale0 = Math.sin((1.0 - t) * omega) / sinom;
                scale1 = Math.sin(t * omega) / sinom;
            }
            else {
                // "from" and "to" quaternions are very close
                //  ... so we can do a linear interpolation
                scale0 = 1.0 - t;
                scale1 = t;
            }
            // calculate final values
            target.x = scale0 * ax + scale1 * bx;
            target.y = scale0 * ay + scale1 * by;
            target.z = scale0 * az + scale1 * bz;
            target.w = scale0 * aw + scale1 * bw;
            return target;
        };
        ;
        /**
         * Rotate an absolute orientation quaternion given an angular velocity and a time step.
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         * @param  target
         * @return The "target" object
         */
        Quaternion.prototype.integrate = function (angularVelocity, dt, angularFactor, target) {
            target = target || new Quaternion();
            var ax = angularVelocity.x * angularFactor.x, ay = angularVelocity.y * angularFactor.y, az = angularVelocity.z * angularFactor.z, bx = this.x, by = this.y, bz = this.z, bw = this.w;
            var half_dt = dt * 0.5;
            target.x += half_dt * (ax * bw + ay * bz - az * by);
            target.y += half_dt * (ay * bw + az * bx - ax * bz);
            target.z += half_dt * (az * bw + ax * by - ay * bx);
            target.w += half_dt * (-ax * bx - ay * by - az * bz);
            return target;
        };
        ;
        return Quaternion;
    }());
    cannon.Quaternion = Quaternion;
    var sfv_t1 = new cannon.Vec3();
    var sfv_t2 = new cannon.Vec3();
    var Quaternion_mult_va = new cannon.Vec3();
    var Quaternion_mult_vb = new cannon.Vec3();
    var Quaternion_mult_vaxvb = new cannon.Vec3();
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var Transform = /** @class */ (function () {
        function Transform(options) {
            if (options === void 0) { options = {}; }
            this.position = new cannon.Vec3();
            if (options.position) {
                this.position.copy(options.position);
            }
            this.quaternion = new cannon.Quaternion();
            if (options.quaternion) {
                this.quaternion.copy(options.quaternion);
            }
        }
        /**
         * @param position
         * @param quaternion
         * @param worldPoint
         * @param result
         */
        Transform.pointToLocalFrame = function (position, quaternion, worldPoint, result) {
            if (result === void 0) { result = new cannon.Vec3(); }
            worldPoint.vsub(position, result);
            quaternion.conjugate(tmpQuat);
            tmpQuat.vmult(result, result);
            return result;
        };
        ;
        /**
         * Get a global point in local transform coordinates.
         * @param worldPoint
         * @param result
         * @returnThe "result" vector object
         */
        Transform.prototype.pointToLocal = function (worldPoint, result) {
            return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result);
        };
        ;
        /**
         * @param position
         * @param quaternion
         * @param localPoint
         * @param result
         */
        Transform.pointToWorldFrame = function (position, quaternion, localPoint, result) {
            if (result === void 0) { result = new cannon.Vec3(); }
            quaternion.vmult(localPoint, result);
            result.vadd(position, result);
            return result;
        };
        ;
        /**
         * Get a local point in global transform coordinates.
         * @param point
         * @param result
         * @return The "result" vector object
         */
        Transform.prototype.pointToWorld = function (localPoint, result) {
            return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result);
        };
        ;
        Transform.prototype.vectorToWorldFrame = function (localVector, result) {
            if (result === void 0) { result = new cannon.Vec3(); }
            this.quaternion.vmult(localVector, result);
            return result;
        };
        ;
        Transform.vectorToWorldFrame = function (quaternion, localVector, result) {
            quaternion.vmult(localVector, result);
            return result;
        };
        ;
        Transform.vectorToLocalFrame = function (position, quaternion, worldVector, result) {
            if (result === void 0) { result = new cannon.Vec3(); }
            quaternion.w *= -1;
            quaternion.vmult(worldVector, result);
            quaternion.w *= -1;
            return result;
        };
        ;
        return Transform;
    }());
    cannon.Transform = Transform;
    var tmpQuat = new cannon.Quaternion();
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var JacobianElement = /** @class */ (function () {
        /**
         * An element containing 6 entries, 3 spatial and 3 rotational degrees of freedom.
         */
        function JacobianElement() {
            this.spatial = new cannon.Vec3();
            this.rotational = new cannon.Vec3();
        }
        /**
         * Multiply with other JacobianElement
         * @param element
         */
        JacobianElement.prototype.multiplyElement = function (element) {
            return element.spatial.dot(this.spatial) + element.rotational.dot(this.rotational);
        };
        ;
        /**
         * Multiply with two vectors
         * @param spatial
         * @param rotational
         */
        JacobianElement.prototype.multiplyVectors = function (spatial, rotational) {
            return spatial.dot(this.spatial) + rotational.dot(this.rotational);
        };
        ;
        return JacobianElement;
    }());
    cannon.JacobianElement = JacobianElement;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    /**
     * Base class for objects that dispatches events.
     */
    var EventTarget = /** @class */ (function () {
        function EventTarget() {
        }
        /**
         * Add an event listener
         * @param  type
         * @param  listener
         * @return The self object, for chainability.
         */
        EventTarget.prototype.addEventListener = function (type, listener) {
            if (this._listeners === undefined) {
                this._listeners = {};
            }
            var listeners = this._listeners;
            if (listeners[type] === undefined) {
                listeners[type] = [];
            }
            if (listeners[type].indexOf(listener) === -1) {
                listeners[type].push(listener);
            }
            return this;
        };
        /**
         * Check if an event listener is added
         * @param type
         * @param listener
         */
        EventTarget.prototype.hasEventListener = function (type, listener) {
            if (this._listeners === undefined) {
                return false;
            }
            var listeners = this._listeners;
            if (listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1) {
                return true;
            }
            return false;
        };
        /**
         * Check if any event listener of the given type is added
         * @param type
         */
        EventTarget.prototype.hasAnyEventListener = function (type) {
            if (this._listeners === undefined) {
                return false;
            }
            var listeners = this._listeners;
            return (listeners[type] !== undefined);
        };
        /**
         * Remove an event listener
         * @param type
         * @param listener
         * @return The self object, for chainability.
         */
        EventTarget.prototype.removeEventListener = function (type, listener) {
            if (this._listeners === undefined) {
                return this;
            }
            var listeners = this._listeners;
            if (listeners[type] === undefined) {
                return this;
            }
            var index = listeners[type].indexOf(listener);
            if (index !== -1) {
                listeners[type].splice(index, 1);
            }
            return this;
        };
        /**
         * Emit an event.
         * @param event
         * @return The self object, for chainability.
         */
        EventTarget.prototype.dispatchEvent = function (event) {
            if (this._listeners === undefined) {
                return this;
            }
            var listeners = this._listeners;
            var listenerArray = listeners[event.type];
            if (listenerArray !== undefined) {
                event.target = this;
                for (var i = 0, l = listenerArray.length; i < l; i++) {
                    listenerArray[i].call(this, event);
                }
            }
            return this;
        };
        return EventTarget;
    }());
    cannon.EventTarget = EventTarget;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    /**
     * For pooling objects that can be reused.
     */
    var Pool = /** @class */ (function () {
        function Pool() {
            this.objects = [];
            this.type = Object;
        }
        /**
         * Release an object after use
         */
        Pool.prototype.release = function () {
            var Nargs = arguments.length;
            for (var i = 0; i !== Nargs; i++) {
                this.objects.push(arguments[i]);
            }
            return this;
        };
        /**
         * Get an object
         */
        Pool.prototype.get = function () {
            if (this.objects.length === 0) {
                return this.constructObject();
            }
            else {
                return this.objects.pop();
            }
        };
        /**
         * Construct an object. Should be implmented in each subclass.
         */
        Pool.prototype.constructObject = function () {
            throw new Error("constructObject() not implemented in this Pool subclass yet!");
        };
        /**
         * @param size
         * @return Self, for chaining
         */
        Pool.prototype.resize = function (size) {
            var objects = this.objects;
            while (objects.length > size) {
                objects.pop();
            }
            while (objects.length < size) {
                objects.push(this.constructObject());
            }
            return this;
        };
        return Pool;
    }());
    cannon.Pool = Pool;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var Utils = /** @class */ (function () {
        function Utils() {
        }
        /**
         * Extend an options object with default values.
         * @param  options The options object. May be falsy: in this case, a new object is created and returned.
         * @param  defaults An object containing default values.
         * @return The modified options object.
         */
        Utils.defaults = function (options, defaults) {
            if (defaults === void 0) { defaults = {}; }
            for (var key in defaults) {
                if (!(key in options)) {
                    options[key] = defaults[key];
                }
            }
            return options;
        };
        return Utils;
    }());
    cannon.Utils = Utils;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var Vec3Pool = /** @class */ (function (_super) {
        __extends(Vec3Pool, _super);
        function Vec3Pool() {
            var _this = _super.call(this) || this;
            _this.type = cannon.Vec3;
            return _this;
        }
        /**
         * Construct a vector
         */
        Vec3Pool.prototype.constructObject = function () {
            return new cannon.Vec3();
        };
        return Vec3Pool;
    }(cannon.Pool));
    cannon.Vec3Pool = Vec3Pool;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var TupleDictionary = /** @class */ (function () {
        function TupleDictionary() {
            /**
             * The data storage
             */
            this.data = { keys: [] };
        }
        /**
         * @param i
         * @param j
         */
        TupleDictionary.prototype.get = function (i, j) {
            if (i > j) {
                // swap
                var temp = j;
                j = i;
                i = temp;
            }
            return this.data[i + '-' + j];
        };
        TupleDictionary.prototype.set = function (i, j, value) {
            if (i > j) {
                var temp = j;
                j = i;
                i = temp;
            }
            var key = i + '-' + j;
            // Check if key already exists
            if (!this.get(i, j)) {
                this.data.keys.push(key);
            }
            this.data[key] = value;
        };
        TupleDictionary.prototype.reset = function () {
            var data = this.data, keys = data.keys;
            while (keys.length > 0) {
                var key = keys.pop();
                delete data[key];
            }
        };
        return TupleDictionary;
    }());
    cannon.TupleDictionary = TupleDictionary;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var AABB = /** @class */ (function () {
        /**
         * Axis aligned bounding box class.
         * @class AABB
         * @constructor
         * @param {Object} [options]
         * @param {Vec3}   [options.upperBound]
         * @param {Vec3}   [options.lowerBound]
         */
        function AABB(options) {
            if (options === void 0) { options = {}; }
            this.lowerBound = new cannon.Vec3();
            if (options.lowerBound) {
                this.lowerBound.copy(options.lowerBound);
            }
            this.upperBound = new cannon.Vec3();
            if (options.upperBound) {
                this.upperBound.copy(options.upperBound);
            }
        }
        /**
         * Set the AABB bounds from a set of points.
         * @param points An array of Vec3's.
         * @param position
         * @param quaternion
         * @param skinSize
         * @return The self object
         */
        AABB.prototype.setFromPoints = function (points, position, quaternion, skinSize) {
            var l = this.lowerBound, u = this.upperBound, q = quaternion;
            // Set to the first point
            l.copy(points[0]);
            if (q) {
                q.vmult(l, l);
            }
            u.copy(l);
            for (var i = 1; i < points.length; i++) {
                var p = points[i];
                if (q) {
                    q.vmult(p, tmp);
                    p = tmp;
                }
                if (p.x > u.x) {
                    u.x = p.x;
                }
                if (p.x < l.x) {
                    l.x = p.x;
                }
                if (p.y > u.y) {
                    u.y = p.y;
                }
                if (p.y < l.y) {
                    l.y = p.y;
                }
                if (p.z > u.z) {
                    u.z = p.z;
                }
                if (p.z < l.z) {
                    l.z = p.z;
                }
            }
            // Add offset
            if (position) {
                position.vadd(l, l);
                position.vadd(u, u);
            }
            if (skinSize) {
                l.x -= skinSize;
                l.y -= skinSize;
                l.z -= skinSize;
                u.x += skinSize;
                u.y += skinSize;
                u.z += skinSize;
            }
            return this;
        };
        /**
         * Copy bounds from an AABB to this AABB
         * @param aabb Source to copy from
         * @return The this object, for chainability
         */
        AABB.prototype.copy = function (aabb) {
            this.lowerBound.copy(aabb.lowerBound);
            this.upperBound.copy(aabb.upperBound);
            return this;
        };
        /**
         * Clone an AABB
         * @method clone
         */
        AABB.prototype.clone = function () {
            return new AABB().copy(this);
        };
        /**
         * Extend this AABB so that it covers the given AABB too.
         * @param aabb
         */
        AABB.prototype.extend = function (aabb) {
            this.lowerBound.x = Math.min(this.lowerBound.x, aabb.lowerBound.x);
            this.upperBound.x = Math.max(this.upperBound.x, aabb.upperBound.x);
            this.lowerBound.y = Math.min(this.lowerBound.y, aabb.lowerBound.y);
            this.upperBound.y = Math.max(this.upperBound.y, aabb.upperBound.y);
            this.lowerBound.z = Math.min(this.lowerBound.z, aabb.lowerBound.z);
            this.upperBound.z = Math.max(this.upperBound.z, aabb.upperBound.z);
        };
        ;
        /**
         * Returns true if the given AABB overlaps this AABB.
         * @param aabb
         */
        AABB.prototype.overlaps = function (aabb) {
            var l1 = this.lowerBound, u1 = this.upperBound, l2 = aabb.lowerBound, u2 = aabb.upperBound;
            //      l2        u2
            //      |---------|
            // |--------|
            // l1       u1
            var overlapsX = ((l2.x <= u1.x && u1.x <= u2.x) || (l1.x <= u2.x && u2.x <= u1.x));
            var overlapsY = ((l2.y <= u1.y && u1.y <= u2.y) || (l1.y <= u2.y && u2.y <= u1.y));
            var overlapsZ = ((l2.z <= u1.z && u1.z <= u2.z) || (l1.z <= u2.z && u2.z <= u1.z));
            return overlapsX && overlapsY && overlapsZ;
        };
        ;
        /**
         * Mostly for debugging
         */
        AABB.prototype.volume = function () {
            var l = this.lowerBound, u = this.upperBound;
            return (u.x - l.x) * (u.y - l.y) * (u.z - l.z);
        };
        ;
        /**
         * Returns true if the given AABB is fully contained in this AABB.
         * @param aabb
         */
        AABB.prototype.contains = function (aabb) {
            var l1 = this.lowerBound, u1 = this.upperBound, l2 = aabb.lowerBound, u2 = aabb.upperBound;
            //      l2        u2
            //      |---------|
            // |---------------|
            // l1              u1
            return ((l1.x <= l2.x && u1.x >= u2.x) &&
                (l1.y <= l2.y && u1.y >= u2.y) &&
                (l1.z <= l2.z && u1.z >= u2.z));
        };
        ;
        AABB.prototype.getCorners = function (a, b, c, d, e, f, g, h) {
            var l = this.lowerBound, u = this.upperBound;
            a.copy(l);
            b.set(u.x, l.y, l.z);
            c.set(u.x, u.y, l.z);
            d.set(l.x, u.y, u.z);
            e.set(u.x, l.y, l.z);
            f.set(l.x, u.y, l.z);
            g.set(l.x, l.y, u.z);
            h.copy(u);
        };
        ;
        /**
         * Get the representation of an AABB in another frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        AABB.prototype.toLocalFrame = function (frame, target) {
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
            for (var i = 0; i !== 8; i++) {
                var corner = corners[i];
                frame.pointToLocal(corner, corner);
            }
            return target.setFromPoints(corners);
        };
        ;
        /**
         * Get the representation of an AABB in the global frame.
         * @param frame
         * @param target
         * @return The "target" AABB object.
         */
        AABB.prototype.toWorldFrame = function (frame, target) {
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
            for (var i = 0; i !== 8; i++) {
                var corner = corners[i];
                frame.pointToWorld(corner, corner);
            }
            return target.setFromPoints(corners);
        };
        ;
        /**
         * Check if the AABB is hit by a ray.
         */
        AABB.prototype.overlapsRay = function (ray) {
            var t = 0;
            // ray.direction is unit direction vector of ray
            var dirFracX = 1 / ray._direction.x;
            var dirFracY = 1 / ray._direction.y;
            var dirFracZ = 1 / ray._direction.z;
            // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
            var t1 = (this.lowerBound.x - ray.from.x) * dirFracX;
            var t2 = (this.upperBound.x - ray.from.x) * dirFracX;
            var t3 = (this.lowerBound.y - ray.from.y) * dirFracY;
            var t4 = (this.upperBound.y - ray.from.y) * dirFracY;
            var t5 = (this.lowerBound.z - ray.from.z) * dirFracZ;
            var t6 = (this.upperBound.z - ray.from.z) * dirFracZ;
            // var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)));
            // var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)));
            var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
            var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
            // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behing us
            if (tmax < 0) {
                //t = tmax;
                return false;
            }
            // if tmin > tmax, ray doesn't intersect AABB
            if (tmin > tmax) {
                //t = tmax;
                return false;
            }
            return true;
        };
        ;
        return AABB;
    }());
    cannon.AABB = AABB;
    var tmp = new cannon.Vec3();
    var transformIntoFrame_corners = [
        new cannon.Vec3(),
        new cannon.Vec3(),
        new cannon.Vec3(),
        new cannon.Vec3(),
        new cannon.Vec3(),
        new cannon.Vec3(),
        new cannon.Vec3(),
        new cannon.Vec3()
    ];
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var ArrayCollisionMatrix = /** @class */ (function () {
        /**
         * Collision "matrix". It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
         */
        function ArrayCollisionMatrix() {
            this.matrix = [];
        }
        /**
         * Get an element
         * @method get
         * @param  {Number} i
         * @param  {Number} j
         * @return {Number}
         */
        ArrayCollisionMatrix.prototype.get = function (i0, j0) {
            var i = i0.index;
            var j = j0.index;
            if (j > i) {
                var temp = j;
                j = i;
                i = temp;
            }
            return this.matrix[(i * (i + 1) >> 1) + j - 1];
        };
        ;
        /**
         * Set an element
         * @param i0
         * @param j0
         * @param value
         */
        ArrayCollisionMatrix.prototype.set = function (i0, j0, value) {
            var i = i0.index;
            var j = j0.index;
            if (j > i) {
                var temp = j;
                j = i;
                i = temp;
            }
            this.matrix[(i * (i + 1) >> 1) + j - 1] = value ? 1 : 0;
        };
        ;
        /**
         * Sets all elements to zero
         */
        ArrayCollisionMatrix.prototype.reset = function () {
            for (var i = 0, l = this.matrix.length; i !== l; i++) {
                this.matrix[i] = 0;
            }
        };
        ;
        /**
         * Sets the max number of objects
         */
        ArrayCollisionMatrix.prototype.setNumObjects = function (n) {
            this.matrix.length = n * (n - 1) >> 1;
        };
        ;
        return ArrayCollisionMatrix;
    }());
    cannon.ArrayCollisionMatrix = ArrayCollisionMatrix;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var ObjectCollisionMatrix = /** @class */ (function () {
        /**
         * Records what objects are colliding with each other
         */
        function ObjectCollisionMatrix() {
            /**
             * The matrix storage
             */
            this.matrix = {};
            this.matrix = {};
        }
        ObjectCollisionMatrix.prototype.get = function (i0, j0) {
            var i = i0.id;
            var j = j0.id;
            if (j > i) {
                var temp = j;
                j = i;
                i = temp;
            }
            return i + '-' + j in this.matrix;
        };
        ;
        ObjectCollisionMatrix.prototype.set = function (i0, j0, value) {
            var i = i0.id;
            var j = j0.id;
            if (j > i) {
                var temp = j;
                j = i;
                i = temp;
            }
            if (value) {
                this.matrix[i + '-' + j] = true;
            }
            else {
                delete this.matrix[i + '-' + j];
            }
        };
        ;
        /**
         * Empty the matrix
         */
        ObjectCollisionMatrix.prototype.reset = function () {
            this.matrix = {};
        };
        ;
        /**
         * Set max number of objects
         *
         * @param n
         */
        ObjectCollisionMatrix.prototype.setNumObjects = function (n) {
        };
        ;
        return ObjectCollisionMatrix;
    }());
    cannon.ObjectCollisionMatrix = ObjectCollisionMatrix;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var OverlapKeeper = /** @class */ (function () {
        function OverlapKeeper() {
            this.current = [];
            this.previous = [];
            this.current = [];
            this.previous = [];
        }
        OverlapKeeper.prototype.getKey = function (i, j) {
            if (j < i) {
                var temp = j;
                j = i;
                i = temp;
            }
            return (i << 16) | j;
        };
        ;
        OverlapKeeper.prototype.set = function (i, j) {
            // Insertion sort. This way the diff will have linear complexity.
            var key = this.getKey(i, j);
            var current = this.current;
            var index = 0;
            while (key > current[index]) {
                index++;
            }
            if (key === current[index]) {
                return; // Pair was already added
            }
            for (var j = current.length - 1; j >= index; j--) {
                current[j + 1] = current[j];
            }
            current[index] = key;
        };
        ;
        OverlapKeeper.prototype.tick = function () {
            var tmp = this.current;
            this.current = this.previous;
            this.previous = tmp;
            this.current.length = 0;
        };
        ;
        OverlapKeeper.prototype.unpackAndPush = function (array, key) {
            array.push((key & 0xFFFF0000) >> 16, key & 0x0000FFFF);
        };
        OverlapKeeper.prototype.getDiff = function (additions, removals) {
            var a = this.current;
            var b = this.previous;
            var al = a.length;
            var bl = b.length;
            var j = 0;
            for (var i = 0; i < al; i++) {
                var found = false;
                var keyA = a[i];
                while (keyA > b[j]) {
                    j++;
                }
                found = keyA === b[j];
                if (!found) {
                    this.unpackAndPush(additions, keyA);
                }
            }
            j = 0;
            for (var i = 0; i < bl; i++) {
                var found = false;
                var keyB = b[i];
                while (keyB > a[j]) {
                    j++;
                }
                found = a[j] === keyB;
                if (!found) {
                    this.unpackAndPush(removals, keyB);
                }
            }
        };
        ;
        return OverlapKeeper;
    }());
    cannon.OverlapKeeper = OverlapKeeper;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var RaycastResult = /** @class */ (function () {
        /**
         * Storage for Ray casting data.
         */
        function RaycastResult() {
            this.rayFromWorld = new cannon.Vec3();
            this.rayToWorld = new cannon.Vec3();
            this.hitNormalWorld = new cannon.Vec3();
            this.hitPointWorld = new cannon.Vec3();
            this.hasHit = false;
            this.shape = null;
            this.body = null;
            /**
             * The index of the hit triangle, if the hit shape was a trimesh.
             */
            this.hitFaceIndex = -1;
            /**
             * Distance to the hit. Will be set to -1 if there was no hit.
             */
            this.distance = -1;
            /**
             * If the ray should stop traversing the bodies.
             */
            this._shouldStop = false;
        }
        /**
         * Reset all result data.
         */
        RaycastResult.prototype.reset = function () {
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
        };
        ;
        RaycastResult.prototype.abort = function () {
            this._shouldStop = true;
        };
        ;
        RaycastResult.prototype.set = function (rayFromWorld, rayToWorld, hitNormalWorld, hitPointWorld, shape, body, distance) {
            this.rayFromWorld.copy(rayFromWorld);
            this.rayToWorld.copy(rayToWorld);
            this.hitNormalWorld.copy(hitNormalWorld);
            this.hitPointWorld.copy(hitPointWorld);
            this.shape = shape;
            this.body = body;
            this.distance = distance;
        };
        ;
        return RaycastResult;
    }());
    cannon.RaycastResult = RaycastResult;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var Shape = /** @class */ (function () {
        /**
         * Base class for shapes
         *
         * @param options
         * @author schteppe
         */
        function Shape(options) {
            if (options === void 0) { options = {}; }
            this.id = Shape.idCounter++;
            this.type = options.type || 0;
            this.boundingSphereRadius = 0;
            this.collisionResponse = options.collisionResponse ? options.collisionResponse : true;
            this.collisionFilterGroup = options.collisionFilterGroup !== undefined ? options.collisionFilterGroup : 1;
            this.collisionFilterMask = options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1;
            this.material = options.material ? options.material : null;
            this.body = null;
        }
        /**
         * Computes the bounding sphere radius. The result is stored in the property .boundingSphereRadius
         */
        Shape.prototype.updateBoundingSphereRadius = function () {
            throw "computeBoundingSphereRadius() not implemented for shape type " + this.type;
        };
        ;
        /**
         * Get the volume of this shape
         */
        Shape.prototype.volume = function () {
            throw "volume() not implemented for shape type " + this.type;
        };
        ;
        /**
         * Calculates the inertia in the local frame for this shape.
         * @param mass
         * @param target
         * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
         */
        Shape.prototype.calculateLocalInertia = function (mass, target) {
            throw "calculateLocalInertia() not implemented for shape type " + this.type;
        };
        ;
        Shape.idCounter = 0;
        /**
         * The available shape types.
         */
        Shape.types = {
            SPHERE: 1,
            PLANE: 2,
            BOX: 4,
            COMPOUND: 8,
            CONVEXPOLYHEDRON: 16,
            HEIGHTFIELD: 32,
            PARTICLE: 64,
            CYLINDER: 128,
            TRIMESH: 256
        };
        return Shape;
    }());
    cannon.Shape = Shape;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var Material = /** @class */ (function () {
        /**
         * Defines a physics material.
         *
         * @param options
         * @author schteppe
         */
        function Material(options) {
            if (options === void 0) { options = {}; }
            var name = '';
            // Backwards compatibility fix
            if (typeof (options) === 'string') {
                name = options;
                options = {};
            }
            else if (typeof (options) === 'object') {
                name = '';
            }
            this.name = name;
            this.id = Material.idCounter++;
            this.friction = typeof (options.friction) !== 'undefined' ? options.friction : -1;
            this.restitution = typeof (options.restitution) !== 'undefined' ? options.restitution : -1;
        }
        Material.idCounter = 0;
        return Material;
    }());
    cannon.Material = Material;
})(cannon || (cannon = {}));
var cannon;
(function (cannon) {
    var ContactMaterial = /** @class */ (function () {
        /**
         * Defines what happens when two materials meet.
         *
         * @param m1
         * @param m2
         * @param options
         */
        function ContactMaterial(m1, m2, options) {
            if (options === void 0) { options = {}; }
            options = cannon.Utils.defaults(options, {
                friction: 0.3,
                restitution: 0.3,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e7,
                frictionEquationRelaxation: 3
            });
            this.id = ContactMaterial.idCounter++;
            this.materials = [m1, m2];
            this.friction = options.friction;
            this.restitution = options.restitution;
            this.contactEquationStiffness = options.contactEquationStiffness;
            this.contactEquationRelaxation = options.contactEquationRelaxation;
            this.frictionEquationStiffness = options.frictionEquationStiffness;
            this.frictionEquationRelaxation = options.frictionEquationRelaxation;
        }
        ContactMaterial.idCounter = 0;
        return ContactMaterial;
    }());
    cannon.ContactMaterial = ContactMaterial;
})(cannon || (cannon = {}));
//# sourceMappingURL=cannon.js.map