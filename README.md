# AMDR (Asynchronous Module Define & Require)
amdr.js is a small and very fast AMD-compliant asynchronous loader.<br>
Size: less than 10KB (>5KB gzipped) using UglifyJS.

----------------------------------------

## Features:
* Loads [CommonJS AMD-formatted javascript modules][1] in parallel.
* Loads [CommonJS Modules][2] (wrapped in a `define()`)
* Loads non-AMD javascript files in parallel, too.
* Supports IE6+, FireFox, Chrome, Safari 3.2+, Opera 9.5+
* Tested with IE6+, FireFox 2+, Chrome 10+, Safari 4+, Opera 9.5+


## Basic API:
* `define([name String], [dependencies Array], factory Function)`
* `require(dependencies Array|String[, callback Function[, fallback Function]])`
* `require.config([config Object])`


## Config:
* `config.config` - config object for module
* `config.timeout` - number of loading timeout in second (default is `7`)
* `config.debug` - boolean of amdr.js debug state (default is `false`)
* `config.urlBase` - string of base path (ex. '/path/to/base')
* `config.urlArgs` - string of request parameter(s) to be appended (ex. 'key1=value1&key2=value2')
* `config.urlExt` - string of default file extension (default is `'.js'`)
* `config.pathMap` - object of path mappings for module names not found directly under baseUrl.
  The path settings are assumed to be relative to baseUrl, unless the paths setting starts with a "/" or has a URL protocol in it ("like http:").

### Example:
    require.config({
      timeout: 15,
      urlBase: '/another/path',
      pathMap: {
        'foo': '../bar/'
      }
    });
    require(['foo/module', 'my/module', 'a.js', 'b.js'],
      function(fooModule, myModule) {
          //This function will be called when all the dependencies
          //listed above are loaded. Note that this function could
          //be called before the page is loaded.
          //This callback is optional.
      }
    );


## CommonJS Modules:
* `require(path String[, callback Function[, fallback Function]])` require other module under current module's context
* `exports` module exports object
* `module` module object
  * `module.exports` - object same as the `exports` module
  * `module.config()` - returns "config" property form the global config
  * `module.toUrl(path String[, config Object])` - converts a module name to the url by current module's context or the given config


## Circular Dependency
Use `require` module inside of a module to load a dynamic module.
This may help to solve some circular dependency issues.

----------------------------------------

## Built-in Module "Promise" API:

`Promise(then Function)` is a abstract class of [Promise/A][3].

The promise represents the *eventual outcome*, which is either fulfillment (success) and an associated value, or rejection (failure) and an associated *reason*.
The promise provides mechanisms for arranging to call a function on its value or reason, and produces a new promise for the result.

### Instance methods:
* `promise.then(callback Function[, fallback Function[, progback Function]])`
  * `callback` to be called with the value after `promise` is fulfilled, or
  * `fallback` to be called with the rejection reason after `promise` is rejected.
  * `progback` to be called with any progress updates issued by `promise`.
* `promise.always(alwaysBack Function)`
  * `alwaysBack` to be called with the value after `promise` is fulfilled, or with the rejection reason after `promise` is rejected.

### Static methods: (implements Promise/A)
* `Promise.resolve(promiseOrValue *)`
* `Promise.resolved([value *])`
* `Promise.rejected([reason *])`
* `Promise.when(promiseOrValue *[, callback Function[, fallback Function[, progback Function]]])`
  * If `promiseOrValue` is a value, arranges for `callback` to be called with that value, and returns a promise for the result.
  * If `promiseOrValue` is a promise, arranges for
    * `callback` to be called with the value after `promise` is fulfilled, or
    * `fallback` to be called with the rejection reason after `promise` is rejected.
    * `progback` to be called with any progress updates issued by `promise`.


## Built-in Module "Deferred" API:

`Deferred()` is a class, implements [Promise/A][3].

A deferred represents an operation whose resolution is *pending*.
It has separate `promise` and `resolver` parts that can be *safely* given out to separate groups of consumers and producers, respectively, to allow safe, one-way communication.

### Instance properties:
* `deferred.promise` a Promise instance (implemented [Promise/A][3]).

### Instance methods:
* `deferred.resolve([value *])` resolve promise.
* `deferred.reject([reason *])` reject promise.
* `deferred.notify([info *])` fires progbacks.
* `deferred.state()` returns "padding", "resolved" or "rejected"
* `deferred.then([callback Function[, fallback Function[, progback Function]]])`.
  * `callback` to be called with the value after `promise` is fulfilled, or
  * `fallback` to be called with the rejection reason after `promise` is rejected.
  * `progback` to be called with any progress updates issued by `promise`.

----------------------------------------

## Loader Module "css":
This is the css file loader.
* Usage: `require(['css!path/of/style.css']);`
* Export: `<link>` element of the `style.css`.


## Loader Module "has":
This is the conditional module loader.
* Usage: `require(['has!condition?module-a:module-b']);`
* Export: condition matched module exports.
* API:
  * `has(feature String) Boolean`
  * `has.add(feature String, definition Boolean|Function)`


## Loader Module "hot":
This is the hot module loader.
No different between uses `hot` loader and normal way in the first time.
After `hot.unload()` be called, only recalls the module factory in next time, will not reload resource.
* Usage: `require(['hot!module-c']);`
* Export: target module exports.
* API:
  * `hot.unload()` - cleans all hot modules exports.

----------------------------------------

## License
This project is released under MIT license.


[1]: http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition	"AMD Module"
[2]: http://wiki.commonjs.org/wiki/Modules/1.1	"CommonJS Module"
[3]: http://wiki.commonjs.org/wiki/Promises/A	"Promise/A"
