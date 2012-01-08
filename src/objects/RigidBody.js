/**
 * Rigid body base class
 * @class RigidBody
 * @param type
 */
CANNON.RigidBody = function(type){
  this.type = type;
  this._position = new CANNON.Vec3();
  this.velocity = new CANNON.Vec3();
  this.force = new CANNON.Vec3();
  this.tau = new CANNON.Vec3();
  this.quaternion = new CANNON.Quaternion();
  this.rotvelo = new CANNON.Vec3();
  this.mass = 1.0;
  this.geodata = {};
  this.world = null;
  this.inertia = new CANNON.Vec3(1,1,1);

  /**
   * Equals -1 before added to the world. After adding, it is the world index
   */
  this._id = -1;
};

/**
 * Sets the center of mass position of the object
 */
CANNON.RigidBody.prototype.setPosition = function(x,y,z){
  if(this._id!=-1){
    this.world.x[this._id] = x;
    this.world.y[this._id] = y;
    this.world.z[this._id] = z;
  } else {
    this._position.x = x;
    this._position.y = y;
    this._position.z = z;
  }
};

/**
 * Sets the center of mass position of the object
 */
CANNON.RigidBody.prototype.getPosition = function(target){
  target = target || new CANNON.Vec3();
  if(this._id!=-1){
    target.x = this.world.x[this._id];
    target.y = this.world.y[this._id];
    target.z = this.world.z[this._id];
  } else {
    target.x = this._position.x;
    target.y = this._position.y;
    target.z = this._position.z;
  }
  return target;
};

/**
 * Enum for object types
 */
CANNON.RigidBody.prototype.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4
};
