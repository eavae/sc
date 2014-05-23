var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');


module.exports = function(grunt) {

    grunt.registerMultiTask('sc-checkphp', 'check php syntax error', function(){
        var files = this.files;
        var options = this.data.options;
        
        var includes = [];

        files.forEach(function(f){
            var src = f.src[0];
            includes.push('include("' + src + '");');
        });

        var php = '<?php\n' + includes.join('\n') + '\necho "check php ok";';

        var phpFilePath = __dirname + '/.temp-check-php.php';

        grunt.file.write(phpFilePath, php);

        var done = this.async();

        //var child = exec('php ' + phpFilePath, function(error, stdout, stderr){
        var child = exec('php ' + phpFilePath, function(error, stdout, stderr){
            grunt.file.delete(phpFilePath);

            if (error !== null) {
                grunt.log.writeln('php error: ' + stderr);
                grunt.fail.warn('php error: ' + error);
                done(false);
            }else{
                grunt.log.ok(stdout);
                done();
            }
        });
    });

};

