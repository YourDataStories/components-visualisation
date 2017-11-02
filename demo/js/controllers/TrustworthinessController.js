angular.module("yds").controller("TrustworthinessController", ["$scope", "$location",
    function ($scope, $location) {
        var scope = $scope;
        scope.showResults = false;

        scope.$watch(function () {
            // Watch $location.search()
            return JSON.stringify($location.search())
        }, function () {
            var params = $location.search();
            scope.showResults = _.has(params, "q") && _.has(params, "tab");
        });
    }
]);
