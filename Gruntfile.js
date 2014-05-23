module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>',

        clean: {
            output: 'build'
        },

        mkdirs: {
            output: 'output'
        },

        'sc-checkphp': {
            checkresphp: {
                files: [
                    {
                      expand: true,
                      cwd: './build/',
                      src: ['**/res.php'],
                      filter: 'isFile'
                    }
                ]
            }
        },

        'sc-compress': {
            build: {
                options: {
                    js: {
                        unused : false,
                        side_effects: false,
                        comparisons: false,
                        conditionals: false,
                        dead_code: false,
                        booleans: false
                    },
                    tpl: {
                        mergeJs: true,
                        mergeCss: true,
                        compressJs: true,
                        compressCss: true,
                    }
                },

                files:[
                    {
                      expand: true,
                      type: 'js',
                      cwd: './src/',
                      src: ['**/*.js'],
                      dest: './build/zh-CN/',
                      filter: 'isFile'
                    },
                    {
                      expand: true,
                      type: 'css',
                      cwd: './src/',
                      src: ['**/*.css'],
                      dest: './build/zh-CN/',
                      filter: 'isFile'
                    },
                    {
                        expand: true,
                        type: 'tpl',
                        cwd: './src/',
                        src: ['**/*.tpl'],
                        dest: './build/zh-CN/',
                        filter: 'isFile'
                    },
                    {
                      expand: true,
                      type: 'default',
                      cwd: './src/',
                      src: ['**/*', '!**/*.{js,css,less,tpl}', '!**/changelog.inc'],
                      dest: './build/zh-CN/',
                      filter: 'isFile'
                    }
                ]
            }
        }
    });

    var startTime = new Date();
    grunt.registerTask('time', function(){
        var d = new Date();
        var s = ((d - startTime) / 1000).toFixed(2) + 's';
        grunt.log.writeln('total: ' + s);
    });

    grunt.loadTasks('sc/task');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['clean', 'sc-compress', 'time']);
    grunt.registerTask('php', ['sc-checkphp', 'time']);
    grunt.registerTask('all', ['default', 'sc-checkphp', 'time']);
};
