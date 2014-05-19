module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>',

        clean: {
            output: 'output'
        },

        mkdirs: {
            output: 'output'
        },

        'sc-compress': {
            build: {
                options: {

                },

                files:[
                    {
                        expand: true,
                        type: 'js',
                        cwd: './src/',
                        dest: './build/zh-CN/',
                        src: ['**/*.js']
                    },
                    {
                        expand: true,
                        type: 'css',
                        cwd: './src/',
                        dest: './build/zh-CN/',
                        src: ['**/*.css']
                    },
                    {
                        expand: true,
                        type: 'tpl',
                        cwd: './src/',
                        dest: './build/zh-CN/',
                        src: ['**/*.tpl']
                    }
                ]
            }
        }
    });
    grunt.loadTasks('task');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.registerTask('default', ['sc-compress']);
};
