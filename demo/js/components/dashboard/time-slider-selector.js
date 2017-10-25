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
                height: "@",        // Height of the slider (optional)
                title: "@"          // Title to show above slider (optional)
            },
            templateUrl: Data.templatePath + "templates/dashboard/time-slider-selector.html",
            link: function (scope, element, attrs) {
                scope.initialized = false;

                var type = scope.type;
                var minYear = parseInt(scope.minYear);
                var maxYear = parseInt(scope.maxYear);
                var height = parseInt(scope.height);
                var dashboardId = scope.dashboardId;
                var vertical = scope.vertical;

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

                if (!_.isUndefined(height) && !_.isNaN(height)) {
                    scope.containerStyle = {
                        height: height + "px"
                    }
                }

                var options = {};
                switch (type) {
                    case "year":
                        break;
                    case "day":
                        options.stepsArray = [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday"
                        ];
                        break;
                    case "time":
                        break;
                }

                // Set slider options
                scope.yearSlider = {
                    value: minYear,
                    options: options
                };

                // Show angular slider after options are set
                scope.initialized = true;
            }
        };
    }
]);
