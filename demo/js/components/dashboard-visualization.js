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

                // Subscribe to year selection changes
                CountrySelectionService.subscribeYearChanges(scope, function() {
                    var selectedVis = "bar";
                    if (scope.selectedVis.length > 0) {
                        selectedVis = scope.selectedVis;
                    }

                    var aggregateTypes = [
                        "aidactivity.beneficiary.countries.all",
                        "aidactivity.budget.for.countries.and.period",
                        "aidactivity.sectors.for.countries.and.period",
                        "aidactivity.spending.for.countries.and.period"
                    ];
                    if (scope.aggregateTypes.length > 0) {
                        aggregateTypes = scope.aggregateTypes;
                    }

                    var selViewType = _.first(aggregateTypes);
                    if (scope.selViewType.length > 0) {
                        selViewType = scope.selViewType;
                    }


                    // Make selectedVis empty in order for the component to re-render
                    scope.selectedVis = "";
                    scope.aggregateTypes = [];

                    // Postpone to end of digest queue
                    $timeout(function() {
                        scope.aggregateTypes = aggregateTypes;
                        scope.selViewType = selViewType;
                        scope.selectVis(selectedVis);
                    });
                });

                /**
                 * Change selected visualization type and if there is a year range selected, add it to apiOptions
                 * @param visType
                 */
                scope.selectVis = function(visType) {
                    // If there is a selected year range, add it to the parameters that will be added to the API call
                    var minYear = CountrySelectionService.getMinYear();
                    var maxYear = CountrySelectionService.getMaxYear();

                    if (!_.isNull(minYear) && !_.isNull(maxYear)) {
                        scope.apiOptions = {
                            year: "[" + minYear + " TO " + maxYear + "]"
                        };
                    }

                    // Change selected visualization type
                    scope.selectedVis = visType;
                };
            }
        };
    }
]);
