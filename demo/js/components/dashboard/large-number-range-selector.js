angular.module("yds").directive("ydsLargeNumberRange", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                minValue: "@",      // Minimum year of the slider (for year selection)
                maxValue: "@",      // Maximum year of the slider (for year selection)
                defaultValue: "@",  // Default value
                selectionType: "@", // Selection type for DashboardService
                title: "@"          // Title to show above slider (optional)
            },
            templateUrl: Data.templatePath + "templates/dashboard/large-number-range-selector.html",
            link: function (scope, element, attrs) {
                scope.initialized = false;

                var minValue = parseInt(scope.minValue);
                var maxValue = parseInt(scope.maxValue);
                var defaultValue = scope.defaultValue;
                var selectionType = scope.selectionType;

                // Check if minYear attribute is defined, else assign default value
                if (_.isUndefined(minValue) || _.isNaN(minValue))
                    minValue = 0;

                // Check if maxYear attribute is defined, else assign default value
                if (_.isUndefined(maxValue) || _.isNaN(maxValue))
                    maxValue = 100;

                /**
                 * Save the current value of the slider to the DashboardService using the specified selection type.
                 */
                var saveValueToDashboardService = function () {
                    DashboardService.saveObject(selectionType, scope.slider.value);
                };

                // Check if there is a saved selection in the cookies, and use that as default
                var cookieValue = DashboardService.getCookieObject(selectionType);
                if (!_.isUndefined(cookieValue) && !_.isNull(cookieValue)) {
                    defaultValue = cookieValue;
                }

                // Set slider options
                scope.slider = {
                    value: defaultValue,
                    options: {
                        onEnd: saveValueToDashboardService,
                        floor: minValue,
                        ceil: maxValue
                    }
                };

                // Save initial slider value to DashboardService
                saveValueToDashboardService();

                // Show angular slider after options are set
                scope.initialized = true;
            }
        };
    }
]);
