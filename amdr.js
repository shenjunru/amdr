/*!
 * AMDR 1.0b3 (sha1: 016998af60923375d70b06f9dc19bc31ad775eac)
 * (c) 2012 Shen Junru. MIT License.
 * http://github.com/shenjunru/amdr
 */

// global exports:
//   define(identifier String, dependencies Array, factory Function|Object)
//   define(identifier String, factory Function|Object)
//   define(dependencies Array, factory Function)
//   define(factory Function|Object)
//   require(module Array|String[, callback Function[, fallback Function]])
//   require.config([config Object])

// global imports (browser):
//   document {createElement(), getElementsByTagName()}

// defined modules:
//   require, exports, module - CommonJS modules.
//   isIE - determines the browser is Internet Explorer.
//   Promise - Promise abstract class.
//     instance properties/methods:
//     - then([callback Function[, fallback Function]])
//     static methods (implements Promise/A):
//     - resolve(promiseOrValue *)
//     - resolved([value *])
//     - rejected([reason *])
//     - when(promiseOrValue *[, callback Function[, fallback Function[, progback Function]]])
//   Deferred - Deferred class, implements Promise/A.
//     instance properties/methods:
//     - promise Promise
//     - resolve([value *])
//     - reject([reason *])
//     - notify([info *])
//     - state()

// how to define a loader:
//   exports.load(name String, module Object)
//     - name - resource name
//     - module.resolve(value) - call it when resource load successful
//     - module.reject(reason) - call it when resource load failed
//     - module.config() - get module config
//     - module.load([url String]) - uses default way to load resource
//     - module.toUrl(name String[, config Object]) - convert name to url by config
//   export.normalize(name String[, normalize Function]) - optional
//     - name - name need to be converted
//     - normalize(name String) - default normalizer

// note:
//   *script.onerror* does not work in IE 6-8. there is no way to know if the
//   resource is not availiable. it triggers the onreadystatechange
//   with a complete state.
//   *script.onload* does work in IE 9+, but it has a bug where it does not
//   fire script.onload event handlers right after execution of script.
//   so script.onreadystatechange is still used. however, onreadystatechange
//   fires with a complete state before the script.onerror function fires.

(function(global, isIE, undef){
    'use strict';

    var // element: document
        document    = global.document,

        // element: resource insert point
        insertPoint = firstNodeOfTagName('head') || firstNodeOfTagName('script'),

        // element: features testing element
        testElement  = document.createElement('script'),

        // event: onload
        eventOnload = 'onload',

        // event: onerror
        eventOnfail = 'onerror',

        sReadyState = 'readyState',

        // flag: supports script 'onload' event
        catchOnload = eventOnload in testElement || !(sReadyState in testElement),

        // flag: uses script.readyState
        scriptState = !catchOnload,

        // flag: script parsing
        scriptParse = {},

        // collection: script ready states
        readyStates = { 'interactive': scriptParse, 'loaded': 1, 'complete': 1 },

        // collection: loading scripts
        actScripts = {},

        // collection: local defined modules, by name
        locModules = {},

        // collection: created amd modules, by full path
        amdModules = {},

        // queue: defer amd module define arguments
        amdDefineQ = scriptState ? {} : [],

        // config: global config
        globalConfig = new Config(),

        // regexp: comma around spaces
        rComma = /\s*,\s*/g,

        // regexp: trims leading spaces & ending spaces
        rTrim = /^\s+|\s+$/g,

        // regexp: extracts function parameters
        // 'function[ name ](parameters)'
        rFnParams = /^\S+(?:\s*|\s+\S+\s*)\(([^\)]*)\)[\s\S]+$/,

        // regexp: removes function comments
        // '// comments' or '/* comments */'
        rComment = /\/\*([\s\S]*?)\*\/|\/\/(.*)$/mg,

        // regexp: retrieves require() in a function
        // 'require("module")'
        rRequire = /\s*\((['"])([^'"\(]+)\1\)/.source,

        // regexp: absolute url
        // '/path' or 'http://path'
        rAbsUrl = /^\/|^[^:]+:\/\//,

        // regexp: relative url
        // './path' or '../path'
        rRelUrl = /^\.?\.\//,

        // regexp: url has ext
        rExtUrl = /\?|\.js$/,

        // regexp: '/./' path
        rDotPath = /\/\.\//g,

        // regexp: resource name
        // 'path/resource', '/resource' or 'resource'
        rResource = /(\/?)[^\/]*$/,

        // regexp: end with '/'
        rEndSlash = /\/$/,

        // regexp: '?'
        rQizMark = /\?/,

        // regexp: '.' or '..'
        rDotSkip = /\.\.?/,

        sSlash   = '/',

        cjsModules = 'require,exports,module',

        // function: reference of Object hasOwnProperty function
        hasOwn = Object.prototype.hasOwnProperty,

        // function: reference of Array indexOf function
        indexOf = Array.prototype.indexOf || function(object, offset){
            var length = this.length;

            offset = offset ? ( offset < 0 ? Math.max(0, length + offset) : offset ) : 0;
            for (; offset < length; offset++) {
                // skip accessing in sparse arrays
                if (offset in this && object === this[offset]) {
                    return offset;
                }
            }

            return -1;
        };


    // features detections
    // =========================================================================

    if (scriptState) {
        eventOnload = 'onreadystatechange';
    }
    // forces using script.readyState
    // see note: script.onload
    scriptState = isIE || scriptState;


    // utils
    // =========================================================================

    function isArray(obj){
        return obj instanceof Array;
    }

    function isFunction(obj){
        return 'function' === typeof obj;
    }

    function isString(obj){
        return 'string' === typeof obj;
    }

    function isObject(obj){
        return 'object' === typeof obj;
    }

    function mixObject(target, source){
        if (source) {
            var key, value;
            for (key in source) {
                if (hasOwn.call(source, key)) {
                    value = source[key];
                    if (isArray(value)) {
                        value = value.concat();
                    } else if (isObject(value)) {
                        value = mixObject(mixObject({}, target[key]), value);
                    }
                    target[key] = value;
                }
            }
        }
        return target;
    }

    function logError(error, memo){
        if (console) { (console.error || console.log).call(
            console, memo || error.stack || error.stacktrace || error
        ); }
    }

    function makeError(memo, ignore){
        var error = new Error(memo.message);
        if (true !== ignore && globalConfig.debug) {
            logError(error, memo);
        }
        return error;
    }

    function makePromiseError(){
        return makeError({
            message: 'promise fulfilled.',
            emitter: 'deferred'
        }, true);
    }

    function firstNodeOfTagName(name){
        return document.getElementsByTagName(name)[0];
    }


    // script loader
    // =========================================================================

    /**
     * loads module by script element
     *
     * @param {Module} module - module instance
     * @param {String} [url] - custom url
     * @private
     */
    function scriptLoad(module, emitter, url){
        var script = document.createElement('script');

        // sets module as executing
        module.padding = false;

        // adds to collection
        actScripts[module.name] = script;
        if (scriptState) {
            amdDefineQ[module.name] = [];
        }

        // adds 'onload' listener
        script[eventOnload] = catchOnload ? function(){
            scriptComplete(module, script);
        } : function(){
            if (readyStates[script.readyState]) {
                scriptComplete(module, script);
            }
        };

        // adds 'onerror' listener
        // see note: script.onerror
        script[eventOnfail] = function(){
            scriptComplete(module, script, makeError({
                message: 'load failure.',
                parent:  emitter,
                source:  module.name
            }));
        };

        // sets attributes
        script.charset = 'utf-8';
        script.async = script.defer = true;
        script.type = 'text/javascript';
        script.src = url || nameToUrl(module.name, module.context.config);

        // inserts
        insertPoint.appendChild(script);
    }

    /**
     * script loaded callback
     *
     * @param {Module} module
     * @param {Element} script
     * @param {Error} [error]
     * @private
     */
    function scriptComplete(module, script, error){
        // removes listeners
        script[eventOnfail] = script[eventOnload] = '';

        // removes form collection
        delete actScripts[module.name];

        if (error) {
            // module rejected: script load failure
            module.reject(error);
        } else {
            // async module define
            var params, queue = amdDefineQ;

            if (scriptState) {
                queue = queue[module.name];
            }

            while (queue.length) {
                params = queue.shift();
                params.push(module);
                moduleDefine.apply(global, params);
            }

            if (scriptState) {
                delete queue[module.name];
            }

            // resolves module for traditional "browser globals" script
            if (!module.defined) {
                module.defined = true;
                module.resolve();
            }
        }
    }


    // inner classes
    // =========================================================================

    /**
     * empty config class for config cloning
     *
     * @constructor
     * @private
     */
    function EmptyConfig(){}

    /**
     * config class
     *
     * @param {String} [path=''] - current path
     * @constructor
     * @private
     */
    function Config(path){
        var config = this;
        config.config  = {};
        config.urlBase = '';
        config.urlArgs = '';
        config.urlExt  = '.js';
        config.pathNow = path || '';
        config.pathMap = {};
        config.timeout = 7;
        config.debug   = false;
    }

    /**
     * clones current config
     *
     * @return {Config}
     */
    (EmptyConfig.prototype = Config.prototype).clone = function(){
        var config = new EmptyConfig();
        mixObject(config, this);
        return config;
    };

    /**
     * context class
     *
     * @param {Config} config
     * @constructor
     * @private
     */
    function Context(config){
        var context  = this,
            deferred = new Deferred();

        // functions
        context.resolve  = deferred.resolve;
        context.reject   = deferred.reject;

        // properties
        context.promise  = deferred.promise;
        context.config   = config;
        context.rejected = false;
        // for CommonJS modules
        context.requires = {};
        context.exports  = undef;
        context.module   = undef;
    }

    /**
     * gets module instance from current context
     *
     * @param {String} name - module name
     * @return {Module}
     */
    Context.prototype.getModule = function(name){
        return amdModules[name] || (amdModules[name] = new Module(
            name, this.config
        ));
    };

    /**
     * module class
     *
     * @param {String} name - module name
     * @param {Config} config - context config
     * @constructor
     * @private
     */
    function Module(name, config){
        var module   = this,
            deferred = new Deferred();

        config = config.clone();
        config.pathNow = name.replace(rResource, '$1');

        // functions
        module.resolve = deferred.resolve;
        module.reject  = deferred.reject;

        // properties
        module.promise = deferred.promise;
        module.context = new Context(config);
        module.defined = false;
        module.padding = true;
        module.name    = name;
    }

    /**
     * promise abstract class
     *
     * @param {Function} then - function(callback, fallback)
     * @constructor
     */
    function Promise(then){
        this.then = then;
    }

    /**
     * registers a callback, always be fired when promise is fulfilled
     *
     * @param {Function} alwaysBack
     * @return {Promise}
     */
    Promise.prototype.always = function(alwaysBack){
        return this.then(alwaysBack, alwaysBack);
    };

    /**
     * deferred promise class
     *
     * @constructor
     * @private
     */
    function Deferred(){
        var deferred = this,
            promise  = new Promise(),

            // listeners
            listeners = [],

            // progress handlers
            progbacks = [],

            // deferred state
            state = 'pending',

            /**
             * pre-resolution then() that adds the supplied callback, fallback
             * and progback functions to the registered listeners.
             *
             * @param {Function} [callback] - resolution handler
             * @param {Function} [fallback] - rejection handler
             * @param {Function} [progback] - progress handler
             */
            _then = function(callback, fallback, progback) {
                var deferred_ = deferred;

                if (callback || fallback) {
                    deferred_ = new Deferred();

                    listeners.push(function(promise){
                        promise
                        .then(callback, fallback)
                        .then(deferred_.resolve, deferred_.reject);
                    });
                }

                if (isFunction(progback)) {
                    progbacks.push(progback);
                }

                return deferred_.promise;
            },

            /**
             * Transition from padding state to fulfilled state,
             * notifying all listeners of the resolution or rejection.
             *
             * @param {*|Promise} completed the completed value of this deferred
             * @return {Promise}
             */
            _fulfill = function(completed){
                var i, l;

                completed = promiseResolve(completed);

                // Replaces _then with one that directly notifies with the result.
                _then = completed.then;

                // Notify listeners
                for (i = 0, l = listeners.length; i < l; i++) {
                    listeners[i](completed);
                }

                // GC
                _fulfill = listeners = undef;

                return completed;
            };

        deferred.promise = promise;

        /**
         * registers handlers for this deferred's promise.
         * even though all arguments are optional, each argument that *is*
         * supplied must be null, undefined, or a function.
         *
         * @param {Function} [callback] - resolution handler
         * @param {Function} [fallback] - rejection handler
         * @return {Promise}
         */
        deferred.then = promise.then = function(callback, fallback, progback){
            return _then(callback, fallback, progback);
        };

        /**
         * resolves this deferred's promise with value as the resolution value.
         *
         * if value is not a promise, resolves this deferred's promise with value.
         * otherwise, puts this deferred's promise into the same state as value.
         * example:
         *   if value is a rejected promise, this deferred will become rejected.
         *
         * @param {*|Promise} [value]
         * @return {Promise} - a promise for the resolution value
         */
        deferred.resolve = function(value){
            if (_fulfill) {
                state = 'resolved';
                return _fulfill(value);
            }
            throw makePromiseError();
        };

        /**
         * rejects this deferred's promise with the reason.
         *
         * @param {*} [reason] - rejection reason
         * @return {Promise}
         */
        deferred.reject = function(reason){
            if (_fulfill) {
                state = 'rejected';
                return _fulfill(promiseRejected(reason));
            }
            throw makePromiseError();
        };

        /**
         * emits a progress update to all progress observers registered with
         * this deferred's promise.
         *
         * @param {*} [update] - anything
         */
        deferred.notify = function(update){
            if (!_fulfill) {
                throw makePromiseError();
            }
            for (var i = 0, l = progbacks.length; i < l; i++) {
                progbacks[i](update);
            }
        };

        /**
         * gets the state of this deferred.
         *
         * @return {String} - state string of this Deferred
         */
        deferred.state = function(){
            return state;
        };
    }


    // promise helpers
    // =========================================================================

    /**
     * returns promiseOrValue if promiseOrValue is a promise, a new promise if
     * promiseOrValue is a foreign promise, or a new, already-resolved promise
     * whose resolution value is promiseOrValue if promiseOrValue is an
     * immediate value.
     *
     * @param promiseOrValue {*|Promise}
     * @return {Promise}
     * @private
     */
    function promiseResolve(promiseOrValue){
        if (promiseOrValue instanceof Promise) {
            return promiseOrValue;
        } else {
            return promiseResolved(promiseOrValue);
        }
    }

    /**
     * creates an already-resolved promise for the supplied value.
     *
     * @param {*} [value] - anything
     * @return {Promise}
     * @private
     */
    function promiseResolved(value){
        return new Promise(function(callback){
            try {
                return promiseResolve(callback ? callback(value) : value);
            } catch (e) {
                return promiseRejected(e);
            }
        });
    }

    /**
     * creates an already-rejected promise with the supplied rejection reason.
     *
     * @param {*} [reason] - rejection reason
     * @return {Promise}
     * @private
     */
    function promiseRejected(reason) {
        return new Promise(function(callback, fallback){
            try {
                return fallback ? promiseResolve(fallback(reason)) : promiseRejected(reason);
            } catch (e) {
                return promiseRejected(e);
            }
        });
    }

    /**
     *
     * @param {*|Promise} promiseOrValue
     * @param {Function} [callback] - resolution handler
     * @param {Function} [fallback] - rejection handler
     * @param {Function} [progback] - progress handler
     * @return {Promise}
     * @private
     */
    function promiseWhen(promiseOrValue, callback, fallback, progback) {
        return promiseResolve(promiseOrValue).then(callback, fallback, progback);
    }


    // module name helpers
    // =========================================================================

    /**
     * converts a name to a url
     * with given config or current config
     *
     * @param {String} name - name to convert
     * @param {Object} config - config {@link Config}
     * @return {String}
     */
    function toUrl(name, config){
        var index = name.lastIndexOf('.'),
            ext   = '';

        if (-1 !== index) {
            ext = name.substring(index, name.length);
            name = name.substring(0, index);
        }

        name = nameNormalize(name, config);

        return nameToUrl(name, config, ext);
    }

    /**
     * converts name to url with config
     *
     * @param {String} name - normalized module name
     * @param {Config} config - config instance
     * @param {String} [ext] - resource extension
     * @return {String}
     * @private
     */
    function nameToUrl(name, config, ext){
        var url = name;

        if (!rExtUrl.test(url)) {
            url += (ext || config.urlExt);
        }
        if (config.urlBase && !rAbsUrl.test(name)) {
            url = config.urlBase + url;
        }
        if (config.urlArgs) {
            url += (rQizMark.test(url) ? '&' : '?') + config.urlArgs;
        }

        return url;
    }

    /**
     * converts name to url with config
     *
     * @param {String} name - normalized module name
     * @return {String}
     * @private
     */
    function nameClean(name){
        // cleans '/./'
        do {
            name = name.replace(rDotPath, sSlash);
        } while (name.indexOf('/./') > -1);

        // cleans 'path/..'
        var index, offset = 1, syms = name.split(sSlash);
        while ( 0 < (index = indexOf.call(syms, '..', offset)) ) {
            rDotSkip.test(syms[index -= 1])
                ? offset++
                : syms.splice(index, 2);
        }

        return syms.join(sSlash);
    }

    /**
     * normalizes module name
     *
     * @param {String} name - module name
     * @param {Config} config - config instance
     * @return {String}
     * @private
     */
    function nameNormalize(name, config){
        if (!name) {
            return name;
        }

        if (!rAbsUrl.test(name)) {
            if (!rRelUrl.test(name)) {
                var maps = config.pathMap,
                    syms, path, i;

                if (maps) {
                    // joins path maps
                    syms = name.split(sSlash);
                    for (i = syms.length; i > 0; i--) {
                        path = syms.slice(0, i).join(sSlash);
                        if (hasOwn.call(maps, path)) {
                            if (path = maps[path]) {
                                syms.splice(0, i, path); // replace
                            } else {
                                syms.splice(0, i); // delete
                            }
                            break;
                        }
                    }
                    name = syms.join(sSlash);
                }
            } else if (config.pathNow) {
                // joins current path
                name = config.pathNow + name;
            }

            // pull off the leading dot.
            if (0 === name.indexOf('./')) {
                name = name.substring(2);
            }
        }

        return nameClean(name);
    }

    /**
     * parses name to an object like { prefix, name }
     * the value of 'prefix' or 'name' will be normalized.
     *
     * @param {String} name - module name
     * @param {Config} config - config instance
     * @return {Object}
     * @private
     */
    function nameParse(name, config){
        var index = name ? name.indexOf('!') : -1,
            pipe;

        if (-1 !== index) {
            pipe = name.substring(index + 1, name.length);
            name = name.substring(0, index);
        }

        return {
            name: nameNormalize(name, config),
            pipe: pipe
        };
    }


    // module define helpers
    // =========================================================================

    /**
     * finds module by interactive script element
     *
     * @return {Module}
     * @private
     */
    function getCurrentMoudle(id){
        for (id in actScripts) {
            if (scriptParse === readyStates[actScripts[id].readyState]) {
                return amdModules[id];
            }
        }
    }

    /**
     * retrieves all 'require()' in the factory
     * even code is compressed
     *
     * @param {Array} dependencies
     * @param {Function} factory
     * @private
     */
    function extractFactoryRequires(dependencies, factory){
        var requires = [], offset = 0, source, params;
        while ( -1 < (offset = indexOf.call(dependencies, 'require', offset)) ) {
            if (undef === source) {
                source = String(factory).replace(rComment, '');
                params = source.replace(rFnParams, '$1').replace(rTrim, '').split(rComma);
            }

            // finds require() by real parameter name
            source.replace(new RegExp(params[offset] + rRequire, 'g'), append);

            offset++;
        }
        return requires;

        function append(m, _, require) {
            if (require) {
                requires.push(require);
            }
            return m;
        }
    }

    /**
     * loads single module
     *
     * @param {Context} context - module context
     * @param {String} name - module name
     * @param {Number|String} index - index in the context
     * @param {String} emitter - emitter name
     * @return {Promise} - module promise
     * @private
     */
    function loadModule(context, name, index, emitter){
        if (name in locModules) {
            return promiseResolved(locModules[name](context)).then(callback);
        }

        var loader   = isNaN(index) && index,
            resource = nameParse(name, context.config),
            currName = resource.name,
            pipeName = resource.pipe,
            module, promise, deferred;

        if (!currName) {
            return promiseRejected(makeError({
                message: 'module name empty.',
                parent:  emitter,
                source:  name
            })).then(fallback);
        }

        // gets module/loader instance
        module = context.getModule(currName);

        // module's promise will be returned
        promise = module.promise;

        if (undef !== pipeName /* allows empty string */) {
            // a new deferred instance
            deferred = new Deferred();

            // loads resource when module<loader> is resolved
            promise.then(function(exports){
                if (exports && exports.load) {
                    // normalizes resource name
                    if (exports.normalize) {
                        pipeName = exports.normalize(pipeName, function(name){
                            return nameNormalize(name, context.config);
                        });
                    } else {
                        pipeName = nameNormalize(pipeName, context.config);
                    }

                    // loads piped module
                    loadModule(context, pipeName, exports, emitter)
                        .then(deferred.resolve, deferred.reject);
                } else {
                    deferred.reject(makeError({
                        message: '"load()" undefined.',
                        parent:  emitter,
                        source:  name
                    }));
                }
            }, deferred.reject);

            // deferred's promise will be returned
            promise = deferred.promise;
        }

        if (loader) {
            // loads module by a loader module

            if (module.padding) {
                module.padding = false;
                loader.load(currName, {
                    resolve: module.resolve,
                    reject:  module.reject,
                    config: function(){
                        return module.context.config;
                    },
                    load: function(url){
                        scriptLoad(module, emitter, url);
                    },
                    toUrl: function(name, config){
                        return toUrl(name, config || this.config());
                    }
                });
            }

            // returns a promise
            return promise;
        } else {
            // loads module in default way

            if (module.padding) {
                scriptLoad(module, emitter);
            }

            // returns a promise
            return promise.then(callback, fallback);
        }

        // module resolved
        function callback(exports){
            // returns for context resolving
            return {
                index:   index,
                exports: exports
            };
        }

        // module rejected
        function fallback(reason){
            // rejects context once
            if (!context.rejected) {
                context.rejected = true;
                // throws for context rejecting
                throw reason;
            }
        }
    }

    /**
     * loads modules
     *
     * @param {Context} context - loading context
     * @param {Array} modules - required module names
     * @param {Array} [requires] - inner required module names
     * @param {String} emitter - emitter name
     * @return {Promise} - context promise
     * @private
     */
    function loadModules(context, modules, requires, emitter){
        var exports = [],
            next    = true,
            offset  = modules.length,
            timeout = false,
            index, length, count, name;

        if (requires && requires.length) {
            modules = modules.concat(requires);
        }

        if (count = length = modules.length) {
            exports.length = offset;
            for (index = 0; next && index < length; index++) {
                if (name = modules[index]) {
                    loadModule(context, name, index < offset ? index : name, emitter)
                        .then(callback, fallback);
                }
            }

            setTimeout(timer, 1000 * context.config.timeout);
        } else {
            context.resolve(exports);
        }

        return context.promise;

        // resolves context
        function callback(module){
            // saves to exports array or require hash
            (isString(module.index)
                ? context.requires
                : exports
            )[module.index] = module.exports;

            if (0 === --count && !timeout) {
                // clears timeout
                timeout = true;

                // context resolved
                context.resolve(exports);
            }
        }

        // rejects context
        function fallback(reason){
            // stops load rest modules
            next = false;

            if (!timeout) {
                // clears timeout
                timeout = true;

                // context rejected: module rejected
                context.reject(reason);
            }
        }

        function timer(){
            if (!timeout) {
                // clears timeout
                timeout = true;

                // context rejected: timeout
                context.reject(makeError({
                    message: 'execute timeout.',
                    parent:  emitter,
                    source:  'context'
                }));
            }
        }
    }


    // core functions
    // =========================================================================

    /**
     * module defining
     *
     * @param {String} name
     * @param {Array} dependencies
     * @param {Array} requires
     * @param {Function} factory
     * @param {Module} module
     * @private
     */
    function moduleDefine(name, dependencies, requires, factory, module){
        var context = module.context;

        // if name is given and not matched with current one,
        // gets the correct module & context instance.
        name = nameNormalize(name, context.config);
        if (name && name !== module.name) {
            module  = context.getModule(name);
            context = module.context;
        }

        if (module.defined) {
            // do not do more define if already done. can happen if there
            // are multiple define calls for the same module. that is not
            // a normal, common case, but it is also not unexpected.
            return; // TODO: makeError('duplicate defined.');
        }

        // sets module as defined
        module.defined = true;

        // sets module as executing
        module.padding = false;

        loadModules(context, dependencies, requires, module.name).then(callback, fallback);

        // resolves module
        function callback(exports){
            try {
                var // executes module factory
                    returns = factory.apply(global, exports),
                    cjsExports = context.exports,
                    cjsModule  = context.module;

                cjsModule = cjsModule && cjsModule.exports;
            } catch (reason) {
                // log error
                logError(reason);

                // module rejected: module factory exception
                module.reject(reason);
            }

            // priority CommonJS 'module.exports' / 'exports',
            // or use factory returns
            if (undef !== cjsModule && cjsExports !== cjsModule) {
                returns = cjsModule;
            } else if (undef === returns && cjsExports) {
                returns = cjsExports;
            }

            // module resolved
            module.resolve(returns);
        }

        // rejects module
        function fallback(reason){
            // module rejected: dependencies rejected
            module.reject(reason);
        }
    }

    /**
     * defines a module
     *
     * @param {String} [name] - module name
     * @param {Array} [dependencies] - module dependencies
     * @param {Object|Function} factory - an object or a function with returns
     * @private
     */
    function define(name_, dependencies_, factory_){
        var arity = arguments.length,
            dependencies = cjsModules,
            requires, name, factory, module;

        // fixes arguments
        if (2 === arity) {
            if (isString(name_)) {
                name = name_;
            } else {
                dependencies = name_;
            }
            factory_ = dependencies_;
        } else if (1 === arity) {
            factory_ = name_;
        } else if (3 === arity) {
            name = name_;
            dependencies = dependencies_;
        }

        if (isFunction(factory_)) {
            // fixes dependencies
            if (cjsModules === dependencies && !factory_.length) {
                dependencies = '';
            }
            dependencies = dependencies && String(dependencies).replace(rTrim, '');
            dependencies = dependencies ? dependencies.split(rComma) : [];

            // fixes factory
            factory = factory_;
            if (factory.length) {
                // extracts requires in the factory
                requires = extractFactoryRequires(dependencies, factory);
            }
        } else {
            // fixes dependencies
            dependencies = [];

            // fixes factory
            factory = function(){
                return factory_;
            };
        }

        if (scriptState) {
            module = getCurrentMoudle();
            amdDefineQ[module.name].push([name, dependencies, requires, factory]);
        } else {
            amdDefineQ.push([name, dependencies, requires, factory]);
        }
    }

    /**
     * indicates define() is AMD
     * @type {Object}
     */
    define.amd = {
        version: '%VERSION%',
        jQuery:  true
    };

    /**
     * requires module(s)
     *
     * @param {String|Array} modules - module name(s), separated by ','
     * @param {Function} callback - fired after all required modules defined,
     *   passes all modules exports as parameters by the given order
     * @param {Function} fallback -
     * @return {Promise}
     * @private
     */
    function require(modules, callback, fallback){
        modules = String(modules).replace(rTrim, '').split(rComma);

        var context = new Context(globalConfig),
            requires;

        if (isFunction(callback)) {
            requires = extractFactoryRequires(modules, callback);
        } else {
            callback = undef;
        }

        return loadModules(context, modules, requires, 'require').then(function(modules){
            return callback && callback.apply(global, modules);
        }, fallback);
    }

    /**
     * gets / sets global config
     *
     * @param {Object} [config] - see {@link Config}
     * @return {Config}
     */
    require.config = function(config){
        if (config) {
            var urlBase = config.urlBase,
                pathMap = config.pathMap,
                key;

            // ensures the urlBase ends in a slash
            if (urlBase && !rEndSlash.test(urlBase)) {
                config.urlBase += '/';
            }
            // ensures the pathMap is not end in a slash
            // also cleans it
            if (pathMap) { for (key in pathMap) {
                pathMap[key] = nameClean(pathMap[key].replace(rEndSlash, ''));
            } }

            mixObject(globalConfig, config);
        }
        return globalConfig;
    };


    // local modules
    // =========================================================================

    /**
     * module 'require' factory
     *
     * @param {Context} context
     * @return {Function}
     * @private
     */
    function cjsRequire(context){
        return function(path){
            return context.requires[path];
        };
    }

    /**
     * module 'require' factory
     *
     * @param {Context} context
     * @return {Object}
     * @private
     */
    function cjsExports(context){
        return context.exports || (context.exports = {});
    }

    /**
     * module 'module' factory
     *
     * @param {Context} context
     * @return {Object}
     * @private
     */
    function cjsModule(context){
        // TODO: ensures properties/methods
        return context.module || (context.module = {
            /** @type {Object} - module exports */
            exports: cjsExports(context),

            /**
             * returns config property assigned by require.config()
             *
             * @return {Object}
             */
            config: function(){
                return context.config.config;
            },

            /**
             * converts a name to a url
             * with given config or current config
             *
             * @param {String} name - name to convert
             * @param {Object} [config] - config {@link Config}
             * @return {String}
             */
            toUrl: function(name, config){
                return toUrl(name, config || context.config);
            }
        });
    }

    // defines CommonJS modules
    locModules.require = cjsRequire;
    locModules.exports = cjsExports;
    locModules.module  = cjsModule;

    // defines other modules

    /**
     * module 'isIE' factory
     *
     * @return {Boolean}
     * @private
     */
    locModules.isIE = function(){
        return isIE;
    };

    /**
     * module 'Promise' factory
     *
     * @return {Function}
     * @private
     */
    locModules.Promise  = function(){
        return Promise;
    };

    /**
     * module 'Deferred' factory
     *
     * @return {Function}
     * @private
     */
    locModules.Deferred = function(){
        return Deferred;
    };


    // exports
    // =========================================================================

    // exports Promise/A implementation functions
    // as Promise module static methods
    Promise.resolve  = promiseResolve;
    Promise.resolved = promiseResolved;
    Promise.rejected = promiseRejected;
    Promise.when = promiseWhen;

    // exports to global
    global.define  = define;
    global.require = require;

}(this, /*@cc_on!@*/!1));
