/*global CANNON:true */

/**
 * @class CANNON.MatN
 * @brief Any matrix size class
 * @author schteppe
 * @param int cols
 * @param int rows
 * @param array elements
 */
CANNON.MatN = function(cols,rows,elements){
    /**
    * @property Float32Array elements
    * @memberof CANNON.MatN
    * @brief A vector containing all matrix elements
    */
    if(elements)
        this.elements = new Float32Array(elements);
    else
        this.elements = new Float32Array(cols*rows);
};

/**
 * @method identity
 * @memberof CANNON.MatN
 * @brief Sets the matrix to identity
 * @todo Should perhaps be renamed to setIdentity() to be more clear.
 * @todo Create another function that immediately creates an identity matrix eg. eye()
 */
CANNON.MatN.prototype.identity = function(){
    for(var i=0; i<this.cols; i++)
        for(var j=0; j<this.rows; j++)
            this.elements[0] = i==j ? 1 : 0;
};
