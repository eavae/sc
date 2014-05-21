/**
* 解析smarty模板，划分为HTML、Smarty（extends、block、comment，其余包含在HTML
* 中）、Script标签、Style标签。
* 用于不太关注细节的模板优化工作。
*  
* Feng Weifeng <jpssff@gmail.com>
* 2014-05-20
*/


var parserContext = require('./context');

var arrayToMap = function(arr){
    var map = {};
    arr.forEach(function(a){
        map[a] = a;
    });
    return map;
};

var TokenTypes = arrayToMap([
    'NONE',

    'HTML_COMMENT',
    'HTML_TAG_START',
    'HTML_TAG_END',
    'HTML_TEXT',

    'HTML_SCRIPT_START',
    'HTML_SCRIPT_END',
    'HTML_SCRIPT_CONTENT',

    'HTML_STYLE_START',
    'HTML_STYLE_END',
    'HTML_STYLE_CONTENT',

    'SMARTY_EXTEND',
    'SMARTY_COMMENT',
    'SMARTY_BLOCK_START',
    'SMARTY_BLOCK_END',

    'HTML_ATTR_NAME',
    'HTML_ATTR_EQ',
    'HTML_ATTR_SINGE_QUOTE',
    'HTML_ATTR_DOUBLE_QUOTE',
    'HTML_ATTR_VALUE',
    'HTML_ATTR_WHITE'
]);

var Token = function(type, text){
    this.type = type || 'NONE';
    this.text = text || '';
    this.line = -1;
    this.attrTokens = null;
};

var AttrToken = function(type, text){
    this.type = type || 'NONE';
    this.text = text || '';
};

var tokenList = [];

var parse_NONE = function(context, buf) {} 

var parse_HTML_COMMENT = function(context, buf) {
    var token = new Token('HTML_COMMENT');
    token.line = context.line;
    buf += context.readForward(/^([\s\S]*?)($|-->)/);
    token.text = buf;
    tokenList.push(token);
}; 

var parse_HTML_TAG_START = function(context, buf) {} 
var parse_HTML_TAG_END = function(context, buf) {} 

var parse_HTML_TEXT = function(context, buf) {
    buf += context.readForward(/^[^<>\{]*/);
    var length = tokenList.length, lastToken = tokenList[length - 1];
    if(length > 0 && lastToken.type === 'HTML_TEXT'){
        lastToken.text += buf;
    }else{
        var token = new Token('HTML_TEXT');
        token.line = context.line;
        token.text = buf;
        tokenList.push(token);
    }
};

var getAttributesMap = function(str){
    var re = /\s+((\w|-)+)(=('|")?(\w|-)+\4?)?/g;
};

var parse_HTML_SCRIPT_START = function(context, buf) {
    var token = new Token('HTML_SCRIPT_START');
    token.line = context.line;
    buf += context.readForward(/>/);
    token.text = buf;
    tokenList.push(token);
    parse_HTML_SCRIPT_CONTENT(context);
    token.attrTokens = parseHTMLAttributes(buf);
}; 

var parse_HTML_SCRIPT_END = function(context, buf) {
    var token = new Token('HTML_SCRIPT_END');
    token.line = context.line;
    buf += context.readForward(/script>/i);
    token.text = buf;
    tokenList.push(token);
};

var parse_HTML_SCRIPT_CONTENT = function(context, buf) {
    var line = context.line;
    var js = context.readForwardBefore(/<\/script>/i);
    if(js){
        token = new Token('HTML_SCRIPT_CONTENT');
        token.line = line;
        token.text = js;
        tokenList.push(token);
    }
};

var parse_HTML_STYLE_START = function(context, buf) {
    var token = new Token('HTML_STYLE_START');
    token.line = context.line;
    buf += context.readForward(/>/);
    token.text = buf;
    tokenList.push(token);
    parse_HTML_STYLE_CONTENT(context);
    token.attrTokens = parseHTMLAttributes(buf);
}; 

var parse_HTML_STYLE_END = function(context, buf) {
    var token = new Token('HTML_STYLE_END');
    token.line = context.line;
    buf += context.readForward(/style>/i);
    token.text = buf;
    tokenList.push(token);
};

var parse_HTML_STYLE_CONTENT = function(context, buf) {
    var line = context.line;
    var css = context.readForwardBefore(/<\/style>/i);
    if(css){
        token = new Token('HTML_STYLE_CONTENT');
        token.line = line;
        token.text = css;
        tokenList.push(token);
    }
};

var parse_SMARTY_EXTEND = function(context, buf) {
    var token = new Token('SMARTY_EXTEND');
    token.line = context.line;
    buf += context.readForward(/extends\s+(['"])[.a-zA-Z_\-\/]+\1\s*%\}/);
    token.text = buf;
    tokenList.push(token);
}; 

var parse_SMARTY_COMMENT = function(context, buf) {
    var token = new Token('SMARTY_COMMENT');
    token.line = context.line;
    buf += context.readForward('*%}');
    token.text = buf;
    tokenList.push(token);
};

var parse_SMARTY_BLOCK_START = function(context, buf) {
    var token = new Token('SMARTY_BLOCK_START');
    token.line = context.line;
    buf += context.readForward('%}');
    token.text = buf;
    tokenList.push(token);
};

var parse_SMARTY_BLOCK_END = function(context, buf) {
    var token = new Token('SMARTY_BLOCK_END');
    token.line = context.line;
    buf += context.readForward('/block%}');
    token.text = buf;
    tokenList.push(token);
}; 

var parse_HTML_ATTR_NAME = function(tokens, context, buf){
    var token = new AttrToken('HTML_ATTR_NAME');
    buf += context.readForward(/^[^=\s]+/);
    token.text = buf;
    tokens.push(token);
}

var parse_HTML_ATTR_EQ = function(tokens, context, buf){
    var token = new AttrToken('HTML_ATTR_EQ');
    buf += context.readForward(/^\s+/);
    token.text = buf;
    tokens.push(token);
}

var parse_HTML_ATTR_SINGE_QUOTE = function(tokens, context, buf){
    var token = new AttrToken('HTML_ATTR_SINGE_QUOTE');
    token.text = buf;
    tokens.push(token);
}

var parse_HTML_ATTR_DOUBLE_QUOTE = function(tokens, context, buf){
    var token = new AttrToken('HTML_ATTR_DOUBLE_QUOTE');
    token.text = buf;
    tokens.push(token);
}

var parse_HTML_ATTR_VALUE = function(tokens, context, buf){
    var lastToken = tokens[tokens.length -1];
    var token = new AttrToken('HTML_ATTR_VALUE');
    if(lastToken.type === 'HTML_ATTR_SINGE_QUOTE'){
        buf += context.readForwardBefore("'");
    }
    else if(lastToken.type === 'HTML_ATTR_DOUBLE_QUOTE') {
        buf += context.readForwardBefore('"');
    }
    token.text = buf;
    tokens.push(token);
}

var parse_HTML_ATTR_WHITE = function(tokens, context, buf){
    var token = new AttrToken('HTML_ATTR_WHITE');
    buf += context.readForward(/^\s+/);
    token.text = buf;
    tokens.push(token);
}


var parseHTMLAttributes = function(text){
    var str = text.replace(/^<\w+/, '').replace(/>$/, '').trim();
    var context = parserContext.create(str);
    var tokens = [], c;
    do {
        var cur = context.read(), buf = cur;
        if(/\s/.test(cur)){
            parse_HTML_ATTR_WHITE(tokens, context, buf);
        }
        else {
            parse_HTML_ATTR_NAME(tokens, context, buf);
            if(! context.isEof()){
                c = context.peek();
                if(/\s/.test(c)){
                    buf = context.read();
                    parse_HTML_ATTR_WHITE(tokens, context, buf);
                }
                else if(c === '=') {
                    buf = context.read();
                    parse_HTML_ATTR_EQ(tokens, context, buf);
                    var c = context.peek();
                    if(/\s/.test(c)){
                        buf = context.read();
                        parse_HTML_ATTR_WHITE(tokens, context, buf);
                    }
                    else if(c === '"' || c === "'") {
                        buf = context.read();
                        if( c === '"') {
                            parse_HTML_ATTR_DOUBLE_QUOTE(tokens, context, buf);
                        }
                        else if (c === "'") {
                            parse_HTML_ATTR_SINGE_QUOTE(tokens, context, buf);
                        }
                        parse_HTML_ATTR_VALUE(tokens, context, '');
                        if(context.matchForward('"')) {
                            buf = context.read();
                            parse_HTML_ATTR_DOUBLE_QUOTE(tokens, context, buf);
                        }
                        else if (context.matchForward("'")) {
                            buf = context.read();
                            parse_HTML_ATTR_SINGE_QUOTE(tokens, context, buf);
                        }
                    }
                }
            }
        }
    } while (!context.isEof());
    return tokens;
};

var parseNext = function(context){
    var cur = context.peek(), buf = '';
    if(cur === '{'){
        buf += context.read();
        if(context.matchForward('%')){
            buf += context.read();
            if (context.matchForward('*')) {
                parse_SMARTY_COMMENT(context, buf);
            }   
            else if(context.matchForward(/^block\s+/)){
                parse_SMARTY_BLOCK_START(context, buf);
            }
            else if(context.matchForward('/block%}')){
                parse_SMARTY_BLOCK_END(context, buf);
            }
            else if(context.matchForward(/^extends\s+/)){
                parse_SMARTY_EXTEND(context, buf);
            }
            else {
                parse_HTML_TEXT(context, buf);
            }
        }
        else {
            parse_HTML_TEXT(context, buf);
        }
    }
    else if (cur === '<') {
        buf += context.read();
        if (context.matchForward('/')) {
            buf += context.read();
            if (context.matchForward(/^script>/i)) {
                parse_HTML_SCRIPT_END(context, buf);
            }
            else if (context.matchForward(/style>/i)) {
                parse_HTML_STYLE_END(context, buf);
            }else {
                parse_HTML_TEXT(context, buf);
            }
        }
        else if (context.matchForward('!--')){
            buf += context.read(3);
            parse_HTML_COMMENT(context, buf);
        }
        else if (context.matchForward(/^script[^<>]*?>/i)) {
            parse_HTML_SCRIPT_START(context, buf);
        }
        else if (context.matchForward(/^style[^<>]*?>/i)) {
            parse_HTML_STYLE_START(context, buf);
        }
        else {
            parse_HTML_TEXT(context, buf);
        }
    }
    else {
        buf += context.read();
        parse_HTML_TEXT(context, buf);
    }
};

exports.parse = function(tpl){
    tpl = tpl.replace(/\r\n/g, '\n').replace(/\r/g, '\n');;
    tokenList = [];
    var context = parserContext.create(tpl);
    do {
        parseNext(context);
    } while (!context.isEof());
    return tokenList;
};
