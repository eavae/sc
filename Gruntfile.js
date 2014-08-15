module.exports = function(grunt) {

    var path = grunt.option('path') || '.';
    var srcpath = '**/';
    if(grunt.option('template')){
      srcpath = '**/' + grunt.option('template') + '/';
    }
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
                      cwd: path + '/build/',
                      src: [srcpath+'res.php'],
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
                      cwd: path + '/src/',
                      src: [srcpath+'*.js'],
                      dest: path + '/build/zh-CN/',
                      filter: 'isFile'
                    },
                    {
                      expand: true,
                      type: 'css',
                      cwd: path + '/src/',
                      src: [srcpath+'*.css'],
                      dest: path + '/build/zh-CN/',
                      filter: 'isFile'
                    },
                    {
                        expand: true,
                        type: 'tpl',
                        cwd: path + '/src/',
                        src: [srcpath+'*.tpl'],
                        dest: path + '/build/zh-CN/',
                        filter: 'isFile'
                    },
                    {
                      expand: true,
                      type: 'default',
                      cwd: path + '/src/',
                      src: [srcpath+'*', '!'+srcpath+'*.{js,css,less,tpl}', '!'+srcpath+'changelog.inc'],
                      dest: path + '/build/zh-CN/',
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
    grunt.registerTask('single', ['sc-compress', 'sc-checkphp', 'time']);
};
