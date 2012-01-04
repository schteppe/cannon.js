/**
 * Produce a 3x3 matrix. Columns first!
 * @class Mat3
 * @param elements
 */
PHYSICS.Mat3 = function(elements){
  if(elements)
    this.elements = new Float32Array(elements);
  else
    this.elements = new Float32Array(9);
};

/**
 * Sets the matrix to identity
 * @todo Should perhaps be renamed to setIdentity() to be more clear.
 * @todo Create another function that immediately creates an identity matrix eg. eye()
 */
PHYSICS.Mat3.prototype.identity = function(){
  this.elements[0] = 1;
  this.elements[1] = 0;
  this.elements[2] = 0;

  this.elements[3] = 0;
  this.elements[4] = 1;
  this.elements[5] = 0;

  this.elements[6] = 0;
  this.elements[7] = 0;
  this.elements[8] = 1;
};

/**
 * Matrix-Vector multiplication
 * @param Vec3 v The vector to multiply with
 * @param Vec3 target Optional, target to save the result in.
 */
PHYSICS.Mat3.prototype.vmult = function(v,target){
  if(target===undefined)
    target = new PHYSICS.Vec3();

  var vec = [v.x, v.y, v.z];
  var targetvec = [0, 0, 0];
  for(var i=0; i<3; i++)
    for(var j=0; j<3; j++)
      targetvec[i] += this.elements[i+3*j]*vec[i];

  target.x = targetvec[0];
  target.y = targetvec[1];
  target.z = targetvec[2];
  return target;
};

/**
 * Matrix-scalar multiplication
 * @param float s
 */
PHYSICS.Mat3.prototype.smult = function(s){
  for(var i=0; i<this.elements.length; i++)
    this.elements[i] *= s;
};

/**
 * Matrix multiplication
 * @param Mat3 m
 * @return Mat3
 */
PHYSICS.Mat3.prototype.mmult = function(m){
  var r = new PHYSICS.Mat3();
  for(var i=0; i<3; i++)
    for(var j=0; j<3; j++){
      var sum = 0.0;
      for(var k=0; k<3; k++)
	sum += this.elements[i+k] * m.elements[k+j*3];
      r.elements[i+j*3] = sum; 
    }
  return r;
};

/**
 * Solve Ax=b
 * @return Vec3 The solution x
 */
PHYSICS.Mat3.prototype.solve = function(b){
  var equations = $M([
		      [ this.elements[0], this.elements[1], this.elements[2],  b.x],
		      [ this.elements[3], this.elements[4], this.elements[5],  b.y],
		      [ this.elements[6], this.elements[7], this.elements[8],  b.z]
		      ]);
  
  var eqns = equations.toRightTriangular();
  
  var sol_z = eqns.e(3,4) / eqns.e(3,3);
  var sol_y = (eqns.e(2,4) - eqns.e(2,3)*sol_z) / eqns.e(2,2);
  var sol_x = (eqns.e(1,4) - eqns.e(1,3)*sol_z - eqns.e(1,2)*sol_y) / eqns.e(1,1);
  return new PHYSICS.Vec3(sol_x,
			  sol_y,
			  sol_z);
};
