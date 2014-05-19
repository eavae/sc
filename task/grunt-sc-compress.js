var fs = require('fs');

var 

module.exports = function(grunt) {

    grunt.registerMultiTask('sc-compress', 'compress js and css', function(){
        var files = this.files;
        this.files.forEach(function(f){
            if(f.type == 'js'){
                    
            }
            else if(f.type == 'css'){
            
            }
            else if(f.type == 'tpl'){
                
            }
        });
        var done = this.async();
    });

};
