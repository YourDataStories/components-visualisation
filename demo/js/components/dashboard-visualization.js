angular.module('yds').directive('ydsDashboardVisualization', ['DashboardService', '$ocLazyLoad', '$timeout',
    function(DashboardService, $ocLazyLoad, $timeout) {
        return {
            restrict: 'E',
            scope: {
                projectId: '@', // Project ID of chart
                viewType: '@',  // View type of chart
                elementH: '@'   // Height of component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath +'/' : '') + 'templates/dashboard-visualization.html',
            link: function (scope, element, attrs) {
                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(scope.elementH) || scope.elementH.trim() == "")
                    scope.elementH = 300;

                // Mapping for which view type's selected countries go to which API parameter.
                // For example selected countries for view type "aidactivity.beneficiary.countries.all"
                // will be sent to the server in a parameter called "countries"
                var apiOptionsMap = {
                    countries: "aidactivity.beneficiary.countries.all",
                    benefactors: "aidactivity.benefactor.countries.all"
                };

                scope.selectedVis = "";
                scope.aggregateTypes= [];

                // Set the first type as default selected one
                scope.selProjectId = scope.projectId;
                scope.selViewType = "";

                /**
                 * Re-render the Aggregate widgets
                 */
                var updateAggregates = function() {
                    var aggregateTypes = [
                        "aidactivity.beneficiary.countries.all",
                        "aidactivity.benefactor.countries.all",
                        "aidactivity.beneficiary.organisations.all",
                        "aidactivity.sectors.for.countries.and.period",
                        "aidactivity.budget.for.countries.and.period",
                        "aidactivity.spending.for.countries.and.period"
                    ];
                    if (scope.aggregateTypes.length > 0) {
                        aggregateTypes = scope.aggregateTypes;
                    }

                    // Make aggregateTypes empty in order for the component to re-render
                    scope.aggregateTypes = [];

                    // Postpone to end of digest queue
                    $timeout(function() {
                        scope.aggregateTypes = aggregateTypes;
                    });
                };

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
                    var minYear = DashboardService.getMinYear();
                    var maxYear = DashboardService.getMaxYear();

                    if (!_.isNull(minYear) && !_.isNull(maxYear)) {
                        scope.apiOptions.year= "[" + minYear + " TO " + maxYear + "]";
                    }

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
                    var viewType = DashboardService.getViewType();

                    scope.selViewType = viewType.type;
                    scope.panelStyle = viewType.panelStyle;
                    scope.panelHeadingStyle = viewType.panelHeadingStyle;
                };

                /**
                 * Handles heatmap selection changes (country selection and year range)
                 */
                var heatmapChangeHandler = function() {
                    updateApiOptions();
                    updateAggregates();
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
            }
        };
    }
]);
