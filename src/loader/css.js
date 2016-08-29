/*!
 * AMDR - CSS file loader 1.1.0 (sha1: 0a8ff25aabcb03682ff9e93446063beeff34f926)
 * (c) 2012~2016 Shen Junru. MIT License.
 * https://github.com/shenjunru/amdr
 */

// global imports:
//   document {createElement(), getElementsByTagName()}
//   opera

// note:
//   *link.onload* & *link.onerror* events.
//   IE:     always fire, even 404. no 'onerror'.
//   Opera:  only fired when request is success(2xx). no 'onerror'.
//   Gecko:  FireFox > 9 support. other version creates 'link.sheet'
//           right after insert to document and creates 'sheet.cssRules'
//           when request is completed.
//   Webkit: Chrome > 19 and Safari 6 support. other version creates
//           'link.sheet' and 'sheet.cssRules' when request is completed.
//   see: http://yearofmoo.com/2011/03/cross-browser-stylesheet-preloading/
//
//   *cross domain* sheet.cssRules retrieving.
//   IE:     only cross domain failed will throw security error.
//   Opera:  always no sheet.cssRules property.
//   Gecko:  throws security error when file is loaded.
//   Webkit: no error thrown, and sheet.cssRules always is null.
//
//   *opera*, sets timeout as 3sec, because opera does not support 'onerror'
//   and no other way to detect failed request. and only 'load timeout' will be
//   thrown for failed request.

// browsers features:
//        | create | insert |  200 & origin  | 200 & cross | 404 & origin | 404 & cross |
// -------|--------|--------|----------------|-------------|--------------|-------------|
// IE     |  sheet |    -   |                onload & rules               / rules=error |
// -------|--------|--------|----------------|-------------|--------------|-------------|
// Opera  |  rules |    -   | onload & rules / rules=error |              -             |
// -------|--------|--------|----------------|-------------|--------------|-------------|
// Gecko  |    -   |  sheet |      rules     | rules=error |    rules=0   | rules=error |
// -------|--------|--------|----------------|-------------|--------------|-------------|
// Webkit |    -   |    -   | sheet & rules  |                  sheet                   |

(function(global, isIE, undef){
    'use strict';

    var // element: document
        document    = global.document,

        // element: resource insert point
        insertPoint = firstNodeOfTagName('head') || firstNodeOfTagName('script'),

        // function: reference of setTimeout function
        setTimeout   = global.setTimeout,

        // function: reference of clearTimeout function
        clearTimeout = global.clearTimeout,

        // flag: browser detecting
        isWebkit = 'webkitAppearance' in document.documentElement.style,
        isOpera  = '[object Opera]' === ({}).toString.call(global.opera),

        // flag: skips browser features detecting
        skipTest = isIE || isOpera,

        // flag: waits browser features detecting
        waitTest = !skipTest,

        // flag: IE & Opera only support 'onload' event
        catchOnload = skipTest || undef,
        catchOnfail = skipTest ? false : undef,

        // event names
        eventOnload = 'onload',
        eventOnfail = 'onerror',

        // collection: link requests
        requests = {},

        // collection: link elements
        elements = {},

        // collection: loading timeouts
        queue = {},

        // collection: delayed define
        delay = [],

        // timer: loading complete checker
        timer = 0;

    // browser features detecting
    // uses data url to avoid extra requests
    skipTest || testFeature(eventOnload, 'data:text/css;base64,', function(result){
        catchOnload = result; //            ^empty data url^
        if (undef !== catchOnfail) {
            testComplete();
        }
    });
    skipTest || testFeature(eventOnfail, isWebkit ? 'data:' : 'data:,', function(result){
        catchOnfail = result; //                    ^webkit^  ^gecko^
        if (undef !== eventOnload) {
            testComplete();
        }
    });

    define('css', ['exports', 'Deferred'], function(exports, Deferred){
        'use strict';

        exports.version = '1.1.0';

        exports.load = function(request, name){
            var _name = name.split('#').shift();

            if (requests.hasOwnProperty(_name)) {
                return requests[_name].promise;
            }

            var deferred = new Deferred();
            requests[_name] = deferred;

            // waiting for browser features detecting
            if (waitTest) {
                delay.push([_name, request, deferred]);

            // defines current one
            } else {
                moduleDefine.call(global, _name, request, deferred);
            }

            return deferred.promise;
        };

        return exports;
    });

    function moduleDefine(name, request, deferred){
        var link = elements[name] = createLink(name);

        // events handlers
        link[eventOnload] = function(rules){
            if (!catchOnload || hasCssRule(link)) {
                // load success
                moduleComplete(name, link, true);
                delayExecute(deferred.resolve, link);
            } else {
                // load failure: rules=0
                link[eventOnfail]();
            }
        };
        link[eventOnfail] = function(){
            moduleComplete(name, link);
            delayExecute(deferred.reject, new Error('load failures.'));
        };
        // adds timeout handler to queue
        queue[name] = setTimeout(function(){
            moduleComplete(name, link);
            delayExecute(deferred.reject, new Error('load timeout.'));
        }, isOpera ? 3000 : 1000 * request.config.timeout);

        // inserts to document
        insertPoint.appendChild(link);

        // Opera & no events supported browsers
        // uses styleSheet checking
        if (!skipTest && !timer && (!catchOnfail || !catchOnload)) {
            checkComplete();
        }
    }

    function moduleComplete(name, link, success){
        // stops timeout timer
        clearTimeout(queue[name]);

        // removed from queue
        delete queue[name];

        // releases memory
        elements[name] = 1;

        // removed events handlers, prevents memory leaks
        link[eventOnfail] = link[eventOnload] = '';

        // if error occurs, remove from dom tree
        if (!success) {
            insertPoint.removeChild(link);
        }
    }

    function firstNodeOfTagName(name){
        return document.getElementsByTagName(name)[0];
    }

    function createLink(href){
        var link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = href;
        return link;
    }

    function testFeature(event, href, callback){
        var link  = createLink(href),
        fired = false,
        allow = 2;

        link[event] = function(){
            fired = true;
        };
        insertPoint.appendChild(link);

        (function test(){
            if (fired) {
                callback(true);
                insertPoint.removeChild(link);
            } else if (allow--) {
                setTimeout(test, 0);
            } else {
                callback(false);
                insertPoint.removeChild(link);
            }
        })();
    }

    function testComplete(){
        waitTest = false;

        // defines delayed first
        while (delay.length) {
            moduleDefine.apply(global, delay.shift());
        }
    }

    function delayExecute(func, param){
        setTimeout(function(){
            func(param);
        }, 0);
    }

    function hasCssRule(link){
        try {
            var sheet = link.sheet || link.styleSheet;
            var rules = sheet.rules || sheet.cssRules;
            return !rules /* Webkit */ || 0 < rules.length;
        } catch(error) {
            // IE only throws error when cross domain request failed.
            return !isIE && isCrossDomain(error);
        }
    }

    function checkComplete(){
        var name, link, sheet, rules, cross;

        for (name in queue) {
            cross = isWebkit;
            link = elements[name];

            // Webkit: creates link.sheet right after file loaded
            if (sheet = link.sheet) {
                // Gecko: also throws error when loading
                try { rules = sheet.cssRules; } catch(error) {
                    // Opera/Gecko: onload - cross domain
                    cross = isCrossDomain(error);
                }

                if (rules) {
                    link[rules.length ? eventOnload : eventOnfail]();
                } else if (cross) {
                    link[eventOnload]();
                }
            }
        }

        // continue or stop
        timer = name ? setTimeout(checkComplete, 100) : 0;
    }

    function isCrossDomain(error){
        return isOpera || error.code === (error.SECURITY_ERR || 1000);
    }

}(this, /*@cc_on!@*/!1));
