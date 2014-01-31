/**
 * Records what objects are colliding with each other
 * @class ObjectCollisionMatrix
 * @constructor
 */
CANNON.ObjectCollisionMatrix = function() {
	this.matrix = {};
};

CANNON.ObjectCollisionMatrix.prototype.get = function(i, j) {
	i = i.id;
	j = j.id;
    if (j > i) {
        var temp = j;
        j = i;
        i = temp;
    }
	return i+'-'+j in this.matrix;
};

CANNON.ObjectCollisionMatrix.prototype.set = function(i, j, value) {
	i = i.id;
	j = j.id;
    if (j > i) {
        var temp = j;
        j = i;
        i = temp;
	}
	if (value) {
		this.matrix[i+'-'+j] = true;
	}
	else {
		delete this.matrix[i+'-'+j];
	}
};

CANNON.ObjectCollisionMatrix.prototype.reset = function() {
	this.matrix = {};
};

CANNON.ObjectCollisionMatrix.prototype.setNumObjects = function(n) {
};
