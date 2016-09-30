angular.module('yds').controller('Dashboard2Controller', ['$scope', '$timeout', 'DashboardService',
    function($scope, $timeout, DashboardService) {
        var scope = $scope;

        // If the panels should be allowed to open
        scope.allowOpenPanel = false;

        // Set initial panel titles
        scope.panelSectorTitle = "Choose your sector";
        scope.panelCountrySelectionTitle = "Choose countries";
        scope.panelTimePeriodTitle = "Choose time period of activities";
        scope.panelCategoryTitle = "Choose filter category";

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
        };

        // Set default selected sector
        scope.setSelectedSector("aidactivity");
    }
]);