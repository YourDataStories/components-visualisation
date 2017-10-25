angular.module("yds").controller("TrafficObservationsController", ["$scope", "DashboardService",
    function ($scope, DashboardService) {
        var scope = $scope;
        scope.galwayProjectId = "http://linkedeconomy.org/resource/Contract/AwardNotice/2013208591/5795646";
        scope.lang = "en";

        // Create the object for the clicked traffic point
        scope.selectedPoint = {
            "point": null
        };

        // Watch changes in the selected point, and set it as selected in the DashboardService
        scope.$watch("selectedPoint.point", function (point) {
            if (_.has(point, "id")) {
                DashboardService.saveObject("trafficobservation.on_points", point.id);
            }
        });
    }
]);
