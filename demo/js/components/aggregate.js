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
                showViewBtn: '@',   // If true, will show the "view details" button in the layouts where it is available
                setOnInit: '@',     // If true, will set this aggregate's view type in DashboardService on init
                elementH: '@',      // Minimum height of Aggregate
                baseUrl: '@',       // Base URL to send to API (optional)
                extraParams: '='    // Extra parameters to send
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath +'/' : '') + 'templates/aggregate.html',
            link: function (scope) {
                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var dashboardId = scope.dashboardId;
                var lang = scope.lang;
                var setOnInit = scope.setOnInit;
                var elementH = parseInt(scope.elementH);
                var iconSize = scope.iconSize;
                var baseUrl = scope.baseUrl;

                var initialized = false;

                scope.detailsButton = false;

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

                // If elementH is undefined, set default value
                if (_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 140;

                var getAggregateData = function() {
                    var params = scope.extraParams;

                    // If base URL attribute is defined, add it to the parameters that will be sent
                    if (!_.isUndefined(baseUrl) && baseUrl.length > 0) {
                        params = _.extend({
                            baseurl: baseUrl
                        }, params);
                    }

                    // Get data for aggregate from API to set variables
                    Data.getAggregate(projectId, viewType, lang, params).then(function(response) {
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
                            if (_.has(view, "layout") && view.layout != "default") {
                                scope.layout = view.layout;

                                switch(scope.layout) {
                                    case "title_aspect":
                                        // Get aspect to display on page
                                        scope.aspect = response.data.aspect;
                                        break;
                                    case "dashboard":
                                        // Create class for aggregate
                                        scope.dashboardClass = "aggregate-" + viewType.replace(/\./g , "-");
                                }
                            } else {
                                // Set default layout options
                                scope.layout = "default";

                                if (!_.isUndefined(scope.showViewBtn) && (scope.showViewBtn == "true" || scope.showViewBtn == "false")) {
                                    scope.detailsButton = (scope.showViewBtn == "true");
                                } else {
                                    scope.detailsButton = true;
                                }
                            }

                            // If detailsButton is shown, subtract the button's height from the elementH
                            if (scope.detailsButton) {
                                elementH -= 40;
                            }

                            // If view didn't have a color so style is undefined, initialize it as empty object
                            if (_.isUndefined(scope.panelHeadingStyle)) {
                                scope.panelHeadingStyle = {};
                            }

                            // Add height to the panel heading style
                            scope.panelHeadingStyle = _.extend(scope.panelHeadingStyle, {
                                "min-height": elementH + "px"
                            });

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
