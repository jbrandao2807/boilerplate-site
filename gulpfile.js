/**
 * Created by jonatan on 10/11/16.
 */
var gulp = require('gulp');
var Config = require('./gulpConfig');

// Plugins
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var del = require('del');
var inject = require('gulp-inject');
var injectPartials = require('gulp-inject-partials');
var less = require('gulp-less');
var newer = require('gulp-newer');
var path = require('path');
var Promise = require('bluebird');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');


gulp.task('clear-dist-folder', function () {

    return del.sync(['./dist/**', '!./dist']);


});

gulp.task('copy-assets-folder', function () {


    return gulp.src(['./src/assets/**', '!./src/assets/js/**/*'], {base: './src'})
        .pipe(newer('./dist'))
        .pipe(gulp.dest('./dist'));

});

gulp.task('process-global-less', function () {

    return gulp.src('./src/less/global.less')
        .pipe(newer('.dist/assets/css/global.bundle.css'))
        .pipe(sourcemaps.init())
        .pipe(less({paths: [path.join(__dirname, 'less', 'includes')]}))
        .pipe(concat('global.bundle.css'))
        .pipe(autoprefixer({browsers: ['> 1%']}))
        .pipe(sourcemaps.write(Config.sourcemap))
        .pipe(gulp.dest('./dist/assets/css'));
});

gulp.task('process-custom-less', function () {

    return gulp.src(['!./src/less/global.less', './src/less/**/*.less'])
        .pipe(sourcemaps.init())
        .pipe(less({paths: [path.join(__dirname, 'less', 'includes')]}))
        .pipe(autoprefixer({browsers: ['> 1%']}))
        .pipe(sourcemaps.write(Config.sourcemap))
        .pipe(gulp.dest('./dist/assets/css'));

});

gulp.task('common-js', function () {

    // Não usando streamseries, se não compilar corretamente, usar abaixo.
    // return streamSeries(gulp.src('./src/assets/js/jquery.js'), gulp.src('./src/assets/js/global.js'))
    return gulp.src(Config.commonJsFiles)
        .pipe(sourcemaps.init())
        .pipe(concat('global.bundle.js'))
        .pipe(uglify(Config.uglyJS))
        .pipe(sourcemaps.write(Config.sourcemap))
        .pipe(gulp.dest('./dist/assets/js'))


});

gulp.task('custom-js', function () {

    return gulp.src(['!./src/assets/js/global.js', './src/assets/js/**/*.js'])
        .pipe(sourcemaps.init())
        // .pipe(concat('global.bundle.js'))
        .pipe(uglify(Config.uglyJS))
        .pipe(sourcemaps.write(Config.sourcemap))
        .pipe(gulp.dest('./dist/assets/js'));

});

gulp.task('partial-injections', function () {

    return gulp.src(['./src/views/**/*.html', '!.src/views/**/*.html'])
        .pipe(injectPartials())
        .pipe(gulp.dest('./dist'));


});

gulp.task('injections', ['partial-injections'], function (done) {


    var sources = gulp.src(['./dist/**/*.html', '!./dist/partials/**/*.html']);
    sources = sources.pipe(injectPartials());

    console.log('====== START Bundling js pack: global');

    sources = sources.pipe(inject(gulp.src('./dist/assets/js/global.bundle.js', {read: false}), {
        name: 'global', addRootSlash: false,
        removeTags: false,
        ignorePath: 'dist'
    }));

    console.log('====== START Bundling js pack: global');

    for (var i = 0, l = Config.bundles.length; i < l; i++) {
        var bundle = Config.bundles[i];

        console.log('====== START Bundling js pack: ' + bundle.name);
        sources = sources.pipe(inject(gulp.src(bundle.js, {read: false}), {
            name: bundle.name, addRootSlash: false,
            removeTags: false,
            ignorePath: 'dist'
        }));

        console.log('====== FINISH Bundling js pack: ' + bundle.name);

        console.log('====== START Bundling css pack: ' + bundle.name);

        sources = sources.pipe(inject(gulp.src(bundle.css, {read: false}), {
            name: bundle.name, addRootSlash: false,
            removeTags: false,
            ignorePath: 'dist'
        }));

        console.log('====== FINISH Bundling css pack: ' + bundle.name);

    }

    sources.pipe(gulp.dest('./dist'));
    done();


});

gulp.task('rebuild-whole-project', function (done) {
    runSequence(
        'clear-dist-folder',
        'copy-assets-folder',
        'process-global-less',
        'process-custom-less',
        'common-js',
        'custom-js',
        'partial-injections',
        'injections',
        done
    )
});

gulp.task('default', ['rebuild-whole-project'], function () {

    //TODO fix watch for new files.
    browserSync.init({
        server: './dist',
        logLevel: 'alert',
        logPrefix: 'BS DEBUG: '
    });


    var commonJsFileNegative = [];
    for (var i = 0, l = Config.commonJsFiles.length; i < l; i++) {
        commonJsFileNegative.push('!' + Config.commonJsFiles[i]);
    }

    gulp.watch(['./src/assets/**/*.*', '!./src/assets/js/**/*.js'], ['copy-assets-folder']);
    gulp.watch('./src/less/global.less', ['process-global-less']);
    gulp.watch(['!./src/less/global.less', './src/less/**/*.less'], ['process-custom-less']);
    gulp.watch(Config.commonJsFiles, ['common-js']);
    gulp.watch(['./src/assets/js/**/*.js'].concat(commonJsFileNegative), ['custom-js']);
    gulp.watch(['./src/**/*.html'], ['injections']);

    var nextUpdate = null;

    gulp.watch(['./dist/**/*.*']).on('change', function () {

        console.log('Updating Browser');
        if (nextUpdate) {
            clearTimeout(nextUpdate);
            nextUpdate = null;
        }

        nextUpdate = setTimeout(function () {
            browserSync.reload()
        }, 150)
    });


});