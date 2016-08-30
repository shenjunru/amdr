# AMDR (Asynchronous Module Define & Require)
amdr.js is a small and very fast AMD-compliant asynchronous loader.<br>
Size: less than 11KB (>5KB gzipped) using UglifyJS.

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
* `config.debug` - boolean of amdr.js debug state (default is `false`)
* `config.timeout` - number of loading timeout in second (default is `7`)
* `config.urlBase` - string of base path (ex. '/path/to/base')
* `config.urlArgs` - string of request parameter(s) to be appended (ex. 'key1=value1&key2=value2')
* `config.urlExt` - string of default file extension (default is `'.js'`)
* `config.pathMap` - object of path mappings for module names not found directly under baseUrl.
  The path settings are assumed to be relative to baseUrl, unless the paths
  setting starts with a "/" or has a URL protocol in it ("like http:").
* `config.shimMap` - object of shim mappings for traditional module.
* `config.rewrite(name, parent)` - function to rewrite the module name.

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


## How to define a plugin:
* `exports.load(request Object, name String, parent String, parents Object)`
  + This function dose module resource loading, returns a promise or a value.
  + `request.config` - module config
  + `request.load([name String])` - uses default way to load a sub-module
  + `request.toUrl(name String, config Config)` - convert name to url by config
  + `name` - request module name
  + `parent` - parent module name
  + `parents` - parent module names
* `export.rewrite(name String, parent String)` - optional
  + This function does dependency name rewriting, returns a string.
  + `name` - request module name
  + `parent` - parent module name
* `export.normalize(name String, normalize Function)` - optional
  + This function does module name normalizing, returns a string.
  + `name` - name need to be converted
  + `normalize(name String)` - default normalizer


## CommonJS Modules:
* `require(path String, [callback Function], [fallback Function])` require other module under current module's context
* `exports` module exports object
* `module` module object
  + `module.config` - module config object
  + `module.exports` - object same as the `exports` module
  + `module.facorty` - function of module factory
  + `module.toUrl(name String, [config Object])` - converts a module name to the url by current module's context or the given config


## Circular Dependency
Use `require` module inside of a module to load a dynamic module.
This may help to solve some circular dependency issues.

----------------------------------------

## Built-in Module "Promise" API:

`Promise(then Function)` is a abstract class of [Promise/A][3].

The promise represents the *eventual outcome*, which is either fulfillment (success) and an associated value, or rejection (failure) and an associated *reason*.
The promise provides mechanisms for arranging to call a function on its value or reason, and produces a new promise for the result.

### Instance methods:
* `promise.then([callback Function], [fallback Function])`
  + `callback` to be called with the value after `promise` is fulfilled, or
  + `fallback` to be called with the rejection reason after `promise` is rejected.

### Static methods: (implements Promise/A)
* `Promise.resolve(promiseOrValue *)`
* `Promise.resolved([value *])`
* `Promise.rejected([reason *])`
* `Promise.when(promiseOrValue *, [callback Function], [fallback Function])`
  + If `promiseOrValue` is a value, arranges for `callback` to be called with that value, and returns a promise for the result.
  + If `promiseOrValue` is a promise, arranges for
    - `callback` to be called with the value after `promise` is fulfilled, or
    - `fallback` to be called with the rejection reason after `promise` is rejected.


## Built-in Module "Deferred" API:

`Deferred()` is a class, implements [Promise/A][3].

A deferred represents an operation whose resolution is *pending*.
It has separate `promise` and `resolver` parts that can be *safely* given out to separate groups of consumers and producers, respectively, to allow safe, one-way communication.

### Instance properties:
* `deferred.promise` a Promise instance (implemented [Promise/A][3]).

### Instance methods:
* `deferred.resolve([value *])` resolve promise.
* `deferred.reject([reason *])` reject promise.
* `deferred.state()` returns "padding", "resolved" or "rejected"
* `deferred.then([callback Function], [fallback Function])`.
  + `callback` to be called with the value after `promise` is fulfilled, or
  + `fallback` to be called with the rejection reason after `promise` is rejected.

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

----------------------------------------

## Changes:
* 1.3.x
  + rewrites core functions.
  + supports dependency name rewriting by plugin.
  + separates module defining and executing.
  + simplifies the internal plugin logic.
  + simplifies `Promise` and `Deferred`
    - removed `promise.always()` function.
    - removed `deferred.notify()` function.
    - removed `progback` parameter of `promise.then()`.
    - removed `progback` parameter of `deferred.then()`.
  + removed `hot` loader module.

* 1.2.x
  + supports module shim.
  + bug fix.

* 1.1.x
  + exposes module dependencies, factory, parent and status.
  + supports global module name rewriting.
  + supports WebWorker.
  + bug fix.

* 1.0.x
  + basic functionality.

----------------------------------------

## License
This project is released under MIT license.


[1]: http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition	"AMD Module"
[2]: http://wiki.commonjs.org/wiki/Modules/1.1	"CommonJS Module"
[3]: http://wiki.commonjs.org/wiki/Promises/A	"Promise/A"
