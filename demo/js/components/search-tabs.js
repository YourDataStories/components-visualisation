angular.module('yds').directive('ydsSearchTabs', ['Data', 'Search', '$location', '$window',
    function(Data, Search, $location, $window){
        return {
            restrict: 'E',
            scope: {
                lang : '@'
            },
            templateUrl:'templates/search-tabs.html',
            link: function(scope) {
                scope.initialized = false;		//flag that indicated when the component is initialized

                scope.tabs = [];

                //check if the language attr is defined, else assign default value
                if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
                    scope.lang = "en";

                //callback function called after each search query
                var initTabs = function() {
                    // get categories for the tabs
                    Search.getSearchTabs().then(function(response) {
                        scope.tabs = response;
                    });

                    scope.initialized = true;
                };

                scope.tabChangeHandler = function (tabIndex) {
                    console.log("tab changed to " + tabIndex + " (" + scope.tabs[tabIndex] + ")");
                };

                //watch location hash change in order to perform search query
                scope.$watch(function () { return $location.search() }, function (urlParams) {
                    if (!scope.initialized) {
                        // initialize tabs
                        initTabs();
                    } else {
                        //get the original search term from the url
                        var keyword = urlParams.q;

                        if (_.isUndefined(keyword) || keyword.trim() == "") {
                            return false;
                        }

                        // todo: update all grids in the tabs with the new search query
                    }
                });
            }
        };
    }]);