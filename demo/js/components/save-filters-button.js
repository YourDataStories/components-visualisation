angular.module("yds").directive("ydsSaveFiltersButton", ["DashboardService", "Data", "Basket",
    function (DashboardService, Data, Basket) {
        return {
            restrict: "E",
            scope: {
                lang: "@",          // Language of component
                infoType: "@",      // Type to use for info component which will show filters to be saved
                dashboardId: "@"    // Dashboard ID
            },
            templateUrl: Data.templatePath + "templates/save-filters-button.html",
            link: function (scope) {
                // Set default language if it is undefined
                if (_.isUndefined(scope.lang) || scope.lang.trim().length === 0) {
                    scope.lang = "en";
                }

                // Set default language if it is undefined
                if (_.isUndefined(scope.infoType) || scope.infoType.trim().length === 0) {
                    scope.infoType = "default"; // In this case, the info component will be blank
                }

                scope.tooltipText = (scope.lang === "el") ? "Αποθήκευση φίλτρων" : "Save filters to Library";

                // Make the button disabled if the given dashboardId is not set up in DashboardService
                scope.disableBtn = !DashboardService.dashboardIdHasCookies(scope.dashboardId);

                /**
                 * Save the filters for the specified Dashboard to the Library
                 */
                scope.saveFilters = function () {
                    // Get cookies for this Dashboard
                    var cookiesObj = DashboardService.getDashboardCookies(scope.dashboardId);

                    // Create Library item
                    var basketConfig = {
                        user_id: Basket.getUserId(),
                        parameters: cookiesObj,
                        dashboard: scope.dashboardId,
                        type: "dashboard"
                    };

                    // Create configuration object with info needed by the modal
                    var modalConfig = {
                        infoType: scope.infoType,
                        lang: scope.lang
                    };

                    // Open the modal
                    Basket.openDashboardModal(basketConfig, modalConfig);
                }
            }
        };
    }
]);
