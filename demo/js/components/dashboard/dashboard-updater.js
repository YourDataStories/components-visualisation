angular.module("yds").directive("ydsDashboardUpdater", ["Data", "DashboardService", "$timeout", "$location",
    function (Data, DashboardService, $timeout, $location) {
        return {
            restrict: "E",
            scope: {
                type: "@",                  // What type of component to show (grid, info etc.)
                projectId: "@",             // Project ID
                viewType: "@",              // Type to give to component
                lang: "@",                  // Language of component
                dashboardId: "@",           // ID used for getting selected year range from DashboardService
                dynamicDashboard: "@",      // Set to true if you are using this in a Dashboard with dynamic filters

                aggregateSetOnInit: "@",    // If the component shown is an aggregate, this indicates if it"s the first
                aggregateIconSize: "@",     // Aggregate icon size (used only if component shown is aggregate)
                aggregateShowButton: "@",   // If true, the aggregate will show the "View details" button
                aggregateValueObj: "=",     // If set, the aggregate should save its value in this object

                addToBasket: "@",           // If true, will show basket button in the components that support it
                selectionId: "@",           // ID for saving the selection for the specified dashboardId (used for grid)
                selectionType: "@",         // Selection type for grid (single or multiple)
                enableAdvSearch: "@",       // Enable/disable advanced search in Search Tabs component (default: true)
                groupedData: "@",           // Used for grid, set to true if the data from the API will be grouped
                numberOfItems: "@",         // Number of items for the grid, if needed
                baseUrl: "@",               // Base URL to send to API
                aggregateType: "@",         // Type of aggregation that the displayed chart should make (count/amount)

                minHeight: "@",             // Minimum height of this component's container
                enableRating: "@"           // Enable rating buttons (not supported for all components)
            },
            templateUrl: Data.templatePath + "templates/dashboard/dashboard-updater.html",
            link: function (scope) {
                var dashboardId = scope.dashboardId;
                var baseUrl = scope.baseUrl;
                var minHeight = parseInt(scope.minHeight);
                var originalType = scope.type;
                var filterSubscriptions = [];
                scope.showInfo = false;

                // Variables needed in case Search Tabs are shown
                var initialized = false;
                var requestType = "";
                var searchParams = {};

                // Keep previous parameter values, to check if the component needs to be re-rendered
                var prevParams = null;
                var prevAggregateType = "amount";

                // If type is undefined, set default value
                if (_.isUndefined(scope.type) || scope.type.trim() === "")
                    scope.type = "info";

                // If viewType is undefined, set default value
                if (_.isUndefined(scope.viewType) || scope.viewType.trim() === "")
                    scope.viewType = "default";

                // If lang is undefined, set default value
                if (_.isUndefined(scope.lang) || scope.lang.trim() === "")
                    scope.lang = "en";

                // If addToBasket is undefined, set default value
                if (_.isUndefined(scope.addToBasket) || scope.addToBasket.trim() === "")
                    scope.addToBasket = "false";

                // If aggregateShowButton is undefined, set default value
                if (_.isUndefined(scope.aggregateShowButton) || (scope.aggregateShowButton !== "true" && scope.aggregateShowButton !== "false"))
                    scope.aggregateShowButton = "true";

                // If enableAdvSearch is undefined, set default value
                if (_.isUndefined(scope.enableAdvSearch) || (scope.enableAdvSearch !== "true" && scope.enableAdvSearch !== "false"))
                    scope.enableAdvSearch = "true";

                // If dynamicDashboard is undefined, set default value
                if (_.isUndefined(scope.dynamicDashboard) || (scope.dynamicDashboard !== "true" && scope.dynamicDashboard !== "false"))
                    scope.dynamicDashboard = "false";

                // If dashboardId is undefined, set default value
                if (_.isUndefined(dashboardId) || dashboardId.trim() === "") {
                    dashboardId = "default";
                }

                // If minHeight is undefined, set default value
                if (_.isUndefined(minHeight) || _.isNaN(minHeight)) {
                    minHeight = 0;
                }

                // Set Y position of buttons
                scope.yBtnPosition = minHeight + 5;

                // Set minimum height of container so when component is being refreshed, the container's
                // height does not become 0 which causes the page to scroll up
                scope.containerStyle = {
                    "min-height": minHeight + "px"
                };

                // Create list of Dashboard IDs that contain grid selection
                var gridDashboards = [
                    "comparison",
                    "comparison1",
                    "comparison2",
                    "comparison_details_1",
                    "comparison_details_2",
                    "public_project"
                ];

                /**
                 * Cause a refresh of the component by setting the type to an empty string and then back to the original
                 */
                var rerenderComponent = function () {
                    scope.type = "";                // Make type empty to hide component

                    $timeout(function () {
                        scope.type = originalType;  // At end of digest show component again
                    });
                };

                var updateExtraParams = function () {
                    // Keep old parameters for comparison and get new parameters from DashboardService
                    var newParams;
                    if (scope.dynamicDashboard === "true") {
                        // Get options for the enabled filters
                        newParams = DashboardService.getApiOptionsDynamic(dashboardId, "filter");
                    } else {
                        newParams = DashboardService.getApiOptions(dashboardId);
                    }

                    // If something changed in the parameters, update component
                    var differentAggregateType = !_.isUndefined(scope.aggregateType) && !_.isEqual(prevAggregateType, scope.aggregateType);
                    var differentParams = !_.isEqual(prevParams, newParams);

                    if (differentParams || differentAggregateType) {
                        prevParams = _.clone(newParams);    // Keep current parameters to check equality later
                        scope.extraParams = newParams;      // Add new parameters to scope

                        // Add base URL to the extra params
                        if (!_.isUndefined(baseUrl) && baseUrl.length > 0) {
                            scope.extraParams = _.extend({
                                baseurl: baseUrl
                            }, scope.extraParams);
                        }

                        // If the aggregateType attribute is defined (and valid), add it to the extra parameters
                        var aggregateType = scope.aggregateType;
                        if (!_.isUndefined(aggregateType) &&
                            (aggregateType === "amount" || aggregateType === "count" || aggregateType === "budget")) {
                            scope.extraParams = _.extend({
                                aggregate: aggregateType
                            }, scope.extraParams);

                            prevAggregateType = scope.aggregateType;
                        }

                        //noinspection FallThroughInSwitchStatementJS
                        switch (scope.type) {
                            case "selection-grid":
                            case "selection-paging-grid":
                            case "aggregate":
                                // Aggregates and selection grids watch their extra params for changes, so do nothing
                                break;
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
                                if (scope.enableAdvSearch === "true") {
                                    Data.getQueryBuilderRules(requestType, scope.extraParams).then(function (response) {
                                        var paramPrefix = searchParams.urlParamPrefix;
                                        var newRules = JSURL.stringify(response.data);

                                        // Set rules URL parameter with the new rules so QueryBuilder can update itself
                                        $location.search(paramPrefix + "rules", newRules);
                                    });
                                }

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
                                rerenderComponent();
                        }
                    }
                };

                if (scope.dynamicDashboard !== "true") {
                    // Subscribe to be notified of changes in selected countries and year range
                    DashboardService.subscribeSelectionChanges(scope, updateExtraParams);
                    DashboardService.subscribeYearChanges(scope, updateExtraParams);

                    // Check if we should also subscribe to the grid selection changes
                    if (scope.type === "selection-grid" || _.contains(gridDashboards, dashboardId)) {
                        DashboardService.subscribeGridSelectionChanges(scope, updateExtraParams);
                    }
                } else {
                    // Subscribe to changes in filters (when filters change, will subscribe only to the required filter
                    // types to watch for changes)
                    DashboardService.subscribeObjectChanges(scope, function () {
                        DashboardService.updateFilterSubscriptions(filterSubscriptions, scope, updateExtraParams);

                        // Check if we should update the extra parameters in case a filter type was removed
                        var newParams = DashboardService.getApiOptionsDynamic(dashboardId, "filter");

                        if (!_.isEqual(newParams, prevParams)) {
                            updateExtraParams();
                        }
                    });

                    DashboardService.updateFilterSubscriptions(filterSubscriptions, scope, updateExtraParams);
                }

                // If the aggregateType attribute is defined, watch it for changes and update the chart
                if (!_.isUndefined(scope.aggregateType) &&
                    (scope.aggregateType === "amount" || scope.aggregateType === "count" || scope.aggregateType === "budget")) {
                    scope.$watch("aggregateType", updateExtraParams);
                }

                // Get initial info
                updateExtraParams();
            }
        };
    }
]);
