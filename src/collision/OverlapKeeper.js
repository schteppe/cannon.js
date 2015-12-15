module.exports = OverlapKeeper;

/**
 * @class OverlapKeeper
 * @constructor
 */
function OverlapKeeper() {
    this.current = [];
    this.previous = [];
}

/**
 * Get the current state
 * @method get
 * @param  {Number} i
 * @param  {Number} j
 * @return {boolean}
 */
OverlapKeeper.prototype.get = function(i, j) {
    return this.current.indexOf(this.getKey(i, j)) !== -1;
};

OverlapKeeper.prototype.getPrevious = function(i, j) {
    return this.previous.indexOf(this.getKey(i, j)) !== -1;
};

OverlapKeeper.prototype.getKey = function(i, j) {
    if (j < i) {
        var temp = j;
        j = i;
        i = temp;
    }
    return (i << 16) | j;
};


/**
 * @method set
 * @param {Number} i
 * @param {Number} j
 */
OverlapKeeper.prototype.set = function(i, j) {
    // Insertion sort. This way the diff will have linear complexity.
    var key = this.getKey(i, j);
    var current = this.current;
    var index = 0;
    while(key > current[index]){
        index++;
    }
    if(key === current[index]){
        return; // Pair was already added
    }
    for(var j=current.length-1; j>=index; j--){
        current[j + 1] = current[j];
    }
    current[index] = key;
};

/**
 * @method tick
 */
OverlapKeeper.prototype.tick = function() {
    var tmp = this.current;
    this.current = this.previous;
    this.previous = tmp;
    this.current.length = 0;
};

function unpackAndPush(array, key){
    array.push((key & 0xFFFF0000) >> 16, key & 0x0000FFFF);
}

/**
 * @method getDiff
 * @param  {array} additions
 * @param  {array} removals
 */
OverlapKeeper.prototype.getDiff = function(additions, removals) {
    var i=0, j=0;
    var a = this.current;
    var b = this.previous;
    var al = a.length;
    var bl = b.length;
    while(i < al && j < bl){
        var iKey = a[i];
        var jKey = b[j];
        if(iKey < jKey){
            unpackAndPush(removals, jKey);
            i++;
        } else if(iKey === jKey){
            i++;
            j++;
        } else {
            unpackAndPush(additions, iKey);
            j++;
        }
    }
    for(var k=i; k<al; k++){
        unpackAndPush(additions, a[k]);
    }
    for(var k=j; k<bl; k++){
        unpackAndPush(removals, b[k]);
    }
};