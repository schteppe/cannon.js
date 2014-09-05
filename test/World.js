var Vec3 = require("../src/math/Vec3");
var Mat3 = require("../src/math/Mat3");
var Quaternion = require("../src/math/Quaternion");
var Box = require('../src/shapes/Box');
var Body = require('../src/objects/Body');
var Sphere = require('../src/shapes/Sphere');
var World = require('../src/world/World');
var NaiveBroadphase = require('../src/collision/NaiveBroadphase');
var ArrayCollisionMatrix = require('../src/collision/ArrayCollisionMatrix');
var ObjectCollisionMatrix = require('../src/collision/ObjectCollisionMatrix');
var RaycastResult = require('../src/collision/RaycastResult');

module.exports = {

    rayTestBox: function(test){
        var world = new World();

        var body = new Body();
        body.addShape(new Box(new Vec3(1, 1, 1)));
        world.addBody(body);

        var from = new Vec3(-10, 0, 0);
        var to = new Vec3(10, 0, 0);

        var result = new RaycastResult();
        world.rayTest(from, to, result);

        test.equal(result.hasHit, true);

        test.done();
    },

    rayTestSphere: function(test){
        var world = new World();

        var body = new Body();
        body.addShape(new Sphere(1));
        world.addBody(body);

        var from = new Vec3(-10, 0, 0);
        var to = new Vec3(10, 0, 0);

        var result = new RaycastResult();
        world.rayTest(from, to, result);

        test.equal(result.hasHit, true);

        test.done();
    },

    collisionMatrix : function(test) {
        function testCollisionMatrix(CollisionMatrix) {
            var test_configs = [
                {
                    positions: [
                        [0,0,0],
                        [2,0,0],
                        [0,4,0],
                        [2,4,0],
                        [0,8,0],
                        [2,8,0]
                    ],
                    colliding: {
                        '0-1':true,
                        '2-3':true,
                        '4-5':true
                    }
                },
                {
                    positions: [
                        [0,0,0],
                        [0,4,0],
                        [0,8,0],
                        [2,0,0],
                        [2,4,0],
                        [2,8,0]
                    ],
                    colliding: {
                        '0-3':true,
                        '1-4':true,
                        '2-5':true
                    }
                },
                {
                    positions: [
                        [ 0, 0, 0],
                        [ 0, 1, 0],
                        [ 0,10, 0],
                        [ 0,20, 0],
                        [ 0,30, 0],
                        [ 0,40, 0],
                        [ 0,50, 0],
                        [ 0,51, 0]
                    ],
                    colliding: {
                        '0-1':true,
                        '6-7':true
                    }
                }
            ];

            for (var config_idx = 0 ; config_idx < test_configs.length; config_idx++) {
                var test_config = test_configs[config_idx];

                var world = new World();
                world.broadphase = new NaiveBroadphase();
                world.collisionMatrix = new CollisionMatrix();
                world.collisionMatrixPrevious = new CollisionMatrix();

                for (var position_idx = 0; position_idx < test_config.positions.length; position_idx++) {
                    var body = new Body({ mass: 1 });
                    body.addShape(new Sphere(1.1));
                    body.position.set.apply(body.position, test_config.positions[position_idx]);
                    world.add(body);
                }

                for (var step_idx = 0; step_idx < 2; step_idx++) {
                    world.step(0.1);
                    var is_first_step = (step_idx === 0);

                    for (var coll_i = 0; coll_i < world.bodies.length; coll_i++) {
                        for (var coll_j = coll_i + 1; coll_j < world.bodies.length; coll_j++) {
                            var is_colliding_pair = test_config.colliding[coll_i+'-'+coll_j] === true;
                            var expected = is_colliding_pair;
                            var is_colliding = is_first_step ?
                                    !!world.collisionMatrix.get(world.bodies[coll_i], world.bodies[coll_j]) :
                                    !!world.collisionMatrixPrevious.get(world.bodies[coll_i], world.bodies[coll_j]);
                            test.ok(is_colliding === expected,
                                    (expected ? "Should be colliding" : "Should not be colliding") +
                                        ': cfg=' + config_idx +
                                        ' is_first_step=' + is_first_step +
                                        ' is_colliding_pair=' + is_colliding_pair +
                                        ' expected=' + expected +
                                        ' is_colliding=' + is_colliding +
                                        ' i=' + coll_i +
                                        ' j=' + coll_j);
                        }
                    }
                }
            }
        }

        testCollisionMatrix(ArrayCollisionMatrix);
        testCollisionMatrix(ObjectCollisionMatrix);

        test.done();
    },


};
