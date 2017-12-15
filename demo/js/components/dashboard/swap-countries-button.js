angular.module("yds").directive("ydsSwapCountriesButton", ["Translations", "DashboardService", "Data",
    function (Translations, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                lang: "@",          // Language of component
                dashboardId: "@"    // Dashboard ID
            },
            templateUrl: Data.templatePath + "templates/dashboard/swap-countries-button.html",
            link: function (scope) {
                // Boolean that indicates whether countries can be swapped right now
                scope.canSwapCountries = true;

                // Set default language if it is undefined
                if (_.isUndefined(scope.lang) || scope.lang.trim().length === 0) {
                    scope.lang = "en";
                }

                // Get translated button label
                scope.btnLabel = Translations.get(scope.lang, "swapCountriesBtnLabel");

                /**
                 * Swap the selected countries between the two enabled Heatmap filters
                 */
                scope.swapCountries = function () {
                    // Get country types for this Dashboard
                    var countryTypes = DashboardService.getCountryTypes(scope.dashboardId);

                    // Only continue if there are 2 possible country types
                    if (countryTypes.length !== 2)
                        return;

                    // Get the value for each country type
                    var countryValues = [];
                    _.each(countryTypes, function (cType) {
                        var value = DashboardService.getCountries(cType);

                        // Add to the list if it's not undefined
                        if (!_.isUndefined(value)) {
                            countryValues.push(value);
                        }
                    });

                    // Only continue if both maps had a value
                    if (countryValues.length !== 2)
                        return;

                    // Set the first type's value to the last type's value
                    DashboardService.setCountries(_.first(countryTypes), _.last(countryValues));

                    // Set the last type's value to the first type's value
                    DashboardService.setCountries(_.last(countryTypes), _.first(countryValues));
                };
            }
        };
    }
]);
