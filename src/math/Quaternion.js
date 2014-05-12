/**
 * @class CANNON.Quaternion
 * @brief A Quaternion describes a rotation in 3D space.
 * @description The Quaternion is mathematically defined as Q = x*i + y*j + z*k + w, where (i,j,k) are imaginary basis vectors. (x,y,z) can be seen as a vector related to the axis of rotation, while the real multiplier, w, is related to the amount of rotation.
 * @param float x Multiplier of the imaginary basis vector i.
 * @param float y Multiplier of the imaginary basis vector j.
 * @param float z Multiplier of the imaginary basis vector k.
 * @param float w Multiplier of the real part.
 * @see http://en.wikipedia.org/wiki/Quaternion
 */
CANNON.Quaternion = function(x,y,z,w){
    /**
    * @property float x
    * @memberof CANNON.Quaternion
    */
    this._x = x!==undefined ? x : 0;
    /**
    * @property float y
    * @memberof CANNON.Quaternion
    */
    this._y = y!==undefined ? y : 0;
    /**
    * @property float z
    * @memberof CANNON.Quaternion
    */
    this._z = z!==undefined ? z : 0;
    /**
    * @property float w
    * @memberof CANNON.Quaternion
    * @brief The multiplier of the real quaternion basis vector.
    */
    this._w = w!==undefined ? w : 1;

    Object.defineProperty(this, 'x', {
        get: function() { return this._x; },
        set: function(value) { this._x = value; }
    });
    Object.defineProperty(this, 'y', {
        get: function() { return this._y; },
        set: function(value) { this._y = value; }
    });
    Object.defineProperty(this, 'z', {
        get: function() { return this._z; },
        set: function(value) { this._z = value; }
    });
    Object.defineProperty(this, 'w', {
        get: function() { return this._w; },
        set: function(value) { this._w = value; }
    });
};

/**
 * @method set
 * @memberof CANNON.Quaternion
 * @brief Set the value of the quaternion.
 * @param float x
 * @param float y
 * @param float z
 * @param float w
 */
CANNON.Quaternion.prototype.set = function(x,y,z,w){
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
};

/**
 * @method toString
 * @memberof CANNON.Quaternion
 * @brief Convert to a readable format
 * @return string
 */
CANNON.Quaternion.prototype.toString = function(){
    return this._x+","+this._y+","+this._z+","+this._w;
};

/**
 * @method setFromAxisAngle
 * @memberof CANNON.Quaternion
 * @brief Set the quaternion components given an axis and an angle.
 * @param CANNON.Vec3 axis
 * @param float angle in radians
 */
CANNON.Quaternion.prototype.setFromAxisAngle = function(axis,angle){
    var s = Math.sin(angle*0.5);
    this._x = axis.x * s;
    this._y = axis.y * s;
    this._z = axis.z * s;
    this._w = Math.cos(angle*0.5);
};

// saves axis to targetAxis and returns 
CANNON.Quaternion.prototype.toAxisAngle = function(targetAxis){
    targetAxis = targetAxis || new CANNON.Vec3();
    this.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
    var angle = 2 * Math.acos(this._w);
    var s = Math.sqrt(1-this._w*this._w); // assuming quaternion normalised then w is less than 1, so term always positive.
    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
        // if s close to zero then direction of axis not important
        targetAxis.x = this._x; // if it is important that axis is normalised then replace with x=1; y=z=0;
        targetAxis.y = this._y;
        targetAxis.z = this._z;
    } else {
        targetAxis.x = this._x / s; // normalise axis
        targetAxis.y = this._y / s;
        targetAxis.z = this._z / s;
    }
    return [targetAxis,angle];
};

/**
 * @method setFromVectors
 * @memberof CANNON.Quaternion
 * @brief Set the quaternion value given two vectors. The resulting rotation will be the needed rotation to rotate u to v.
 * @param CANNON.Vec3 u
 * @param CANNON.Vec3 v
 */
CANNON.Quaternion.prototype.setFromVectors = function(u,v){
    var a = u.cross(v);
    this._x = a.x;
    this._y = a.y;
    this._z = a.z;
    this._w = Math.sqrt(Math.pow(u.norm(),2) * Math.pow(v.norm(),2)) + u.dot(v);
    this.normalize();
};

/**
 * @method mult
 * @memberof CANNON.Quaternion
 * @brief Quaternion multiplication
 * @param CANNON.Quaternion q
 * @param CANNON.Quaternion target Optional.
 * @return CANNON.Quaternion
 */
var Quaternion_mult_va = new CANNON.Vec3();
var Quaternion_mult_vb = new CANNON.Vec3();
var Quaternion_mult_vaxvb = new CANNON.Vec3();
CANNON.Quaternion.prototype.mult = function(q,target){
    target = target || new CANNON.Quaternion();
    var w = this._w,
        va = Quaternion_mult_va,
        vb = Quaternion_mult_vb,
        vaxvb = Quaternion_mult_vaxvb;

    va.set(this._x,this._y,this._z);
    vb.set(q.x,q.y,q.z);
    target.w = w*q.w - va.dot(vb);
    va.cross(vb,vaxvb);

    target.x = w * vb.x + q.w*va.x + vaxvb.x;
    target.y = w * vb.y + q.w*va.y + vaxvb.y;
    target.z = w * vb.z + q.w*va.z + vaxvb.z;

    return target;
};

/**
 * @method inverse
 * @memberof CANNON.Quaternion
 * @brief Get the inverse quaternion rotation.
 * @param CANNON.Quaternion target
 * @return CANNON.Quaternion
 */
CANNON.Quaternion.prototype.inverse = function(target){
    var x = this._x, y = this._y, z = this._z, w = this._w;
    target = target || new CANNON.Quaternion();

    this.conjugate(target);
    var inorm2 = 1/(x*x + y*y + z*z + w*w);
    target.x *= inorm2;
    target.y *= inorm2;
    target.z *= inorm2;
    target.w *= inorm2;

    return target;
};

/**
 * @method conjugate
 * @memberof CANNON.Quaternion
 * @brief Get the quaternion conjugate
 * @param CANNON.Quaternion target
 * @return CANNON.Quaternion
 */
CANNON.Quaternion.prototype.conjugate = function(target){
    target = target || new CANNON.Quaternion();

    target.x = -this._x;
    target.y = -this._y;
    target.z = -this._z;
    target.w = this._w;

    return target;
};

/**
 * @method normalize
 * @memberof CANNON.Quaternion
 * @brief Normalize the quaternion. Note that this changes the values of the quaternion.
 */
CANNON.Quaternion.prototype.normalize = function(){
    var l = Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w);
    if ( l === 0 ) {
        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._w = 0;
    } else {
        l = 1 / l;
        this._x *= l;
        this._y *= l;
        this._z *= l;
        this._w *= l;
    }
};

/**
 * @method normalizeFast
 * @memberof CANNON.Quaternion
 * @brief Approximation of quaternion normalization. Works best when quat is already almost-normalized.
 * @see http://jsperf.com/fast-quaternion-normalization
 * @author unphased, https://github.com/unphased
 */
CANNON.Quaternion.prototype.normalizeFast = function () {
    var f = (3.0-(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w))/2.0;
    if ( f === 0 ) {
        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._w = 0;
    } else {
        this._x *= f;
        this._y *= f;
        this._z *= f;
        this._w *= f;
    }
};

/**
 * @method vmult
 * @memberof CANNON.Quaternion
 * @brief Multiply the quaternion by a vector
 * @param CANNON.Vec3 v
 * @param CANNON.Vec3 target Optional
 * @return CANNON.Vec3
 */
CANNON.Quaternion.prototype.vmult = function(v,target){
    target = target || new CANNON.Vec3();
    if(this._w===0.0){
        target.x = v.x;
        target.y = v.y;
        target.z = v.z;
    } else {

        var x = v.x,
            y = v.y,
            z = v.z;

        var qx = this._x,
            qy = this._y,
            qz = this._z,
            qw = this._w;

        // q*v
        var ix =  qw * x + qy * z - qz * y,
        iy =  qw * y + qz * x - qx * z,
        iz =  qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

        target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    }

    return target;
};

/**
 * @method copy
 * @memberof CANNON.Quaternion
 * @param CANNON.Quaternion target
 */
CANNON.Quaternion.prototype.copy = function(target){
    target.x = this._x;
    target.y = this._y;
    target.z = this._z;
    target.w = this._w;
};

/**
 * @method toEuler
 * @memberof CANNON.Quaternion
 * @brief Convert the quaternion to euler angle representation. Order: YZX, as this page describes: http://www.euclideanspace.com/maths/standards/index.htm
 * @param CANNON.Vec3 target
 * @param string order Three-character string e.g. "YZX", which also is default.
 */
CANNON.Quaternion.prototype.toEuler = function(target,order){
    order = order || "YZX";

    var heading, attitude, bank;
    var x = this._x, y = this._y, z = this._z, w = this._w;

    switch(order){
    case "YZX":
        var test = x*y + z*w;
        if (test > 0.499) { // singularity at north pole
            heading = 2 * Math.atan2(x,w);
            attitude = Math.PI/2;
            bank = 0;
        }
        if (test < -0.499) { // singularity at south pole
            heading = -2 * Math.atan2(x,w);
            attitude = - Math.PI/2;
            bank = 0;
        }
        if(isNaN(heading)){
            var sqx = x*x;
            var sqy = y*y;
            var sqz = z*z;
            heading = Math.atan2(2*y*w - 2*x*z , 1 - 2*sqy - 2*sqz); // Heading
            attitude = Math.asin(2*test); // attitude
            bank = Math.atan2(2*x*w - 2*y*z , 1 - 2*sqx - 2*sqz); // bank
        }
        break;
    default:
        throw new Error("Euler order "+order+" not supported yet.");
    }

    target.y = heading;
    target.z = attitude;
    target.x = bank;
};
