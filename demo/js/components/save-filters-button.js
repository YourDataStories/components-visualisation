angular.module("yds").directive("ydsSaveFiltersButton", ["DashboardService", "Basket",
    function (DashboardService, Basket) {
        return {
            restrict: "E",
            scope: {
                lang: "@",          // Language of component
                dashboardId: "@"    // Dashboard ID
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/save-filters-button.html",
            link: function (scope) {
                // Set default language if it is undefined
                if (_.isUndefined(scope.lang) || scope.lang.trim().length == 0) {
                    scope.lang = "en";
                }

                scope.tooltipText = (scope.lang == "el") ? "Αποθήκευση φίλτρων" : "Save filters to Library";

                // Make the button disabled if the given dashboardId is not set up in DashboardService
                scope.disableBtn = !DashboardService.dashboardIdHasCookies(scope.dashboardId);

                /**
                 * Save the filters for the specified Dashboard to the Library
                 */
                scope.saveFilters = function () {
                    var cookiesObj = DashboardService.getDashboardCookies(scope.dashboardId);
                    console.log("Save filters", cookiesObj);
                    //todo

                    var basketConfig = {
                        user_id: Basket.getUserId(),
                        parameters: cookiesObj
                    };

                    Basket.openDashboardModal(basketConfig);
                }
            }
        };
    }
]);
