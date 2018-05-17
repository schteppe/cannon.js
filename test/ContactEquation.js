var Body = require('../src/objects/Body');
var Vec3 = require('../src/math/Vec3');
var ContactEquation = require('../src/equations/ContactEquation');

exports.construct = function(test){
    var bodyA = new Body();
    var bodyB = new Body();
    new ContactEquation(bodyA, bodyB);
    test.done();
};

exports.getImpactVelocityAlongNormal = function(test){
    var bodyA = new Body({
        position: new Vec3(1,0,0),
        velocity: new Vec3(-10,0,0)
    });
    var bodyB = new Body({
        position: new Vec3(-1,0,0),
        velocity: new Vec3(1,0,0)
    });
    var contact = new ContactEquation(bodyA, bodyB);
    contact.ni.set(1,0,0);
    contact.ri.set(-1,0,0);
    contact.rj.set(1,0,0);
    var v = contact.getImpactVelocityAlongNormal();
    test.equal(v, -11);
    test.done();
};
