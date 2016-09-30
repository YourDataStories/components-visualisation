angular.module('yds').controller('DashboardController', ['$scope', 'DashboardService',
    function($scope, DashboardService) {
        var scope = $scope;

        // Get aggregates for aid activities
        var aidAggregates = DashboardService.getAggregates("aidactivity");
        scope.aidAggregates = aidAggregates.types;
        scope.aidAggregateClass = "col-md-" + aidAggregates.width;

        // Get aggregates for trade activities
        var tradeAggregates = DashboardService.getAggregates("tradeactivity");
        scope.tradeAggregates = tradeAggregates.types;
        scope.tradeAggregateClass = "col-md-" + tradeAggregates.width;
    }
]);
