angular.module('yds').directive('ydsDashboardUpdater', ['$timeout', 'DashboardService',
    function($timeout, DashboardService) {
        return {
            restrict: 'E',
            scope: {
                type: '@',          // What type of component to show (grid, info etc.)
                viewType: '@',      // Type to give to component
                dashboardId: '@',   // ID used for getting selected year range from DashboardService
                minHeight: '@',     // Minimum height of this component's container
                lang: '@'           // Language of component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/dashboard-updater.html',
            link: function (scope) {
                var dashboardId = scope.dashboardId;
                var minHeight = parseInt(scope.minHeight);
                scope.showInfo = false;

                // If type is undefined, set default value
                if (_.isUndefined(scope.type) || scope.type.trim() == "")
                    scope.type = "info";

                // If viewType is undefined, set default value
                if (_.isUndefined(scope.viewType) || scope.viewType.trim() == "")
                    scope.type = "default";

                // If lang is undefined, set default value
                if (_.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";

                // If dashboardId is undefined, set default value
                if (_.isUndefined(dashboardId) || dashboardId.trim() == "") {
                    dashboardId = "default";
                }

                // If minHeight is undefined, set default value
                if (_.isUndefined(minHeight) || _.isNaN(minHeight)) {
                    minHeight = 0;
                }

                // Set minimum height of container so when component is being refreshed, the container's
                // height does not become 0 which causes the page to scroll up
                scope.containerStyle = {
                    "min-height": minHeight + "px"
                };

                var updateExtraParams = function() {
                    // Add new extraParams to scope
                    scope.extraParams = DashboardService.getApiOptions(dashboardId);

                    // Re-render component
                    var type = scope.type;  // Save current type
                    scope.type = "";        // Make type empty to hide component

                    $timeout(function() {
                        scope.type = type;  // At end of digest show component again
                    });
                };

                // Subscribe to be notified of changes in selected countries and year range
                DashboardService.subscribeSelectionChanges(scope, updateExtraParams);
                DashboardService.subscribeYearChanges(scope, updateExtraParams);

                // Get initial info
                updateExtraParams();
            }
        };
    }
]);
