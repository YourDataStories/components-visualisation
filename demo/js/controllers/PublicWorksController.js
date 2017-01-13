angular.module('yds').controller('PublicWorksController', ['$scope', '$timeout', '$location', '$anchorScroll', '$window', 'DashboardService',
    function($scope, $timeout, $location, $anchorScroll, $window, DashboardService) {
        var scope = $scope;

        scope.showProjectInfo = false;
        scope.aggregateToShow = 0;
        scope.aggregateClasses = [];

        scope.selectTab = function(tabIndex) {
            scope.aggregateToShow = tabIndex;
        };

        // Get aggregates for sector
        var aggregates = DashboardService.getAggregates("public_work");
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
		
	scope.infoPopoverUrl = ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath +'/' : '') + "templates-demo/publicworks-info.html";

        // Subscribe to be notified of selected project changes
        DashboardService.subscribeProjectChanges(scope, function() {
            if ($window.pageYOffset < 1000) {
                // Scroll a bit to make details visible
                $location.hash("dashboard-public-works-data-grid");
                $anchorScroll();
            }

            // Select new project
            scope.showProjectInfo = false;
            scope.selectedProject = {};

            $timeout(function() {
                scope.selectedProject = DashboardService.getSelectedProjectInfo();
                scope.showProjectInfo = true;
            });
        });
    }
]);
