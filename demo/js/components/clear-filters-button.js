angular.module("yds").directive("ydsClearFiltersButton", ["DashboardService",
    function (DashboardService) {
        return {
            restrict: "E",
            scope: {
                lang: "@",          // Language of component
                dashboardId: "@"    // Dashboard ID
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/clear-filters-button.html",
            link: function (scope) {
                scope.clearFilters = function () {
                    console.log("Clearing filters");
                }
            }
        };
    }
]);
