angular.module("yds").controller("TrafficCountsController", ["$scope",
    function ($scope) {
        var scope = $scope;

        scope.projectId = "http://linkedeconomy.org/resource/Contract/AwardNotice/2013208591/5795646";
        scope.lang = "en";

        // Create the object for the clicked traffic point
        scope.clickedTrafficPoint = {
            "point": null
        };
    }
]);
