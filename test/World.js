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

    clearForces: function(test){
        var world = new World();
        var body = new Body();
        world.addBody(body);
        body.force.set(1,2,3);
        body.torque.set(4,5,6);

        world.clearForces();

        test.ok(body.force.almostEquals(new Vec3(0,0,0)));
        test.ok(body.torque.almostEquals(new Vec3(0,0,0)));

        test.done();
    },

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

    raycastClosest: {
        single: function(test){
            var world = new World();
            var body = new Body({
                shape: new Sphere(1)
            });
            world.addBody(body);

            var from = new Vec3(-10, 0, 0);
            var to = new Vec3(10, 0, 0);

            var result = new RaycastResult();
            world.raycastClosest(from, to, {}, result);

            test.equal(result.hasHit, true);
            test.equal(result.body, body);
            test.equal(result.shape, body.shapes[0]);

            test.done();
        },

        order: function(test){
            var world = new World();
            var bodyA = new Body({ shape: new Sphere(1), position: new Vec3(-1,0,0) });
            var bodyB = new Body({ shape: new Sphere(1), position: new Vec3(1,0,0) });
            world.addBody(bodyA);
            world.addBody(bodyB);

            var from = new Vec3(-10, 0, 0);
            var to = new Vec3(10, 0, 0);

            var result = new RaycastResult();
            world.raycastClosest(from, to, {}, result);

            test.equal(result.hasHit, true);
            test.equal(result.body, bodyA);
            test.equal(result.shape, bodyA.shapes[0]);

            from.set(10, 0, 0);
            to.set(-10, 0, 0);

            result = new RaycastResult();
            world.raycastClosest(from, to, {}, result);

            test.equal(result.hasHit, true);
            test.equal(result.body, bodyB);
            test.equal(result.shape, bodyB.shapes[0]);

            test.done();
        }
    },

    raycastAll: {
        simple: function(test){
            var world = new World();
            var body = new Body({ shape: new Sphere(1) });
            world.addBody(body);

            var from = new Vec3(-10, 0, 0);
            var to = new Vec3(10, 0, 0);

            var hasHit;
            var numResults=0;
            var resultBody;
            var resultShape;

            var returnVal = world.raycastAll(from, to, {}, function (result){
                hasHit = result.hasHit;
                resultShape = result.shape;
                resultBody = result.body;
                numResults++;
            });

            test.equal(returnVal, true, 'should return true on hit');
            test.equal(hasHit, true);
            test.equal(resultBody, body);
            test.equal(numResults, 2);
            test.equal(resultShape, resultBody.shapes[0]);

            test.done();
        },

        twoSpheres: function(test){

            var world = new World();
            var body = new Body({ shape: new Sphere(1) });
            world.addBody(body);

            var body2 = new Body({ shape: new Sphere(1) });
            world.addBody(body2);

            var from = new Vec3(-10, 0, 0);
            var to = new Vec3(10, 0, 0);

            var hasHit = false;
            var numResults = 0;
            var resultBody;
            var resultShape;

            world.raycastAll(from, to, {}, function (result){
                hasHit = result.hasHit;
                resultShape = result.shape;
                resultBody = result.body;
                numResults++;
            });

            test.equal(hasHit, true);
            test.equal(numResults, 4);

            test.done();
        },

        skipBackFaces: function(test){
            var world = new World();
            var body = new Body({ shape: new Sphere(1) });
            world.addBody(body);

            var hasHit = false;
            var numResults = 0;
            var resultBody;
            var resultShape;

            world.raycastAll(new Vec3(-10, 0, 0), new Vec3(10, 0, 0), { skipBackfaces: true }, function (result){
                hasHit = result.hasHit;
                resultShape = result.shape;
                resultBody = result.body;
                numResults++;
            });

            test.equal(hasHit, true);
            test.equal(numResults, 1);

            test.done();
        },

        collisionFilters: function(test){
            var world = new World();
            var body = new Body({
                shape: new Sphere(1)
            });
            world.addBody(body);
            body.collisionFilterGroup = 2;
            body.collisionFilterMask = 2;

            var numResults = 0;

            world.raycastAll(new Vec3(-10, 0, 0), new Vec3(10, 0, 0), {
                collisionFilterGroup: 2,
                collisionFilterMask: 2
            }, function (result){
                numResults++;
            });

            test.equal(numResults, 2);

            numResults = 0;

            world.raycastAll(new Vec3(-10, 0, 0), new Vec3(10, 0, 0), {
                collisionFilterGroup: 1,
                collisionFilterMask: 1
            }, function (result){
                numResults++;
            });

            test.equal(numResults, 0, 'should use collision groups!');

            test.done();
        }
    },

    raycastAny: function(test){
        var world = new World();
        world.addBody(new Body({ shape: new Sphere(1) }));

        var from = new Vec3(-10, 0, 0);
        var to = new Vec3(10, 0, 0);

        var result = new RaycastResult();
        world.raycastAny(from, to, {}, result);

        test.ok(result.hasHit);

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
                    world.addBody(body);
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
