angular.module('yds').controller('Dashboard2Controller', ['$scope', '$timeout', 'DashboardService',
    function($scope, $timeout, DashboardService) {
        var scope = $scope;

        // If the panels should be allowed to open
        scope.allowOpenPanel = false;

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

        scope.infoPopoverUrl = ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath +'/' : '') + "templates-demo/dashboard2-info.html";

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

                $timeout(function() {
                    // Set new aggregates
                    scope.aggregates = aggregates.types;
                    scope.aggregateTitles = aggregates.titles;

                    // Show tabset again
                    scope.showVis = true;
                });

                // Select new sector
                scope.selectedSector = newSector;

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
            scope.selectedProject = DashboardService.getSelectedProjectInfo();
        });
    }
]);