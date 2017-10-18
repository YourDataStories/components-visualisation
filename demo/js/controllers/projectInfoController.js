angular.module("yds").controller("ProjectInfoController", ["$scope", "DashboardService", "YDS_CONSTANTS",
    function ($scope, DashboardService, YDS_CONSTANTS) {
        // Get info for selected project from DashboardService
        var projectInfo = DashboardService.getSelectedProjectInfo();
        $scope.projectId = projectInfo.id;

        // Set base URL variable
        $scope.baseUrl = YDS_CONSTANTS.PROJECT_DETAILS_URL;
    }
]);
