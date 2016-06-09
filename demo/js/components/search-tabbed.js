angular.module('yds').directive('ydsSearchTabbed', ['$window', '$timeout', '$location', 'YDS_CONSTANTS', 'Search',
    function ($window, $timeout, $location, YDS_CONSTANTS, Search) {
    return {
        restrict: 'E',
        scope: {
            lang:'@',
            maxSuggestions: '@'     // maximum number of suggestions to show
        },
        templateUrl: 'templates/search-tabbed.html',
        link: function (scope) {
            scope.searchOptions = {
                lang: scope.lang,
                searchKeyword: ""
            };

            // check if the language attr is defined, else assign default value
            if(angular.isUndefined(scope.searchOptions.lang) || scope.searchOptions.lang.trim()=="")
                scope.searchOptions.lang = "en";

            // check if max suggestions attribute is defined, else assign default value
            if (_.isUndefined(scope.maxSuggestions) || scope.maxSuggestions.trim() == "") {
                scope.maxSuggestions = 5;
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
            }, function (newValue, oldValue) {
                if(!angular.isUndefined(newValue) && newValue!=scope.searchOptions.searchKeyword)
                    scope.searchOptions.searchKeyword = angular.copy(newValue);
            });

            /**
             * Function fired when the search button is clicked
             **/
            scope.search = function (searchForm) {
                //check if search box is empty
                if (!searchForm.$valid) {
                    $location.search("q", null);
                    Search.clearKeyword();
                } else {
                    $timeout(function() {
                        // append the query and current tab params to the search url
                        var baseUrl = (scope.searchOptions.lang == "en") ? YDS_CONSTANTS.SEARCH_RESULTS_URL_TABBED : YDS_CONSTANTS.SEARCH_RESULTS_URL_EL;

                        $window.location.href = baseUrl + "?q=" + scope.searchOptions.searchKeyword + "&tab=" + $location.search().tab;
                    });
                }
            };

            /**
             * Function to get search suggestions from the Search service
             * @param val   Input from the search bar
             */
            scope.getSuggestions = function(val) {
                return Search.getSearchSuggestions(val, scope.lang, scope.maxSuggestions);
            };
        }
    };
}]);