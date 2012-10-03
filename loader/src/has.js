/*!
 * has condition loader for AMDR (sha1: 2b5131a3d4d5e0340faa78187ef144b2e8cfc1b9)
 * (c) 2012 Shen Junru. MIT License.
 * http://github.com/shenjunru/amdr
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
