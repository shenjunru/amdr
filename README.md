# AMDR (Asynchronous Module Define & Require)

amdr.js is a small and very fast AMD-compliant asynchronous loader.<br>
Size: less than 7KB (3KB gzipped) using UglifyJS.

----------------------------------------

## Features:

* Loads CommonJS AMD-formatted javascript modules in parallel.
* Loads CommonJS Modules (v1.1 when wrapped in a `define()`)
* Loads non-AMD javascript files in parallel, too.
* Supports IE6+, FireFox, Chrome, Safari 3.2+, Opera 9.5+
* Tested with IE6+, FireFox 2+, Chrome 10+, Safari 4+, Opera 9.5+

## API:

* <code>define([name String], [dependencies Array], factory Function)</code>
* <code>require(dependencies Array|String[, callback Function[, fallback Function]])</code>

## Static Modules:
* "Promise" function
* "Deferred" function

## Promise API:
* <code>Promise(then Function)</code> is a abstract class.
* instance methods:
* <code>promise.then(callback Function[, fallback Function[, progback Function]])</code>
* <code>promise.always(alwaysBack Function)</code>
* static methods: (implements Promise/A)
* <code>Promise.resolve(promiseOrValue *)</code>
* <code>Promise.resolved([value *])</code>
* <code>Promise.rejected([reason *])</code>
* <code>Promise.when(promiseOrValue *[, callback Function[, fallback Function[, progback Function]]])</code>

## Deferred API:
* <code>Deferred()</code> is a class, implements Promise/A.
* instance methods:
* <code>deferred.promise</code> a promise instance (implemented Promise/A).
* <code>deferred.resolve([value *])</code> resolve promise.
* <code>deferred.reject([reason *])</code> reject promise.
* <code>deferred.notify([info *])</code> fires progbacks.
* <code>deferred.state()</code> returns "padding", "resolved" or "rejected"

## Module "has" API:
* <code>has(feature String) Boolean</code>
* <code>has.add(feature String, definition Boolean|Function)</code>
