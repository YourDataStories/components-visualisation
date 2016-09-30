angular.module('yds').controller('Dashboard2Controller', ['$scope', 'DashboardService',
    function($scope, DashboardService) {
        var scope = $scope;

        // If the panels should be allowed to open
        scope.allowOpenPanel = false;

        // Default selected sector
        scope.selectedSector = "aidactivity";

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
            // Get country types for previously selected sector
            var map = DashboardService.getApiOptionsMapping(scope.selectedSector);

            // For country type of previous sector, clear its selected countries
            _.each(map, function(countryType) {
                DashboardService.clearCountries(countryType);
            });

            // Select new sector
            scope.selectedSector = newSector;
        }
    }
]);