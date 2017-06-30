angular.module('yds').controller('DashboardDynamicController', ['$scope', '$timeout', '$location', '$anchorScroll', '$window', '$filter', 'DashboardService',
    function ($scope, $timeout, $location, $anchorScroll, $window, $filter, DashboardService) {
        var scope = $scope;

        scope.dashboardsConfig = {
            types: DashboardService.getDashboardTypes(),
            selectedDashboard: "contract",
            filters: DashboardService.getDashboardFilters("contract"),
            selectedFilters: []
        };

        scope.showProjectInfo = false;
        scope.aggregateToShow = 0;
        scope.aggregateClasses = [];
        scope.aggregateValues = {};

        /**
         * Update the selected filters array to include only the filters which are selected in the filters checkbox list
         */
        scope.updateSelectedFilters = function () {
            scope.dashboardsConfig.selectedFilters =
                $filter('filter')(scope.dashboardsConfig.filters, {checked: true});

            // Save the selected filters to the DashboardService
            DashboardService.saveObject("filter", scope.dashboardsConfig.selectedFilters);
        };

        /**
         * Return the Bootstrap column class for a specified filter type
         * @param filterType
         * @returns {*}
         */
        scope.getFilterColumnClass = function (filterType) {
            switch (filterType) {
                case "grid":
                    return "col-md-6";
                case "heatmap":
                    return "col-md-6";
                case "year":
                    return "col-md-4";
                default:
                    return "col-md-3";
            }
        };

        scope.selectTab = function (tabIndex) {
            scope.aggregateToShow = tabIndex;
        };

        // Update selected filters, to select the ones that should be selected initially
        scope.updateSelectedFilters();

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

        scope.infoPopoverUrl = ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + "templates-demo/contracts-info.html";

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
