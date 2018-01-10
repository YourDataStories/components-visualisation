angular.module("yds").directive("ydsYearRange", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                enableBar: "@",     // Set to true to enable bar chart with resource counts. Required bar type to be set
                barType: "@",       // Bar view type for resource counts
                lang: "@",          // Language of component (only used for bar chart)

                minYear: "@",       // Minimum year of the slider
                maxYear: "@",       // Maximum year of the slider
                dashboardId: "@",   // ID to use for saving year range in DashboardService
                vertical: "@",      // If true the slider will be vertical (defaults to horizontal)
                height: "@",        // Height of the slider (optional)
                title: "@"          // Title to show above slider (optional)
            },
            templateUrl: Data.templatePath + "templates/dashboard/year-range-selector.html",
            link: function (scope, element, attrs) {
                scope.initialized = false;

                var minYear = parseInt(scope.minYear);
                var maxYear = parseInt(scope.maxYear);
                var height = parseInt(scope.height);
                var dashboardId = scope.dashboardId;

                // Check if minYear attribute is defined, else assign default value
                if (_.isUndefined(minYear) || _.isNaN(minYear))
                    minYear = 1970;

                // Check if maxYear attribute is defined, else assign default value
                if (_.isUndefined(maxYear) || _.isNaN(maxYear))
                    maxYear = 2050;

                // Check if dashboardId attribute is defined, else assign default value
                if (_.isUndefined(dashboardId) || dashboardId.length === 0)
                    dashboardId = "default";

                // Check if vertical attribute is defined, else assign default value
                if (_.isUndefined(scope.vertical) || (scope.vertical !== "true" && scope.vertical !== "false"))
                    scope.vertical = "false";

                // Check if enableBar attribute is defined, else assign default value
                if (_.isUndefined(scope.enableBar) || (scope.enableBar !== "true" && scope.enableBar !== "false"))
                    scope.enableBar = "false";

                if (!_.isUndefined(height) && !_.isNaN(height)) {
                    scope.containerStyle = {
                        height: height + "px"
                    }
                }

                // Set cookie key for this selector
                var cookieKey = "year_" + dashboardId;

                /**
                 * Update the year range in DashboardService
                 */
                var updateYearRange = function () {
                    var minValue = scope.yearSlider.minValue;
                    var maxValue = scope.yearSlider.maxValue;

                    // Update selected years in DashboardService
                    DashboardService.setYearRange(dashboardId, minValue, maxValue);

                    DashboardService.setCookieObject(cookieKey, {
                        minValue: minValue,
                        maxValue: maxValue
                    });
                };

                // Set slider options
                scope.yearSlider = {
                    minValue: minYear,
                    maxValue: maxYear,
                    options: {
                        floor: minYear,
                        ceil: maxYear,
                        step: 1,
                        vertical: (scope.vertical === "true"),
                        onEnd: updateYearRange
                    }
                };

                // Show angular slider after options are set
                scope.initialized = true;

                // If there are any min/max years saved in a cookie, restore them
                var cookieYears = DashboardService.getCookieObject(cookieKey);

                if (!_.isEmpty(cookieYears)) {
                    // Set values on the slider model to be shown on the page
                    scope.yearSlider.minValue = cookieYears.minValue;
                    scope.yearSlider.maxValue = cookieYears.maxValue;

                    // Set selected year range to the one from the cookie
                    DashboardService.setYearRange(dashboardId, cookieYears.minValue, cookieYears.maxValue);
                } else {
                    // Set initial year selection to be the entire range
                    DashboardService.setYearRange(dashboardId, minYear, maxYear);
                }

                // Make sure to show the pointers in the correct places
                $timeout(function () {
                    scope.$broadcast("reCalcViewDimensions");
                }, 50);
            }
        };
    }
]);
