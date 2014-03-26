
var File = module.export = function(fullPath, content){
    this.path = fullPath;
    if(typeof content !== undefined)
        this.content = content;
};
