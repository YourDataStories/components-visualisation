angular.module("yds").controller("TrafficObservationsController", ["$scope", "DashboardService",
    function ($scope, DashboardService) {
        var scope = $scope;
        scope.galwayProjectId = "http://linkedeconomy.org/resource/Contract/AwardNotice/2013208591/5795646";
        scope.lang = "en";

        // Create the object for the clicked traffic point
        scope.selectedPoints = {
            "point": null
        };

        // Watch changes in the selected point, and set it as selected in the DashboardService
        scope.$watch("selectedPoints.point", function (points) {
            var selValue = _.isString(points) && points.length > 0 ? points : null;   // Prevent saving an empty string
            DashboardService.saveObject("trafficobservation.on_points", selValue);
        });
    }
]);
