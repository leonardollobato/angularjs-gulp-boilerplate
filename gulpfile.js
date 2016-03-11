var gulp = require('gulp'),
    args = require('yargs').argv,
    config = require('./gulp.config')(),
    del = require('del'),
    browserSync = require('browser-sync'),
    port = process.env.PORT || config.defaultPort,
    $ = require('gulp-load-plugins')({ lazy: true });

gulp.task('help', $.taskListing);

gulp.task('default', ['opt']);

gulp.task('opt', ['inject', 'fonts', 'images'], function() {
    log('Optimizing the javascript, css and html');

    var assets = $.useref.assets({ searchPath: './' });
    var cssFilter = $.filter('**/*.css');
    var jsLibFilter = $.filter('**/' + config.optimized.lib);
    var jsAppFilter = $.filter('**/' + config.optimized.app);

    var templateCache = config.temp + config.templateCache.file;

    return gulp.src(config.index)
        .pipe($.plumber())
        .pipe($.inject(
            gulp.src(templateCache, { read: false }), {
                starttag: '<!-- inject:templates:js -->'
            }))
        .pipe(assets)
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore())
        .pipe(jsLibFilter)
        .pipe($.uglify())
        .pipe(jsLibFilter.restore())
        .pipe(jsAppFilter)
        .pipe($.ngAnnotate())
        .pipe($.uglify())
        .pipe(jsAppFilter.restore())
        .pipe($.rev())
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.revReplace())
        .pipe(gulp.dest(config.build))
        .pipe($.rev.manifest())
        .pipe(gulp.dest(config.build));
});

/**
 * Bump the version
 * --type=pre will bump the prerelease version *.*.*-x
 * --type=patch or no flag will bump the patch version *.*.x
 * --type=minor will bump the minor version *.x.*
 * --type=major will bump the major version x.*.*
 * --version=1.2.3 will bump to a specific version and ignore other flags
 */
gulp.task('version', function() {
    var msg = 'Versioning';
    var type = args.type;
    var version = args.version;
    var options = {};

    if (version) {
        options.version = version;
        msg += ' to ' + version;
    } else {
        options.type = type;
        msg += ' for a ' + type;
    }

    log(msg);

    return gulp.src(config.packages)
        .pipe($.bump(options))
        .pipe(gulp.dest(config.root));
});

gulp.task('fonts', ['clean:fonts'], function() {
    log('Copying the Fonts');

    return gulp.src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean:images'], function() {
    log('Copying the Images and Compressing them');

    return gulp.src(config.images)
        .pipe($.imagemin({ optimizationLevel: 4 }))
        .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('serve:dev', ['inject'], function() {
    server(true);
});

gulp.task('serve:build', ['opt'], function() {
    server(false);
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

gulp.task('inject', ['wiredep', 'styles', 'templatecache'], function() {
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

gulp.task('clean', function() {
    log('Cleaning Styles, Images and Fonts');
    var delconfig = [].concat(config.build, config.temp);
    clean(delconfig);
});

gulp.task('clean:fonts', function() {
    var files = config.build + 'fonts/**/*.*';
    clean(files);
});

gulp.task('clean:images', function() {
    var files = config.build + 'images/**/*.*';
    clean(files);
});

gulp.task('clean:styles', function() {
    var files = config.temp + '**/*.css';
    clean(files);
});

gulp.task('templatecache', ['clean:code'], function() {
    log('Creating AngularJS $templateCache');

    return gulp.src(config.htmltemplates)
        .pipe($.minifyHtml({ empty: true }))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.temp));
});
gulp.task('clean:code', function() {
    var files = [].concat(
        config.temp + '**/*.js',
        config.build + '**/*.html',
        config.build + 'js/**/*.js'
    );
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

function server(isDev) {
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
            startBrowserSync(isDev);
        })
        .on('crash', function() {
            log('!!!!!!! nodemon CRASHED !!!!!');
        })
        .on('exit', function() {
            log('*** nodemon bye bye ***');
        });
}

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync(isDev) {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting browser-sync');

    if (isDev) {
        gulp.watch(config.less, ['styles'])
            .on('change', function(event) {
                changeEvent(event);
            });
    } else {
        gulp.watch([config.less, config.js, config.html], ['opt', browserSync.reload])
            .on('change', function(event) {
                changeEvent(event);
            });
    }

    var options = {
        proxy: 'localhost:' + port + (isDev ? '/src/client/' : '/build'),
        port: 3000,
        files: isDev ? [
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ] : [],
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
