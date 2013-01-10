# AMDR (Asynchronous Module Define & Require)
amdr.js is a small and very fast AMD-compliant asynchronous loader.<br>
Size: less than 8KB (>4KB gzipped) using UglifyJS.

----------------------------------------

## Features:
* Loads CommonJS AMD-formatted javascript modules in parallel.
* Loads CommonJS Modules (v1.1 when wrapped in a `define()`)
* Loads non-AMD javascript files in parallel, too.
* Supports IE6+, FireFox, Chrome, Safari 3.2+, Opera 9.5+
* Tested with IE6+, FireFox 2+, Chrome 10+, Safari 4+, Opera 9.5+

## API:
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
* `config.pathMap` - object of path mappings for module names not found directly under baseUrl.<br>
  The path settings are assumed to be relative to baseUrl, unless the paths setting starts with a "/" or has a URL protocol in it ("like http:").

## Example:
    <script src="scripts/amdr.js"></script>
    <script>
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
    </script>

## Builtin Modules:
* "Promise" class
* "Deferred" class
* "has" function

## Builtin Module "Promise" API:
* `Promise(then Function)` is a abstract class.
* instance methods:
* `promise.then(callback Function[, fallback Function[, progback Function]])`
* `promise.always(alwaysBack Function)`
* static methods: (implements Promise/A)
* `Promise.resolve(promiseOrValue *)`
* `Promise.resolved([value *])`
* `Promise.rejected([reason *])`
* `Promise.when(promiseOrValue *[, callback Function[, fallback Function[, progback Function]]])`

## Builtin Module "Deferred" API:
* `Deferred()` is a class, implements Promise/A.
* instance methods:
* `deferred.promise` a promise instance (implemented Promise/A).
* `deferred.resolve([value *])` resolve promise.
* `deferred.reject([reason *])` reject promise.
* `deferred.notify([info *])` fires progbacks.
* `deferred.state()` returns "padding", "resolved" or "rejected"

## Builtin Module "has" API:
* `has(feature String) Boolean`
* `has.add(feature String, definition Boolean|Function)`
