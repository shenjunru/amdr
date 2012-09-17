(function(global, isIE){
    'use strict';

    var // element: document
        document    = global.document,

        // element: resource insert point
        insertPoint = firstNodeOfTagName('head') || firstNodeOfTagName('script'),

        // flag: supports 'onload' & 'onerror' events
        // only IE & Opera supports actually
        // see: http://yearofmoo.com/2011/03/cross-browser-stylesheet-preloading/
        linkOnEvent = isIE && '[object Opera]' === ({}).toString.call(global.opera),

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
                    complete(id, link);
                    resolve(link);
                };
                link[eventOnfail] = function(){
                    complete(id, link, true);
                    reject(new Error('load failures.'));
                };
                // adds timeout id to queue
                queue[id] = setTimeout(function(){
                    complete(id, link, true);
                    reject(new Error('load timeout.'));
                }, 7000);

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

    function complete(id, link, error){
        // stops timeout timer
        clearTimeout(queue[id]);

        // removed from queue
        delete queue[id];

        // removed events handlers, prevents memory leaks
        link[eventOnfail] = link[eventOnload] = '';

        // if error occurs, remove from dom tree
        if (error) {
            insertPoint.removeChild(link);
        }
    }

    function checkQueue(id /* var */){
        for (id in queue) {
            return checker();
        }
    }

    function checker(id /* var */, link /* var */, rules /* var */){
        for (id in queue) {
            link = links[id];
            // if file is loading, retrieves 'cssRules' property in firefox
            // will throws an error.
            try { if (rules = link.sheet && link.sheet.cssRules) {
                setTimeout(link[rules.length ? eventOnload : eventOnfail], 0);
            } } catch(_) {}
        }

        setTimeout(checkQueue, 100);
    }

}(this, /*@cc_on!@*/!1));
