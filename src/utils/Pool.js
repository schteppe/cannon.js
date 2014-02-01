module.exports = ObjectPool;

/**
 * For pooling objects that can be reused.
 * @class ObjectPool
 */
function ObjectPool(){
    this.objects = [];
    this.type = Object;
};

ObjectPool.prototype.release = function(){
    var Nargs = arguments.length;
    for(var i=0; i!==Nargs; i++){
        this.objects.push(arguments[i]);
    }
};

ObjectPool.prototype.get = function(){
    if(this.objects.length===0){
        return this.constructObject();
    } else {
        return this.objects.pop();
    }
};

ObjectPool.prototype.constructObject = function(){
    throw new Error("constructObject() not implemented in this ObjectPool subclass yet!");
};
