module.exports = MatN;

/**
 * Any matrix size class
 * @class MatN
 * @constructor
 * @author schteppe
 * @param {Number} cols
 * @param {Number} rows
 * @param {Array} elements
 */
function MatN(cols,rows,elements){
    /**
     * A vector containing all matrix elements
     * @property Float32Array elements
     */
    if(elements){
        this.elements = new Float32Array(elements);
    } else {
        this.elements = new Float32Array(cols*rows);
    }
};

/**
 * Sets the matrix to identity
 * @method identity
 * @todo Should perhaps be renamed to setIdentity() to be more clear.
 * @todo Create another function that immediately creates an identity matrix eg. eye()
 */
MatN.prototype.identity = function(){
    for(var i=0; i<this.cols; i++){
        for(var j=0; j<this.rows; j++){
            this.elements[0] = i===j ? 1 : 0;
        }
    }
};
