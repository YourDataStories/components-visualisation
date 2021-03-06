angular.module("yds").directive("ydsYearRange", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                enableBar: "@",     // Set to true to enable bar chart with resource counts. Required bar type to be set
                barType: "@",       // Bar view type for resource counts
                lang: "@",          // Language of component (only used for bar chart)

                selectionType: "@", // Selection type. If you set this, the range will be saved as an object.

                minYear: "@",       // Minimum year of the slider
                maxYear: "@",       // Maximum year of the slider
                dashboardId: "@",   // ID to use for saving year range in DashboardService
                vertical: "@",      // If true the slider will be vertical (defaults to horizontal)
                height: "@",        // Height of the slider (optional)
                title: "@"          // Title to show above slider (optional)
            },
            templateUrl: Data.templatePath + "templates/dashboard/year-range-selector.html",
            link: function (scope, element, attrs) {
                var maxValue = "Max";
                scope.initialized = false;

                var minYear = parseInt(scope.minYear);
                var maxYear = parseInt(scope.maxYear);
                var height = parseInt(scope.height);
                var dashboardId = scope.dashboardId;
                var selectionType = scope.selectionType;
                var saveAsYear = (_.isUndefined(selectionType) || selectionType.length === 0);

                // Check if minYear attribute is defined, else assign default value
                if (_.isNaN(minYear) && scope.minYear === maxValue) {
                    minYear = maxValue;
                } else if (_.isUndefined(minYear) || _.isNaN(minYear)) {
                    minYear = 1970;
                }

                // Check if maxYear attribute is defined, else assign default value
                if (_.isNaN(maxYear) && scope.maxYear === maxValue) {
                    maxYear = maxValue;
                } else if (_.isUndefined(maxYear) || _.isNaN(maxYear)) {
                    maxYear = 2050;
                }

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
                var cookieKey = saveAsYear ? "year_" + dashboardId : selectionType;

                /**
                 * Save a year range to the DashboardService, taking into account the saveAsYear variable.
                 * (if true will save using the year range facility, otherwise as an object)
                 * @param minValue  Minimum value
                 * @param maxValue  Maximum value
                 */
                var saveRangeToService = function (minValue, maxValue) {
                    var valueObj = {
                        minValue: minValue,
                        maxValue: maxValue
                    };

                    // Update selected years in DashboardService
                    if (saveAsYear) {
                        // Save as year range, and add a cookie manually
                        DashboardService.setYearRange(dashboardId, minValue, maxValue);
                        DashboardService.setCookieObject(cookieKey, valueObj);
                    } else {
                        // Save as object
                        DashboardService.saveObject(selectionType, valueObj);
                    }
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
                        onEnd: function () {
                            saveRangeToService(scope.yearSlider.minValue, scope.yearSlider.maxValue);
                        }
                    }
                };

                // Special slider case: number of tenders (custom steps)
                if (selectionType === "numberOfTenders") {
                    var stepsArray = [];
                    for (var i = 0; i <= 20; i++) {
                        stepsArray.push(i);
                    }
                    stepsArray.push(100, 500, 1000, 5000, 10000, 50000, 100000, maxValue);

                    scope.yearSlider.options = {
                        stepsArray: stepsArray,
                        vertical: (scope.vertical === "true"),
                        onEnd: function () {
                            saveRangeToService(scope.yearSlider.minValue, scope.yearSlider.maxValue);
                        }
                    }
                }

                // Show angular slider after options are set
                scope.initialized = true;

                // If there are any min/max years saved in a cookie, restore them
                var cookieYears = DashboardService.getCookieObject(cookieKey);

                if (!_.isEmpty(cookieYears)) {
                    // Set values on the slider model to be shown on the page
                    scope.yearSlider.minValue = cookieYears.minValue;
                    scope.yearSlider.maxValue = cookieYears.maxValue;

                    // Set selected year range to the one from the cookie
                    saveRangeToService(cookieYears.minValue, cookieYears.maxValue);
                } else {
                    // Set initial year selection to be the entire range
                    saveRangeToService(minYear, maxYear);
                }

                // Make sure to show the pointers in the correct places
                $timeout(function () {
                    scope.$broadcast("reCalcViewDimensions");
                }, 50);
            }
        };
    }
]);
