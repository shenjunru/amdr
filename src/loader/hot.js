/*!
 * AMDR - Hot module loader 1.0.0 (sha1: d4b7e05bbf0cc01832fca3e35a65ca76f331087a)
 * (c) 2016 Shen Junru. MIT License.
 * https://github.com/shenjunru/amdr
 */

// No support for non AMD module.

define(['Promise', 'exports'], function(Promise, exports){
    'use strict';

    exports.version = '1.0.0';

    exports.normalize = function(name){
        return name;
    };

    exports.load = function(name, module, emitter){
        var ref = define.amd.cache[name];
        if (ref && ref.factory && ref.settled && ref.frozen) {
            require(ref.dependencies, function(){
                try {
                    var returns = ref.factory.apply(cur, arguments);

                    ref.promise = Promise.resolved(returns);
                    ref.exports = returns;

                    module.resolve(returns);
                } catch (reason) {
                    ref.promise = Promise.rejected(reason);
                    ref.exports = void(0);
                    module.reject(reason);
                }
            }, module.reject, module.config(), emitter, true);
        } else {
            require([name], module.resolve, module.reject, module.config(), emitter, true);
        }
    };

    exports.unload = function(){
        var name, module, cache = define.amd.cache;
        for (name in cache) {
            if (0 === name.indexOf('hot!')) {
                delete define.amd.cache[name];
                if (( module = define.amd.cache[name.slice(4)] )) {
                    module.frozen = true;
                }
            }
        }
    };

    return exports;
});
