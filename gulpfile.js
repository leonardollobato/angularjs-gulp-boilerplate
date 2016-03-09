var gulp = require('gulp'),
    args = require('yargs').argv,
    config = require('./gulp.config')(),
    $ = require('gulp-load-plugins')({ lazy: true });

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
