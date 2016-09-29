var ydsDemo = angular.module('ydsDemo', ['ui.router', 'ui.bootstrap', 'oc.lazyLoad', 'yds']);

ydsDemo.run(function($rootScope, $location) {
	$rootScope.location = $location;
});

ydsDemo.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
	$urlRouterProvider.otherwise('/search');
	$locationProvider.hashPrefix('!');

	$stateProvider.state('search', {
		url: '/search',
		templateUrl: 'templates-demo/search.html'
	})
	.state('search-el', {
		url: '/search-el',
		templateUrl: 'templates-demo/search-el.html'
	})
	.state('search-tabbed', {
		url: '/search-tabbed',
		templateUrl: 'templates-demo/search-tabbed.html'
	})
	.state('dashboard', {
		url: '/dashboard',
		templateUrl: 'templates-demo/dashboard.html'
	})
	.state('dashboard2', {
		url: '/dashboard2',
		templateUrl: 'templates-demo/dashboard2.html'
	})
	.state('project2', {
		url: '/project2',
		templateUrl: 'templates-demo/project2.html'
	})
	.state('projects', {
		url: '/projects',
		templateUrl: 'templates-demo/resource.html',
		controller: function($scope) {
			$scope.disqusConfig = {
				disqus_shortname: 'ydscommentstest',
				disqus_identifier: 'projects',
				disqus_url: 'http://ydsdev.iit.demokritos.gr/YDSComponents/#!/projects'
			};
		}
	})
	.state('projects-el', {
		url: '/projects-el',
		templateUrl: 'templates-demo/resource-el.html'
	})
	.state('map', {
		url: '/map',
		templateUrl: 'templates-demo/map.html'
	})
	.state('geo-editing', {
		url: '/geo-editing',
		templateUrl: 'templates-demo/geo-editing.html'
	})
	.state('cache', {
		url: '/cache',
		templateUrl: 'templates-demo/cache-management.html'
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