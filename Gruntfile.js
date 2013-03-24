module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: '\n\n'
            },
            cannon : {
                src:   [// Wrapper start
                        "LICENSE",
                        "src/wrapper/Start.js",
                        "src/Cannon.js",

                        // Math
                        "src/math/Mat3.js",
                        "src/math/Vec3.js",
                        "src/math/Quaternion.js",

                        // Utils
                        "src/utils/EventTarget.js",
                        "src/utils/Pool.js",
                        "src/utils/Vec3Pool.js",

                        // Objects
                        "src/objects/Shape.js",
                        "src/objects/Body.js",
                        "src/objects/Particle.js",
                        "src/objects/RigidBody.js",
                        "src/objects/Sphere.js",
                        "src/objects/SPHSystem.js",
                        "src/objects/Box.js",
                        "src/objects/Plane.js",
                        "src/objects/Compound.js",
                        "src/objects/ConvexPolyhedron.js",
                        "src/objects/Cylinder.js",

                        // Collision
                        "src/collision/Ray.js",
                        "src/collision/Broadphase.js",
                        "src/collision/NaiveBroadphase.js",
                        "src/collision/GridBroadphase.js",

                        // Solver
                        "src/solver/Solver.js",
                        "src/solver/GSSolver.js",
                        "src/solver/SplitSolver.js",

                        // Material
                        "src/material/Material.js",
                        "src/material/ContactMaterial.js",

                        // World
                        "src/world/World.js",
                        "src/world/ContactGenerator.js",

                        // Constraints
                        "src/constraints/Equation.js",
                        "src/constraints/ContactEquation.js",
                        "src/constraints/FrictionEquation.js",
                        "src/constraints/RotationalEquation.js",
                        "src/constraints/Constraint.js",
                        "src/constraints/DistanceConstraint.js",
                        "src/constraints/RotationalMotorEquation.js",
                        "src/constraints/HingeConstraint.js",
                        "src/constraints/PointToPointConstraint.js",

                        // Wrapper end
                        "src/wrapper/End.js",
                ],
                dest: 'build/cannon.js'
            },

            demo : {
                src: ['src/demo/Demo.js'],
                dest: 'build/cannon.demo.js'
            },
        },

        uglify : {
            build : {
                src : ['build/cannon.js'],
                dest : 'build/cannon.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', ['concat:cannon', 'concat:demo', 'uglify']);

};
