/*!
 * CSS file loader for AMDR
 * (c) 2012 Shen Junru. MIT License.
 * http://github.com/xfsn/amdr
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

        // collection: url maps id
        idMap = {},

        // collection: link elements
        links = {},

        // collection: loading timeouts
        queue = {},

        delay = [],

        // id seed
        seed  = 0,

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

    define({
        load: function(name, resolve, reject){
            var id = idMap[name] || (idMap[name] = 'amdr-css-' + seed++);

            if (!links[id]) {
                if (waitTest) {
                    // waiting for browser features detecting
                    delay.push([id, name, resolve, reject]);
                } else {
                    // defines current one
                    moduleDefine.call(global, id, name, resolve, reject);
                }
            }
        }
    });

    function moduleDefine(id, name, resolve, reject){
        var link = links[id] = createLink(name);

        // attributes
        link.id = id;

        // events handlers
        link[eventOnload] = function(rules){
            // IE always fire 'onload' even 404
            if (!skipTest || hasCssRule(link)) {
                // load success
                moduleComplete(id, link, true);
                delayExecute(resolve, link);
            } else {
                // load failure: IE loaded with rules=0
                link[eventOnfail]();
            }
        };
        link[eventOnfail] = function(){
            moduleComplete(id, link);
            delayExecute(reject, new Error('load failures.'));
        };
        // adds timeout id to queue
        queue[id] = setTimeout(function(){
            moduleComplete(id, link);
            delayExecute(reject, new Error('load timeout.'));
        }, isOpera ? 3000 : 7000); // TODO: get timeout config

        // inserts to document
        insertPoint.appendChild(link);

        // Opera & no events supported browsers
        // uses styleSheet checking
        if (!skipTest && !timer && (!catchOnfail || !catchOnload)) {
            checkComplete();
        }
    }

    function moduleComplete(id, link, success){
        // stops timeout timer
        clearTimeout(queue[id]);

        // removed from queue
        delete queue[id];

        // releases memory
        links[id] = 1;

        // removed events handlers, prevents memory leaks
        link[eventOnfail] = link[eventOnload] = '';

        // if error occurs, remove from dom tree
        if (!success) {
            //insertPoint.removeChild(link);
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
        });
    }

    function hasCssRule(sheet){
        try {
            sheet = sheet.sheet || sheet.styleSheet;
            return 0 < (sheet.rules || sheet.cssRules).length;
        } catch(_) {
            // cross domain:
            // IE: file unavailable.
            return !isIE || false;
        }
    }

    function checkComplete(/* var */id, link, sheet, rules, cross){
        for (id in queue) {
            cross = isWebkit;
            link = links[id];

            // Webkit: creates link.sheet right after file loaded
            if (sheet = link.sheet) {
                // Gecko: also throws error when loading
                try { rules = sheet.cssRules; } catch(_) {
                    // Opera/Gecko: onload - cross domain
                    cross = isOpera || _.code === (_.SECURITY_ERR || 1000);
                }

                if (rules) {
                    link[rules.length ? eventOnload : eventOnfail]();
                } else if (cross) {
                    link[eventOnload]();
                }
            }
        }

        // continue or stop
        timer = id ? setTimeout(checkComplete, 100) : 0;
    }

}(this, /*@cc_on!@*/!1));
