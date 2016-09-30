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
            // Clear selected countries
            DashboardService.clearCountries(scope.selectedSector);
            DashboardService.clearCountries(newSector);

            // Select new sector
            scope.selectedSector = newSector;
        }
    }
]);