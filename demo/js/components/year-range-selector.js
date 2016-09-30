angular.module('yds').directive('ydsYearRange', ['$timeout', 'DashboardService',
    function($timeout, DashboardService) {
        return {
            restrict: 'E',
            scope: {
                minYear: '@',       // Minimum year of the slider
                maxYear: '@',       // Maximum year of the slider
                dashboardId: '@',   // ID to use for saving year range in DashboardService
                title: '@'          // Title to show above slider (optional)
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/year-range-selector.html',
            link: function (scope, element, attrs) {
                scope.initialized = false;

                var minYear = parseInt(scope.minYear);
                var maxYear = parseInt(scope.maxYear);
                var dashboardId = scope.dashboardId;

                // Check if minYear attr is defined, else assign default value
                if (_.isUndefined(minYear) || _.isNaN(minYear))
                    minYear = 1970;

                // Check if maxYear attr is defined, else assign default value
                if (_.isUndefined(maxYear) || _.isNaN(maxYear))
                    maxYear = 2050;

                // Check if dashboardId attr is defined, else assign default value
                if (_.isUndefined(dashboardId) || dashboardId.length == 0)
                    dashboardId = "default";

                /**
                 * Update the year range in DashboardService
                 */
                var updateYearRange = function() {
                    var minValue = scope.yearSlider.minValue;
                    var maxValue = scope.yearSlider.maxValue;

                    // Update selected years in DashboardService
                    DashboardService.setYearRange(dashboardId, minValue, maxValue);
                };

                // Set initial year selection in DashboardService
                DashboardService.setYearRange(dashboardId, minYear, maxYear);

                // Set slider options
                scope.yearSlider = {
                    minValue: minYear,
                    maxValue: maxYear,
                    options: {
                        floor: minYear,
                        ceil: maxYear,
                        step: 1,
                        onEnd: updateYearRange
                    }
                };

                // Show angular slider after options are set
                scope.initialized = true;
            }
        };
    }
]);
