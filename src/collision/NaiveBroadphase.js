/**
 * @class CANNON.NaiveBroadphase
 * @brief Naive broadphase implementation, used in lack of better ones.
 * @description The naive broadphase looks at all possible pairs without restriction, therefore it has complexity N^2 (which is bad)
 * @extends CANNON.Broadphase
 */
CANNON.NaiveBroadphase = function(){
    CANNON.Broadphase.apply(this);
};
CANNON.NaiveBroadphase.prototype = new CANNON.Broadphase();
CANNON.NaiveBroadphase.prototype.constructor = CANNON.NaiveBroadphase;

/**
 * @method collisionPairs
 * @memberof CANNON.NaiveBroadphase
 * @brief Get all the collision pairs in the physics world
 * @param CANNON.World world
 * @param Array pairs1
 * @param Array pairs2
 */
CANNON.NaiveBroadphase.prototype.collisionPairs = function(world,pairs1,pairs2){
    var bodies = world.bodies,
        n = bodies.length,
        i,j,bi,bj;

    // Naive N^2 ftw!
    for(i=0; i!==n; i++){
        for(j=0; j!==i; j++){

            bi = bodies[i];
            bj = bodies[j];

            if(!this.needBroadphaseCollision(bi,bj)){
                continue;
            }

            this.intersectionTest(bi,bj,pairs1,pairs2);
        }
    }
};
