angular.module('yds').directive('ydsDashboardVisualization', ['DashboardService', '$ocLazyLoad', '$timeout',
    function(DashboardService, $ocLazyLoad, $timeout) {
        return {
            restrict: 'E',
            scope: {
                projectId: '@',     // Project ID of chart
                dashboardId: '@',   // ID used for getting selected year range from DashboardService
                elementH: '@'       // Height of component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath +'/' : '') + 'templates/dashboard-visualization.html',
            link: function (scope, element, attrs) {
                var dashboardId = scope.dashboardId;

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(scope.elementH) || scope.elementH.trim() == "")
                    scope.elementH = 300;

                // Set minimum height of details panel body
                scope.panelBodyStyle = {
                    "min-height": (parseInt(scope.elementH) + 30) + "px"
                };

                // If dashboardId is undefined, show error
                if (_.isUndefined(dashboardId) || dashboardId.trim() == "") {
                    dashboardId = "default";
                }

                scope.selectedVis = "";
                scope.aggregateTypes= DashboardService.getAggregates(dashboardId);

                // Set the first type as default selected one
                scope.selProjectId = scope.projectId;
                scope.selViewType = "";

                /**
                 * Re-render the selected visualization
                 */
                var updateVisualization = function() {
                    var selectedVis = "bar";
                    if (scope.selectedVis.length > 0) {
                        selectedVis = scope.selectedVis;
                    }

                    // Make selectedVis empty in order for the component to re-render
                    scope.selectedVis = "";

                    // Postpone to end of digest queue
                    $timeout(function() {
                        scope.selectVis(selectedVis);
                    });
                };

                /**
                 * Update the apiOptions variable with the needed values
                 */
                var updateApiOptions = function() {
                    // Reset api options object
                    scope.apiOptions = {};

                    // If there is a selected year range, add it to the parameters that will be added to the API call
                    var minYear = DashboardService.getMinYear(dashboardId);
                    var maxYear = DashboardService.getMaxYear(dashboardId);

                    // Get parameter name for year range
                    var yearParam = DashboardService.getYearParamName(dashboardId);

                    if (!_.isNull(minYear) && !_.isNull(maxYear)) {
                        scope.apiOptions[yearParam] = "[" + minYear + " TO " + maxYear + "]";
                    }

                    // Get mappings for request from DashboardService
                    var apiOptionsMap = DashboardService.getApiOptionsMapping(dashboardId);

                    // If there are selected countries, add them to api options
                    _.each(apiOptionsMap, function(viewType, key) {
                        // Get selected countries for this key, keep only their codes, and join them into a string
                        var selectedCountries = DashboardService.getCountries(viewType);
                        selectedCountries = _.pluck(selectedCountries, "code").join(",");

                        if (selectedCountries.length > 0) {
                            scope.apiOptions[key] = selectedCountries;
                        }
                    });
                };

                /**
                 * Update the view type from the DashboardService
                 * Also sets the Visualization panel's color
                 */
                var updateViewType = function() {
                    var viewType = DashboardService.getViewType(dashboardId);

                    if (!_.isUndefined(viewType)) {
                        scope.selViewType = viewType.type;
                        scope.panelStyle = viewType.panelStyle;
                        scope.panelHeadingStyle = viewType.panelHeadingStyle;
                    }
                };

                /**
                 * Handles heatmap selection changes (country selection and year range)
                 */
                var heatmapChangeHandler = function() {
                    updateApiOptions();
                    updateVisualization();
                };

                /**
                 * Handles view type selection changes
                 */
                var viewTypeChangeHandler = function() {
                    updateApiOptions();
                    updateViewType();
                    updateVisualization();
                };

                // Subscribe to year selection and view type changes
                DashboardService.subscribeYearChanges(scope, heatmapChangeHandler);
                DashboardService.subscribeSelectionChanges(scope, heatmapChangeHandler);
                DashboardService.subscribeViewTypeChanges(scope, viewTypeChangeHandler);

                /**
                 * Change selected visualization type
                 * @param visType
                 */
                scope.selectVis = function(visType) {
                    scope.selectedVis = visType;
                };

                // Initialize component
                viewTypeChangeHandler();
            }
        };
    }
]);
