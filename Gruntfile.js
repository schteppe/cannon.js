var fs = require('fs')

module.exports = function(grunt) {

    var bundlePath = "build/cannon.js",
        minifiedBundlePath = "build/cannon.min.js";

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
                dest : bundlePath,
                options : {
                    bundleOptions: {
                        standalone : "CANNON"
                    }
                }
            }
        },

        uglify : {
            build : {
                src : [bundlePath],
                dest : minifiedBundlePath
            }
        },

        yuidoc: {
            compile: {
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version: '<%= pkg.version %>',
                url: '<%= pkg.homepage %>',
                options: {
                    outdir : "docs",
                    paths : ["./src/"],
                },
            }
        },

        nodeunit: {
            all: ['test/**/*.js'],
        },
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.registerTask('default', ['concat', 'browserify', 'uglify', 'addLicense']);
    grunt.registerTask('test', ['nodeunit']);

    grunt.registerTask('addLicense','Adds the LICENSE to the top of the built files',function(){
        var text = fs.readFileSync("LICENSE").toString();

        var dev = fs.readFileSync(bundlePath).toString();
        var min = fs.readFileSync(minifiedBundlePath).toString();

        fs.writeFileSync(bundlePath,text+"\n"+dev);
        fs.writeFileSync(minifiedBundlePath,text+"\n"+min);
    });
};
