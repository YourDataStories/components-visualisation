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
                    //todo: Swap countries
                };
            }
        };
    }
]);
