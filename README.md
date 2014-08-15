Grunt Smarty Build Tool
==

介绍
----

`sc`是一个功能简单的前端工具，用来编译、压缩smarty模板中的JavaScript和CSS。


安装
----

	git clone git@github.com:eavae/sc.git somedir
	cd somedir
	npm install


使用
----

使用以下命令完成相应工作：

    grunt 将当前src目录下的文件编译至build目录
    grunt php 进行PHP错误检查
    grunt all 进行编译压缩和PHP检查
    grunt single 对单模板进行编译，不清空build目录
    
    --path 指定编译目录
    --template 指定模板目录

问题反馈
--------

通过这个链接提交反馈: <https://github.com/psfe/sc/issues/new>
