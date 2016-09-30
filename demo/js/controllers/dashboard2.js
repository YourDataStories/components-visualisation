angular.module('yds').controller('Dashboard2Controller', ['$scope', 'DashboardService',
    function($scope, DashboardService) {
        var scope = $scope;

        // If the panels should be allowed to open
        scope.allowOpenPanel = false;

        // Set initial panel titles
        scope.panelSectorTitle = "Choose your sector";
        scope.panelCountrySelectionTitle = "Choose countries";
        scope.panelTimePeriodTitle = "Choose time period of activities";
        scope.panelCategoryTitle = "Choose filter category";
    }
]);