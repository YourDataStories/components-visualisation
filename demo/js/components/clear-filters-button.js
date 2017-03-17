angular.module("yds").directive("ydsClearFiltersButton", ["DashboardService", "$window",
    function (DashboardService, $window) {
        return {
            restrict: "E",
            scope: {
                lang: "@",          // Language of component
                dashboardId: "@"    // Dashboard ID
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/clear-filters-button.html",
            link: function (scope) {
                // Set default language if it is undefined
                if (_.isUndefined(scope.lang) || scope.lang.trim().length == 0) {
                    scope.lang = "en";
                }

                // Make the button disabled if the given dashboardId is not set up in DashboardService
                scope.disableBtn = !DashboardService.dashboardIdHasCookies(scope.dashboardId);

                /**
                 * Clear the filters for the specified Dashboard
                 */
                scope.clearFilters = function () {
                    // Clear saved cookies for this dashboard
                    DashboardService.clearDashboardCookies(scope.dashboardId);

                    // Reload the page
                    $window.location.reload();
                }
            }
        };
    }
]);
