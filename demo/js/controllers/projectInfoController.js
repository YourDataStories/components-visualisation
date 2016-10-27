angular.module('yds').controller('ProjectInfoController', ['$scope', 'DashboardService',
    function($scope, DashboardService) {
        // Get info for selected project from DashboardService
        var projectInfo = DashboardService.getSelectedProjectInfo();

        $scope.projectId = projectInfo.id;
    }
]);
