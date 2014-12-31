/*!
 * AMDR - Condition loader 1.0.0 (sha1: d621d314b0a1ad527f8ffb46cd3031a8cf72e826)
 * (c) 2012~2014 Shen Junru. MIT License.
 * https://github.com/shenjunru/amdr
 */

// API:
//   has(feature String) Boolean
//   has.add(feature String, definition Boolean|Function)

define(function(){
    'use strict';

    var features = {},
        rHasName = /([^\?]+)\?([^:]*)(?::([^:]+))?/;

    function has(name){
        return true === features[name];
    }

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
    has.load = function(name, module){
        module.load();
    };

    has.normalize = function(name, normalize){
        var result = rHasName.exec(name);
        if (result) {
            result = has(result[1]) ? result[2] : result[3];
        }
        return normalize(result || '');
    };

    return has;
});
