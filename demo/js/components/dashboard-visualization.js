angular.module('yds').directive('ydsDashboardVisualization', ['CountrySelectionService', '$ocLazyLoad', '$timeout',
    function(CountrySelectionService, $ocLazyLoad, $timeout) {
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
                 * Update the view type from the CountrySelectionService
                 * Also sets the Visualization panel's color
                 */
                var updateViewType = function() {
                    var viewType = CountrySelectionService.getViewType();

                    scope.selViewType = viewType.type;
                    scope.panelStyle = viewType.panelStyle;
                    scope.panelHeadingStyle = viewType.panelHeadingStyle;
                };

                /**
                 * Handles heatmap selection changes (country selection and year range)
                 */
                var heatmapChangeHandler = function() {
                    updateAggregates();
                    updateVisualization();
                };

                /**
                 * Handles view type selection changes
                 */
                var viewTypeChangeHandler = function() {
                    updateViewType();
                    updateVisualization();
                };

                // Subscribe to year selection and view type changes
                CountrySelectionService.subscribeYearChanges(scope, heatmapChangeHandler);
                // CountrySelectionService.subscribeSelectionChanges(scope, heatmapChangeHandler);
                CountrySelectionService.subscribeViewTypeChanges(scope, viewTypeChangeHandler);

                /**
                 * Change selected visualization type and if there is a year range selected, add it to apiOptions
                 * @param visType
                 */
                scope.selectVis = function(visType) {
                    // Reset api options object
                    scope.apiOptions = {};

                    // If there is a selected year range, add it to the parameters that will be added to the API call
                    var minYear = CountrySelectionService.getMinYear();
                    var maxYear = CountrySelectionService.getMaxYear();

                    if (!_.isNull(minYear) && !_.isNull(maxYear)) {
                        scope.apiOptions.year= "[" + minYear + " TO " + maxYear + "]";
                    }

                    // // If there are selected countries, add them to api options
                    // var selectedCountries = CountrySelectionService.getCountries();
                    // selectedCountries = _.pluck(selectedCountries, "code").join(",");   // keep only codes and join them
                    //
                    // if (selectedCountries.length > 0) {
                    //     scope.apiOptions.countries = selectedCountries;
                    // }

                    // Change selected visualization type
                    scope.selectedVis = visType;
                };
            }
        };
    }
]);
