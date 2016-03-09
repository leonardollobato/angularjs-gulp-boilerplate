(function() {
    'use strict';

    angular
        .module('app', ['core'])
        .config(Router)
        .controller('MainController', MainController);

    MainController.$inject = [];

    /* @ngInject */
    function MainController() {
        var vm = this;
        console.log('App is working');
    }

    Router.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

    /* @ngInject */
    function Router($stateProvider, $urlRouterProvider, $locationProvider) {

        console.log('route has been called');

        var layout = 'app/views/layout/layout.html';

        // $locationProvider.html5Mode(true);
        $urlRouterProvider
            .otherwise('/');

        $stateProvider
            .state('/', {
                url: '/',
                //template: '<h1>Hello</h1>'
                templateUrl: layout
            })
            .state('dashboard', {
                url: '/contacts',
                //template: '<h1>Hello</h1>'
                templateUrl: 'app/views/dashboard.view.html'
            });
    }
})();
