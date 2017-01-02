/**
 * Created by jonatan on 10/11/16.
 */


var loadParams = {
    DEBUG: true,
    pattern: ['gulp-*', 'gulp.*', 'stream-series', 'event-stream', 'path', 'del'],
    replaceString: /\bgulp[\-.]/
};

var sourcemapParams = './maps';
var uglyJSParams = {
    preserveComments: 'license'
};


var bundles = [
    {
        name: 'index',
        js: ['./dist/assets/js/index.js'],
        css: ['./dist/assets/css/index.css']
    }
]

module.exports = {
    gulpLoad: loadParams,
    sourcemap: sourcemapParams,
    uglyJS: uglyJSParams,
    commonJsFiles: ['./src/assets/js/global.js'],
    bundles: bundles,
    lazy: false
};