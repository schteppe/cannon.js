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
    this.x = x!==undefined ? x : 0;
    /**
    * @property float y
    * @memberof CANNON.Quaternion
    */
    this.y = y!==undefined ? y : 0;
    /**
    * @property float z
    * @memberof CANNON.Quaternion
    */
    this.z = z!==undefined ? z : 0;
    /**
    * @property float w
    * @memberof CANNON.Quaternion
    * @brief The multiplier of the real quaternion basis vector.
    */
    this.w = w!==undefined ? w : 1;
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
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
};

/**
 * @method toString
 * @memberof CANNON.Quaternion
 * @brief Convert to a readable format
 * @return string
 */
CANNON.Quaternion.prototype.toString = function(){
    return this.x+","+this.y+","+this.z+","+this.w;
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
    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(angle*0.5);
};

// saves axis to targetAxis and returns 
CANNON.Quaternion.prototype.toAxisAngle = function(targetAxis){
    targetAxis = targetAxis || new CANNON.Vec3();
    this.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
    var angle = 2 * Math.acos(this.w);
    var s = Math.sqrt(1-this.w*this.w); // assuming quaternion normalised then w is less than 1, so term always positive.
    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
        // if s close to zero then direction of axis not important
        targetAxis.x = this.x; // if it is important that axis is normalised then replace with x=1; y=z=0;
        targetAxis.y = this.y;
        targetAxis.z = this.z;
    } else {
        targetAxis.x = this.x / s; // normalise axis
        targetAxis.y = this.y / s;
        targetAxis.z = this.z / s;
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
    this.x = a.x;
    this.y = a.y;
    this.z = a.z;
    this.w = Math.sqrt(Math.pow(u.norm(),2) * Math.pow(v.norm(),2)) + u.dot(v);
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
    var w = this.w,
        va = Quaternion_mult_va,
        vb = Quaternion_mult_vb,
        vaxvb = Quaternion_mult_vaxvb;

    va.set(this.x,this.y,this.z);
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
    var x = this.x, y = this.y, z = this.z, w = this.w;
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

    target.x = -this.x;
    target.y = -this.y;
    target.z = -this.z;
    target.w = this.w;

    return target;
};

/**
 * @method normalize
 * @memberof CANNON.Quaternion
 * @brief Normalize the quaternion. Note that this changes the values of the quaternion.
 */
CANNON.Quaternion.prototype.normalize = function(){
    var l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);
    if ( l === 0 ) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
    } else {
        l = 1 / l;
        this.x *= l;
        this.y *= l;
        this.z *= l;
        this.w *= l;
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
    var f = (3.0-(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w))/2.0;
    if ( f === 0 ) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
    } else {
        this.x *= f;
        this.y *= f;
        this.z *= f;
        this.w *= f;
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
    if(this.w===0.0){
        target.x = v.x;
        target.y = v.y;
        target.z = v.z;
    } else {

        var x = v.x,
            y = v.y,
            z = v.z;

        var qx = this.x,
            qy = this.y,
            qz = this.z,
            qw = this.w;

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
    target.x = this.x;
    target.y = this.y;
    target.z = this.z;
    target.w = this.w;
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
    var x = this.x, y = this.y, z = this.z, w = this.w;

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