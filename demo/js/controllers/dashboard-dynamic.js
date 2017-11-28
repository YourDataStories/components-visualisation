angular.module("yds").controller("DashboardDynamicController", ["$scope", "$timeout", "$location", "$anchorScroll", "$window", "$filter", "DashboardService",
    function ($scope, $timeout, $location, $anchorScroll, $window, $filter, DashboardService) {
        var scope = $scope;
        var defaultDashboard = "aidactivity";

        scope.dashboardsConfig = {
            types: [{
                label: "Aid Activity",
                type: "aidactivity"
            }, {
                label: "Trade Activity",
                type: "tradeactivity"
            }, {
                label: "Contract",
                type: "contract"
            }],
            selectedDashboard: defaultDashboard,
            filters: [],
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
                $filter("filter")(scope.dashboardsConfig.filters, {checked: true});

            // Save the selected filters to the DashboardService
            DashboardService.saveObject("filter", scope.dashboardsConfig.selectedFilters);
        };

        /**
         * Change the Dashboard type.
         * @param newType
         */
        scope.changeDashboardType = function (newType) {
            // Get new filters
            scope.dashboardsConfig.filters = DashboardService.getDashboardFilters(newType);

            // Update selected filters
            scope.updateSelectedFilters();

            // Update the aggregates
            scope.aggregates = [];
            scope.aggregateTitles = [];
            scope.aggregateClasses = [];

            $timeout(function () {
                var aggregates = DashboardService.getAggregates(newType);

                scope.aggregateClass = "col-md-" + aggregates.width;

                // Set classes for tabs
                scope.aggregateClasses = [];
                _.each(aggregates.types, function (aggregate) {
                    scope.aggregateClasses.push(aggregate.replace(/\./g, "-"));
                });

                // Set new aggregates
                scope.aggregates = aggregates.types;
                scope.aggregateTitles = aggregates.titles;
                scope.selectTab(0);

                // Need to select the active tab after they have been added with ng-repeat
                $timeout(function () {
                    scope.dashboardVisActiveTab = 0;
                });
            });
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
                case "grid-grouped":
                    return "col-md-12";
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

        // Select the default Dashboard type
        scope.changeDashboardType(defaultDashboard);

        // Subscribe to be notified of selected project changes
        DashboardService.subscribeProjectChanges(scope, function () {
            if ($window.pageYOffset < 1000) {
                // Scroll a bit to make details visible
                $location.hash("dashboard-data-grid");
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
