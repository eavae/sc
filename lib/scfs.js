/**
 * @file 批量处理文件
 * 
 * @author Feng Weifeng <jpssff@gmail.com>
 */
var Deferred = require('Deferred'),
    fs = require('fs'),
    _ = require('underscore');

module.exports = function(fileList){
    return new FS(fileList);
};


function FS(list){
    this.list = list;
    //最多同时进行多少个操作
    //因为受限于系统同时打开文件数量，设置一个合理的值可以确保性能和稳定性。
    this._max = 10;
    //放置新增加的任务，如果任务开始执行，则将任务从数组中删除。
    this._tasks = [];
    this._running = false;
}

/**
 * 添加一个任务，然后执行。
 *
 * @param {Function|Defered} fn 如果类型为函数，则需要返回一个deferred对象
 */
FS.prototype.then = function(fn){
    if(typeof fn == 'function'){
        this._tasks.push(fn);
    }
    else if(typeof fn == 'object'){
        this._tasks.push(function(){
            return fn;
        });
    }
    if(!this._running){
        this._startTask();
    }
    return this;
};

FS.prototype._startTask = function(){
    if(this._running || this._tasks.length == 0) return;
    var task = this._tasks.shift();
    var _this = this;
    var def = task.call(this);
    this._running = true;
    def && def.always(function(){
        _this._running = false;
        if(_this._tasks.length > 0){
            _this._startTask();
        }
    });
};

/**
 * 针对列表中每个文件进行处理
 *
 * @param {Function} fn fn的参数为处理任务的deferred对象和文件路径
 *
 */
FS.prototype.queue = function(fn){
    var list = this.list.slice(0),
    max = this._max,
    working = [];
    var task = function(){
        var def = Deferred(function(){
            var takeOne = function(){
                if(working.length < max && list.length > 0){
                    var file = list.shift();
                    var d = Deferred(function(d1){
                        fn.call(null, d1, file);
                    });
                    working.push(d);
                    d.always(function(){
                        //console.log(file);
                        var index = working.indexOf(d);
                        working.splice(index, 1);
                        takeOne();
                    });
                    takeOne();
                }
                else if(list.length == 0 && working.length == 0){
                    def.resolve();
                }
            };
            takeOne();
        });
        return def;
    };
    this.then(task);
    return this;
};

/*
* fn的参数为err-读取错误, data-文件内容
*/
FS.prototype.readFile = function(fn){
    return this.queue(function(def, file){
        fs.readFile(file, {encoding:'utf-8'}, function(err, data){
            console.log(data);
            fn && fn(data);
            def.resolve();
        });
    });
};
