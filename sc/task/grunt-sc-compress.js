var fs = require('fs');
var path = require('path');

var uglify = require('uglify-js');
var CleanCSS = require('clean-css');
var less = require('less');
var tplParser = require('../simple_template_parser');

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

    /**
     * 压缩js
     */
    var compressJs = function(js, options){
        var code = '';
        var ast = uglify.parse(js);
        ast.figure_out_scope();
        var compressor = uglify.Compressor(options);
        ast = ast.transform(compressor);
        code = ast.print_to_string(); 
        return code;
    };

    /**
     * 获取html标签属性的映射map
     */
    var getAttrMap = function(token){
        var map = {}, key, attrTokens = token.attrTokens || [];
        attrTokens.forEach(function(t){
            if(t.type === 'HTML_ATTR_NAME') {
                map[t.text] = null;
                key = t.text;
            }
            else if(t.type === 'HTML_ATTR_VALUE') {
                map[key] = t.text;
            }
        });
        return map;
    };

    /**
     * 去除css中的css ui组件，并返回干净的css文本和ui列表
     */
    var processCssUI = function(css){
        var uis = [];
        var re = /\{%fe_fn_c_css\s+css\s*=('|")\w+('|")\s*%\}/g;
        var reUI = /('|")(\w+)('|")/;
        var list = css.match(re);
        if(list && list.length) {
            list.forEach(function(s){
                var name = reUI.exec(s)[2];
                uis.push(name);
            });
        }
        css = css.replace(re, '');
        var result = {
            'uis' : uis,
            'css' : css
        };
        return result;
    };

    /**
     * 检查字符串中是否包含smarty语句
     */
    var hasSmarty = function(text){
        return text.indexOf('{%') > -1 && text.indexOf('%}') > -1;
    };

    /**
     * 将字符串替换成php字符串变量书写形式
     */
    var phpStringEncode = function(str){
        return str.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
    };

    /**
     * 将抽出的js、css、ui合并到php中
     */
    var resTemplate;
    var writeResPhp = function(f, mergeJs, mergeCss, mergeUI, options){
        var src = f.src;
        var resPath = path.dirname(f.dest) + '/res.php';
        var tplName = path.basename(path.dirname(f.dest));
        var arrJs = [], arrCss = [], arrUI = [];
        mergeJs.forEach(function(item){
            if (hasSmarty(item.text)) {
                grunt.fail.warn('smarty syntax found in js-merge in ' + src + '');
            }
            try{
                item.text = compressJs(item.text, options.js);
            } catch(e) {
                var err = createError(e, src, 'Compress js error', item.line);
                grunt.log.warn('compress js in ' + src + ' failed.');
                grunt.fail.warn(err);
            }
            arrJs.push(item.text);
        });
        mergeCss.forEach(function(item){
            if (hasSmarty(item.text)) {
                grunt.fail.warn('smarty syntax found in css-merge in ' + src + '');
            }
            try {
                item.text = new CleanCSS().minify(item.text);
            } catch(e) {
                var err = createError(e, src, 'Compress css failed');
                grunt.log.warn('compress css ' + src + ' failed.');
                grunt.fail.warn(err);
            }
            arrCss.push(item.text);
        });
        arrUI = grunt.util._.uniq(mergeUI);
        if(!resTemplate) {
            resTemplate = grunt.file.read(__dirname + '/' + '../data/res_template.php');
        }
        var js = "''";
        if(arrJs.length > 0) {
            js = 'A.merge("' + tplName + '",function(){' + arrJs.join(';') + '});';
            js = phpStringEncode(js);
            js = "'" + js + "'";
        }
        var css = "''";
        if (arrCss.length > 0) {
            css = arrCss.join('');
            css = "'" + phpStringEncode(css) + "'";
        }
        var php = resTemplate
            .replace('%###%templateName%###%', tplName)
            .replace('%###%ui%###%', "'" + arrUI.join(',') + "'")
            .replace('%###%css%###%', css)
            .replace('%###%js%###%', js);
        grunt.file.write(resPath, php);
    };

    var compressTpl = function(f, options){
        var src = f.src[0], dest = f.dest;
        var source = grunt.file.read(src);

        var tokens = tplParser.parse(source);

        var result = [], scriptStartToken, styleStartToken,
            mergeJs = [], mergeCss = [], mergeUI = [],
            needMergeJs = false, needMergeCss = false, attr;

        tokens.forEach(function(token){
            if(token.type === 'HTML_SCRIPT_START') {
                scriptStartToken = token;
                attr = getAttrMap(scriptStartToken);
                if(options.tpl.mergeJs && attr.hasOwnProperty('data-merge')){
                    needMergeJs = true;
                }
                else {
                    needMergeJs = false;
                }
                if (!needMergeJs) {
                    result.push(token.text);
                }
            }
            else if(token.type === 'HTML_SCRIPT_CONTENT') {
                var js = token.text;
                if(needMergeJs){
                    mergeJs.push({text:js, line:token.line});
                    js = ''
                }
                else if(options.tpl.compressJs && attr['data-compress'] !== 'off') {
                    try{
                        js = compressJs(js, options.js);
                        //console.log(js);
                    } catch(e) {
                        var err = createError(e, src, 'Compress tpl error', token.line);
                        grunt.log.warn('compress js in ' + src + ' failed.');
                        grunt.fail.warn(err);
                    }
                }
                result.push(js);
            }
            else if (token.type === 'HTML_SCRIPT_END') {
                if (!needMergeJs) {
                    result.push(token.text);
                }
            }
            else if(token.type === 'HTML_STYLE_START') {
                styleStartToken = token;
                attr = getAttrMap(styleStartToken);
                if(options.tpl.mergeCss && attr.hasOwnProperty('data-merge')) {
                    needMergeCss = true;
                }
                else{
                    needMergeCss = false;
                }
                if (!needMergeCss) {
                    result.push(token.text);
                }
            }
            else if(token.type === 'HTML_STYLE_CONTENT') {
                var css = token.text;
                if(needMergeCss) {
                    var processdCssData = processCssUI(css);
                    mergeCss.push({text:processdCssData.css, line:token.line});
                    mergeUI.push.apply(mergeUI, processdCssData.uis);
                    css = '';
                }
                else if (options.tpl.compressCss && attr['data-compress'] !== 'off') {
                    try {
                        css = new CleanCSS().minify(css);    
                    } catch(e) {
                        //console.log(css);
                        var err = createError(e, src, 'Compress tpl failed');
                        grunt.log.warn('compress css in ' + src + ' failed.');
                        grunt.fail.warn(err);
                    }
                }
                result.push(css);
            }
            else if (token.type === 'HTML_STYLE_END') {
                if (!needMergeCss) {
                    result.push(token.text);
                }
            }
            else{
                result.push(token.text);
            }
        });
        grunt.file.write(dest, result.join(''));
        writeResPhp(f, mergeJs, mergeCss, mergeUI, options);
        grunt.log.ok('compress tpl ok: ' + dest);
    };

    grunt.registerMultiTask('sc-compress', 'compress js and css', function(){
        var files = this.files//.slice(0,1);
        var options = this.data.options;
        files.forEach(function(f){
            var src = f.src[0], dest = f.dest;
            if(f.type == 'js'){
                try {
                    var result = uglify.minify(src, dest, options.js);
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
                compressTpl(f, options);
            }
            else {
                grunt.file.copy(src, dest);
                grunt.log.ok('compress default ok: ' + dest);
            }
        });
    });
};
