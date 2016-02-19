angular.module('yds').directive('ydsSearch', ['$window', '$rootScope', '$location','YDS_CONSTANTS', 'Search', 'Data',
	function ($window, $rootScope, $location, YDS_CONSTANTS, Search, Data) {
	return {
		restrict: 'E',
		scope: {
			standalone: '@'
		},
		templateUrl: 'templates/search.html',
		link: function (scope, element) {
			scope.searchKeyword = "";
			scope.placeholder = "Search for...";
			var standalone = scope.standalone;

			//check if the standalone attr is defined, else assign default value
			if(angular.isUndefined(standalone) || (standalone!="true" && standalone!="false"))
				standalone = "false";

			//if back button was pressed for navigation, restore old content
			if($rootScope.actualLocation === $location.path())
				Data.backButtonUsed();
			else {
				Data.backButtonNotUsed();
				Search.clearKeyword();
			}

			//initialize search keyword using the search service
			var initialKeyword = Search.getKeyword();

			if (!angular.isUndefined(initialKeyword))
				scope.searchKeyword = angular.copy(initialKeyword);

			scope.search = function (searchForm) {
				//check if search box is empty
				if (!searchForm.$valid)
					return false;

				//store the search keyword inside the Search Service
				Search.setKeyword(scope.searchKeyword);

				//if search component is standalone, redirect to the search results
				if (standalone === "true") {
					var redirectURL = YDS_CONSTANTS.SEARCH_RESULTS_URL;
					$window.location.href = redirectURL;
				}
			}

		}
	};
}]);