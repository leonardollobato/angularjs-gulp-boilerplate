(function() {
    'use strict';

    angular
        .module('landingApp', ['core'])
        .config(Router)
        .controller('MainLandingController', MainLandingController);

    MainLandingController.$inject = [];

    /* @ngInject */
    function MainLandingController() {
        var vm = this;
        console.log('landingApp is working 2');
    }

    Router.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

    /* @ngInject */
    function Router($stateProvider, $urlRouterProvider, $locationProvider) {

        console.log('route has been called');

        var layout = "app/layout/layout.html";

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
