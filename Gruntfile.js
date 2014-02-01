module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: '\n\n'
            },

            demo : {
                src: ['src/demo/Demo.js'],
                dest: 'build/cannon.demo.js'
            },
        },

        browserify : {
            cannon : {
                src : ["src/Cannon.js"],
                dest : 'build/cannon.js',
                options : {
                    standalone : "CANNON"
                }
            }
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
    grunt.loadNpmTasks('grunt-browserify');
    grunt.registerTask('default', ['concat', 'browserify', 'uglify']);

};
