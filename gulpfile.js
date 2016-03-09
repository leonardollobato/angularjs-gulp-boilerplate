var gulp = require('gulp'),
    args = require('yargs').argv,
    config = require('./gulp.config')(),
    del = require('del'),
    $ = require('gulp-load-plugins')({ lazy: true });

gulp.task('watcher:less', function() {
    gulp.watch(config.less, ['styles']);
});

gulp.task('styles', ['clean:styles'], function() {
    log('Compiling Less --> CSS');

    return gulp.src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({
            browser: [
                'last 2 version',
                '> 5%'
            ]
        }))
        .pipe(gulp.dest(config.temp));
});

gulp.task('clean:styles', function() {
    var files = config.temp + '**/*.css';
    clean(files);
});

gulp.task('vet', function() {
    log('Analyzing source with JSHing and JSCS');

    return gulp.src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs({ fix: true }))
        .pipe($.jscs.reporter())
        .pipe($.jscs.reporter('fail'))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe($.jshint.reporter('fail'));
});

function clean(path) {
    log($.util.colors.red.bold('Cleaning: ' + path));
    del.sync(path);
}

function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}
