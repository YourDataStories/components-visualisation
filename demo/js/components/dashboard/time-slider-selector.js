angular.module("yds").directive("ydsTimeSlider", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                type: "@",          // One of year, day, time, for selecting a year, a day of the week, or specific time
                minYear: "@",       // Minimum year of the slider (for year selection)
                maxYear: "@",       // Maximum year of the slider (for year selection)
                defaultValue: "@",  // Default value
                dashboardId: "@",   // ID to use for saving the value in DashboardService
                selectionType: "@", // Selection type for DashboardService
                title: "@"          // Title to show above slider (optional)
            },
            templateUrl: Data.templatePath + "templates/dashboard/time-slider-selector.html",
            link: function (scope, element, attrs) {
                scope.initialized = false;

                var type = scope.type;
                var minYear = parseInt(scope.minYear);
                var maxYear = parseInt(scope.maxYear);
                var defaultValue = parseInt(scope.defaultValue);
                var dashboardId = scope.dashboardId;
                var selectionType = scope.selectionType;

                // Check if type attribute is set correctly
                if (_.isUndefined(type) || (type !== "year" && type !== "day" && type !== "time")) {
                    console.error("Type is wrong or undefined! Using 'year' as a default.");
                    type = "year";
                }

                // Check if minYear attribute is defined, else assign default value
                if (_.isUndefined(minYear) || _.isNaN(minYear))
                    minYear = 1970;

                // Check if maxYear attribute is defined, else assign default value
                if (_.isUndefined(maxYear) || _.isNaN(maxYear))
                    maxYear = 2050;

                // Check if dashboardId attribute is defined, else assign default value
                if (_.isUndefined(dashboardId) || dashboardId.length === 0)
                    dashboardId = "default";

                /**
                 * Transform the number of minutes that has passed since midnight to a string of the form HH:MM
                 * @param value     Number of minutes since midnight
                 * @returns {string}
                 */
                var minutesToTime = function (value) {
                    // Transform the minutes into a time format
                    var hours = Math.floor(value / 60);
                    var minutes = value % 60;
                    return (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes;
                };

                // Set names for the days of the week
                var weekDays = [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday"
                ];

                // Set common options for all sliders
                var options = {
                    onEnd: function () {
                        var finalValue;

                        // Apply modification to the value depending on the type
                        switch (type) {
                            case "day":
                                finalValue = weekDays[scope.slider.value];
                                break;
                            case "time":
                                finalValue = minutesToTime(scope.slider.value);
                                break;
                            default:
                                finalValue = scope.slider.value;
                        }

                        DashboardService.saveObject(selectionType, finalValue);
                    }
                };

                // Set options that depend on the slider's type
                var specificOptions;
                switch (type) {
                    case "year":
                        specificOptions = {
                            floor: minYear,
                            ceil: maxYear
                        };

                        defaultValue = defaultValue || minYear;
                        break;
                    case "day":
                        specificOptions = {
                            stepsArray: weekDays
                        };

                        defaultValue = defaultValue || 0;
                        break;
                    case "time":
                        specificOptions = {
                            floor: 0,
                            step: 5,
                            ceil: 1439, // There are 1440 minutes in a day
                            translate: minutesToTime
                        };

                        defaultValue = defaultValue || 0;
                        break;
                }

                // Set slider options
                scope.slider = {
                    value: defaultValue,
                    options: _.extend(options, specificOptions)
                };

                // Show angular slider after options are set
                scope.initialized = true;
            }
        };
    }
]);
