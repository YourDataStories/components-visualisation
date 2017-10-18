angular.module("yds").controller("TrafficCountsController", ["$scope", "$timeout", "DashboardService",
    function ($scope, $timeout, DashboardService) {
        var scope = $scope;

        scope.galwayProjectId = "http://linkedeconomy.org/resource/Contract/AwardNotice/2013208591/5795646";
        scope.lang = "en";
        scope.showGrid = true;
        scope.showProjectInfo = false;

        // Create the object for the clicked traffic point
        scope.selectedPoint = {
            "point": null
        };

        /**
         * Get the selected contract from the DashboardService, and show or hide the Contract details
         */
        var gridSelectionHandler = function () {
            var selectedContract = _.first(DashboardService.getGridSelection("galway_contract"));

            DashboardService.setSelectedProject(selectedContract, null);
            scope.showProjectInfo = false;

            $timeout(function () {
                scope.showProjectInfo = !_.isUndefined(selectedContract);
            });
        };

        // Watch changes in the selected point, and set it as selected in the DashboardService
        scope.$watch("selectedPoint.point", function (newPoint) {
            // Force a refresh of the related contracts grid
            scope.showGrid = false;
            scope.showProjectInfo = false;

            $timeout(function () {
                scope.showGrid = true;
                DashboardService.setGridSelection("galway_contract", undefined);
                DashboardService.setGridSelection("galway_traffic_point", newPoint);
            });
        });

        // Watch for changes in the selected contract, to show the Contract details page
        DashboardService.subscribeGridSelectionChanges(scope, gridSelectionHandler);
    }
]);
