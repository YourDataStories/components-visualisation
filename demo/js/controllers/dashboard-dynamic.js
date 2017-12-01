angular.module("yds").controller("DashboardDynamicController", ["$scope", "$timeout", "$location", "$anchorScroll", "$window", "$filter", "DashboardService",
    function ($scope, $timeout, $location, $anchorScroll, $window, $filter, DashboardService) {
        var scope = $scope;
        var defaultDashboard = DashboardService.getCookieObject("dynamic_dashboard_type") || "aidactivity";

        scope.dashboardsConfig = {
            types: [{
                label: "Aid Activity",
                type: "aidactivity",
                icon: "fa-medkit"
            }, {
                label: "Trade Activity",
                type: "tradeactivity",
                icon: "fa-exchange"
            }, {
                label: "Contract",
                type: "contract",
                icon: "fa-pencil"
            }],
            selectedDashboard: defaultDashboard,
            filters: [],
            selectedFilters: []
        };

        // Column width classes for each filter type
        scope.filterColumnClass = {
            "grid": "col-md-6",
            "grid-grouped": "col-md-12",
            "heatmap": "col-md-6",
            "amount": "col-md-6",
            "year": "col-md-4"
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
            // Save new Dashboard type to cookies
            DashboardService.setCookieObject("dynamic_dashboard_type", newType);

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
