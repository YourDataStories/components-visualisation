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
                var selectionType = scope.selectionType;

                // Check if minValue attribute is defined, else assign default value
                if (_.isUndefined(minValue) || _.isNaN(minValue))
                    minValue = 0;

                // Check if maxValue attribute is defined, else assign default value
                if (_.isUndefined(maxValue) || _.isNaN(maxValue))
                    maxValue = 100;

                var selection = {
                    min: "*",
                    max: "*"
                };

                // Generate array with some numbers between the min/max values
                // Another way: https://stackoverflow.com/a/846249
                var comboboxValues = [minValue];

                var i = 0;
                while (_.last(comboboxValues) < maxValue) {
                    comboboxValues.push(Math.pow(10, i));
                    i++;
                }
                comboboxValues.push(maxValue);
                comboboxValues.push("*");

                // Check if there is a saved selection in the cookies, and use that as default
                var cookieValue = DashboardService.getCookieObject(selectionType);
                if (!_.isUndefined(cookieValue) && !_.isNull(cookieValue)) {
                    // Split cookie value to min/max values and add then to the selection to be used as defaults
                    var vals = cookieValue.replace(/\[|]/g, "").split(" TO ");

                    // Get min & max values as integers, or "*" string
                    var min = (vals[0] === "*") ? "*" : parseInt(vals[0]);
                    var max = (vals[1] === "*") ? "*" : parseInt(vals[1]);

                    // Ensure that the default min/max values are added to the list
                    if (!_.contains(comboboxValues, min)) {
                        comboboxValues.push(min);
                    }

                    if (!_.contains(comboboxValues, max)) {
                        comboboxValues.push(max);
                    }

                    // Set the selection
                    selection.min = min;
                    selection.max = max;
                }

                /**
                 * Handle changes in the values of the Selectize.js comboboxes.
                 * @param valName   Which value changed (min or max)
                 * @param newValue  The new value
                 */
                var changeHandler = function (valName, newValue) {
                    // Save new selection to variable, and Dashboard service
                    if (!_.isUndefined(valName) && !_.isUndefined(newValue) && newValue.length > 0) {
                        selection[valName] = newValue;
                    }

                    DashboardService.saveObject(selectionType, "[" + selection.min + " TO " + selection.max + "]");
                };

                // Create options that are applicable to both comboboxes
                var selectizeOptions = {
                    options: _.map(comboboxValues, function (item) {
                        return {
                            value: item,
                            text: item.toLocaleString(undefined, {minimumFractionDigits: 0})
                        };
                    }),
                    create: true,
                    createOnBlur: true,
                    maxItems: 1,
                    placeholder: "Select " + scope.title,
                    createFilter: "^[0-9]+$"    // Allow only numbers as user input
                };

                // Initialize Selectize.js for min and max comboboxes
                $(minDiv).selectize(_.extend(selectizeOptions, {
                    items: [selection.min],
                    onChange: function (item) {
                        changeHandler("min", item);
                    }
                }));

                $(maxDiv).selectize(_.extend(selectizeOptions, {
                    items: [selection.max],
                    onChange: function (item) {
                        changeHandler("max", item);
                    }
                }));

                // Save initial slider value to DashboardService
                changeHandler();
            }
        };
    }
]);
