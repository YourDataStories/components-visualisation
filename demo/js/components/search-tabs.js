angular.module('yds').directive('ydsSearchTabs', ['Data', 'Search', '$location', 'Translations',
    function(Data, Search, $location, Translations){
        return {
            restrict: 'E',
            scope: {
                lang : '@'
            },
            templateUrl:'templates/search-tabs.html',
            link: function(scope) {
                scope.initialized = false;	    // flag that indicated when the component is initialized
                scope.tabs = {};                // Object with tab information
                scope.showTabs = false;         // Indicates if the tabs should be shown
                scope.showNoResultsMsg = false; // Indicates if the no results message should be shown
                scope.translations = Translations.getAll(scope.lang);   // Translations used for no results message

                var prevQ = "";                 // Keeps previous search query value
                var prevTab = "";               // Keeps previous tab name value

                // check if the language attr is defined, else assign default value
                if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
                    scope.lang = "en";

                /**
                 * Function to initialize the tabs and make the first one active
                 */
                var initTabs = function() {
                    // get categories for the tabs
                    Search.getSearchTabs().then(function(response) {
                        scope.tabs = response.tabs;

                        if (Search.getKeyword().trim().length > 0) {
                            updateTabs();
                        }

                        scope.initialized = true;
                    });
                };

                var updateTabs = function() {
                    Search.getSearchTabs().then(function(response) {
                        var newTabs = response.tabs;

                        scope.showTabs = (_.keys(newTabs).length > 0);
                        scope.showNoResultsMsg = !scope.showTabs;

                        // update amounts of tabs
                        if (scope.showTabs) {
                            _.each(scope.tabs, function(tab) {
                                if (_.has(newTabs, tab.name)) {
                                    tab.amount = newTabs[tab.name].amount;
                                    tab.show = true;
                                } else {
                                    // the tab has 0 amount, set it to not show
                                    tab.amount = 0;
                                    tab.show = false;
                                }

                                tab.active = false;
                            });

                            // make the correct tab selected
                            var prevSelTab = $location.search().tab;

                            if (!_.isUndefined(prevSelTab) && scope.tabs[prevSelTab].show) {
                                scope.tabs[prevSelTab].active = true;
                            } else {
                                scope.tabs[response.firstTab].active = true;
                            }
                        } else {
                            // no results, remove tab from url
                            $location.search("tab", null);
                        }

                    });
                };

                /**
                 * Changes the url parameters to reflect tab changes
                 * @param tabName
                 */
                scope.tabChangeHandler = function (tabName) {
                    // change the url parameter to reflect the tab change
                    $location.search("tab", tabName);
                };

                var urlChangeHandler = function() {
                    // find what changed
                    var urlParams = $location.search();

                    if (urlParams.q != prevQ) {
                        prevQ = urlParams.q;

                        if (!scope.initialized) {
                            // initialize tabs
                            initTabs();
                        }

                        //get the original search term from the url
                        var keyword = $location.search().q;

                        if (_.isUndefined(keyword) || keyword.trim() == "") {
                            // hide tabs and no results message
                            _.each(scope.tabs, function(tab) {
                                tab.show = false;
                            });

                            scope.showNoResultsMsg = false;
                            scope.showTabs = false;

                            // remove tab url parameter
                            $location.search("tab", null);

                            return false;
                        }

                        Search.setKeyword(keyword);

                        if (scope.initialized) {
                            updateTabs();
                        }
                    } else if (urlParams.tab != prevTab) {
                        prevTab = urlParams.tab;
                    }
                };

                var pageLoadHandler = function () {
                    if (!scope.initialized) {
                        urlChangeHandler();     // call url change handler to initialize the page
                        pageLoadListener();     // remove event listener
                    }
                };

                var pageLoadListener = scope.$watch(function () { return $location.search() }, pageLoadHandler);
                scope.$on("$locationChangeSuccess", urlChangeHandler);
            }
        };
    }]);