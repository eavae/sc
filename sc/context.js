exports.create = function(raw) {
    var index = 0, line = 0;
    var updateLine = function(s){
        var i = 0, l = s.length;
        while(i < l){
            if(s.charAt(i) === '\n') {
                line ++;
            }
            i ++;
        }
    };
    var context = {
        text: '',
        peek: function(count) {
            count = count || 1;
            return raw.substr(index, count);
        },
        read: function(count) {
            if (count === 0) {
                return '';
            }
            count = count || 1;
            var next = this.peek(count);
            index += count;
            if (index > this.length) {
                index = this.length;
            }
            updateLine(next);
            return next;
        },
        readUntilNonWhitespace: function() {
            var value = '', next;
            while (!this.isEof()) {
                next = this.read();
                value += next;
                if (!/\s$/.test(value)) {
                    break;
                }
            }

            return value;
        },
        isEof: function() {
            return index >= this.length;
        },
        readForward: function(item, isBefore) {
            var leftRaw = raw.substring(this.index),
                oldIndex = index;
            if (typeof item === 'string') {
                var i = leftRaw.indexOf(item);
                index += (i + (isBefore ? 0 : item.length));
                var s = raw.substring(oldIndex, index);
                updateLine(s);
                return s;
            }
            else if (item instanceof RegExp) {
                var value = (item.exec(leftRaw) || [''])[0];
                if(value){
                    var i = leftRaw.indexOf(value);
                    index += (i + (isBefore ? 0 : value.length));
                    var s = raw.substring(oldIndex, index);
                    updateLine(s);
                    return s;
                }
            };
            return '';
        },
        readForwardBefore: function(item){
            return context.readForward(item, true);
        },
        matchForward: function(item){
            var leftRaw = raw.substring(this.index);
            if(typeof item === 'string'){
                return context.peek(item.length) === item;
            }
            else if(item instanceof RegExp){
                return leftRaw.search(item) === 0;
            }
            return false;
        },
        peekIgnoreWhitespace: function(count) {
            count = count || 1;
            var value = '', next = '', offset = 0;
            do {
                next = raw.charAt(this.index + ++offset);
                if (!next) {
                    break;
                }
                if (!/\s/.test(next)) {
                    value += next;
                }
            } while (value.length < count);

            return value;
        }
    };

    context.__defineGetter__('line', function() {
        return line;
    });
    context.__defineGetter__('current', function() {
        return this.isEof() ? '' : raw.charAt(this.index);
    });
    context.__defineGetter__('raw', function() {
        return raw;
    });
    context.__defineGetter__('length', function() {
        return raw.length;
    });
    context.__defineGetter__('index', function() {
        return index;
    });
    context.__defineGetter__('substring', function() {
        return raw.substring(this.index);
    });

    return context;
}
