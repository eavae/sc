var fs = require('fs');

var uglify = require('uglify-js');
var CleanCSS = require('clean-css');
var less = require('less');
var tplParser = require('../sc/simple_template_parser');

//debugger;


module.exports = function(grunt) {

    var createError = function(e, src, message, lineInCode){
        var err = new Error(message);
        if (e.message) {
            err.message += '\n' + e.message + '. \n';
            if (e.line) {
                err.message += 'Line ' + (e.line + (lineInCode || 0)) 
                + ' in ' + src + '\n';
            }
        }
        err.origError = e;
        return err;
    };

    var compressJs = function(js){
        var code = '';
        var ast = uglify.parse(js);
        ast.figure_out_scope();
        var compressor = uglify.Compressor({});
        ast = ast.transform(compressor);
        code = ast.print_to_string(); 
        return code;
    };

    var compressTpl = function(f){
        var src = f.src[0], dest = f.dest;
        var source = grunt.file.read(src);
        var tokens = tplParser.parse(source);
        var result = [];
        tokens.forEach(function(token){
            if(token.type === 'HTML_SCRIPT_CONTENT') {
                var js = token.text;
                try{
                    js = compressJs(js);
                    console.log(js);
                } catch(e) {
                    var err = createError(e, src, 'Compress tpl error', token.line);
                    grunt.log.warn('compress js in ' + src + ' failed.');
                    grunt.fail.warn(err);
                }
                result.push(js);
            }
            else if(token.type === 'HTML_STYLE_CONTENT') {
                var css = token.text.replace(/\{%[\w\W]*?%\}/g, '');
                try {
                    css = new CleanCSS().minify(css);    
                } catch(e) {
                    console.log(css);
                    var err = createError(e, src, 'Compress tpl failed');
                    grunt.log.warn('compress css in ' + src + ' failed.');
                    grunt.fail.warn(err);
                }
                result.push(css);
            }
            else{
                result.push(token.text);
            }
        });
        grunt.file.write(dest, result.join(''));
        grunt.log.ok('compress tpl ok: ' + dest);
    };

    grunt.registerMultiTask('sc-compress', 'compress js and css', function(){
        var files = this.files.slice(0,10);
        files.forEach(function(f){
            var src = f.src[0], dest = f.dest;
            if(f.type == 'js'){
                try {
                    var result = uglify.minify(src, dest, {});
                    grunt.log.ok('compress js ok: ' + dest);
                } catch(e) {
                    var err = createError(e, src, 'Compress js failed');
                    grunt.log.warn('compress js ' + src + ' failed.');
                    grunt.fail.warn(err);
                }
            }
            else if(f.type == 'css'){
                var source = grunt.file.read(src);
                try {
                    var minimized = new CleanCSS().minify(source);
                    grunt.file.write(dest, minimized);
                    grunt.log.ok('compress css ok: ' + dest);
                } catch(e) {
                    var err = createError(e, src, 'Compress css failed');
                    grunt.log.warn('compress css ' + src + ' failed.');
                    grunt.fail.warn(err);
                }
            }
            else if(f.type == 'less'){
                var source = grunt.file.read(src);
                less.render(source, function(e, css){
                    if (e) {
                        var err = createError(e, src, 'Less file failed');
                        grunt.log.warn('less ' + src + ' failed.');
                        grunt.fail.warn(err);
                    }
                    else {
                        grunt.file.write(dest, css);
                        grunt.log.ok('compress less ok: ' + dest);
                    }
                });
            }
            else if(f.type == 'tpl'){
                compressTpl(f);
            }
            else {
                grunt.file.copy(src, dest);
                grunt.log.ok('compress default ok: ' + dest);
            }
        });
    });

};
