angular.module('yds').directive('ydsDashboardUpdater', ['Data', 'DashboardService', '$timeout', '$location',
    function(Data, DashboardService, $timeout, $location) {
        return {
            restrict: 'E',
            scope: {
                type: '@',          // What type of component to show (grid, info etc.)
                viewType: '@',      // Type to give to component
                dashboardId: '@',   // ID used for getting selected year range from DashboardService
                minHeight: '@',     // Minimum height of this component's container
                lang: '@'           // Language of component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/dashboard-updater.html',
            link: function (scope) {
                var dashboardId = scope.dashboardId;
                var minHeight = parseInt(scope.minHeight);
                scope.showInfo = false;

                // Variables needed in case Search Tabs are shown
                var initialized = false;
                var requestType = "";
                var searchParams = {};

                // If type is undefined, set default value
                if (_.isUndefined(scope.type) || scope.type.trim() == "")
                    scope.type = "info";

                // If viewType is undefined, set default value
                if (_.isUndefined(scope.viewType) || scope.viewType.trim() == "")
                    scope.viewType = "default";

                // If lang is undefined, set default value
                if (_.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";

                // If dashboardId is undefined, set default value
                if (_.isUndefined(dashboardId) || dashboardId.trim() == "") {
                    dashboardId = "default";
                }

                // If minHeight is undefined, set default value
                if (_.isUndefined(minHeight) || _.isNaN(minHeight)) {
                    minHeight = 0;
                }

                // Set minimum height of container so when component is being refreshed, the container's
                // height does not become 0 which causes the page to scroll up
                scope.containerStyle = {
                    "min-height": minHeight + "px"
                };

                var updateExtraParams = function() {
                    // Keep old parameters for comparison and get new parameters from DashboardService
                    var oldParams = scope.extraParams;
                    scope.extraParams = DashboardService.getApiOptions(dashboardId);

                    // If something changed in the parameters, update component
                    if (!_.isEqual(oldParams, scope.extraParams)) {
                        switch(scope.type) {
                            case "search":
                                if (!initialized) {
                                    // Get parameters for search component and keep requestType for later
                                    searchParams = DashboardService.getSearchParams(dashboardId);
                                    requestType = searchParams.requestType;

                                    // Add parameters for the search-tabs component to scope (requestType not needed)
                                    _.extend(scope, _.omit(searchParams, "requestType"));

                                    initialized = true;
                                }

                                // Make request to get rules for QueryBuilder
                                Data.getQueryBuilderRules(requestType, scope.extraParams).then(function(response) {
                                    var paramPrefix = searchParams.urlParamPrefix;
                                    var newRules = JSURL.stringify(response.data);

                                    // Set rules URL parameter with the new rules so QueryBuilder can update itself
                                    $location.search(paramPrefix + "rules", newRules);
                                });

                                break;
                            case "grid":
                                if (!initialized) {
                                    // Get concept from DashboardService so "view" button will work correctly
                                    scope.concept = DashboardService.getSearchParams(dashboardId).concept;

                                    initialized = true;
                                }
                                // Continue to re-render grid
                            default:
                                // Re-render component
                                var type = scope.type;  // Save current type
                                scope.type = "";        // Make type empty to hide component

                                $timeout(function() {
                                    scope.type = type;  // At end of digest show component again
                                });

                                break;
                        }
                    }
                };

                // Subscribe to be notified of changes in selected countries and year range
                DashboardService.subscribeSelectionChanges(scope, updateExtraParams);
                DashboardService.subscribeYearChanges(scope, updateExtraParams);

                // Get initial info
                updateExtraParams();
            }
        };
    }
]);
