var Constraint = require('../src/constraints/Constraint');
var Equation = require('../src/equations/Equation');
var Body = require('../src/objects/Body');

module.exports = {
    construct: function(test){
        var bodyA = new Body();
        var bodyB = new Body();
        new Constraint(bodyA, bodyB);
        test.done();
    },

    enable: function(test){
        var bodyA = new Body();
        var bodyB = new Body();
        var c = new Constraint(bodyA, bodyB);
        var eq = new Equation(bodyA, bodyB);
        c.equations.push(eq);

        c.enable();
        test.ok(eq.enabled);

        c.disable();
        test.ok(!eq.enabled);

        test.done();
    }
};

