/*!
 * AMDR 1.3.5 (sha1: a9d8d8b29f3c17fd838e1bdd6cb8c3e8439be5f0)
 * (c) 2012~2018 Shen Junru. MIT License.
 * https://github.com/shenjunru/amdr
 */

// Global exports:
//   define(identifier String, dependencies Array, factory Function|Object)
//   define(identifier String, factory Function|Object)
//   define(dependencies Array, factory Function)
//   define(factory Function|Object)
//   require(module Array|String[, callback Function[, fallback Function]])
//   require.config([config Object])

// Global imports (browser):
//   document {createElement(), getElementsByTagName()}

// CommonJS module:
// define(function(require, exports, module) {
//     // Put traditional CommonJS module content here
// });

// Defined modules:
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

// How to define a plugin:
//   exports.load(request Object, name String, parent String, parents Object)
//     This function dose module resource loading, returns a promise or a value.
//     - request.config - module config
//     - request.load([name String]) - uses default way to load a sub-module
//     - request.toUrl(name String, config Config) - convert name to url by config
//     - name - request module name
//     - parent - parent module name
//     - parents - parent module names
//   export.rewrite(name String, parent String) - optional
//     This function does dependency name rewriting, returns a string.
//     - name - request module name
//     - parent - parent module name
//   export.normalize(name String, normalize Function) - optional
//     This function does module name normalizing, returns a string.
//     - name - name need to be converted
//     - normalize(name String) - default normalizer

// Note:
//   *script.onerror* does not work in IE 6-8. there is no way to know if the
//   resource is not availiable. it triggers the onreadystatechange
//   with a complete state.
//   *script.onload* does work in IE 9+, but it has a bug where it does not
//   fire script.onload event handlers right after execution of script.
//   so script.onreadystatechange is still used. however, onreadystatechange
//   fires with a complete state before the script.onerror function fires.

(function(global, isIE, undef){
    'use strict';

    // element: document
    var document    = global.document;

    // object: global console object
    var console     = global.console;

    // object: original "define" and "require"
    var oldDefine   = global.define;
    var oldRequire  = global.require;

    // function: reference of setTimeout function
    var setTimeout  = global.setTimeout;

    // function: reference of clearTimeout function
    var clsTimeout  = global.clearTimeout;

    // function: reference of Object hasOwnProperty function
    var hasOwn      = Object.prototype.hasOwnProperty;

    // function: reference of Object toString function
    var toString    = Object.prototype.toString;

    // function: reference of Array indexOf function
    var arrIndex    = Array.prototype.indexOf || function(object, offset){
        var length = this.length >>> 0;

        offset = offset ? ( offset < 0 ? Math.max(0, length + offset) : offset ) : 0;
        for (; offset < length; offset++) {
            // skip accessing in sparse arrays
            if (offset in this && object === this[offset]) {
                return offset;
            }
        }

        return -1;
    };

    // function: reference of Array map function
    var arrMap      = Array.prototype.map || function(callback) {
        var index = 0;
        var length = this.length >>> 0;
        var result = new Array(length);

        for (; index < length; index++) {
            if (index in this) {
                result[index] = callback.call(undef, this[index], index, this);
            }
        }

        return result;
    };

    // class: reference of native Promise class
    var NPromise    = global.Promise;

    // class: reference of Deferred implementation
    var IDeferred   = NPromise ? DeferredNative : DeferredPolyfill;

    // prototype: config prototype
    var ConfigProto = Config.prototype;

    // flag: is not in the browser environment
    var notBrowser  = undef === document || undef === document.createElement;

    // flag: is in the web worker environment
    var isWebWorker = notBrowser && isFunction(global.importScripts);

    // element: resource insert point
    var insertPoint = notBrowser || firstNodeOfTagName('head') || firstNodeOfTagName('script');

    // element: features testing element
    var testElement = notBrowser ? {} : document.createElement('script');

    // event: onload
    var eventOnload = 'onload';

    // event: onerror
    var eventOnfail = 'onerror';

    var sReadyState = 'readyState';

    // flag: supports script 'onload' event
    var catchOnload = eventOnload in testElement || !(sReadyState in testElement);

    // flag: uses script.readyState
    var scriptState = !catchOnload;

    // flag: script parsing
    var scriptParse = {};

    // collection: script ready states
    var readyStates = { 'interactive': scriptParse, 'loaded': 1, 'complete': 1 };

    // collection: local defined modules, by name
    var locModules = {};

    // collection: (browser) created amd modules, by full path
    var amdModules = {};

    // collection: (browser) loading scripts
    var actScripts = {};

    // queue: (browser) defer amd module define arguments (browser)
    var amdScriptQ = [];

    // queue: (worker) loading modules
    var amdImportQ = [];

    // state: loading scripts count
    var runScripts = 0;

    // state: undetectable module name count
    var unknowns = 0;

    // config: global config
    var configGlobal = new Config();

    // object: empty
    var plainObject = {};

    // regexp: comma around spaces
    var rComma = /\s*,\s*/g;

    // regexp: trims leading spaces & ending spaces
    var rTrim = /^\s+|\s+$/g;

    // regexp: extracts function parameters
    // 'function[ name ](parameters)'
    var rFnParams = /^\S+(?:\s*|\s+\S+\s*)\(([^)]*)\)[\s\S]+$/;

    // regexp: removes function comments
    // '// comments' or '/* comments */'
    var rComment = /\/\*([\s\S]*?)\*\/|\/\/(.*)$/mg;

    // regexp: retrieves require() in a function
    // 'require("module")'
    var rRequire = /\s*\((['"])([^'"(]+)\1\)/.source;

    // regexp: absolute url
    // '/', '/path', '//host' or 'http://host'
    var rAbsUrl = /^\/($|[^/])|^([^:]+:)?\/\/[^/]+/;

    // regexp: relative url
    // './path' or '../path'
    var rRelUrl = /^\.?\.\//;

    // regexp: full url
    // '//host' or 'http://host'
    var rWithHost = /^([^:]+:)?\/\/[^/]+/;

    // regexp: '/./' path
    var rDotPath = /\/\.\//g;

    // regexp: resource name
    // 'path/resource', '/resource' or 'resource'
    var rResource = /(\/?)[^/]*$/;

    // regexp: '?' or '#'
    var rQizHash = /[?#]/;

    // regexp: end with '/'
    var rEndSlash = /\/$/;

    // regexp: '?'
    var rQizMark = /\?/;

    // regexp: '.' or '..'
    var rDotSkip = /\.\.?/;

    // string: slash
    var sSlash   = '/';

    // string: require
    var sRequire = 'require';

    // string: promise state
    var sPending  = 'pending';
    var sResolved = 'resolved';
    var sRejected = 'rejected';

    // array: common js dependencies
    var cjsImports = ['require', 'exports', 'module'];

    // features detections
    // =========================================================================

    if (scriptState) {
        eventOnload = 'onreadystatechange';
    }
    // forces using script.readyState
    // see note: script.onload
    scriptState = isWebWorker ? false : (isIE || scriptState);
    if (scriptState) {
        amdScriptQ = {};
    }


    // utils
    // =========================================================================

    /**
     * determines the object is a function
     *
     * @param {*} object
     * @return {boolean}
     */
    function isFunction(object){
        return '[object Function]' === toString.call(object);
    }

    /**
     * determines the object is a string
     *
     * @param {*} object
     * @return {boolean}
     */
    function isString(object){
        return '[object String]' === toString.call(object);
    }

    /**
     * determines the object is an array
     *
     * @param {*} object
     * @return {boolean}
     */
    function isArray(object){
        return '[object Array]' === toString.call(object);
    }

    /**
     * iterates all properties on a object
     *
     * @param {Object} object
     * @param {function(key, value)} iterator
     * @param {*} [context]
     */
    function iterate(object, iterator, context){
        if (!object || !isFunction(iterator)) { return; }

        for (var key in object) {
            if (!hasOwn.call(plainObject, key)) {
                iterator.call(context, key, object[key]);
            }
        }
    }

    /**
     * logs a error with memo data.
     *
     * @param {Error} error - error object
     * @param {Object} [memo] - memo data
     * @return {Error}
     */
    function logError(error, memo){
        if (true === configGlobal.debug) {
            configGlobal.log(error, memo);
        }
        return error;
    }

    /**
     * creates and logs a error.
     *
     * @param {string} memo.message - error message
     * @param {string} memo.parent - emitter parent
     * @param {string} memo.source - emitter source
     * @return {Error}
     */
    function makeError(memo){
        return logError(new Error(memo.message), memo);
    }

    /**
     * creates a promise error.
     *
     * @param {string} method
     * @param {*} value
     * @return {Error}
     */
    function makePromiseError(method, value){
        return makeError({
            message: 'promise settled.',
            parent: method,
            source: value
        });
    }

    /**
     * finds element by tag name.
     *
     * @param {string} name - tag name
     * @return {?Element}
     */
    function firstNodeOfTagName(name){
        return document.getElementsByTagName(name)[0];
    }


    // script loader
    // =========================================================================

    /**
     * loads module script file
     *
     * @param {Module} module - module instance
     * @param {string} parent - emitter name
     * @param {?string} ext - resource extension
     */
    function scriptLoad(module, parent, ext){
        var timing = module.context.config.timeout;
        var status = { done: false, time: undef };
        var script;

        // sets module as executing
        module.pending = false;

        // starts request countdown
        if (isFinite(timing) && 0 < timing) {
            status.time = setTimeout(function(){
                // context rejected: timeout
                scriptComplete(module, status, script, makeError({
                    message: 'request timeout.',
                    parent:  parent,
                    source:  module.name
                }));
            }, 1000 * timing);
        }

        // update request status
        module.request.then(done, done);

        if (status.done) {
            return;
        }

        if (isWebWorker) {
            script = scriptImport(module, status, parent, ext);
        } else {
            script = scriptAttach(module, status, parent, ext);
        }

        function done(){
            clsTimeout(status.time);
            status.done = true;
        }
    }

    /**
     * loads module by importScripts()
     *
     * @param {Module} module - module instance
     * @param {Object} status - status object
     * @param {string} parent - emitter name
     * @param {?string} ext - resource extension
     * @return {void}
     */
    function scriptImport(module, status, parent, ext){
        // adds module to queue
        amdImportQ.push(module);

        try {
            // importing
            global.importScripts(nameToUrl(module.name, module.context.config, ext));
            // import successful
            scriptComplete(module, status, undef);
        } catch (reason) {
            // import failed
            scriptComplete(module, status, undef, makeError({
                message: 'import failure.',
                parent:  parent,
                source:  module.name
            }));
        }

        // cleanups
        var entry = amdImportQ.pop();
        if (entry && entry !== module) {
            amdImportQ.push(entry);
        }
    }

    /**
     * loads module by script element
     *
     * @param {Module} module - module instance
     * @param {Object} status - status object
     * @param {string} parent - emitter name
     * @param {?string} ext - resource extension
     * @return {Element} script element
     */
    function scriptAttach(module, status, parent, ext){
        var script = document.createElement('script');

        // adds to collection
        actScripts[module.name] = script;
        runScripts++;
        if (scriptState) {
            amdScriptQ[module.name] = [];
        }

        // adds 'onload' listener
        script[eventOnload] = catchOnload ? function(){
            scriptComplete(module, status, script);
        } : function(){
            if (readyStates[script.readyState]) {
                scriptComplete(module, status, script);
            }
        };

        // adds 'onerror' listener
        // see note: script.onerror
        script[eventOnfail] = function(){
            scriptComplete(module, status, script, makeError({
                message: 'load failure.',
                parent:  parent,
                source:  module.name
            }));
        };

        // sets attributes
        script.charset = 'utf-8';
        script.async = script.defer = true;
        script.type = 'text/javascript';
        script.src = nameToUrl(module.name, module.context.config, ext);

        // inserts
        return insertPoint.appendChild(script);
    }

    /**
     * script loaded callback
     *
     * @param {Module} module - module instance
     * @param {Object} status - status object
     * @param {?Element} script - script element
     * @param {Error} [error] - error object
     */
    function scriptComplete(module, status, script, error){
        if (undef !== script) {
            // removes listeners
            script[eventOnfail] = script[eventOnload] = '';

            // removes form collection
            status.done || delete actScripts[module.name];
            status.done || runScripts--;
        }

        if (error) {
            // module rejected: script load failure
            status.done || module.reject(error);
        } else {
            // async module define
            var params, queue = amdScriptQ;

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
                moduleDefine(module.name, [], [], configGlobal.shimMap[module.name], module);
            }
        }
    }


    // inner classes
    // =========================================================================

    /**
     * config class
     *
     * @constructor
     */
    function Config(){
        this.pathMap = {};
        this.shimMap = {};
    }

    ConfigProto.debug    = false;
    ConfigProto.timeout  = 7;
    ConfigProto.urlBase  = '';
    ConfigProto.urlArgs  = '';
    ConfigProto.urlExt   = '.js';
    ConfigProto.pathNow  = '';
    ConfigProto.pathMap  = undef;
    ConfigProto.shimMap  = undef;

    /**
     * rewrites module name.
     *
     * @param {string} name - module name
     * @param {string} parent - emitter name
     * @return {string}
     */
    ConfigProto.rewrite = function(name, parent){
        /* eslint no-unused-vars:off */
        return name;
    };

    /**
     * logs a error.
     *
     * @param {Error} error - error object
     * @param {Object} [memo] - memo data
     */
    ConfigProto.log = function(error, memo){
        /* eslint no-console:off */
        if (console) {
            Function.prototype.call.call(
                console.error || console.log,
                console,
                memo || error.stack || error.stacktrace || error
            );
        }
    };

    /**
     * clones this config.
     *
     * @return {Config}
     */
    ConfigProto.clone = function(){
        var config = new Config();

        iterate(config, function(key, value){
            if (hasOwn.call(this, key)) {
                if ('pathMap' === key || 'shimMap' === key) {
                    iterate(this[key], function(key, value){
                        this[key] = value;
                    }, value);
                } else {
                    config[key] = this[key];
                }
            }
        }, this);

        return config;
    };

    /**
     * merges a config.
     *
     * @param {*} config
     * @return {Config}
     */
    ConfigProto.merge = function(config){
        if (!config) { return this; }

        var urlBase = config.urlBase;

        // ensures the debug is a boolean
        if ('debug' in config) {
            this.debug    = true === config.debug;
        }

        // ensures the timeout is a positive number
        if (isFinite(config.timeout) && 0 < config.timeout) {
            this.timeout  = config.timeout;
        }

        // ensures the urlBase ends in a slash
        if (isString(urlBase)) {
            if (urlBase && !rEndSlash.test(urlBase)) {
                urlBase += '/';
            }
            this.urlBase = urlBase;
        }

        // ensures the parameters is a string
        if (isString(config.urlArgs)) {
            this.urlArgs  = config.urlArgs;
        }

        // ensures the extension is a string
        if (isString(config.urlExt)) {
            this.urlExt   = config.urlExt;
        }

        // ensures the rewrite is a function
        if (isFunction(config.rewrite)) {
            this.rewrite = config.rewrite;
        }

        // ensures the path is not end in a slash, also cleans it
        iterate(config.pathMap, function(key, value){
            if (isString(value)) {
                this.pathMap[key] = nameClean(value.replace(rEndSlash, ''));
            }
        }, this);

        // ensures the shim definitions
        iterate(config.shimMap, function(key, value){
            var factory = isFunction(value) ? value : isString(value) ? function(){
                return global[value];
            } : undef;
            if (factory) {
                this.shimMap[nameNormalize(key, this)] = factory;
            }
        }, this);

        return this;
    };

    /**
     * context class
     *
     * @param {Config} config
     * @constructor
     */
    function Context(config){
        var context  = this;
        var deferred = new Deferred();

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
     * gets module instance from current context.
     *
     * @param {string} name - module name
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
     * @param {string} name - module name
     * @param {Config} config - context config
     * @constructor
     */
    function Module(name, config){
        var module = this;
        var define = new Deferred();
        var settle = new Deferred();

        var _config = config.clone();
        _config.pathNow = name.replace(rResource, '$1');

        // functions
        module.define = define.resolve;
        module.settle = settle.resolve;
        module.reject = function(reason){
            var rejected = undef;
            if (sPending === define.state()) {
                rejected = define.reject(reason);
            }
            if (sPending === settle.state()) {
                rejected = settle.reject(reason);
            }
            if (undef === rejected) {
                throw makePromiseError('reject', reason);
            }
            return rejected;
        };

        // properties
        module.parents = {};
        module.request = define.promise;
        module.promise = settle.promise;
        module.context = new Context(_config);
        module.pending = true;
        module.defined = false;
        module.settled = false;
        module.imports = undef; // direct dependencies
        module.insides = undef; // inline dependencies
        module.factory = undef;
        module.exports = undef;
        module.name    = name;
    }

    /**
     * adds parent module name.
     *
     * @param {string} name - module name
     */
    Module.prototype.addParent = function(name){
        if (sRequire !== name && hasOwn.call(amdModules, name)) {
            this.parents[name] = amdModules[name].parents;
        }
        return this;
    };

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
     * deferred promise class (native)
     *
     * @constructor
     */
    function DeferredNative(){
        var deferred = this;
        var state = sPending;
        var resolve, reject;
        var promise = new NPromise(function(_resolve, _reject){
            resolve = _resolve;
            reject = _reject;
        });
        deferred.promise = promise;
        deferred.resolve = function(value){
            resolve(value); return promise;
        };
        deferred.reject = function(reason){
            reject(reason); return promise;
        };
        deferred.state = function(){
            return state;
        };
        promise.then(function(){
            state = sResolved;
        }, function(){
            state = sRejected;
        });
    }

    /**
     * deferred promise class (polyfill)
     *
     * @constructor
     */
    function DeferredPolyfill(){
        var deferred = this;
        var listeners = [];
        var promise = new Promise(undef);
        var state = sPending;

        /**
         * pre-resolution then() that adds the supplied callback
         * and fallback functions to the registered listeners.
         *
         * @param {Function} [callback] - resolved handler
         * @param {Function} [fallback] - rejected handler
         */
        var then = function(callback, fallback) {
            var _deferred = deferred;

            if (callback || fallback) {
                _deferred = new Deferred();

                listeners.push(function(promise){
                    promise
                        .then(callback, fallback)
                        .then(_deferred.resolve, _deferred.reject);
                });
            }

            return _deferred.promise;
        };

        /**
         * Transition from pending state to settled state,
         * notifying all listeners of the resolution or rejection.
         *
         * @param {*|Promise} completed the completed value of this deferred
         * @return {Promise}
         */
        var settle = function(completed){
            var i, l;

            completed = promiseResolve(completed);

            // Replaces _then with one that directly notifies with the result.
            then = completed.then;

            // Notify listeners
            for (i = 0, l = listeners.length; i < l; i++) {
                listeners[i](completed);
            }

            // GC
            settle = listeners = undef;

            return completed;
        };

        deferred.promise = promise;

        /**
         * registers handlers for this deferred's promise.
         * even though all arguments are optional, each argument that *is*
         * supplied must be null, undefined, or a function.
         *
         * @param {Function} [callback] - resolved handler
         * @param {Function} [fallback] - rejected handler
         * @return {Promise}
         */
        promise.then = function(callback, fallback){
            return then(callback, fallback);
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
            if (settle) {
                state = sResolved;
                return settle(value);
            }
            throw makePromiseError('resolve', value);
        };

        /**
         * rejects this deferred's promise with the reason.
         *
         * @param {*} [reason] - rejection reason
         * @return {Promise}
         */
        deferred.reject = function(reason){
            if (settle) {
                state = sRejected;
                return settle(promiseRejected(reason));
            }
            throw makePromiseError('reject', reason);
        };

        /**
         * gets the state of this deferred.
         *
         * @return {string} - state string of this Deferred
         */
        deferred.state = function(){
            return state;
        };
    }

    /**
     * deferred promise class
     *
     * @param {function(resolve, reject)} executor
     * @constructor
     */
    function Deferred(executor){
        var deferred = this;
        IDeferred.call(deferred);
        if (isFunction(executor)) {
            try {
                executor(deferred.resolve, deferred.reject);
            } catch (error) {
                deferred.reject(error);
            }
        }
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
     */
    function promiseResolve(promiseOrValue){
        if (isFunction(promiseOrValue && promiseOrValue.then)) {
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
     */
    function promiseResolved(value){
        return new Promise(function(callback){
            try {
                return promiseResolve(callback ? callback(value) : value);
            } catch (error) {
                return promiseRejected(error);
            }
        });
    }

    /**
     * creates an already-rejected promise with the supplied rejection reason.
     *
     * @param {*} [reason] - rejection reason
     * @return {Promise}
     */
    function promiseRejected(reason) {
        return new Promise(function(callback, fallback){
            try {
                return fallback ? promiseResolve(fallback(reason)) : promiseRejected(reason);
            } catch (error) {
                return promiseRejected(error);
            }
        });
    }

    // exports promise helpers
    Deferred.resolve = NPromise ? NPromise.resolve.bind(NPromise) : promiseResolve;
    Deferred.reject = NPromise ? NPromise.reject.bind(NPromise) : promiseRejected;


    // module name helpers
    // =========================================================================

    /**
     * converts a name to a url
     * with given config or current config
     *
     * @param {string} name - name to convert
     * @param {Object} config - config object
     * @param {string} [config.urlBase]
     * @param {string} [config.urlExt]
     * @param {string} [config.urlArgs]
     * @param {string} [config.pathNow]
     * @param {Object} [config.pathMap]
     * @return {string}
     */
    function toUrl(name, config){
        var _name = nameNormalize(name, config);
        if (rQizHash.test(_name)) {
            return nameToUrl(name, config, undef);
        }

        var _path = _name.split(rQizHash).shift();
        var _file = _path.split(sSlash).pop();
        var index = _file.lastIndexOf('.'), ext;

        if (-1 !== index) {
            ext = _file.slice(index);
        }


        return nameToUrl(_name, config, ext);
    }

    /**
     * converts name to url with config
     *
     * @param {string} name - normalized module name
     * @param {Object} config - config object
     * @param {string} [config.urlBase]
     * @param {string} [config.urlExt]
     * @param {string} [config.urlArgs]
     * @param {string} [ext] - resource extension
     * @return {string}
     */
    function nameToUrl(name, config, ext){
        var _url = name;
        var _ext = null == ext ? config.urlExt : ext;

        if (!(rQizHash.test(_url) || 0 < _url.split(sSlash).pop().indexOf(_ext))) {
            _url += _ext;
        }
        if (config.urlBase) {
            if (!rAbsUrl.test(name)) {
                _url = config.urlBase + _url;
            } else if (!rWithHost.test(name)) {
                _url = config.urlBase.slice(0, -1) + _url;
            }
        }

        var path = _url.split('#').shift();
        var hash = _url.slice(path.length);
        if (config.urlArgs) {
            path += (rQizMark.test(path) ? '&' : '?') + config.urlArgs;
        }

        return path + hash;
    }

    /**
     * converts name to url with config
     *
     * @param {string} name - normalized module name
     * @return {string}
     */
    function nameClean(name){
        // cleans '/./'
        do {
            name = name.replace(rDotPath, sSlash);
        } while (name.indexOf('/./') > -1);

        // cleans 'path/..'
        var index, offset = 1, syms = name.split(sSlash);
        while ( 0 < (index = arrIndex.call(syms, '..', offset)) ) {
            if (rDotSkip.test(syms[index -= 1])) {
                offset++;
            } else {
                syms.splice(index, 2);
            }
        }

        return syms.join(sSlash);
    }

    /**
     * normalizes module name
     *
     * @param {string} name - module name
     * @param {Object} [config] - config object
     * @param {string} [config.pathNow]
     * @param {Object} [config.pathMap]
     * @return {string}
     */
    function nameNormalize(name, config){
        if (!name) {
            return name;
        }

        var path = name.split(rQizHash).shift();
        var data = name.slice(path.length);
        var maps, syms, temp, i;

        if (!path) {
            return name;
        }

        if (!rAbsUrl.test(path)) {
            if (!rRelUrl.test(path)) {
                if ((maps = config.pathMap)) {
                    // joins path maps
                    syms = path.split(sSlash);
                    for (i = syms.length; i > 0; i--) {
                        temp = syms.slice(0, i).join(sSlash);
                        if (hasOwn.call(maps, temp)) {
                            /*jshint boss:true*/
                            if ((temp = maps[temp])) {
                                syms.splice(0, i, temp); // replace
                            } else {
                                syms.splice(0, i); // delete
                            }
                            break;
                        }
                    }
                    path = syms.join(sSlash);
                }
            } else if (config.pathNow) {
                // joins current path
                path = config.pathNow + path;
            }

            // pull off the leading dot.
            if (0 === path.indexOf('./')) {
                path = path.substring(2);
            }
        }

        return nameClean(path) + data;
    }


    // module define helpers
    // =========================================================================

    /**
     * finds module by interactive script element
     *
     * @return {Module}
     */
    function getCurrentModule(){
        for (var id in actScripts) {
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
     */
    function extractFactoryRequires(dependencies, factory){
        var requires = [], offset = 0, source, params;
        while ( -1 < (offset = arrIndex.call(dependencies, sRequire, offset)) ) {
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
     * loads modules
     *
     * @param {Context} context - loading context
     * @param {Array.<string>} imports - direct dependencies
     * @param {?Array.<string>} insides - inline dependencies
     * @param {string} parent - emitter name
     * @param {boolean} frozen - disallow name rewriting
     * @return {Promise} - context promise
     */
    function loadModules(context, imports, insides, parent, frozen){
        var exports = [];
        var next    = true;
        var offset  = imports.length;
        var index, length, count, name;

        if (insides && insides.length) {
            imports = imports.concat(insides);
        }

        if (( count = (length = imports.length) )) {
            exports.length = offset;
            for (index = 0; next && index < length; index++) {
                if ((name = imports[index])) {
                    loadModule(context, index < offset ? index : name, name, parent, frozen)
                        .then(callback, fallback);
                }
            }
        } else {
            context.resolve(exports);
        }

        return context.promise;

        // resolves context
        function callback(module){
            // saves exports to array or require hash
            (isString(module.index) ? context.requires : exports)[module.index] = module.exports;

            // context resolved
            if (0 === --count) {
                context.resolve(exports);
            }
        }

        // rejects context
        function fallback(reason){
            // stops load rest modules
            next = false;

            // context rejected: module rejected
            context.reject(reason);
        }
    }

    /**
     * loads single module
     *
     * @param {Context} context - module context
     * @param {number|string} index - number of import, name of inline
     * @param {string} name - module name
     * @param {string} parent - emitter name
     * @param {boolean} frozen - disallow name rewriting
     * @return {Promise} - module promise
     */
    function loadModule(context, index, name, parent, frozen){
        var promise = moduleLoad(context, name, parent, frozen);
        promise = promise.then(function(module){
            return hasOwn.call(locModules, name) ? module : moduleSettle(module, frozen);
        });
        return promise.then(callback, fallback);

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


    // core functions
    // =========================================================================

    /**
     * module loading
     *
     * @param {Context} context - module context
     * @param {string} name - module name
     * @param {string} parent - emitter name
     * @param {boolean} frozen - disallow name rewriting
     * @return {Promise} - module promise
     */
    function moduleLoad(context, name, parent, frozen){
        if (hasOwn.call(locModules, name)) {
            return Deferred.resolve(locModules[name](context, parent, frozen));
        }

        var fullName = name.split('!').shift();
        var pipeName = name.slice(fullName.length + 1);
        var currName = fullName.split('#').shift();
        var currHash = fullName.slice(currName.length);
        var destName, promise, module;

        if (!currName) {
            return Deferred.reject(makeError({
                message: ('' === pipeName ? 'module' : 'plugin') + ' name empty.',
                parent:  parent,
                source:  name
            }));
        }

        // internal loading
        if ('' === pipeName) {
            // rewrites resource name
            if (!frozen && isFunction(configGlobal.rewrite)) {
                destName = configGlobal.rewrite(currName, parent);
            } else {
                destName = currName;
            }

            // normalizes resource name
            destName = nameNormalize(destName, context.config);

            // gets module instance
            module = context.getModule(destName).addParent(parent);

            // loads module file
            if (module.pending) {
                scriptLoad(module, parent, '' === currHash ? undef : '');
            }

            // get module instance promise
            promise = Deferred.resolve(module);

        // external loading
        } else {
            if (hasOwn.call(locModules, currName) || hasOwn.call(locModules, pipeName)) {
                return promiseRejected(makeError({
                    message: 'pipe internal module.',
                    parent:  parent,
                    source:  name
                }));
            }

            // get plugin instance promise
            promise = moduleLoad(context, currName, sRequire, true);

            // get plugin settling promise
            promise = promise.then(function(module){
                return hasOwn.call(locModules, name) ? module : moduleSettle(module, true);
            });

            // get module defining promise
            promise = promise.then(function(exports){
                if (!exports || !isFunction(exports.load)) {
                    return promiseRejected(makeError({
                        message: '"load()" undefined.',
                        parent:  name,
                        source:  currName
                    }));
                }

                // normalizes resource name
                if (isFunction(exports.normalize)) {
                    destName = exports.normalize(pipeName, function(name){
                        return nameNormalize(name, context.config);
                    });
                } else {
                    destName = nameNormalize(pipeName, context.config);
                }

                // gets module instance
                module = context.getModule(fullName + '!' + destName).addParent(parent);
                if (!module.pending) {
                    return module;
                }

                // sets module as executing
                module.pending = false;

                try {
                    var local = false;
                    var result = exports.load(/* request */{
                        /** @type {string} */
                        params: currHash,

                        /** @type {Config} */
                        config: context.config,

                        /**
                         * loads a sub-module.
                         *
                         * @param {string} [name] - module name
                         * @return {*} promise or value
                         */
                        load: function(name){
                            local = true;
                            return moduleLoad(context, name || destName, parent, frozen).then(function(module){
                                return module.request;
                            });
                        },

                        /**
                         * parses a name to a url.
                         *
                         * @param {string} name - module name
                         * @param {Object} [config] - config object
                         * @param {string} [config.urlBase]
                         * @param {string} [config.urlExt]
                         * @param {string} [config.urlArgs]
                         * @param {string} [config.pathNow]
                         * @param {Object} [config.pathMap]
                         * @return {string}
                         */
                        toUrl: function(name, config){
                            return toUrl(name, config || context.config);
                        }
                    }, destName, parent, module.parents);
                    Deferred.resolve(result).then(function(result){
                        if (local) {
                            var imports = result.imports;
                            var insides = result.insides;

                            // rewrites pipe resource name
                            if (!frozen && isFunction(exports.rewrite)) {
                                imports = imports && arrMap.call(imports, function(name){
                                    return exports.rewrite(name, module.name);
                                });
                                insides && insides && arrMap.call(insides, function(name){
                                    return exports.rewrite(name, module.name);
                                });
                            }

                            moduleDefine('', imports, insides, result.factory, module);
                        } else {
                            moduleDefine('', [], undef, function(){ return result; }, module);
                        }
                    }, module.reject);
                } catch (error) {
                    module.reject(logError(error));
                }

                return module;
            });
        }

        return promise;
    }

    /**
     * module defining
     *
     * @param {string} name - module name
     * @param {Array.<string>} imports - direct dependencies
     * @param {?Array.<string>} insides - inline dependencies
     * @param {Function} factory - module exports factory
     * @param {Module} module - module instance
     */
    function moduleDefine(name, imports, insides, factory, module){
        var _module = module;

        // if name is given and not matched with current one,
        // gets the correct module & context instance.
        if (name && name !== _module.name) {
            var _name = nameNormalize(name, _module.context.config);
            if (_name && _name !== _module.name) {
                _module  = _module.context.getModule(_name);
            }
        }

        if (_module.defined) {
            // do not do more define if already done. can happen if there
            // are multiple define calls for the same module. that is not
            // a normal, common case, but it is also not unexpected.
            makeError({
                message: 'duplicate defined.',
                parent:  _module.name,
                source:  _module.name
            });
            return;
        }

        // sets module as executing
        _module.pending = false;

        // sets module as defined
        _module.defined = true;

        // saves module dependencies
        _module.imports = imports;
        _module.insides = insides;

        // saves module factory
        if (isFunction(factory)) {
            _module.factory = factory;
        } else {
            _module.factory = function(){
                return factory;
            };
        }

        // module defined
        _module.define({
            imports: _module.imports,
            insides: _module.insides,
            factory: _module.factory
        });
    }

    /**
     * module defining
     *
     * @param {Module} module - module instance
     * @param {boolean} frozen - disallow name rewriting
     * @param {boolean} [settle] - internal only
     */
    function moduleSettle(module, frozen, settle){
        if (module.settled) {
            return module.promise;
        }

        if (undef === settle) {
            return module.request.then(function(){
                return moduleSettle(module, frozen, true);
            });
        }

        // sets module as settled
        module.settled = true;

        // load dependencies
        loadModules(module.context, module.imports, module.insides, module.name, frozen).then(callback, fallback);

        return module.promise;

        // resolves module
        function callback(dependencies){
            var cjsContext = module.context;
            var cjsExports = cjsContext.exports;
            var cjsModule  = cjsContext.module;
            var cjsReturns, returns;

            // saves module factory
            if (undef !== cjsModule) {
                cjsModule.factory = module.factory;
            }

            try {
                // executes module factory
                returns = module.factory.apply(global, dependencies);
            } catch (reason) {
                // module rejected: module factory exception
                module.reject(logError(reason));
            }

            // priority CommonJS 'module.exports' / 'exports',
            // or use factory returns
            cjsReturns = cjsModule && cjsModule.exports;
            if (undef !== cjsReturns && cjsExports !== cjsReturns) {
                returns = cjsReturns;
            } else if (undef === returns && undef !== cjsExports) {
                returns = cjsExports;
            }

            // convert value to promise
            returns = Deferred.resolve(returns);

            // saves module exports
            returns.then(function(returns){
                module.exports = returns;
                if (undef !== cjsExports) {
                    cjsContext.exports = returns;
                }
                if (undef !== cjsModule) {
                    cjsModule.exports = returns;
                }
            });

            // module resolved or rejected
            returns.then(module.settle, module.reject);
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
     * @param {string} [name] - module name
     * @param {Array.<string>} [dependencies] - module dependencies
     * @param {Function|Object} factory - a function with returns or an object
     * @throws TypeError
     */
    function define(name, dependencies, factory){
        var _arity = arguments.length;
        if (0 === _arity) {
            return;
        }

        var _module = scriptState && getCurrentModule();
        var _imports, _insides, _factory, factory_, _name, name_;

        // fixes arguments
        if (2 === _arity) {
            // handle: define(name, factory) / define(dependencies, factory)
            if (isArray(name)) {
                _imports = name;
            } else if (isString(name)) {
                _name = name;
            } else {
                throw new TypeError(name);
            }
            _factory = dependencies;
        } else if (1 === _arity) {
            // handle: define(factory)
            _factory = name;
        } else {
            // handle: define(name, dependencies, factory)
            if (!isString(_name = name)) {
                throw new TypeError(_name);
            }
            if (!isArray(_imports = dependencies)) {
                throw new TypeError(_imports);
            }
            _factory = factory;
        }

        // fixes dependencies
        if (isString(_imports)) {
            _imports = _imports.split(rComma);
        }
        if (isArray(_imports)) {
            _imports = arrMap.call(_imports, function(name){
                return name.replace(rTrim, '');
            });
        }

        // fixes factory
        if (isFunction(_factory)) {
            factory_ = _factory;

            // extracts requires in the factory
            if (factory_.length) {
                if (undef === _imports) {
                    _imports = cjsImports;
                }
                _insides = extractFactoryRequires(_imports, _factory);
            }
        } else {
            factory_ = function(){
                return _factory;
            };
        }

        // fixes dependencies
        if (undef === _imports) {
            _imports = [];
        }

        // fixes name
        name_ = _name && nameNormalize(_name, configGlobal);

        // amd module in IE browser
        if (scriptState && _module) {
            return void(amdScriptQ[_module.name].push([name_, _imports, _insides, factory_]));
        }

        // amd module in other browsers
        if (!scriptState && (0 < runScripts) && (!name_ || name_ in actScripts)) {
            return void(amdScriptQ.push([name_, _imports, _insides, factory_]));
        }

        // global define / worker import module
        if (!name_ && 0 !== name_) {
            if (isWebWorker && 0 < amdImportQ.length) {
                name_ = amdImportQ[amdImportQ.length - 1].name;
            } else {
                name_ = 'unknown/' + (++unknowns);
                makeError({
                    message: 'undetectable module name.',
                    parent:  'global',
                    source:  factory || name_
                });
            }
        }
        _module = new Context(configGlobal).getModule(name_);
        moduleDefine(name_, _imports, _insides, factory_, _module);
        return name_;
    }

    /**
     * indicates define() is AMD
     * @type {Object}
     */
    define.amd = {
        version: '1.3.5',
        cache:   amdModules,
        jQuery:  true
    };

    /**
     * requires module(s)
     *
     * @param {string|Array} modules - module name(s), separated by ','
     * @param {?Function} [callback] - fired after all required modules defined,
     *   passes all modules exports as parameters by the given order
     * @param {?Function} [fallback] - function(reason)
     * @param {Config} [config=global] - internal use, config object
     * @param {string} [emitter="require"] - internal use, emitter name
     * @param {boolean} [frozen=false] - internal use, disallow name rewriting
     * @return {Promise}
     */
    function require(modules, callback, fallback, config, emitter, frozen){
        var _imports = modules;
        var _context = new Context(config instanceof Config ? config : configGlobal);
        var _emitter = isString(emitter) ? emitter : sRequire;
        var _simplex = false;
        var _insides;

        if (isString(modules)) {
            _imports = modules.split(rComma);
            _simplex = 2 > _imports.length;
        }

        if (isArray(_imports)) {
            _imports = arrMap.call(_imports, function(name){
                return name.replace(rTrim, '');
            });
        } else {
            throw new TypeError(_imports);
        }

        if (isFunction(callback)) {
            _insides = extractFactoryRequires(_imports, callback);
        }

        return loadModules(_context, _imports, _insides, _emitter, true === frozen).then(function(modules){
            if (isFunction(callback)) {
                return callback.apply(global, modules);
            } else {
                return _simplex ? modules[0] : modules;
            }
        }, function(reason){
            if (isFunction(fallback)) {
                return fallback.call(global, reason);
            } else {
                throw reason;
            }
        });
    }

    /**
     * gets / sets global config
     *
     * @param {Object} [config]
     * @param {boolean} [config.debug=false]
     * @param {number} [config.timeout=7] request timeout in second
     * @param {string} [config.urlBase=''] - base url
     * @param {string} [config.urlArgs=''] - url parameters
     * @param {string} [config.urlExt='.js'] - resource extension
     * @param {Object.<alias, path>} [config.pathMap] - mapping of path aliases
     * @param {Object.<string, string|function>} [config.shimMap] - mapping of shim factories
     * @param {function(name, parent)} [config.rewrite] - a function rewrites module name
     * @return {Config}
     */
    require.config = function(config){
        return configGlobal.merge(config).clone();
    };


    // local modules
    // =========================================================================

    /**
     * module 'require' factory
     *
     * @param {Context} context - module context
     * @param {string} parent - emitter name
     * @param {boolean} frozen - disallow name rewriting
     * @return {Function}
     */
    function cjsRequire(context, parent, frozen){
        return function(path, callback, fallback){
            if (path in context.requires) {
                if (isFunction(callback)) {
                    callback(context.requires[path]);
                } else {
                    return context.requires[path];
                }
            } else {
                require(path, callback, fallback, context.config, parent, frozen);
            }
        };
    }

    /**
     * module 'require' factory
     *
     * @param {Context} context - module context
     * @return {Object}
     */
    function cjsExports(context){
        return context.exports || (context.exports = {});
    }

    /**
     * module 'module' factory
     *
     * @param {Context} context - module context
     * @return {Object}
     */
    function cjsModule(context){
        return context.module || (context.module = {
            /** @type {Config} - module config */
            config: context.config,

            /** @type {Object} - module exports */
            exports: cjsExports(context),

            /** @type {Function} - module factory */
            factory: undef,

            /**
             * converts a name to a url
             * with given config or current config
             *
             * @param {string} name - name to convert
             * @param {Object} [config] - config object
             * @param {string} [config.urlBase]
             * @param {string} [config.urlExt]
             * @param {string} [config.urlArgs]
             * @param {string} [config.pathNow]
             * @param {Object} [config.pathMap]
             * @return {string}
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
     * @return {boolean}
     */
    locModules.isIE = function(){
        return isIE;
    };

    /**
     * module 'Deferred' factory
     *
     * @return {Function}
     */
    locModules.Deferred = function(){
        return Deferred;
    };


    // expose
    // =========================================================================

    global.amdr = {
        version: '1.3.5',
        config:  require.config,
        define:  global.define = define,
        require: global.require = require,
        origin:  {
            define:  oldDefine,
            require: oldRequire
        }
    };

}(this, /*@cc_on!@*/!1));
