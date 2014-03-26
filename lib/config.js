/**
 * @file 默认配置，用与构建
 * @author Feng Weifeng <jpssff@gmail.com>
 */

var config = exports = module.exports = {};


/**
 * 源文件目录
 */
config.src = "src";

/**
 * 构建后放置的目录
 */
config.build = "build";

/**
 * 排除文件的glob expressions
 * 对于常用命令行的同学更加方便，比js的正则看起来更直观
 */
config.defaultExclude = [
    '.svn',
    '.git',
    '.cvs',
    '.gitingore',
    '.swp',
    '.swo',
    '.tmp',
    '.bak'
];

/**
 * 用于自定义排除文件
 */
config.exclude = [];
