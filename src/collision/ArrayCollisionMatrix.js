/**
 * Collision "matrix". It's actually a triangular-shaped array of whether two bodies are touching this step, for reference next step
 * @class ArrayCollisionMatrix
 * @constructor
 */
CANNON.ArrayCollisionMatrix = function() {
	this.matrix = [];
};

CANNON.ArrayCollisionMatrix.prototype.get = function(i, j) {
	i = i.index;
	j = j.index;
    if (j > i) {
        var temp = j;
        j = i;
        i = temp;
    }
	return this.matrix[(i*(i + 1)>>1) + j-1];
};

CANNON.ArrayCollisionMatrix.prototype.set = function(i, j, value) {
	i = i.index;
	j = j.index;
    if (j > i) {
        var temp = j;
        j = i;
        i = temp;
    }
	this.matrix[(i*(i + 1)>>1) + j-1] = value ? 1 : 0;
};

CANNON.ArrayCollisionMatrix.prototype.reset = function() {
	for (var i=0, l=this.matrix.length; i!==l; i++) {
		this.matrix[i]=0;
	}
};

CANNON.ArrayCollisionMatrix.prototype.setNumObjects = function(n) {
	this.matrix.length = n*(n-1)>>1;
};
