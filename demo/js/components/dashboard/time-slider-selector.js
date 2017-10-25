angular.module("yds").directive("ydsTimeSlider", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                type: "@",          // One of year, day, time, for selecting a year, a day of the week, or specific time
                minYear: "@",       // Minimum year of the slider (for year selection)
                maxYear: "@",       // Maximum year of the slider (for year selection)
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
                var dashboardId = scope.dashboardId;

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
                var options = {};
                var defaultValue = null;

                // Set options that depend on the slider's type
                var specificOptions;
                switch (type) {
                    case "year":
                        specificOptions = {
                            floor: minYear,
                            ceil: maxYear
                        };

                        defaultValue = minYear;
                        break;
                    case "day":
                        specificOptions = {
                            stepsArray: weekDays
                        };

                        defaultValue = 0;
                        break;
                    case "time":
                        specificOptions = {
                            floor: 0,
                            step: 5,
                            ceil: 1439, // There are 1440 minutes in a day
                            translate: function (value) {
                                // Transform the minutes into a time format
                                var hours = Math.floor(value / 60);
                                var minutes = value % 60;
                                return (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes;
                            }
                        };
                        break;
                }

                // Set slider options
                scope.yearSlider = {
                    value: defaultValue,
                    options: _.extend(options, specificOptions)
                };

                // Show angular slider after options are set
                scope.initialized = true;
            }
        };
    }
]);
