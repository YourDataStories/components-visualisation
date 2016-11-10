angular.module('yds').controller('DashboardPilot1Controller', ['$scope', 'DashboardService',
    function($scope, DashboardService) {
        var scope = $scope;

        scope.aggregateToShow = 0;
        scope.aggregateClasses = [];

        scope.selectTab = function(tabIndex) {
            scope.aggregateToShow = tabIndex;
        };

        // Get aggregates for sector
        var aggregates = DashboardService.getAggregates("contract");
        scope.aggregateClass = "col-md-" + aggregates.width;

        // Reset uib-tabset
        scope.dashboardVisActiveTab = 0;

        // Set classes for tabs
        scope.aggregateClasses = [];
        _.each(aggregates.types, function(aggregate) {
            scope.aggregateClasses.push(aggregate.replace(/\./g , "-"));
        });

        // Set new aggregates
        scope.aggregates = aggregates.types;
        scope.aggregateTitles = aggregates.titles;
    }
]);
