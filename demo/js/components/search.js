angular.module('yds').directive('ydsSearch', ['$window', '$rootScope', '$location','YDS_CONSTANTS', 'Search',
	function ($window, $rootScope, $location, YDS_CONSTANTS, Search) {
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

			if (standalone !== "true") {
				scope.$watch(function () {
					return Search.getKeyword();
				}, function (newValue, oldValue) {
					if(!angular.isUndefined(newValue) && newValue!=scope.searchKeyword)
						scope.searchKeyword = angular.copy(newValue);
				});
			}

			scope.search = function (searchForm) {
				//check if search box is empty
				if (!searchForm.$valid)
					return false;

				var redirectURL = YDS_CONSTANTS.SEARCH_RESULTS_URL;
				$window.location.href = redirectURL + "#q=" +  scope.searchKeyword;
			}

		}
	};
}]);