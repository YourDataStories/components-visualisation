angular.module('yds').directive('ydsSearch', ['$window', '$timeout', '$location', 'YDS_CONSTANTS', 'Search', 'queryBuilderService',
	function ($window, $timeout, $location, YDS_CONSTANTS, Search, queryBuilderService) {
		return {
			restrict: 'E',
			scope: {
				lang:'@',				// Language of component
				urlParamPrefix: '@',	// Prefix to add before all url parameters (optional)
				watchRuleUrlParam: '@', // If Advanced Search should watch URL parameter for rule changes and apply them
				maxSuggestions: '@',	// Maximum suggestions to show in typeahead popup
				standalone: '@',		// If search component is standalone
				tabbed: '@',			// If search component is used in tabbed search (so it needs to use different URL)
                enableAdvSearch:'@',	// Set to false to disable advanced search (defaults to true)
				concept: '@',			// Concept for adv. search, used by QB for restoring rules from url parameters
				conceptId: '@'			// Concept id, used by advanced search for getting query builder rules
			},
			templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/search.html',
			link: function (scope) {
				scope.searchOptions = {
					lang: scope.lang,
					standalone: scope.standalone,
					advancedVisible: false,
					searchKeyword: ""
				};

				var paramPrefix = scope.urlParamPrefix;

				// Make advanced search visible if rules are defined in the URL
				if (!_.isUndefined($location.search()[paramPrefix + "rules"]) && scope.concept == $location.search()[paramPrefix + "tab"]) {
					scope.searchOptions.advancedVisible = true;
				}

				scope.validationError = false;						// When true, QueryBuilder validation error is shown

				// Check if the search is tabbed or not and use the correct url for requests (it defaults to not tabbed)
				if (_.isUndefined(scope.tabbed) || (scope.tabbed != "true" && scope.tabbed != "false")) {
					scope.tabbed = "false";
				}

				// Check if enableAdvSearch is defined else use default value
				if (_.isUndefined(scope.enableAdvSearch) || (scope.enableAdvSearch != "true" && scope.enableAdvSearch != "false")) {
					// If Search is tabbed enable advanced search by default, or disable it if
					scope.enableAdvSearch = scope.tabbed;
				}

				// If no url parameter prefix is defined or it is only whitespace, use no parameter prefix
				if (_.isUndefined(paramPrefix) || (paramPrefix.trim()=="" && paramPrefix.length > 0))
					paramPrefix = "";

				//check if the language attr is defined, else assign default value
				if(_.isUndefined(scope.searchOptions.lang) || scope.searchOptions.lang.trim()=="")
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

                // If search should watch URL parameters, it means it will change automatically, so make it visible
                if (scope.watchRuleUrlParam == "true" && scope.enableAdvSearch == "true") {
                    scope.searchOptions.advancedVisible = true;
                }

				// Check if max suggestions attribute is defined, else assign default value
				if (_.isUndefined(scope.maxSuggestions) || scope.maxSuggestions.trim() == "") {
					scope.maxSuggestions = 15;
				}

				// Check if the standalone attr is defined, else assign default value
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
						if (scope.searchOptions.standalone != "true") {
							// Create parameter names because they are used multiple times after this
							var queryParamName = paramPrefix + "q";
							var rulesParamName = paramPrefix + "rules";

							// Check if search box is empty
							if (!searchForm.$valid) {
								$location.search(queryParamName, null);
								$location.search(rulesParamName, null);
								Search.clearKeyword();
							} else {
								var prevQ = $location.search()[queryParamName];

								// In case the query didn't change, remove it to cause the grid-results to refresh
                                if (_.isEqual(prevQ, scope.searchOptions.searchKeyword)) {
                                    $location.search(queryParamName, null);
                                }

                                // After a timeout, set the correct query parameter
                                $timeout(function() {
                                    // Add new keyword to url params, and remove any rules because this is not advanced search
                                    $location.search(queryParamName, scope.searchOptions.searchKeyword);
                                    $location.search(rulesParamName, null);
                                });
							}
						} else if (searchForm.$valid) {
							// Standalone tabbed search
							var concept = scope.concept;

							if (!_.isUndefined(concept) && concept.trim().length > 0) {
								// Concept is defined and search is standalone, so use it as the tab for Tabbed search
								$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL_TABBED + "?q=" + scope.searchOptions.searchKeyword + "&tab=" + concept;
							} else {
								// No concept defined, go to tabbed search with no tab parameter
								$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL_TABBED + "?q=" + scope.searchOptions.searchKeyword;
							}
						}
					} else {
						// Check if search box is empty
						if (!searchForm.$valid)
							return false;

						// Append the query param to the search url
						if (scope.searchOptions.lang == "en")
							$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL + "?q=" + scope.searchOptions.searchKeyword;
						else
							$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL_EL + "?q=" + scope.searchOptions.searchKeyword;
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

							// Add new keyword and rules to the URL params
							$location.search(paramPrefix + "q", keyword);
							$location.search(paramPrefix + "rules", JSURL.stringify(rules));
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
					return Search.getSuggestions(val, scope.lang, scope.maxSuggestions);
				};

				/**
				 * Shows or hides the advanced search panel
				 */
				scope.toggleAdvancedSearch = function() {
					scope.searchOptions.advancedVisible = !scope.searchOptions.advancedVisible;
				};
			}
		};
	}
]);