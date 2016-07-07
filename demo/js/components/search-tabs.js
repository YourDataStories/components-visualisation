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
                scope.translations = Translations.getAll(scope.lang);   // Translations used for no results message

                var prevQ = "";                 // Keeps previous search query value
                var prevTab = "";               // Keeps previous tab name value

                // check if the language attr is defined, else assign default value
                if(angular.isUndefined(scope.lang) || scope.lang.trim()=="")
                    scope.lang = "en";

                /**
                 * Initializes the tabs and makes the first one active
                 */
                var initTabs = function() {
                    Search.getSearchTabs(scope.lang).then(function(response) {
                        // Get tabs from the response
                        var tabs = response.tabs;

                        // Set all the tabs to inactive so the first one isn't activated by default
                        _.each(tabs, function(tab) {
                            tab.active = false;
                        });

                        // Set the tabs variable
                        scope.tabs = tabs;

                        // Update tab result counts and select the appropriate one
                        updateTabs();

                        scope.initialized = true;
                    });
                };

                /**
                 * Updates the amounts shown on each tab and selects the appropriate one depending on url parameters
                 */
                var updateTabs = function() {
                    Search.getTabResultCounts().then(function(response) {
                        var newTabs = response.tabs;

                        // update amounts of tabs
                        _.each(scope.tabs, function(tab) {
                            if (_.has(newTabs, tab.concept)) {
                                // update the tab's amount to the new one
                                tab.amount = newTabs[tab.concept].amount;
                            } else {
                                // set tab's amount to 0
                                tab.amount = 0;
                            }
                        });

                        // make the correct tab selected
                        var prevSelTab = $location.search().tab;

                        if (!_.isUndefined(prevSelTab)) {
                            // find and select the previously selected tab
                            _.each(scope.tabs, function(tab) {
                                if (tab.label == prevSelTab) {
                                    tab.active = true;
                                }
                            });
                        } else {
                            // select first tab
                            var tabToSel = _.first(scope.tabs);
                            tabToSel.active = true;
                            prevTab = tabToSel.label;
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

                /**
                 * Runs when the url parameters change and acts depending on which one changed
                 */
                var urlChangeHandler = function() {
                    // Get url parameters to see if the tab or the query changed
                    var urlParams = $location.search();

                    if (urlParams.q != prevQ) {
                        // The query changed
                        prevQ = urlParams.q;

                        // Get the search term from the url and set it as search keyword
                        var keyword = $location.search().q;
                        Search.setKeyword(keyword);

                        // Initialize or update the tabs
                        if (!scope.initialized) {
                            initTabs();             // initialize the tabs
                        } else {
                            updateTabs();           // update the tabs
                        }
                    } else if (urlParams.tab != prevTab) {
                        // The tab changed
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
    }
]);