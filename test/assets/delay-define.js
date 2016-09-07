define([
    'Deferred'
], function(Deferred){

    var time = new Date().valueOf();
    return new Deferred(function(resolve){
        setTimeout(function(){
            resolve(new Date().valueOf() - time);
        }, 1000);
    });

});
