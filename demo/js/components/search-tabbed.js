angular.module('yds').directive('ydsSearchTabbed', ['$window', '$timeout', '$location', 'YDS_CONSTANTS', 'Search',
    function ($window, $timeout, $location, YDS_CONSTANTS, Search) {
    return {
        restrict: 'E',
        scope: {
            lang:'@'
        },
        templateUrl: 'templates/search-tabbed.html',
        link: function (scope) {
            scope.searchOptions = {
                lang: scope.lang,
                searchKeyword: ""
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

            scope.$watch(function () {
                return Search.getKeyword();
            }, function (newValue, oldValue) {
                if(!angular.isUndefined(newValue) && newValue!=scope.searchOptions.searchKeyword)
                    scope.searchOptions.searchKeyword = angular.copy(newValue);
            });

            /**
             * function fired when the search button is clicked
             **/
            scope.search = function (searchForm) {
                //check if search box is empty
                if (!searchForm.$valid) {
                    return false;
                }

                $timeout(function() {
                    // append the query and current tab params to the search url
                    var baseUrl = (scope.searchOptions.lang == "en") ? YDS_CONSTANTS.SEARCH_RESULTS_URL_TABBED : YDS_CONSTANTS.SEARCH_RESULTS_URL_EL;

                    $window.location.href = baseUrl + "?q=" + scope.searchOptions.searchKeyword + "&tab=" + $location.search().tab;
                });
            };
        }
    };
}]);