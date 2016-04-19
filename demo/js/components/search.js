angular.module('yds').directive('ydsSearch', ['$window', '$timeout', '$location', 'YDS_CONSTANTS', 'Search',
	function ($window, $timeout, $location, YDS_CONSTANTS, Search) {
	return {
		restrict: 'E',
		scope: {
			lang:'@',
			standalone: '@'
		},
		templateUrl: 'templates/search.html',
		link: function (scope, element) {
			scope.searchKeyword = "";
			var standalone = scope.standalone;

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
				scope.lang = "en";

			switch(scope.lang) {
				case "el":
					scope.placeholder = "Αναζήτηση για...";
					scope.searchBtnText = "Αναζήτηση";
					break;
				default:
					scope.placeholder = "Search for...";
					scope.searchBtnText = "Search";
			}

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

				$timeout(function() {
					//delete the query params
					delete $location.$$search.q;
					$location.$$compose();

					//append the query param to the search url
					if (scope.lang == "en")
						$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL + "?q=" + scope.searchKeyword;
					else if (scope.lang == "el")
						$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL_EL + "?q=" + scope.searchKeyword;
				}, 0);
			}
		}
	};
}]);