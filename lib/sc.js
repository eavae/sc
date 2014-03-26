/**
 * @file sc主文件
 * @author Feng Weifeng <jpssff@gmail.com>
 */
var glob = require('glob');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var minimatch = require('minimatch');
var deferred = require('deferred');
var scfs = require('./scfs');
var isBinaryFileSync = require("isbinaryfile");

var sc = exports = module.exports = {};

/**
 * sc版本号
 *
 * @type {String}
 */
sc.verson = require('../package.json').version;


/**
 * 绑定并开始处理一个路径
 *
 * @param {String} p 代码根目录路径
 * @return {ec} for chaining
 */
sc.start = function(p){
    var startTime = new Date();
    p = path.resolve(p);
    if(!fs.existsSync(p))
        throw "目录不存在:" + p;
    sc.path = p;
    var config = sc.config = mergeConfig();
    
    //扫描文件
    console.log('扫描文件...');
    var list = getFileList(p);
    console.log('文件+目录共%s个', list.length);

    //console.log(list);
    //删除build目录
    var buildPath = path.join(sc.path, config.build);
    deleteFolderRecursive(buildPath);
    console.log('已删除：' + buildPath);

    //sc语法检查
    var task = scfs(list).queue(function(def, file){
        //console.log(file);
        fs.stat(file, function(err, stats){
           if(err)
               throw err;
           if(stats.isFile(file)){
               processFile(def, file);
           }
           else{
               def.resolve();
           }
        });
        //task.then(function(){
        //    console.log('用时 %s s', (new Date - startTime)/1000);
        //});
    });
    task.then(function(){
        console.log('用时 %s s', (new Date - startTime)/1000);
    });

    //文件合并处理
    
    //模板语法检查
    
    //编译模板
    
    //输出文件

    return sc;
};

function processFile(def, file){
    if(isBinaryFileSync(file)){
        def.resolve();
    }
    else{
        fs.readFile(file, {encoding:'utf-8'}, function(err, data){
            if(err)
                throw err;
            if(/\.js$/.test(file)){
                compressJs(file, data);
                def.resolve();
            }else{
                def.resolve();
            }
        });
    }
}

function processDir(dir){
    
}

function compressJs(file, text){
    var ugjs = require('uglify-js');
    try{
        var ast = ugjs.parse(text);
        ast.figure_out_scope();
        var compressor = ugjs.Compressor({warnings:false});
        ast = ast.transform(compressor);
        var code = ast.print_to_string();
    }catch(e){
        console.error("压缩js时出错,文件名:" + file);
        console.log(e);
    }
}

function deleteFolderRecursive(p) {
    if( fs.existsSync(p) ) {
        var files = [];
        files = fs.readdirSync(p);
        files.forEach(function(file){
            var curPath = path.join(p, file);
            if(fs.statSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(p);
    }
}


/**
 * 读取模块配置并于默认配置合并
 *
 * @return {Object}
 */
function mergeConfig(){
    var userConfigPath = path.join(sc.path, 'sc.config.json');
    var config = require('./config');
    var userConfig = {};
    ////导入模块配置
    if(fs.existsSync(userConfigPath)){
        console.log('用户配置文件:' + userConfigPath);
        try{
            userConfig = require(userConfigPath);
        }catch(e){
            throw "读配置错误，请修改。" + p;
        }
    }
    var ex = config.defaultExclude;
    if(userConfig.exclude){
        ex = ex.concat(userConfig.exclude);
    }
    ex = _.uniq(ex);
    var exReg = [];
    ex.forEach(function(expression){
        var mm = new minimatch.Minimatch(expression);
        var reg = mm.makeRe();
        if(reg == false || reg == null)
            throw "配置错误，exclude:" + expression;
        exReg.push(reg);
    });
    config.exclude = exReg;
    //console.log(exReg);
    return config;
};

/**
 * 文件在构建时是否需要被排除
 *
 * @return {Boolean}
 */
function isFileExclude(p){
    var ex = sc.config.exclude;
    for(var i=0,l=ex.length;i<l;i++){
        var reg = ex[i];
        if(reg.test(p)) 
            return true;
    }
    return false;
}


/**
 * 获取路径下所有文件、目录
 *
 * @return {Array}
*/
function getFileList(p){
    var list = [];
    var files = fs.readdirSync(p);
    files.forEach(function(f){
        var fullPath = path.join(p, f);
        if(isFileExclude(f)){
            console.log('忽略文件:' + fullPath);
            return;
        }
        list.push(fullPath);
        var stat = fs.lstatSync(fullPath);
        if(stat.isDirectory() && !stat.isSymbolicLink()){
            list.push.apply(list, getFileList(fullPath));
        }
    });
    return list;
};
