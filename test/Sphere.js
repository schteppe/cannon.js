var Sphere = require('../src/shapes/Sphere');

module.exports = {
    throwOnWrongRadius : function(test){

        // These should be all right
        new Sphere(1);
        new Sphere(0);

        test.throws(function () {
            new Sphere(-1);
        }, Error, 'Should throw on negative radius');

        test.done();
    }
};
