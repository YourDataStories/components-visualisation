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
                var minDiv = _.first(angular.element(element[0].querySelector(".min-number-select")));
                var maxDiv = _.first(angular.element(element[0].querySelector(".max-number-select")));

                var minValue = parseInt(scope.minValue);
                var maxValue = parseInt(scope.maxValue);
                // var defaultValue = scope.defaultValue;
                var selectionType = scope.selectionType;

                // Check if minValue attribute is defined, else assign default value
                if (_.isUndefined(minValue) || _.isNaN(minValue))
                    minValue = 0;

                // Check if maxValue attribute is defined, else assign default value
                if (_.isUndefined(maxValue) || _.isNaN(maxValue))
                    maxValue = 100;

                var selection = {
                    min: minValue,
                    max: maxValue
                };

                // todo: Generate this array from min/max values, e.g. https://stackoverflow.com/a/846249
                var selectValues = [0, 1, 10, 100, 1000];

                /**
                 * Save the current value of the slider to the DashboardService
                 */
                var saveValueToDashboardService = function () {
                    DashboardService.saveObject(selectionType, selection);
                };

                // todo: Check if there is a saved selection in the cookies, and use that as default
                // var cookieValue = DashboardService.getCookieObject(selectionType);
                // if (!_.isUndefined(cookieValue) && !_.isNull(cookieValue)) {
                //     defaultValue = cookieValue;
                // }

                // Save initial slider value to DashboardService
                saveValueToDashboardService();

                /**
                 * Handle changes in the values of the Selectize.js comboboxes.
                 * @param valName   Which value changed (min or max)
                 * @param newValue  The new value
                 */
                var changeHandler = function (valName, newValue) {
                    selection[valName] = newValue;

                    $timeout(function () {
                        // todo: Check that $timeout is required here
                        saveValueToDashboardService();
                    });
                    console.log("Current selection: ", selection);
                };

                // todo: When adding items, check if they are numbers and between min/max values (see createFilter)
                var selectizeOptions = {
                    options: _.map(selectValues, function (item) {
                        return {
                            value: item,
                            text: item
                        };
                    }),
                    create: true,
                    createOnBlur: true,
                    maxItems: 1,
                    placeholder: "Select " + scope.title,
                    onChange: function (item) {
                        console.log("Selected ", item);
                    }
                };

                // Initialize Selectize.js
                $(minDiv).selectize(_.extend(selectizeOptions, {
                    onChange: function (item) {
                        changeHandler("min", item);
                    }
                }));
                $(maxDiv).selectize(_.extend(selectizeOptions, {
                    onChange: function (item) {
                        changeHandler("max", item);
                    }
                }));
            }
        };
    }
]);
