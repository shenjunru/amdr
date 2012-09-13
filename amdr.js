/*!
 * AMDR <Asynchronous Module Define & Require>
 * (c) 2012 Shen Junru. MIT License.
 * http://github.com/xfsn/amdr
 */

// global exports:
//   define(identifier, dependencies, factory)
//   require(module, callback, fallback)
//   require.config([config]);

// global imports:
//   opera
//   event
//   document {createElement(), getElementsByTagName()}

// defined modules:
//   require, exports, module - CommonJS modules
//   AMD - self exports,
//     with config()
//     static methods
//   Promise - Promise abstract class,
//     with resolve(), resolved(), rejected() and when()
//     static methods implements Promise/A
//   Deferred - Deferred class,
//     Promise/A implementation

// Note:
//   #IE-SCRIPT-ONERROR:
//     script.onerror does not work in IE 6-8. There is no way to know if
//     loading a script generates a 404, worse, it triggers the
//     onreadystatechange with a complete state even in a 404 case.
//
//     script.onerror does work in IE 9+, but it has a bug where it does not
//     fire script.onload event handlers right after execution of script.
//     So script.onreadystatechange is still used. However, onreadystatechange
//     fires with a complete state before the script.onerror function fires.

(function(global, undef){
    'use strict';

    var // element: document
        document    = global.document,

        // element: resource insert point
        insertPoint = firstNodeOfTagName('head') || firstNodeOfTagName('script'),

        // element: script tester
        testScript  = document.createElement('script'),

        // event: onload
        eventOnload = 'onreadystatechange',

        // event: onerror
        eventOnfail = 'onerror',

        // flag: script parsing
        scriptParse = {},

        // flag: supports script readyState
        scriptState = eventOnload in testScript && !global.opera,

        // flag: supports script 'onerror' event
        scriptError = eventOnfail in testScript,

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
        rResource = /\/?[^\/]*$/,

        // regexp: end with '/'
        rEndSlash = /\/$/,

        // regexp: '?'
        rQizMark = /\?/,

        sDotPath = '/./',
        sRelPath = '/../',
        sSlash   = '/',

        cjsModules = 'require,exports,module',

        // function: reference of Object hasOwnProperty function
        hasOwn = Object.prototype.hasOwnProperty,

        // function: reference of Array indexOf function
        /** @private */
        indexOf = Array.prototype.indexOf || function(object, offset){
            var length = this.length;

            offset = offset ? ( offset < 0 ? Math.max(0, length + offset) : offset ) : 0;
            for (1; offset < length; offset++) {
                // skip accessing in sparse arrays
                if (offset in this && object === this[offset]) {
                    return offset;
                }
            }

            return -1;
        };


    // features detections
    // =========================================================================

    if (!scriptState) {
        eventOnload = 'onload';
    }


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

    function makeError(message){
        return new Error(message);
    }

    function makePromiseError(){
        return makeError('already fulfilled');
    }

    function firstNodeOfTagName(name){
        return document.getElementsByTagName(name)[0];
    }


    // script loader
    // =========================================================================

    /**
     * loads module by script element
     *
     * @param {Module} module
     * @private
     */
    function scriptLoad(module){
        var script = document.createElement('script');

        // sets module as executing
        module.padding = false;

        // adds to collection
        actScripts[module.id] = script;
        if (scriptState) {
            amdDefineQ[module.id] = [];
        }

        // adds 'onload' listener
        script[eventOnload] = scriptState ? function(){
            if (readyStates[script.readyState]) {
                // Note: #IE-SCRIPT-ONERROR
                script.timer = setTimeout(function(){
                    scriptComplete(module, script);
                }, 0);
            }
        } : function(event){
            if ('load' === event.type) {
                scriptComplete(module, script);
            }
        };

        // adds 'onerror' listener
        if (scriptError) { script[eventOnfail] = function(){
            // Note: #IE-SCRIPT-ONERROR
            if (scriptState) {
                clearTimeout(script.timer);
                delete script.timer;
            }
            scriptComplete(module, script, makeError('module load failure'));
        }; }

        // sets attributes
        script.charset = 'utf-8';
        script.type = 'text/javascript';
        script.src = module.url;

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
        script[eventOnload] = ''; if (scriptError) { script[eventOnfail] = ''; }

        // removes form collection
        delete actScripts[module.id];

        if (error) {
            // module rejected: script load failure
            module.reject(error);
        } else {
            // async module define
            var params, queue = amdDefineQ;

            if (scriptState) {
                queue = queue[module.id];
            }

            while (queue.length) {
                params = queue.shift();
                params.push(module);
                moduleDefine.apply(global, params);
            }

            if (scriptState) {
                delete queue[module.id];
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
        config.pathNow = path || '';
        config.pathMap = {};
        config.timeout = 7;
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
     * @param {String} [prefix=''] - prefix name
     * @return {Module}
     */
    Context.prototype.getModule = function(name, prefix){
        var id = (prefix ? prefix + '!' : '') + name;
        return amdModules[id] || (amdModules[id] = new Module(
            id, name, this.config
        ));
    };

    /**
     * module class
     *
     * @param {Config} config
     * @constructor
     * @private
     */
    function Module(id, name, config){
        var module   = this,
            deferred = new Deferred();

        config = config.clone();
        config.pathNow = name.replace(rResource, sSlash);

        // functions
        module.resolve = deferred.resolve;
        module.reject  = deferred.reject;

        // properties
        module.promise = deferred.promise;
        module.context = new Context(config);
        module.defined = false;
        module.padding = true;

        module.id   = id;
        module.name = name;
        module.url  = nameToUrl(name, config);

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
            var i, l;
            if (_fulfill) {
                for (i = 0, l = progbacks.length; i < l; i++) {
                    progbacks[i](update);
                }
            }
            throw makePromiseError();
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
     * converts name to url with config
     *
     * @param {String} name - normalized module name
     * @param {Config} config - config instance
     * @param {String} [ext='.js'] - resource extension
     * @return {String}
     * @private
     */
    function nameToUrl(name, config, ext){
        var url = name;
        if (!rExtUrl.test(url)) {
            url += (ext || '.js');
        }
        if (config.urlBase && !rAbsUrl.test(name)) {
            url = config.urlBase + url;
        }
        if (config.urlArgs) {
            url += (rQizMark.test(url) === -1 ? '?' : '&') + config.urlArgs;
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
        var idot, idir, flag;

        // cleans '/./'
        do {
            name = name.replace(rDotPath, sSlash);
            flag = name.indexOf(sDotPath) > -1;
        } while (flag);

        // cleans '/../'
        do {
            idot = name.indexOf(sRelPath);
            if (flag = (0 < idot)) {
                idir = name.lastIndexOf(sSlash, idot - 1);
                name = name.slice(0, idir < 0 ? 0 : idir)
                + name.slice(idot - name.length + 3);
            }
        } while (flag);

        return name;
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
                // joins path maps
                var maps = config.pathMap,
                    syms = name.split(sSlash),
                    i, path;

                for (i = syms.length; i > 0; i--) {
                    path = syms.slice(0, i).join(sSlash);
                    if (path = maps[path]) {
                        syms.splice(0, i, path);
                        break;
                    }
                }
                name = syms.join(sSlash);
            } else {
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
            prefix;

        if (-1 !== index) {
            prefix = name.substring(0, index);
            name   = name.substring(index + 1, name.length);
        } else {
            name = nameNormalize(name, config);
        }

        if (prefix) {
            prefix = nameNormalize(prefix, config);
        }

        return {
            prefix: prefix,
            name:   name
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
    function getCurrentMoudle(){
        var id;
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
     * @return {Promise} - module promise
     * @private
     */
    function loadModule(context, name, index){
        if (name in locModules) {
            return promiseResolved(locModules[name](context)).then(callback);
        }

        var config = nameParse(name, context.config),
            prefix = config.prefix,
            module, deferred, promise, loader;

        name = config.name;

        if (undef === prefix) {
            /* loads a module normally */

            // gets module instance
            module  = context.getModule(name);

            // module's promise will be returned
            promise = module.promise;

            if (module.padding) {
                scriptLoad(module);
            }
        } else {
            /* loads a module by another module<loader> */

            // a new deferred instance
            deferred = new Deferred();

            // deferred's promise will be returned
            promise = deferred.promise;

            if (prefix) {
                // gets module<loader> instance
                loader = context.getModule(prefix);

                // loads resource when module<loader> is resolved
                loader.promise.then(function(exports){
                    if (exports && exports.load) {
                        // normalizes resource name
                        if (exports.normalize) {
                            // TODO: ensures parameters
                            name = exports.normalize(name, function(name){
                                return nameNormalize(name, context.config);
                            });
                        } else {
                            name = nameNormalize(name, context.config);
                        }

                        // gets module instance of this resource
                        module = context.getModule(name, prefix);

                        // fulfills deferred's promise when module fulfilled
                        module.promise.then(deferred.resolve, deferred.reject);

                        if (!module.ready) {
                            // TODO: ensures parameters
                            exports.load(name, module.resolve, module.reject);
                        }
                    } else {
                        deferred.reject(makeError('"load" method undefined.'));
                    }
                }, deferred.reject);
            } else {
                deferred.reject(makeError('empty loader name.'));
            }
        }

        // returns a promise
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

    /**
     * loads modules
     *
     * @param {Context} context
     * @param {Array} modules
     * @param {Array} [requires]
     * @return {Promise} - context promise
     * @private
     */
    function loadModules(context, modules, requires){
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
                    loadModule(context, name, index < offset ? index : name)
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
                context.reject(makeError('context timeout.'));
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
        if (name && name !== module.id) {
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

        loadModules(context, dependencies, requires).then(callback, fallback);

        // resolves module
        function callback(exports){
            try {
                // executes module factory
                var returns = factory.apply(global, exports);
            } catch (reason) {
                // module rejected: module factory exception
                module.reject(reason);
            }

            // module resolved
            // priority CommonJS 'exports' / 'module.exports',
            // or use factory returns
            module.resolve(context.exports || returns);
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
            amdDefineQ[module.id].push([name, dependencies, requires, factory]);
        } else {
            amdDefineQ.push([name, dependencies, requires, factory]);
        }
    }

    /**
     * indicates define() is AMD
     * @type {Object}
     */
    define.amd = {
        version: '%VERSION%'
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

        return loadModules(context, modules, requires).then(function(modules){
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
            var urlBase = config.urlBase;
            //Make sure the urlBase ends in a slash.
            if (urlBase && !rEndSlash.test(urlBase)) {
                config.urlBase += '/';
            }
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
        // TODO: ensures properties
        return context.module || (context.module = {
            'exports': cjsExports(context),
            'toUrl': function(name, config){
                config = config || context.config;

                var index = name.lastIndexOf('.'),
                    ext   = '';

                if (-1 !== index) {
                    name = name.substring(0, index);
                    ext = name.substring(index, name.length);
                }

                name = nameNormalize(name, config);

                return nameToUrl(name, config, ext);
            }
        });
    }

    // defines CommonJS modules
    locModules.require = cjsRequire;
    locModules.exports = cjsExports;
    locModules.module  = cjsModule;

    // defines other modules

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

}(this));
