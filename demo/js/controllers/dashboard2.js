angular.module('yds').controller('Dashboard2Controller', ['$scope', '$timeout', 'DashboardService',
    function($scope, $timeout, DashboardService) {
        var scope = $scope;

        // Set initial panel titles
        scope.panelSectorTitle = "Choose activity type";
        scope.panelCountrySelectionTitle = "Choose countries";
        scope.panelTimePeriodTitle = "Choose time period of activities";
        scope.panelCategoryTitle = "Choose filter category";

        // Accordion options
        scope.oneAtATime = true;
        scope.status = {
            sectorOpen: true
        };

        scope.showVis = true;
        scope.aggregateToShow = 0;
        scope.aggregateClasses = [];

        scope.infoPopoverUrl = ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath +'/' : '') + "templates-demo/dashboard2-info.html";

        scope.selectTab = function(tabIndex) {
            scope.aggregateToShow = tabIndex;
        };

        /**
         * Select a sector
         * @param newSector Sector to select
         * @param setTitle  If true will set the title of the 1st accordion heading
         */
        scope.setSelectedSector = function(newSector, setTitle) {
            if (scope.selectedSector != newSector) {
                if (!_.isUndefined(scope.selectedSector)) {
                    // Get country types for previously selected sector
                    var map = DashboardService.getApiOptionsMapping(scope.selectedSector);

                    // For country type of previous sector, clear its selected countries
                    _.each(map, function(countryType) {
                        DashboardService.clearCountries(countryType);
                    });
                }

                // Get aggregates for new sector
                var aggregates = DashboardService.getAggregates(newSector);
                scope.aggregateClass = "col-md-" + aggregates.width;

                // Clear current aggregates array
                scope.aggregates = [];  // Empty aggregate array

                // Reset uib-tabset
                scope.dashboardVisActiveTab = 0;
                scope.showVis = false;

                // Set classes for tabs
                scope.aggregateClasses = [];
                _.each(aggregates.types, function(aggregate) {
                    scope.aggregateClasses.push(aggregate.replace(/\./g , "-"));
                });

                $timeout(function() {
                    // Set new aggregates
                    scope.aggregates = aggregates.types;
                    scope.aggregateTitles = aggregates.titles;

                    // Show tabset again
                    scope.showVis = true;
                });

                // Select new sector
                scope.selectedSector = newSector;
                scope.infoType = newSector + ".filters.selected";

                // Reset selected project
                scope.selectedProject = {};
            }

            // If setTitle is true, set the panel's title to show the selection
            if (setTitle) {
                var selSectorStr = (newSector == "aidactivity") ? "Aid Activities" : "Trade Activities";
                scope.panelSectorTitle = "You have chosen: " + selSectorStr;
            }

            scope.status.countryOpen = true;
        };

        // Set default selected sector
        scope.setSelectedSector("aidactivity", false);

        // Fix for angular slider rendering wrong when inside tabs
        // (https://github.com/angular-slider/angularjs-slider/issues/79#issuecomment-121141586)
        scope.$watch("status.periodOpen", function() {
            scope.$broadcast('reCalcViewDimensions');
        });

        // Subscribe to be notified of selected project changes
        DashboardService.subscribeProjectChanges(scope, function() {
            scope.selectedProject = {};

            $timeout(function() {
                scope.selectedProject = DashboardService.getSelectedProjectInfo();
            });
        });
    }
]);
