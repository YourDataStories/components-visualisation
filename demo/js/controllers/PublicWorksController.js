angular.module('yds').controller('PublicWorksController', ['$scope', '$timeout', '$location', '$anchorScroll', '$window', 'DashboardService',
    function($scope, $timeout, $location, $anchorScroll, $window, DashboardService) {
        var scope = $scope;

        scope.showProjectInfo = false;

        // Subscribe to be notified of selected project changes
        DashboardService.subscribeProjectChanges(scope, function() {
            if ($window.pageYOffset < 1000) {
                // Scroll a bit to make details visible
                $location.hash("dashboard-public-works-data-grid");
                $anchorScroll();
            }

            // Select new project
            scope.showProjectInfo = false;
            scope.selectedProject = {};

            $timeout(function() {
                scope.selectedProject = DashboardService.getSelectedProjectInfo();
                scope.showProjectInfo = true;
            });
        });
    }
]);
