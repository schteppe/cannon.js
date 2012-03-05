/**
 * Rigid body base class
 * @class RigidBody
 * @param mass
 * @param shape
 * @todo Motion state? Like dynamic, kinematic, static...
 * @todo Viscous damping property
 */
CANNON.RigidBody = function(mass,shape,material){
  // Local variables
  this._position = new CANNON.Vec3();
  this._velocity = new CANNON.Vec3();
  this._force = new CANNON.Vec3();
  this._tau = new CANNON.Vec3();
  this._quaternion = new CANNON.Quaternion(1,0,0,0);
  this._rotvelo = new CANNON.Vec3();
  this._mass = mass;
  this._shape = shape;
  this._inertia = shape.calculateLocalInertia(mass);
  this._material = material;
  this._linearDamping = 0.01;
  this._angularDamping = 0.01;

  /// Reference to the world the body is living in
  this._world = null;

  /// Equals -1 before added to the world. After adding, it is the world body index
  this._id = -1;
};

/**
 * Get or set linear damping on the body, a number between 0 and 1. If it is zero, no damping is done. If one, the body will not move.
 * @param float d Optional. If not provided, current damping is returned.
 * @return float
 */
CANNON.RigidBody.prototype.linearDamping = function(d){
  if(d==undefined)
    return this._linearDamping;
  else {
    d = Number(d);
    if(!isNaN(d) && d>=0.0 && d<=1.0)
      this._linearDamping = d;
    else
      throw "Damping must be a number between 0 and 1";
  }
};

/**
 * Get or set angular damping on the body, a number between 0 and 1. If it is zero, no damping is done. If one, the body will not move.
 * @param float d Optional. If not provided, current damping is returned.
 * @return float
 */
CANNON.RigidBody.prototype.angularDamping = function(d){
  if(d==undefined)
    return this._angularDamping;
  else {
    d = Number(d);
    if(!isNaN(d) && d>=0.0 && d<=1.0)
      this._angularDamping = d;
    else
      throw "Damping must be a number between 0 and 1";
  }
};

/**
 * Get/set mass. Note: When changing mass, you should change the inertia too.
 * @param float m
 * @return float
 */
CANNON.RigidBody.prototype.mass = function(m){
  if(m==undefined){
    // Get
    if(this._id!=-1)
      return this._world.mass[this._id];
    else
      return this._mass;
  } else {
    // Set
    if(this._id!=-1){
      this._world.mass[this._id] = m;
      this._world.invm[this._id] = 1.0/m;
    } else
      this._mass = m;
  }
};

/**
 * Get/set shape.
 * @param Shape s
 * @return Shape
 */
CANNON.RigidBody.prototype.shape = function(s){
  if(s==undefined){
    // Get
    return this._shape;
  } else {
    // Set
    this._shape = s;
    if(this._id!=-1){
      // @todo More things to update here when changing shape?
      this._world.type[this._id] = shape.type;
    }
  }
};

/**
 * Sets the center of mass position of the object
 * @param float x
 * @param float y
 * @param float z
 */
CANNON.RigidBody.prototype.setPosition = function(x,y,z){
  if(this._id!=-1){
    this._world.x[this._id] = x;
    this._world.y[this._id] = y;
    this._world.z[this._id] = z;
    this._world.clearCollisionState(this);
  } else {
    this._position.x = x;
    this._position.y = y;
    this._position.z = z;
  }
};

/**
 * Gets the center of mass position of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getPosition = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.x[this._id];
    target.y = this._world.y[this._id];
    target.z = this._world.z[this._id];
  } else {
    target.x = this._position.x;
    target.y = this._position.y;
    target.z = this._position.z;
  }
  return target;
};

/**
 * Sets the orientation of the object
 * @param float x
 * @param float y
 * @param float z
 * @param float w
 */
CANNON.RigidBody.prototype.setOrientation = function(x,y,z,w){
  var q = new CANNON.Quaternion(x,y,z,w);
  q.normalize();
  if(this._id!=-1){
    this._world.qx[this._id] = q.x;
    this._world.qy[this._id] = q.y;
    this._world.qz[this._id] = q.z;
    this._world.qw[this._id] = q.w;
  } else {
    this._quaternion.x = q.x;
    this._quaternion.y = q.y;
    this._quaternion.z = q.z;
    this._quaternion.w = q.w;
  }
};

/**
 * Gets the orientation of the object
 * @param Quaternion target Optional.
 * @return Quaternion
 */
CANNON.RigidBody.prototype.getOrientation = function(target){
  target = target || new CANNON.Quaternion();
  if(this._id!=-1){
    target.x = this._world.qx[this._id];
    target.y = this._world.qy[this._id];
    target.z = this._world.qz[this._id];
    target.w = this._world.qw[this._id];
  } else {
    target.x = this._quaternion.x;
    target.y = this._quaternion.y;
    target.z = this._quaternion.z;
    target.w = this._quaternion.w;
  }
  target.normalize();
  return target;
};

/**
 * Sets the velocity of the object
 */
CANNON.RigidBody.prototype.setVelocity = function(x,y,z){
  if(this._id!=-1){
    this._world.vx[this._id] = x;
    this._world.vy[this._id] = y;
    this._world.vz[this._id] = z;
  } else {
    this._velocity.x = x;
    this._velocity.y = y;
    this._velocity.z = z;
  }
};

/**
 * Gets the velocity of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getVelocity = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.x[this._id];
    target.y = this._world.y[this._id];
    target.z = this._world.z[this._id];
  } else {
    target.x = this._velocity.x;
    target.y = this._velocity.y;
    target.z = this._velocity.z;
  }
  return target;
};

/**
 * Sets the angularvelocity of the object
 */
CANNON.RigidBody.prototype.setAngularVelocity = function(x,y,z){
  if(this._id!=-1){
    this._world.wx[this._id] = x;
    this._world.wy[this._id] = y;
    this._world.wz[this._id] = z;
  } else {
    this._rotvelo.x = x;
    this._rotvelo.y = y;
    this._rotvelo.z = z;
  }
};

/**
 * Gets the angularvelocity of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getAngularvelocity = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.wx[this._id];
    target.y = this._world.wy[this._id];
    target.z = this._world.wz[this._id];
  } else {
    target.x = this._rotvelo.x;
    target.y = this._rotvelo.y;
    target.z = this._rotvelo.z;
  }
  return target;
};

/**
 * Sets the force on the object
 * @param float x
 * @param float y
 * @param float z
 */
CANNON.RigidBody.prototype.setForce = function(x,y,z){
  if(this._id!=-1){
    this._world.fx[this._id] = x;
    this._world.fy[this._id] = y;
    this._world.fz[this._id] = z;
  } else {
    this._force.x = x;
    this._force.y = y;
    this._force.z = z;
  }
};

/**
 * Gets the force of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getForce = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.fx[this._id];
    target.y = this._world.fy[this._id];
    target.z = this._world.fz[this._id];
  } else {
    target.x = this._force.x;
    target.y = this._force.y;
    target.z = this._force.z;
  }
  return target;
};

/**
 * Sets the torque on the object
 * @param float x
 * @param float y
 * @param float z
 */
CANNON.RigidBody.prototype.setTorque = function(x,y,z){
  if(this._id!=-1){
    this._world.taux[this._id] = x;
    this._world.tauy[this._id] = y;
    this._world.tauz[this._id] = z;
  } else {
    this._tau.x = x;
    this._tau.y = y;
    this._tau.z = z;
  }
};

/**
 * Gets the torque of the object
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.RigidBody.prototype.getTorque = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this._world.taux[this._id];
    target.y = this._world.tauy[this._id];
    target.z = this._world.tauz[this._id];
  } else {
    target.x = this._torque.x;
    target.y = this._torque.y;
    target.z = this._torque.z;
  }
  return target;
};