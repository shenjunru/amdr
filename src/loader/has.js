/*!
 * AMDR - Condition loader 1.1.0 (sha1: 20e2e7977a5110c0100aaa3f713e5e95225167ef)
 * (c) 2012~2016 Shen Junru. MIT License.
 * https://github.com/shenjunru/amdr
 */

// API:
//   has(feature String) Boolean
//   has.add(feature String, definition Boolean|Function)

define('has', [], function(){
    'use strict';

    var features = {},
        rHasName = /([^\?]+)\?([^:]+)(?::([^:].*))?/;

    function has(name){
        return true === features[name];
    }

    has.version = '1.1.0';

    has.add = function(name, definition){
        if ('function' === typeof definition) {
            definition = definition();
        }
        if ('boolean' === typeof definition) {
            features[name] = definition;
        }
        return has;
    };

    // as a loader
    has.load = function(request, name){
        var result = rHasName.exec(name);
        if (result) {
            result = has(result[1]) ? result[2] : result[3];
        }
        if (result) {
            return request.load(result);
        } else {
            throw new Error('unable to normalize name');
        }
    };

    return has;
});
