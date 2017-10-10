angular.module("yds").controller("TrafficCountsController", ["$scope",
    function ($scope) {
        var scope = $scope;

        // Create the object for the clicked traffic point
        scope.clickedTrafficPoint = {
            "point": null
        };
    }
]);
