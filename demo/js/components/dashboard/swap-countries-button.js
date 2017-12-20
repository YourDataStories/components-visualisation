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
                // todo: Pressing the button multiple times quickly makes it stop working
                // Boolean that indicates whether countries can be swapped right now
                scope.countrySwapEnabled = true;

                // Set default language if it is undefined
                if (_.isUndefined(scope.lang) || scope.lang.trim().length === 0) {
                    scope.lang = "en";
                }

                // Get translated button label
                scope.btnLabel = Translations.get(scope.lang, "swapCountriesBtnLabel");

                /**
                 * Get the country types for the current Dashboard ID
                 */
                var getCountryTypes = function () {
                    var countryMapping = DashboardService.getCountryMapping(scope.dashboardId);
                    return _.values(countryMapping);
                };

                /**
                 * Given some country (view)types, get their values
                 * @param countryTypes  Array of country (heatmap) view types
                 * @param codesOnly     Set to true if you want a list of just the country codes instead of objects.
                 * @returns {Array}
                 */
                var getCountryValues = function (countryTypes, codesOnly) {
                    var countryValues = [];
                    _.each(countryTypes, function (cType) {
                        var value = DashboardService.getCountries(cType);

                        // Add to the list if it's not undefined
                        if (!_.isUndefined(value)) {
                            // Check if we should return whole objects, or just the country codes
                            if (codesOnly) {
                                value = _.pluck(value, "code");
                            }

                            countryValues.push(value);
                        }
                    });

                    return countryValues;
                };

                /**
                 * Swap the selected countries between the two enabled Heatmap filters
                 */
                scope.swapCountries = function () {
                    // Final check if countries can be swapped, in case something changed
                    if (canSwapCountries()) {
                        // Get country types for this Dashboard
                        var countryTypes = getCountryTypes();

                        // Get the value for each country type
                        var countryValues = getCountryValues(countryTypes, false);

                        // Set the first type's value to the last type's value
                        DashboardService.setCountries(_.first(countryTypes), _.last(countryValues));

                        // Set the last type's value to the first type's value
                        DashboardService.setCountries(_.last(countryTypes), _.first(countryValues));
                    } else {
                        console.warn("Countries cannot be swapped, but button was enabled.");
                    }
                };

                /**
                 * Check if country swapping can be done. The conditions that must be met are
                 * - There are two heatmaps on the page
                 * - The heatmaps have selected countries
                 * - The countries from each heatmap exist on the other
                 * @returns {boolean}   Whether swapping can be done or not
                 */
                var canSwapCountries = function () {
                    // Get values for the countries
                    // todo: Could remember previous country types and if they don't change, do nothing?
                    var countryTypes = getCountryTypes();

                    // If there aren't two country types, disable the button
                    if (countryTypes.length !== 2) {
                        return false;
                    }

                    // Get the selections (ignoring empty ones)
                    var selectedCountries = getCountryValues(countryTypes, true);
                    selectedCountries = _.reject(selectedCountries, _.isEmpty);

                    // Check that both heatmaps had selections
                    if (selectedCountries.length !== 2) {
                        return false;
                    }

                    // Get the enabled countries from each heatmap
                    var availableCountries = [];

                    _.each(countryTypes, function (type) {
                        var countries = DashboardService.getObject(type + "_codes");

                        availableCountries.push(countries);
                    });

                    // Check that we indeed have 2 lists of available countries
                    if (availableCountries.length !== 2) {
                        console.warn("Countries both had values but didn't save available countries?");
                        return false;
                    }

                    // Check that the selected country from each heatmap exists on the other
                    var ok = true;

                    var availableCountries1 = _.first(availableCountries);
                    _.each(_.last(selectedCountries), function (country) {
                        if (!_.contains(availableCountries1, country)) {
                            ok = false;
                        }
                    });

                    // If the selected country of the 2nd heatmap doesn't exist in the 1st, don't continue
                    if (!ok)
                        return false;

                    var availableCountries2 = _.last(availableCountries);
                    _.each(_.first(selectedCountries), function (country) {
                        if (!_.contains(availableCountries2, country)) {
                            ok = false;
                        }
                    });

                    return true;
                };

                var buttonEnableCheck = function () {
                    // Enable the button only if the countries between the heatmaps can be swapped
                    scope.countrySwapEnabled = canSwapCountries();

                    // Check that there are 2 heatmap filters enabled, to hide the button
                    var filterLabels = DashboardService.getObject("filter_" + scope.dashboardId);

                    // Get filters for this Dashboard
                    var filters = DashboardService.getDashboardFilters(scope.dashboardId);

                    // Count how many of the enabled filters are heatmaps
                    var heatmapCount = 0;

                    _.each(filterLabels, function (label) {
                        var filter = _.findWhere(filters, {
                            name: label
                        });

                        if (filter.type === "heatmap") {
                            heatmapCount++;
                        }
                    });

                    // Show button only if the enabled heatmaps are exactly 2
                    scope.showButton = (heatmapCount === 2);
                };

                // When available countries change, check if we should enable/disable the button
                DashboardService.subscribeObjectChanges(scope, buttonEnableCheck);
                DashboardService.subscribeSelectionChanges(scope, buttonEnableCheck);
            }
        };
    }
]);
