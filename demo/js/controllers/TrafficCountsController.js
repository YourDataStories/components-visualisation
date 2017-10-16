angular.module("yds").controller("TrafficCountsController", ["$scope",
    function ($scope) {
        var scope = $scope;

        scope.projectId = "http://linkedeconomy.org/resource/Contract/AwardNotice/2013208591/5795646";

        // Create the object for the clicked traffic point
        scope.clickedTrafficPoint = {
            "point": null
        };

        // Select example point
        scope.clickedTrafficPoint.point = {
            lat: 0, lng: 0, id: "http://linkedeconomy.org/ontology/traffic/resource/ObservationPoint/1850"
        };
    }
]);
