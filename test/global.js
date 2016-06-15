require.config({
    timeout: 20,
    urlBase: 'test/..', // fake, point to current path
    pathMap: {
        "loader": "../src/loader",
        'runner': 'runner.js',
        'foo': './foo/../', // fake, point to current path
        'bar': 'bar/..'     // fake, point to current path
    }
});
