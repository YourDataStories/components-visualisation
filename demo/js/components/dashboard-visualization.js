angular.module('yds').directive('ydsDashboardVisualization', ['DashboardService', '$ocLazyLoad', '$timeout',
    function (DashboardService, $ocLazyLoad, $timeout) {
        return {
            restrict: 'E',
            scope: {
                projectId: '@',         // Project ID of chart
                dashboardId: '@',       // ID used for getting selected year range from DashboardService
                addToBasket: '@',       // If true, the save to basket button will appear in visualizations
                disableColor: '@',      // If true, the component will ignore the color of the selected aggregate type
                defaultChart: '@',      // Chart to show on initialization of the component. Default is "bar".
                type: '@',              // View type of component. If not set, will get it from DashboardService
                lang: '@',              // Language of charts
                baseUrl: '@',           // Base URL to send to API
                title: '@',             // Title of component
                elementH: '@',          // Height of component

                numberOfItems: '@',     // Number of items that the charts are expected to show. If too big, will use paging
                pagingThreshold: '@',   // Number of items that when exceeded, components with paging should be used

                enableRating: '@'       // Enable rating buttons for this component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/dashboard-visualization.html',
            link: function (scope) {
                var dashboardId = scope.dashboardId;
                var disableColor = scope.disableColor;
                var defaultChart = scope.defaultChart;
                var type = scope.type;
                scope.usePaging = false;    // Paging disabled by default

                scope.aggregateRadio = "count";

                // Check if the component's title attribute is defined, else assign default value
                if (_.isUndefined(scope.title)) {
                    if (scope.lang == "el") {
                        scope.title = "Λεπτομέρειες";
                    } else {
                        scope.title = "Details";
                    }
                }

                // If the pagingThreshold is set, watch for changes in the number of items
                scope.pagingThreshold = parseInt(scope.pagingThreshold);

                if (!_.isUndefined(scope.pagingThreshold) && !_.isNaN(scope.pagingThreshold)) {
                    scope.$watch("numberOfItems", function () {
                        // Check if paging should be used
                        scope.usePaging = parseInt(scope.numberOfItems) >= scope.pagingThreshold;
                    });
                }

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(scope.elementH) || scope.elementH.trim() == "")
                    scope.elementH = 300;

                // If dashboardId is undefined, show error
                if (_.isUndefined(dashboardId) || dashboardId.trim() == "")
                    dashboardId = "default";

                // If disableColor is undefined, show error
                if (_.isUndefined(disableColor) || (disableColor != "true" && disableColor != "false"))
                    disableColor = "false";

                // If defaultChart is undefined, show bar chart
                if (_.isUndefined(defaultChart)) {
                    defaultChart = "bar";
                }

                // Set minimum height of details panel body
                scope.panelBodyStyle = {
                    "min-height": (parseInt(scope.elementH) + 30) + "px"
                };

                scope.selectedVis = DashboardService.getSelectedVisType();

                // Set the first type as default selected one
                scope.selProjectId = scope.projectId;
                scope.selViewType = "";

                // Variables for previous values, to check that something really changed before re-rendering component
                var prevViewType = "";
                var updateVis = false;

                /**
                 * Re-render the selected visualization
                 */
                var updateVisualization = function () {
                    if (updateVis) {
                        var selectedVis = defaultChart;
                        if (scope.selectedVis.length > 0) {
                            selectedVis = scope.selectedVis;
                        }

                        // Make selectedVis empty in order for the component to re-render
                        scope.selectedVis = "";

                        // Postpone to end of digest queue
                        $timeout(function () {
                            scope.selectVis(selectedVis);

                            updateVis = false;
                        });
                    }
                };

                /**
                 * Update the view type from the DashboardService
                 * Also sets the Visualization panel's color
                 */
                var updateViewType = function () {
                    prevViewType = scope.selViewType;
                    var viewType = DashboardService.getViewType(dashboardId);

                    if (!_.isUndefined(type) && type.length > 0) {
                        // Use view type from attribute
                        viewType = {
                            type: type
                        };
                    }

                    if (!_.isUndefined(viewType) && !_.isEqual(prevViewType, viewType.type)) {
                        scope.selViewType = viewType.type;

                        if (disableColor != "true") {
                            scope.panelStyle = viewType.panelStyle;
                            scope.panelHeadingStyle = _.omit(viewType.panelHeadingStyle, "min-height");
                        }

                        updateVis = true;
                    }
                };

                /**
                 * Handles view type selection changes
                 */
                var viewTypeChangeHandler = function () {
                    updateViewType();
                    updateVisualization();
                };

                if (_.isUndefined(type) || type.length == 0) {
                    // Subscribe to year selection and view type changes
                    DashboardService.subscribeViewTypeChanges(scope, viewTypeChangeHandler);
                }

                /**
                 * Change selected visualization type
                 * @param visType
                 */
                scope.selectVis = function (visType) {
                    scope.selectedVis = visType;

                    DashboardService.setVisType(visType);
                };

                // Initialize component
                viewTypeChangeHandler();
            }
        };
    }
]);
