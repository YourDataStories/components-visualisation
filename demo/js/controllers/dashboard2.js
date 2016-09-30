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

        // Style for 1st and last aggregate
        scope.firstAggregateStyle = {
            'padding-left': 0
        };

        scope.lastAggregateStyle = {
            'padding-right': 0
        };

        /**
         * Select a sector
         * @param newSector Sector to select
         */
        scope.setSelectedSector = function(newSector) {
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

                $timeout(function() {
                    // Set new aggregates
                    scope.aggregates = aggregates.types;
                });

                // Select new sector
                scope.selectedSector = newSector;
            }

            scope.status.countryOpen = true;
        };

        // Set default selected sector
        scope.setSelectedSector("aidactivity");

        // Fix for angular slider rendering wrong when inside tabs
        // (https://github.com/angular-slider/angularjs-slider/issues/79#issuecomment-121141586)
        scope.$watch("status.periodOpen", function() {
            scope.$broadcast('reCalcViewDimensions');
        });
    }
]);