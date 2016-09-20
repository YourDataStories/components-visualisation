angular.module('yds').directive('ydsDashboardUpdater', ['$timeout', 'DashboardService',
    function($timeout, DashboardService) {
        return {
            restrict: 'E',
            scope: {
                type: '@',          // What type of component to show (grid, info etc.)
                viewType: '@',      // Type to give to component
                dashboardId: '@',   // ID used for getting selected year range from DashboardService
                lang: '@'           // Language of component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/dashboard-updater.html',
            link: function (scope) {
                var dashboardId = scope.dashboardId;
                scope.showInfo = false;

                // If type is undefined, set default value
                if (_.isUndefined(scope.type) || scope.type.trim() == "")
                    scope.type = "info";

                // If viewType is undefined, set default value
                if (_.isUndefined(scope.viewType) || scope.viewType.trim() == "")
                    scope.type = "default";

                // If lang is undefined, set default value
                if (_.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";

                // If dashboardId is undefined, set default value
                if (_.isUndefined(dashboardId) || dashboardId.trim() == "") {
                    dashboardId = "default";
                }

                var updateExtraParams = function() {
                    var apiOptionsMap = DashboardService.getApiOptionsMapping();

                    // Get min and max selected year and create the year range string for request
                    var minYear = DashboardService.getMinYear(dashboardId);
                    var maxYear = DashboardService.getMaxYear(dashboardId);

                    var yearRange = "[" + minYear + " TO " + maxYear + "]";

                    // Initialize extraParams object with year range
                    var extraParams = {
                        year: yearRange
                    };

                    // Get countries to send with request from DashboardService
                    _.each(apiOptionsMap, function(viewType, key) {
                        var countries = DashboardService.getCountries(viewType);
                        countries = _.pluck(countries, "code").join(",");

                        if (countries.length > 0) {
                            extraParams[key] = countries;
                        }
                    });

                    // Add new extraParams to scope
                    scope.extraParams = extraParams;

                    // Re-render component
                    var type = scope.type;  // Save current type
                    scope.type = "";        // Make type empty to hide component

                    $timeout(function() {
                        scope.type = type;  // At end of digest show component again
                    });
                };

                // Subscribe to be notified of changes in selected countries and year range
                DashboardService.subscribeSelectionChanges(scope, updateExtraParams);
                DashboardService.subscribeYearChanges(scope, updateExtraParams);

                // Get initial info
                updateExtraParams();
            }
        };
    }
]);
