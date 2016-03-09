var gulp = require('gulp'),
    args = require('yargs').argv,
    config = require('./gulp.config')(),
    del = require('del'),
    browserSync = require('browser-sync'),
    port = process.env.PORT || config.defaultPort,
    $ = require('gulp-load-plugins')({ lazy: true });


gulp.task('serve:dev', ['inject'], function() {
    var isDev = true;

    var nodeOptions = {
        script: config.nodeServer,
        delayTime: 0,
        env: {
            'PORT': port,
            'NODE_ENV': isDev ? 'dev' : 'build'
        },
        watch: [config.server]
    };

    return $.nodemon(nodeOptions)
        .on('restart', ['vet'], function(ev) {
            log('*** nodemon restarted ***');
            log('files changed on restart:\n' + ev);
            setTimeout(function() {
                browserSync.notify('reloading now...');
                browserSync.reload({ stream: false });
            }, config.browserReloadDelay);
        })
        .on('start', function() {
            log('*** nodemon started ***');
            startBrowserSync();
        })
        .on('crash', function() {
            log('!!!!!!! nodemon CRASHED !!!!!');
        })
        .on('exit', function() {
            log('*** nodemon bye bye ***');
        });
});


gulp.task('wiredep', function() {
    log('Wire up the bower css js and our app js into html');
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;

    return gulp.src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'styles'], function() {
    log('Wire up the app css into the html and call wiredep');
    return gulp.src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});

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

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync() {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting browser-sync');

    gulp.watch(config.less, ['styles'])
        .on('change', function(event) {
            changeEvent(event);
        });

    var options = {
        proxy: 'localhost:' + port + '/src/client/',
        port: 3000,
        files: [
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'Leonardo',
        notify: true,
        reloadDelay: 0
    };

    browserSync(options);
}

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
