angular.module('yds').directive('ydsSearchTabs', ['Data', 'Search', '$location', '$window',
    function(Data, Search, $location, $window){
        return {
            restrict: 'E',
            scope: {
                lang : '@'
            },
            templateUrl:'templates/search-tabs.html',
            link: function(scope) {
                scope.initialized = false;	// flag that indicated when the component is initialized
                scope.tabs = [];            // array with the tab names

                //check if the language attr is defined, else assign default value
                if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
                    scope.lang = "en";

                //callback function called after each search query
                var initTabs = function() {
                    // get categories for the tabs
                    Search.getSearchTabs().then(function(response) {
                        var tabToSelect = $location.search().tab;
                        if (_.isUndefined(tabToSelect)) {
                            tabToSelect = response.firstTab;
                        }
                        scope.tabs = response.tabs;

                        scope.tabs[tabToSelect].active = true;

                        scope.initialized = true;
                    });
                };

                scope.tabChangeHandler = function (tabName) {
                    // change the url parameter to reflect the tab change
                    $location.search("tab", tabName);
                };

                //watch location hash change in order to perform search query
                scope.$watch(function () { return $location.search() }, function (urlParams) {
                    if (!scope.initialized) {
                        // initialize tabs
                        initTabs();
                    }

                    //get the original search term from the url
                    var keyword = urlParams.q;

                    if (_.isUndefined(keyword) || keyword.trim() == "") {
                        return false;
                    }

                    Search.setKeyword(keyword);

                    // todo: update all grids in the tabs with the new search query
                });
            }
        };
    }]);