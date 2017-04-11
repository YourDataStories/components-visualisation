angular.module('yds').directive('ydsTrafficObservation', ['Data', 'DashboardService',
    function (Data, DashboardService) {
        return {
            restrict: 'E',
            scope: {
                projectId: '@',         // ID of the project that the data belong
                viewType: '@',          // Name of the array that contains the visualised data
                lang: '@',              // Lang of the visualised data

                extraParams: '=',       // Extra attributes to pass to the API, if needed
                baseUrl: '@',           // Base URL to send to API (optional)

                elementH: '@'           // Set the height of the component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/traffic-observation.html',
            link: function (scope, element, attrs) {
                //reference the dom elements in which the yds-traffic-observation is rendered
                var trafficWrapper = angular.element(element[0].querySelector('.component-wrapper'));
                var trafficContainer = angular.element(element[0].querySelector('.traffic-observation-container'));

                var elementId = "traffic" + Data.createRandomId();

                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var lang = scope.lang;
                var elementH = scope.elementH;

                var baseUrl = scope.baseUrl;

                //check if project id or grid type are defined
                if (_.isUndefined(projectId) || projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                //check if view-type attribute is empty and assign the default value
                if (_.isUndefined(viewType) || viewType.trim() === "")
                    viewType = "default";

                //check if the language attr is defined, else assign default value
                if (_.isUndefined(lang) || lang.trim() === "")
                    lang = "en";

                //check if the component's height attr is defined, else assign default value
                if (_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 200;

                //set the id and the height of the grid component
                trafficContainer[0].id = elementId;
                trafficWrapper[0].style.height = elementH + 'px';

                /**
                 * Create the grid
                 */
                var createGrid = function () {
                    // Get data and visualize grid
                    var extraParams = _.clone(scope.extraParams);

                    if (!_.isUndefined(baseUrl)) {
                        if (_.isUndefined(extraParams)) {
                            extraParams = {};
                        }

                        extraParams.baseurl = baseUrl;
                    }

                    Data.getProjectVis("grid", projectId, viewType, lang, extraParams)
                        .then(function (response) {
                            if (response.success === false || response.view.length === 0) {
                                console.error("An error has occurred!");
                                return false;
                            }

                            // Get column definitions
                            scope.columnDefs = Data.prepareGridColumns(response.view);

                            // Get data for the grid
                            scope.rowData = Data.prepareGridData(response.data, response.view);

                            // todo: sparklines
                        }, function (error) {
                            if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                                scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                            else
                                scope.ydsAlert = error.message;
                        });
                };

                createGrid();
            }
        };
    }
]);
