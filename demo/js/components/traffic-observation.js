angular.module('yds').directive('ydsTrafficObservation', ['$timeout', 'Data',
    function ($timeout, Data) {
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
                            var rows = Data.prepareGridData(response.data, response.view);

                            // Add IDs to Sparkline containers
                            _.each(rows, function (row) {
                                row.id = "sparkline" + Data.createRandomId();
                            });

                            // Create Highcharts SparkLine constructor, if it doesn't exist
                            if (!_.has(Highcharts, "SparkLine")) {
                                // Create a constructor for sparklines that takes some sensible defaults and merges in the individual
                                // chart options. This function is also available from the jQuery plugin as $(element).highcharts('SparkLine').
                                Highcharts.SparkLine = function (a, b, c) {
                                    var hasRenderToArg = typeof a === 'string' || a.nodeName,
                                        options = arguments[hasRenderToArg ? 1 : 0],
                                        defaultOptions = {
                                            chart: {
                                                renderTo: (options.chart && options.chart.renderTo) || this,
                                                backgroundColor: null,
                                                borderWidth: 0,
                                                type: 'area',
                                                margin: [2, 0, 2, 0],
                                                width: 120,
                                                height: 20,
                                                style: {
                                                    overflow: 'visible'
                                                },

                                                // small optimalization, saves 1-2 ms each sparkline
                                                skipClone: true
                                            },
                                            title: {
                                                text: ''
                                            },
                                            credits: {
                                                enabled: false
                                            },
                                            xAxis: {
                                                labels: {
                                                    enabled: false
                                                },
                                                title: {
                                                    text: null
                                                },
                                                startOnTick: false,
                                                endOnTick: false,
                                                tickPositions: []
                                            },
                                            yAxis: {
                                                endOnTick: false,
                                                startOnTick: false,
                                                labels: {
                                                    enabled: false
                                                },
                                                title: {
                                                    text: null
                                                },
                                                tickPositions: [0]
                                            },
                                            legend: {
                                                enabled: false
                                            },
                                            tooltip: {
                                                backgroundColor: null,
                                                borderWidth: 0,
                                                shadow: false,
                                                useHTML: true,
                                                hideDelay: 0,
                                                shared: true,
                                                padding: 0,
                                                positioner: function (w, h, point) {
                                                    return {x: point.plotX - w / 2, y: point.plotY - h};
                                                }
                                            },
                                            plotOptions: {
                                                series: {
                                                    animation: false,
                                                    lineWidth: 1,
                                                    shadow: false,
                                                    states: {
                                                        hover: {
                                                            lineWidth: 1
                                                        }
                                                    },
                                                    marker: {
                                                        radius: 1,
                                                        states: {
                                                            hover: {
                                                                radius: 2
                                                            }
                                                        }
                                                    },
                                                    fillOpacity: 0.25
                                                },
                                                column: {
                                                    negativeColor: '#910000',
                                                    borderColor: 'silver'
                                                }
                                            }
                                        };

                                    options = Highcharts.merge(defaultOptions, options);

                                    return hasRenderToArg ?
                                        new Highcharts.Chart(a, options, c) :
                                        new Highcharts.Chart(options, b);
                                };
                            }

                            // Create sparklines after a timeout (so that IDs will have been applied to the DOM)
                            $timeout(function () {
                                _.each(scope.rowData, function (row) {
                                    // Transform data for Highcharts
                                    var data = _.map(_.rest(scope.columnDefs), function (column) {
                                        return row[column.field];
                                    });

                                    var highchartsData = _.map(data, function (value, key) {
                                        return [
                                            parseInt(key),
                                            parseInt(value.replace(/,/g, ""))
                                        ];
                                    });

                                    new Highcharts.SparkLine(row.id, {
                                        series: [{
                                            data: highchartsData
                                        }],
                                        tooltip: {
                                            headerFormat: '<span style="font-size: 10px">{point.x}:</span><br/>',
                                            pointFormat: '<b>{point.y}</b>'
                                        },
                                        exporting: {
                                            enabled: false
                                        }
                                    });
                                });
                            });

                            scope.rowData = rows;
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
