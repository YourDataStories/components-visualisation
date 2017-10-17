angular.module("yds").controller("TrafficCountsController", ["$scope", "$timeout", "DashboardService",
    function ($scope, $timeout, DashboardService) {
        var scope = $scope;

        scope.galwayProjectId = "http://linkedeconomy.org/resource/Contract/AwardNotice/2013208591/5795646";
        scope.lang = "en";
        scope.showGrid = true;

        // Create the object for the clicked traffic point
        scope.selectedPoint = {
            "point": null
        };

        // Watch changes in the selected point, and set it as selected in the DashboardService
        scope.$watch("selectedPoint.point", function (newPoint) {
            // Force a refresh of the related contracts grid
            scope.showGrid = false;

            $timeout(function () {
                scope.showGrid = true;
                DashboardService.setGridSelection("galway_traffic_point", newPoint);
            });
        });
    }
]);
