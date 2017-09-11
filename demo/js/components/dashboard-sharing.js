angular.module("yds").directive("ydsDashboardSharing", ["DashboardService", "$location",
    function (DashboardService, $location) {
        return {
            restrict: "E",
            scope: {
                lang: "@",          // Language of component
                dashboardId: "@"    // Dashboard ID
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/dashboard-sharing.html",
            link: function (scope) {
                // Set default language if it is undefined
                if (_.isUndefined(scope.lang) || scope.lang.trim().length === 0) {
                    scope.lang = "en";
                }

                // Setup popover parameters
                scope.popover = {
                    template: "templates/dashboard-sharing-popover.html",
                    title: "Dashboard Sharing URL",
                    url: ""
                };

                // Make the button disabled if the given dashboardId is not set up in DashboardService
                scope.disableBtn = !DashboardService.dashboardIdHasCookies(scope.dashboardId);

                scope.shareDashboard = function () {
                    scope.popover.url = DashboardService.getSharingUrl(scope.dashboardId);
                };

                // When loading, check if there is a "filters" URL parameter and restore filters from it
                var params = $location.search();

                if (_.has(params, "filters")) {
                    // Parse the JSURL-formatted filters
                    var filters = JSURL.parse(params.filters);

                    // Restore the filters
                    DashboardService.restoreCookies(scope.dashboardId, filters);
                }
            }
        };
    }
]);
