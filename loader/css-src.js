/*!
 * CSS file loader for AMDR
 * (c) 2012 Shen Junru. MIT License.
 * http://github.com/xfsn/amdr
 */

// global imports:
//   document {createElement(), getElementsByTagName()}
//   devicePixelRatio
//   opera

// note:
//   *link.onload* & *link.onerror* events.
//   IE & Opera support 'onload' & 'onerror' correctly. others does not support.
//   Gecko creates link.sheet right after insert to document and creates
//   sheet.cssRules when file is loaded.
//   Webkit creates link.sheet & sheet.cssRules when file is loaded.
//   see: http://yearofmoo.com/2011/03/cross-browser-stylesheet-preloading/
//
//   *cross domain* sheet.cssRules retrieving.
//   Gecko throws security error when file is loaded.
//   Webkit does not throw any error, and sheet.cssRules always is null.

(function(global, isIE){
    'use strict';

    var // element: document
        document    = global.document,

        // element: resource insert point
        insertPoint = firstNodeOfTagName('head') || firstNodeOfTagName('script'),

        // flag: supports 'onload' & 'onerror' events
        linkOnEvent = isIE || '[object Opera]' === ({}).toString.call(global.opera),

        // flag: browser is based on Webkit
        isWebkit = !!global.devicePixelRatio,

        // event: onload
        eventOnload = linkOnEvent ? 'onload' : 'ondone',

        // event: onerror
        eventOnfail = linkOnEvent ? 'onerror' : 'onfail',

        idMap = {},
        links = {},
        queue = {},
        seed  = 0;

    define({
        load: function(name, resolve, reject){
            var id = idMap[name] || (idMap[name] = 'amdr-css-' + seed++),
                link;

            if (!links[id]) {
                links[id] = link = document.createElement('link');

                // events handlers
                link[eventOnload] = function(){
                    complete(id, link, true);
                    delay(resolve, link);
                };
                link[eventOnfail] = function(){
                    complete(id, link);
                    delay(reject, new Error('load failures.'));
                };
                // adds timeout id to queue
                queue[id] = setTimeout(function(){
                    complete(id, link);
                    delay(reject, new Error('load timeout.'));
                }, 7000); // TODO: get timeout config

                // attributes
                link.rel  = 'stylesheet';
                link.type = 'text/css';
                link.id   = id;
                link.href = name;

                // adds to dom tree
                insertPoint.appendChild(link);

                if (!linkOnEvent) {
                    checkQueue();
                }
            }
        }
    });

    function firstNodeOfTagName(name){
        return document.getElementsByTagName(name)[0];
    }

    function delay(func, param){
        setTimeout(function(){
            func(param);
        });
    }

    function complete(id, link, success){
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
            insertPoint.removeChild(link);
        }
    }

    function checkQueue(id /* var */){
        for (id in queue) {
            return checker();
        }
    }

    function checker(/* var */id , link, sheet, rules, cross){
        for (id in queue) {
            cross = isWebkit;
            link = links[id];
            // if file is loading, retrieves 'cssRules' property in firefox
            // will throws an error.
            if (sheet = link.sheet) {
                try { rules = sheet.cssRules; } catch(_) {
                    // Gecko: onload - cross domain
                    cross = _.code === _.SECURITY_ERR;
                }

                if (rules) {
                    link[rules.length ? eventOnload : eventOnfail]();
                } else if (cross) {
                    // Webkit/Gecko: onload - cross domain
                    link[eventOnload]();
                }
            }
        }
        setTimeout(checkQueue, 100);
    }

}(this, /*@cc_on!@*/!1));
