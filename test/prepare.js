require.config({
    debug: true,
    timeout: 20,
    urlBase: 'test/..', // fake, point to current path
    pathMap: {
        "css": "../src/loader/css",
        "has": "../src/loader/has",
        "hot": "../src/loader/hot",
        'runner': 'runner.js',
        'foo': './foo/../', // fake, point to current path
        'bar': 'bar/..'     // fake, point to current path
    }
});
function wait(promise){
    promise.then(next, next);
    function next(){
        QUnit.start();
    }
}
