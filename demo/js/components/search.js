angular.module('yds').directive('ydsSearch', ['$window', '$timeout', '$location', 'YDS_CONSTANTS', 'Search',
	function ($window, $timeout, $location, YDS_CONSTANTS, Search) {
	return {
		restrict: 'E',
		scope: {
			lang:'@',
			standalone: '@'
		},
		templateUrl: 'templates/search.html',
		link: function (scope) {
			scope.searchOptions = {
				lang: scope.lang,
				standalone: scope.standalone,
				advancedVisible: false,
				searchKeyword: "",
				cpvKeyword: "",
				importerKeyword: "",
				exporterKeyword: ""
			};

			//check if the language attr is defined, else assign default value
			if(angular.isUndefined(scope.searchOptions.lang) || scope.searchOptions.lang.trim()=="")
				scope.searchOptions.lang = "en";

			switch(scope.searchOptions.lang) {
				case "el":
					scope.placeholder = "Αναζήτηση για...";
					scope.searchBtnText = "Αναζήτηση";
					break;
				default:
					scope.placeholder = "Search for...";
					scope.searchBtnText = "Search";
			}

			//check if the standalone attr is defined, else assign default value
			if(angular.isUndefined(scope.searchOptions.standalone) || (scope.searchOptions.standalone!="true" && scope.searchOptions.standalone!="false"))
				scope.searchOptions.standalone = "false";

			if (scope.searchOptions.standalone !== "true") {
				scope.$watch(function () {
					return Search.getKeyword();
				}, function (newValue, oldValue) {
					if(!angular.isUndefined(newValue) && newValue!=scope.searchOptions.searchKeyword)
						scope.searchOptions.searchKeyword = angular.copy(newValue);
				});
			}


			/**
			 * function fired when the search button is clicked
			 **/
			scope.search = function (searchForm) {
				//check if search box is empty
				if (!searchForm.$valid)
					return false;

				$timeout(function() {
					//append the query param to the search url
					if (scope.searchOptions.lang == "en")
						$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL + "?q=" + scope.searchOptions.searchKeyword;
					else
						$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL_EL + "?q=" + scope.searchOptions.searchKeyword;
				});
			};


			/**
			 * function to extract advanced search terms and format in Solr format
			 **/
			var extractAdvQueryParams = function (query, type) {
				var params = [];
				var tokens = query.split(" ");

				_.each(tokens, function(token){
					params.push(type + ":" + token)
				});

				return params.join(" AND ");
			};


			/**
			 * function fired when the advanced search button is clicked
			 **/
			scope.advancedSearch = function (searchForm) {
				//get the form's inputs and initialize the required variables
				var advancedQuery = "";
				var queryTokens = [];
				var queryParams = {
					CPV: searchForm["cpv"].$viewValue.trim(),
					Importer: searchForm["importer"].$viewValue.trim(),
					Exporter: searchForm["exporter"].$viewValue.trim()
				};

				//iterate through the advanced query's params and format them
				_.each(queryParams, function(value, key) {
					if (value.length > 0)
						queryTokens.push(extractAdvQueryParams(value, key));
				});

				//if the user has provided input for at least one advanced search param, refresh the query params
				if (queryTokens.length>0) {
					advancedQuery = queryTokens.join(" AND ");

					$timeout(function() {
						//append the query param to the search url
						if (scope.searchOptions.lang == "en")
							$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL + "?q=" + advancedQuery;
						else
							$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL_EL + "?q=" + advancedQuery;
					});
				}
			};


			/**
			 * function to show/hide the advanced search panel
			 **/
			scope.toggleAdvancedSearch = function() {
				$timeout(function(){
					scope.searchOptions.advancedVisible = !scope.searchOptions.advancedVisible;
				})
			}
		}
	};
}]);