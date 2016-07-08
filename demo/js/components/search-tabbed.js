angular.module('yds').directive('ydsSearchTabbed', ['$window', '$timeout', '$location', 'YDS_CONSTANTS', 'Search', 'queryBuilderService',
    function ($window, $timeout, $location, YDS_CONSTANTS, Search, queryBuilderService) {
    return {
        restrict: 'E',
        scope: {
            lang:'@',
            maxSuggestions: '@'     // maximum number of suggestions to show
        },
        templateUrl: 'templates/search.html',
        link: function (scope) {
            scope.searchOptions = {
                lang: scope.lang,
                standalone: scope.standalone,
                advancedVisible: false,
                searchKeyword: ""
            };

            // check if the language attr is defined, else assign default value
            if(angular.isUndefined(scope.searchOptions.lang) || scope.searchOptions.lang.trim()=="")
                scope.searchOptions.lang = "en";

            // check if max suggestions attribute is defined, else assign default value
            if (_.isUndefined(scope.maxSuggestions) || scope.maxSuggestions.trim() == "") {
                scope.maxSuggestions = 15;
            }

            switch(scope.searchOptions.lang) {
                case "el":
                    scope.placeholder = "Αναζήτηση για...";
                    scope.searchBtnText = "Αναζήτηση";
                    break;
                default:
                    scope.placeholder = "Search for...";
                    scope.searchBtnText = "Search";
            }

            scope.$watch(function () {
                return Search.getKeyword();
            }, function (newValue) {
                if(!angular.isUndefined(newValue) && newValue!=scope.searchOptions.searchKeyword)
                    scope.searchOptions.searchKeyword = angular.copy(newValue);
            });

            //check if the standalone attr is defined, else assign default value
            if(angular.isUndefined(scope.searchOptions.standalone) || (scope.searchOptions.standalone!="true" && scope.searchOptions.standalone!="false"))
                scope.searchOptions.standalone = "false";

            /**
             * Function fired when the search button is clicked
             */
            scope.search = function (searchForm) {
                //check if search box is empty
                if (!searchForm.$valid) {
                    $location.search("q", null);
                    Search.clearKeyword();
                } else {
                    $timeout(function() {
                        // append the query and current tab params to the search url
                        var baseUrl = (scope.searchOptions.lang == "en") ? YDS_CONSTANTS.SEARCH_RESULTS_URL_TABBED : YDS_CONSTANTS.SEARCH_RESULTS_URL_EL;
                        var tabParam = (_.isUndefined($location.search().tab)) ? "" : "&tab=" + $location.search().tab;

                        $window.location.href = baseUrl + "?q=" + scope.searchOptions.searchKeyword + tabParam;
                    });
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
             * Function fired when the advanced search button is clicked
             */
            scope.advancedSearch = function () {
                var rules = queryBuilderService.getRules();

                if (!_.isEmpty(rules)) {
                    scope.validationError = false;
                    console.log(rules);
                } else {
                    scope.validationError = true;
                }

                //get the form's inputs and initialize the required variables
                // var advancedQuery = "";
                // var queryTokens = [];
                // var queryParams = {
                // 	CPV: searchForm["cpv"].$viewValue.trim(),
                // 	Importer: searchForm["importer"].$viewValue.trim(),
                // 	Exporter: searchForm["exporter"].$viewValue.trim()
                // };
                //
                // //iterate through the advanced query's params and format them
                // _.each(queryParams, function(value, key) {
                // 	if (value.length > 0)
                // 		queryTokens.push(extractAdvQueryParams(value, key));
                // });
                //
                // //if the user has provided input for at least one advanced search param, refresh the query params
                // if (queryTokens.length>0) {
                // 	advancedQuery = queryTokens.join(" AND ");
                //
                // 	$timeout(function() {
                // 		//append the query param to the search url
                // 		if (scope.searchOptions.lang == "en")
                // 			$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL + "?q=" + advancedQuery;
                // 		else
                // 			$window.location.href = YDS_CONSTANTS.SEARCH_RESULTS_URL_EL + "?q=" + advancedQuery;
                // 	});
                // }
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
}]);