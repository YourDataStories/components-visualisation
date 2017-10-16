angular.module('yds').controller('DashboardPilot1Controller', ['$scope', '$timeout', '$location', '$anchorScroll', '$window', 'DashboardService', 'Data',
    function ($scope, $timeout, $location, $anchorScroll, $window, DashboardService, Data) {
        var scope = $scope;

        scope.showProjectInfo = false;
        scope.aggregateToShow = 0;
        scope.aggregateClasses = [];
        scope.aggregateValues = {};

        scope.selectTab = function (tabIndex) {
            scope.aggregateToShow = tabIndex;
        };

        // Get aggregates for sector
        var aggregates = DashboardService.getAggregates("contract");
        scope.aggregateClass = "col-md-" + aggregates.width;

        // Reset uib-tabset
        scope.dashboardVisActiveTab = 0;

        // Set classes for tabs
        scope.aggregateClasses = [];
        _.each(aggregates.types, function (aggregate) {
            scope.aggregateClasses.push(aggregate.replace(/\./g, "-"));
        });

        // Set new aggregates
        scope.aggregates = aggregates.types;
        scope.aggregateTitles = aggregates.titles;

        scope.infoPopoverUrl = Data.templatePath + "templates-demo/contracts-info.html";

        // Subscribe to be notified of selected project changes
        DashboardService.subscribeProjectChanges(scope, function () {
            if ($window.pageYOffset < 1000) {
                // Scroll a bit to make details visible
                $location.hash("dashboard-contract-data-grid");
                $anchorScroll();
            }

            // Select new project
            scope.showProjectInfo = false;
            scope.selectedProject = {};

            $timeout(function () {
                scope.selectedProject = DashboardService.getSelectedProjectInfo();
                scope.showProjectInfo = true;
            });
        });
    }
]);
