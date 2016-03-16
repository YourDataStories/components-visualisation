var ydsDemo = angular.module('ydsDemo', ['ui.router', 'ui.bootstrap', 'oc.lazyLoad', 'yds']);

ydsDemo.run(function($rootScope, $location) {
	$rootScope.location = $location;
});

ydsDemo.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/');

	$stateProvider.state('home', {
		url: '/',
		templateUrl: 'templates-demo/home.html'
	})
	.state('search', {
		url: '/search',
		templateUrl: 'templates-demo/search.html'
	})
	.state('projects', {
		url: '/projects',
		templateUrl: 'templates-demo/resource.html'
	})
	.state('map', {
		url: '/map',
		templateUrl: 'templates-demo/map.html'
	})
	.state('geo-editing', {
		url: '/geo-editing',
		templateUrl: 'templates-demo/geo-editing.html'
	})
	.state('embed', {
		url: '/embed/:embedCode',
		template: '<yds-hybrid></yds-hybrid>'
	})
	.state('iframe', {
		url: '/iframe',
		templateUrl: 'templates-demo/iframe.html'
	})
	.state('browse', {
		url: '/browse',
		templateUrl: 'templates-demo/browse.html'
	})
	.state('workbench', {
		url: '/workbench',
		templateUrl: 'templates-demo/workbench.html'
	});
});

ydsDemo.run(function($rootScope, $templateCache) {
	$rootScope.$on('$stateChangeStart', function(event, next, current) {
		if (typeof(current) !== 'undefined'){
			$templateCache.remove(current.templateUrl);
		}
	});
});