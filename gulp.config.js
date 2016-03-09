module.exports = function() {
    var client = './src/client/';
    var root = './';
    var clientApp = client + 'app/';
    var server = './node_modules/http-server/bin/';
    var temp = './.tmp/';

    var config = {
        temp: temp,
        alljs: [
            './src/**/*.js',
            './*.js'
        ],
        browserReloadDelay: 1000,
        build: './build/',
        client: client,
        css: [
            temp + 'styles.css'
        ],
        fonts: [
            './bower_components/font-awesome/fonts/*.*',
            './bower_components/bootstrap/dist/fonts/*.*'
        ],
        html: '**/*.html',
        htmltemplates: clientApp + '**/*.html',
        images: [
            client + 'images/**/*.*'
        ],
        index: client + 'index.html',
        js: [
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],
        less: [
            client + '/styles/styles.less'
        ],
        optimized: {
            app: 'app.js',
            lib: 'lib.js'
        },
        root: root,
        server: server,
        bower: {
            json: require('./bower.json'),
            directory: './bower_components',
            ignorePath: '../..'
        },
        packages: [
            './package.json',
            './bower.json',
        ],
        templateCache: {
            file: 'templates.js',
            options: {
                module: 'core',
                standAlone: false,
                root: 'app/'
            }
        },
        defaultPort: 7203,
        nodeServer: './node_modules/http-server/bin/http-server',

    };

    config.getWiredepDefaultOptions = function() {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };

        return options;
    };

    return config;
};
