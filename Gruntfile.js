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
                    }
                },

                files:[
                    {
                       expand: true,
                       type: 'js',
                       cwd: './src/',
                       dest: './build/zh-CN/',
                       src: ['**/*.js'],
                       filter: 'isFile'
                    },
                    {
                       expand: true,
                       type: 'css',
                       cwd: './src/',
                       dest: './build/zh-CN/',
                       src: ['**/*.css'],
                       filter: 'isFile'
                    },
                    {
                        expand: true,
                        type: 'tpl',
                        cwd: './src/',
                        dest: './build/zh-CN/',
                        src: ['**/*.tpl'],
                        filter: 'isFile'
                    },
                    {
                       expand: true,
                       type: 'default',
                       cwd: './src/',
                       dest: './build/zh-CN/',
                       src: ['**/*', '!**/*.{js,css,less,tpl}', '!**/changelog.inc'],
                       filter: 'isFile'
                    }
                ]
            }
        }
    });
    grunt.loadTasks('task');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.registerTask('default', ['clean', 'sc-compress']);
};
