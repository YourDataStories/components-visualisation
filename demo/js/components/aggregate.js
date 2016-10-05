angular.module('yds').directive('ydsAggregate', ['Data', 'DashboardService', '$sce',
    function(Data, DashboardService, $sce) {
        return {
            restrict: 'E',
            scope: {
                projectId: '@',     // Project ID of chart
                viewType: '@',      // View type of chart
                dashboardId: '@',   // ID used for getting selected year range from DashboardService
                lang: '@',          // Language
                iconSize: '@',      // Icon size for FontAwesome icon (2-5)
                setOnInit: '@',     // If true, will set this aggregate's view type in DashboardService on init
                extraParams: '='    // Extra parameters to send
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath +'/' : '') + 'templates/aggregate.html',
            link: function (scope) {
                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var dashboardId = scope.dashboardId;
                var lang = scope.lang;
                var setOnInit = scope.setOnInit;
                var iconSize = scope.iconSize;

                var initialized = false;

                scope.showDetailsButton = false;

                // If project attribute is undefined, set default value
                if (_.isUndefined(projectId) || projectId.trim() == "")
                    projectId = "none";

                // If view type is undefined, show error
                if (_.isUndefined(viewType) || viewType.trim() == "") {
                    console.error("View type not defined!");
                    return;
                }

                // If dashboardId is undefined, show error
                if (_.isUndefined(dashboardId) || dashboardId.trim() == "") {
                    dashboardId = "default";
                }

                // If language is undefined, set default value
                if (_.isUndefined(lang) || lang.trim() == "")
                    lang = "en";

                // If iconSize is undefined, set default value
                if (_.isUndefined(iconSize) || iconSize.trim() == "")
                    iconSize = "4";

                var getAggregateData = function() {
                    // Get data for aggregate from API to set variables
                    Data.getAggregate(projectId, viewType, lang, scope.extraParams).then(function(response) {
                        // Get view
                        var view = _.first(response.view);

                        // Get value and label
                        scope.label = $sce.trustAsHtml(response.data.label);
                        scope.value = $sce.trustAsHtml(String(response.data.value));

                        if (!_.isEmpty(response.view)) {
                            // If view has icon, set the icon class
                            if (_.has(view, "icon")) {
                                scope.iconClass = view.icon + " fa-" + iconSize + "x";
                            }

                            // If view has a color, set the aggregate's color to that
                            if (_.has(view, "color")) {
                                // Get color and create panel and panel heading styles
                                var color = view.color;

                                scope.panelStyle = {
                                    "border-color": color
                                };

                                scope.panelHeadingStyle = {
                                    "background-color": color,
                                    "border-color": color,
                                    "color": "#FFFFFF"
                                };
                            }

                            // Check if view has layout and set appropriate options
                            if (_.has(view, "layout") || view.layout == "default") {
                                scope.layout = view.layout;

                                switch(scope.layout) {
                                    case "title":
                                        break;
                                    case "description":
                                        break;
                                    case "date":
                                        break;
                                }
                            } else {
                                // Set default layout options
                                scope.layout = "default";
                                scope.showDetailsButton = true;
                            }

                            if (setOnInit == "true" && !initialized && _.isEmpty(DashboardService.getViewType(dashboardId))) {
                                scope.setViewType();
                            }
                        }

                        initialized = true;
                    });
                };

                /**
                 * Sets the view type to this aggregate component's view type in DashboardService
                 */
                scope.setViewType = function() {
                    DashboardService.setViewType(dashboardId, {
                        type: viewType,
                        panelStyle: scope.panelStyle,
                        panelHeadingStyle: scope.panelHeadingStyle
                    });
                };

                // Watch for changes in extra parameters of aggregate and update it
                scope.$watch("extraParams", function(newValue, oldValue) {
                    if (!_.isEqual(newValue, oldValue)) {
                        getAggregateData();
                    }
                });

                // Create aggregate for the first time
                if (!initialized) {
                    getAggregateData();
                }
            }
        };
    }
]);
