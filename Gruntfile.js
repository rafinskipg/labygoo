// Generated on 2013-10-18 using generator-angular 0.4.0
'use strict';
var LIVERELOAD_PORT = 35729;

var mountFolder = function(connect, dir) {
    return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);


    // configurable paths
    var config = {
        app: 'app'
    };


    grunt.initConfig({
        app: config,
        watch: {
            compass: {
                files: ['{,**/}**.{scss,sass}'],
                tasks: ['compass:server', 'autoprefixer']
              },
            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    '{,**/}**.html',
                    '<%= app.app %>/styles/{,**/}**.css'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                open: 'index.html',
                livereload: LIVERELOAD_PORT
            },
            app: {
                options: {
                  open: true,
                  base: [
                    '<%= app.app %>'
                  ]
                }
              },
            app2: {
                options: {
                  open: true,
                  base: [
                    'app_state_machine'
                  ]
                }
              }
              
        },
        compass: {
              options: {
                sassDir: 'sass',
                cssDir: 'styles',
                generatedImagesDir: 'images/generated',
                imagesDir: 'images',
                javascriptsDir: 'javascript',
                fontsDir: 'fonts',
                importPath: 'bower_components',
                httpImagesPath: 'images',
                httpGeneratedImagesPath: '/images/generated',
                httpFontsPath: 'fonts',
                relativeAssets: false
              },
              dist: {},
              server: {
                options: {
                  debugInfo: true
                }
              }
            },
         autoprefixer: {
              options: ['last 1 version'],
              dist: {
                files: [{
                  expand: true,
                  cwd: 'styles/',
                  src: '{,*/}*.css',
                  dest: 'styles/'
                }]
              }
            },
    });


    grunt.registerTask('server', [
        'connect:app',
        'watch'
    ]);
    grunt.registerTask('server2', [
        'connect:app2',
        'watch'
    ]);

    grunt.registerTask('default', [
        'server'
    ]);
};