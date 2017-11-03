angular.module("yds").controller("TrustworthinessController", ["$scope", "$location", "$timeout",
    function ($scope, $location, $timeout) {
        var scope = $scope;
        scope.showResults = false;
        scope.enableViewBtn = false;
        scope.projDetailsType = "none";

        scope.$watch(function () {
            // Watch $location.search()
            return JSON.stringify($location.search())
        }, function () {
            var params = $location.search();

            // Check if the grid's view project buttons should be enabled
            if (_.has(params, "gridDetailsType")) {
                // Enable view button in the grid
                scope.enableViewBtn = true;
                scope.projDetailsType = params.gridType;
            } else {
                // Disable view button in the grid
                scope.enableViewBtn = false;
                scope.projDetailsType = "none";
            }

            // Remove the grid (so it will reset its project details type if we show it)
            scope.showResults = false;

            if (_.has(params, "q") && _.has(params, "tab")) {
                $timeout(function () {
                    // Show results if there is both a "q" and "tab" parameter
                    scope.showResults = true;
                });
            }
        });
    }
]);
