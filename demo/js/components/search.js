angular.module('yds').directive('ydsSearch', ['$window', '$timeout', '$location', 'YDS_CONSTANTS', 'Search', 'queryBuilderService',
	function ($window, $timeout, $location, YDS_CONSTANTS, Search, queryBuilderService) {
		return {
			restrict: 'E',
			scope: {
				lang:'@',				// language of component
				maxSuggestions: '@',	// maximum suggestions to show in typeahead popup
				standalone: '@',		// if search component is standalone
				tabbed: '@',			// if search component is used in tabbed search (so it needs to use different URL)
				concept: '@'			// concept, used by advanced search for getting query builder rules
			},
			templateUrl: 'templates/search.html',
			link: function (scope) {
				scope.searchOptions = {
					lang: scope.lang,
					standalone: scope.standalone,
					advancedVisible: false,
					searchKeyword: ""
				};

				scope.validationError = false;						// When true, QueryBuilder validation error is shown

				// Check if the search is tabbed or not and use the correct url for requests (it defaults to not tabbed)
				if (_.isUndefined(scope.tabbed) || (scope.tabbed != "true" && scope.tabbed != "false")) {
					scope.tabbed = "false";
				}

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

				// check if max suggestions attribute is defined, else assign default value
				if (_.isUndefined(scope.maxSuggestions) || scope.maxSuggestions.trim() == "") {
					scope.maxSuggestions = 15;
				}

				//check if the standalone attr is defined, else assign default value
				if(angular.isUndefined(scope.searchOptions.standalone) || (scope.searchOptions.standalone != "true" && scope.searchOptions.standalone != "false"))
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
				 * Function fired when the search button is clicked
				 */
				scope.search = function (searchForm) {
					if (scope.tabbed == "true") {
						//check if search box is empty
						if (!searchForm.$valid) {
							$location.search("q", null);
							$location.search("rules", null);
							Search.clearKeyword();
						} else {
							$timeout(function() {
								// append the query and current tab params to the search url
								var baseUrl = (scope.searchOptions.lang == "en") ? YDS_CONSTANTS.SEARCH_RESULTS_URL_TABBED : YDS_CONSTANTS.SEARCH_RESULTS_URL_EL;
								var tabParam = (_.isUndefined($location.search().tab)) ? "" : "&tab=" + $location.search().tab;

								$window.location.href = baseUrl + "?q=" + scope.searchOptions.searchKeyword + tabParam;
							});
						}
					} else {
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
					}
				};

				/**
				 * Function fired when the advanced search button is clicked
				 */
				scope.advancedSearch = function () {
					if (queryBuilderService.hasNoFilters(scope.builderId)) {
						console.error("No filters available for this builder!");
						return;
					}

					var rules = queryBuilderService.getRules(scope.builderId);

					if (!_.isEmpty(rules)) {
						scope.validationError = false;

						// Add all search parameters to the URL so advanced search is performed by the active grid
						$timeout(function() {
							var keyword = scope.searchOptions.searchKeyword;
							if (_.isUndefined(keyword) || keyword.trim().length == 0) {
								keyword = "*";
							}

							// append the query, current tab params and query builder rules to the search url
							var baseUrl = (scope.searchOptions.lang == "en") ? YDS_CONSTANTS.SEARCH_RESULTS_URL_TABBED : YDS_CONSTANTS.SEARCH_RESULTS_URL_EL;
							var queryParam = "?q=" + keyword;
							var tabParam = (_.isUndefined($location.search().tab)) ? "" : "&tab=" + $location.search().tab;
							var rulesParam = "&rules=" + encodeURIComponent(JSON.stringify(rules));

							$window.location.href = baseUrl + queryParam + tabParam + rulesParam;
						});
					} else {
						scope.validationError = true;
					}
				};

				/**
				 * Gets search suggestions from the Search service
				 * @param val   Input from the search bar
				 */
				scope.getSuggestions = function(val) {
					return Search.getSearchSuggestions(val, scope.lang, scope.maxSuggestions);
				};

				/**
				 * Shows or hides the advanced search panel
				 */
				scope.toggleAdvancedSearch = function() {
					$timeout(function(){
						scope.searchOptions.advancedVisible = !scope.searchOptions.advancedVisible;
					});
				};
			}
		};
	}
]);