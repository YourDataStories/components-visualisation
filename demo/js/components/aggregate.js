angular.module('yds').directive('ydsAggregate', ['Data', 'DashboardService', '$sce', '$timeout',
    function(Data, DashboardService, $sce, $timeout) {
        return {
            restrict: 'E',
            scope: {
                projectId: '@',     // Project ID of chart
                viewType: '@',      // View type of chart
                lang: '@',          // Language
                setOnInit: '@',     // If true, will set this aggregate's view type in DashboardService on init
                extraParams: '='    // Extra parameters to send
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath +'/' : '') + 'templates/aggregate.html',
            link: function (scope) {
                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var lang = scope.lang;
                var setOnInit = scope.setOnInit;

                var initialized = false;

                // If project attribute is undefined, set default value
                if (_.isUndefined(projectId) || projectId.trim() == "")
                    projectId = "none";

                // If view type is undefined, show error
                if (_.isUndefined(viewType) || viewType.trim() == "") {
                    console.error("View type not defined!");
                    return;
                }

                // If language is undefined, set default value
                if (_.isUndefined(lang) || lang.trim() == "")
                    lang = "en";

                var getAggregateData = function() {
                    // Get data for aggregate from API to set variables
                    Data.getAggregate(projectId, viewType, lang, scope.extraParams).then(function(response) {
                        // Get value and label
                        scope.label = $sce.trustAsHtml(response.data.label);
                        scope.value = response.data.value;

                        // Get icon class
                        scope.iconClass = _.first(response.view).icon;

                        // Get color and create panel and panel heading styles
                        var color = _.first(response.view).color;

                        scope.panelStyle = {
                            "border-color": color
                        };

                        scope.panelHeadingStyle = {
                            "background-color": color,
                            "border-color": color,
                            "color": "#FFFFFF"
                        };

                        if (setOnInit == "true" && !initialized && _.isEmpty(DashboardService.getViewType())) {
                            scope.setViewType();
                        }

                        initialized = true;
                    });
                };

                /**
                 * Sets the view type to this aggregate component's view type in DashboardService
                 */
                scope.setViewType = function() {
                    DashboardService.setViewType({
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
                $timeout(function() {
                    if (!initialized) {
                        getAggregateData();
                    }
                }, 1000);
            }
        };
    }
]);
