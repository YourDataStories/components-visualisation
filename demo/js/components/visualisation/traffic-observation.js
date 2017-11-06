angular.module("yds").directive("ydsTrafficObservation", ["$timeout", "Data",
    function ($timeout, Data) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",         // ID of the project that the data belong
                viewType: "@",          // Name of the array that contains the visualised data
                lang: "@",              // Lang of the visualised data
                extraParams: "=",       // Extra attributes to pass to the API, if needed
                baseUrl: "@",           // Base URL to send to API (optional)

                allowSelection: "@",    // Set to true to enable selection of items in the 1st column

                elementH: "@"           // Set the height of the component
            },
            templateUrl: Data.templatePath + "templates/traffic-observation.html",
            link: function (scope, element) {
                // Reference the DOM elements in which the yds-traffic-observation is rendered
                var trafficWrapper = _.first(angular.element(element[0].querySelector(".component-wrapper")));
                var trafficContainer = _.first(angular.element(element[0].querySelector(".traffic-observation-container")));

                var elementId = "traffic" + Data.createRandomId();

                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var lang = scope.lang;
                var elementH = scope.elementH;
                var baseUrl = scope.baseUrl;

                scope.showChart = false;

                // Check if project id or grid type are defined
                if (_.isUndefined(projectId) || projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                // Check if view-type attribute is empty and assign the default value
                if (_.isUndefined(viewType) || viewType.trim() === "")
                    viewType = "default";

                // Check if the language attribute is defined, else assign default value
                if (_.isUndefined(lang) || lang.trim() === "")
                    lang = "en";

                // If allowSelection is undefined, set default value
                if (_.isUndefined(scope.allowSelection) || (scope.allowSelection !== "true" && scope.allowSelection !== "false"))
                    scope.allowSelection = "false";

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 200;

                // Set the id and the height of the grid component
                trafficContainer.id = elementId;
                trafficWrapper.style.height = elementH + "px";

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
                            var originalColDefs = Data.prepareGridColumns(response.view);

                            // Make a copy of the columns in the scope because we will modify them
                            scope.columnDefs = _.clone(originalColDefs);

                            // Get data for the grid
                            var rows = Data.prepareGridData(response.data, response.view);
                            scope.rowData = rows;

                            // Add IDs to Sparkline containers
                            _.each(rows, function (row) {
                                row.id = "sparkline" + Data.createRandomId();
                            });

                            // Get the available years from the view
                            var viewYears = _.chain(response.view)
                                .where({type: "integer"})
                                .pluck("header")
                                .map(function (value) {
                                    return parseInt(value); // Can't use parseInt directly because of its 2nd parameter
                                })
                                .reject(_.isNaN)
                                .value();

                            // Find min & max years
                            var minYear = _.min(viewYears);
                            var maxYear = _.max(viewYears);

                            // Only calculate increase, % change and add sparklines if there is more than a single year
                            if (maxYear > minYear) {
                                // Calculate increase in traffic & percentage change
                                _.each(rows, function (row) {
                                    var firstYearTraffic = formattedStrToInt(row[minYear]);
                                    var lastYearTraffic = formattedStrToInt(row[maxYear]);

                                    var trafficIncrease = lastYearTraffic - firstYearTraffic;
                                    var percentageDiff = (trafficIncrease / firstYearTraffic) * 100;

                                    row.increase = trafficIncrease.toLocaleString();
                                    row.percent = Math.round(percentageDiff * 10) / 10
                                });

                                // Add headers for traffic increase & percentage change
                                scope.columnDefs = _.union(scope.columnDefs, [
                                    {
                                        headerName: "Increase " + minYear + "/" + maxYear,
                                        field: "increase"
                                    }, {
                                        headerName: "%",
                                        field: "percent"
                                    }
                                ]);

                                // Create sparklines after a timeout (so that IDs will have been applied to the DOM)
                                $timeout(function () {
                                    _.each(scope.rowData, function (row) {
                                        // Only continue if the container for the sparkline of the row still exists
                                        if ($("#" + row.id).length === 0)
                                            return;

                                        // Transform data for Highcharts
                                        var data = _.map(_.rest(originalColDefs), function (column) {
                                            return [
                                                parseInt(column.field),
                                                formattedStrToInt(row[column.field])
                                            ]
                                        });

                                        // Get the raw values, used for calculating the min/max axis values
                                        var axisValues = _.last(_.unzip(data));
                                        var minValue = _.min(axisValues);
                                        var maxValue = _.max(axisValues);
                                        var range = maxValue - minValue;

                                        var minAxisValue = minValue - (range * 0.2);
                                        if (minAxisValue < 0 && minValue >= 0) {
                                            minAxisValue = 0;
                                        }

                                        new Highcharts.SparkLine(row.id, {
                                            series: [{
                                                data: data
                                            }],
                                            tooltip: {
                                                backgroundColor: "#FFFFFF",
                                                borderWidth: 1,
                                                shadow: true,
                                                padding: 8,
                                                headerFormat: "<span style='font-size: 10px'>{point.x}:</span><br/>",
                                                pointFormat: "<b>{point.y}</b>"
                                            },
                                            exporting: {
                                                enabled: false
                                            },
                                            yAxis: {
                                                min: minAxisValue,
                                                max: maxValue
                                            },
                                            xAxis: {
                                                labels: {
                                                    enabled: true,
                                                    style: {
                                                        fontSize: "7px"
                                                    },
                                                    y: 2
                                                },
                                                tickPosition: "inside",
                                                tickPositions: null
                                            },
                                            chart: {
                                                height: 30
                                            }
                                        });
                                    });
                                });

                                scope.showChart = true;
                            }
                        }, function (error) {
                            if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                                scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                            else
                                scope.ydsAlert = error.message;
                        });
                };

                /**
                 * Get a number as returned from the API (formatted with commas) and return it as an Integer
                 * @param numberStr
                 * @returns {Number}
                 */
                var formattedStrToInt = function (numberStr) {
                    return parseInt(numberStr.replace(/,/g, ""));
                };

                /**
                 * Register a sparkline chart in Highcharts, if it hasn't been registered already.
                 */
                var registerSparkline = function () {
                    if (!_.has(Highcharts, "SparkLine")) {
                        // Create a constructor for sparklines that takes some sensible defaults and merges in the individual
                        // chart options. This function is also available from the jQuery plugin as $(element).highcharts('SparkLine').
                        Highcharts.SparkLine = function (a, b, c) {
                            var hasRenderToArg = typeof a === "string" || a.nodeName,
                                options = arguments[hasRenderToArg ? 1 : 0],
                                defaultOptions = {
                                    chart: {
                                        renderTo: (options.chart && options.chart.renderTo) || this,
                                        backgroundColor: null,
                                        borderWidth: 0,
                                        type: "area",
                                        margin: [2, 0, 2, 0],
                                        width: 120,
                                        height: 20,
                                        style: {
                                            overflow: "visible"
                                        },

                                        // small optimalization, saves 1-2 ms each sparkline
                                        skipClone: true
                                    },
                                    title: {
                                        text: ""
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
                                            negativeColor: "#910000",
                                            borderColor: "silver"
                                        }
                                    }
                                };

                            options = Highcharts.merge(defaultOptions, options);

                            return hasRenderToArg ?
                                new Highcharts.Chart(a, options, c) :
                                new Highcharts.Chart(options, b);
                        };
                    }
                };

                /**
                 * Select a row
                 * @param rowIndex  Index of row to select
                 * @param row       Data of row to select
                 */
                scope.selectRow = function (rowIndex, row) {
                    console.log("Selecting row:", rowIndex, row);
                };

                // Register Sparkline and create the table
                registerSparkline();
                createGrid();
            }
        };
    }
]);
