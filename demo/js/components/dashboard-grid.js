angular.module('yds').directive('ydsDashboardGrid', ['Data', '$timeout', 'DashboardService',
    function(Data, $timeout, DashboardService) {
        return {
            restrict: 'E',
            scope: {
                dashboardId: '@',   // ID used for getting selected year range from DashboardService
                lang: '@'           // Language of component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/dashboard-grid.html',
            link: function (scope) {
                var dashboardId = scope.dashboardId;
                scope.showGrid = false;

                if (_.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";

                // If dashboardId is undefined, show error
                if (_.isUndefined(dashboardId) || dashboardId.trim() == "") {
                    dashboardId = "default";
                }

                var updateInfo = function() {
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

                    // Re-render info component
                    scope.showGrid = false;

                    $timeout(function() {
                        scope.showGrid = true;
                    });
                };

                // Subscribe to be notified of changes in selected countries and year range
                DashboardService.subscribeSelectionChanges(scope, updateInfo);
                DashboardService.subscribeYearChanges(scope, updateInfo);

                // Get initial info
                updateInfo();
            }
        };
    }
]);
