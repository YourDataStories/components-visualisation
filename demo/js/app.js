var ydsDemo = angular.module('ydsDemo', ['ui.router', 'ui.bootstrap', 'oc.lazyLoad', 'yds']);

ydsDemo.run(function($rootScope, $location) {
	$rootScope.location = $location;
});

// Controller to set base URL and project ID in Organisation buyer & seller demo pages
ydsDemo.controller('OrganisationController', ['$scope', '$location', function($scope, $location) {
	// Set base URL variable
	$scope.baseUrl = "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/redirect";

	// Set language
	$scope.lang = "el";

	// Get project ID from url parameters
	var projectId = $location.search().id;
	if (_.isUndefined(projectId) || projectId.length == 0) {
		// Set default project ID to be able to display the page
		projectId = "http://linkedeconomy.org/resource/Organization/997687930";

		console.warn("No project ID in URL parameters: using default ID");
	}

	$scope.projectId = projectId;
}]);

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
	.state('dashboardp1', {
		url: '/dashboardp1',
		templateUrl: 'templates-demo/dashboard-p1.html'
	})
	.state('public-works', {
		url: '/public-works',
		templateUrl: 'templates-demo/public-works.html'
	})
	.state('redirect', {
		url: '/redirect',
		template: '<div class="container"><h2>Redirecting...</h2></div>',
		controller: function($scope, $location) {
			// Check type url parameter and redirect to appropriate page
			var urlParams = $location.search();

			if (_.has(urlParams, "type")) {
				switch(urlParams.type) {
					case "Organisation.Buyer":
						$location.path("/organisation-buyer");
						break;
					case "Organisation.Seller":
						$location.path("/organisation-seller");
						break;
				}
			}
		}
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
	.state('contract-ted', {
		url: '/contract-ted',
		templateUrl: 'templates-demo/contract-ted.html',
		controller: function($scope) {
			// Set project ID and base URL variables
			$scope.projectId = "http://linkedeconomy.org/resource/Contract/AwardNotice/2015233765/6910539";
			$scope.baseUrl = "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/redirect";
		}
	})
	.state('organisation-buyer', {
		url: '/organisation-buyer',
		templateUrl: 'templates-demo/organisation-buyer.html',
		controller: 'OrganisationController'
	})
	.state('organisation-seller', {
		url: '/organisation-seller',
		templateUrl: 'templates-demo/organisation-seller.html',
		controller: 'OrganisationController'
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