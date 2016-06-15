(function(worker){
    'use strict';

    function convert(args){
        return JSON.stringify(Array.prototype.slice.call(args));
    }

    function callback(){
        worker.postMessage({
            action: 'callback',
            returns: convert(arguments)
        });
    }

    function fallback(){
        worker.postMessage({
            action: 'fallback',
            returns: convert(arguments)
        });
    }

    worker.addEventListener('message', function(event){
        var action = event.data;
        action = (new Function('return ' + action))();
        if ('function' === typeof action) {
            action(worker, callback, fallback);
        }
    }, false);

    try {
        worker.importScripts('../src/amdr.js');
        worker.importScripts('./global.js');
        worker.postMessage({
            action: 'ready',
            returns: true
        });
    } catch(error) {
        worker.postMessage({
            action: 'ready',
            returns: error
        });
    }

})(this);
