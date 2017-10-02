angular.module("yds").controller("DatasetCorrelationsController", ["$scope", "$ocLazyLoad", "$timeout", "PValues",
    function ($scope, $ocLazyLoad, $timeout, PValues) {
        var scope = $scope;
        scope.loaded = false;
        scope.eikosogramTitle = "None";
        var controller, pvalues, chart;
        var categoryA, categoryB;

        scope.pValue = 95;

        // Load required files from:
        // http://new.censusatschool.org.nz/resource/using-the-eikosogram-to-teach-conditional-and-joint-probability/
        $ocLazyLoad.load({
            files: [
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/shared/d3.js",
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/probability.js",
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/probModel.js",
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/probView.js",
                "https://www.stat.auckland.ac.nz/~wild/TwoWay/eiko.js",
                "//cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js"
            ],
            cache: true
        }).then(function () {
            // Show the file selector now that everything is loaded
            scope.loaded = true;

            // Initialize controller (The 2 timeouts make it work in Firefox...)
            $timeout(function () {
                $timeout(function () {
                    // Get the mainControl and save it to the controller variable
                    if (!_.isNull(window.mainControl) && !_.isUndefined(window.mainControl)) {
                        controller = window.mainControl;
                    } else {
                        //todo: Show the error?
                        console.error("Controller is not initialized, cannot continue!");
                        return;
                    }

                    // Set custom functions in the controller
                    controller.finishedModelSU = function () {
                        $timeout(function () {
                            // window.dataHeadings variable should be available by now...
                            pvalues = PValues.calculate(window.dataHeadings, controller.model.getData());

                            createPValueHeatmap(PValues.getVarNames(), pValuesToHighcharts(pvalues));
                        });
                    };

                    // Use only eikosogram when creating display
                    controller.createDisplay = function () {
                        // Get factors
                        var varTypes = PValues.getVarTypes();
                        var factors = [
                            [categoryA, varTypes[categoryA]],
                            [categoryB, varTypes[categoryB]]
                        ];

                        // Create eikosogram
                        controller.eiko = new eiko(controller, factors, controller.model.getData(), 5);
                        controller.dataDisplay = controller.eiko;
                    };

                    // Set font size
                    controller.view.getFont = function () {
                        return 1.0;
                    };

                    // Make the function that is called when the animation is paused to continue the animation
                    controller.canContinue = function () {
                        $timeout(function () {
                            controller.continue();
                        });
                    }
                });
            });
        });

        /**
         * Transform the p-values from a 2D array, to the format that Highcharts heatmaps accept.
         * @param data  2D array of values (as returned from PValues service)
         * @returns {Array} Data formatted for Highcharts heatmap
         */
        var pValuesToHighcharts = function (data) {
            var newData = [];

            _.each(data, function (row, i) {
                _.each(row, function (value, j) {
                    var point = {
                        x: i,
                        y: j,
                        value: value
                    };

                    // For the points in the diagonal, make them a specific color
                    if (i === j) {
                        point.color = "#828282";
                    }

                    newData.push(point);
                });
            });

            return newData;
        };

        /**
         * Show eikosogram for the clicked point in the Highcharts heatmap.
         * @param e Highcharts click event
         */
        var pValueClickHandler = function (e) {
            // Clear any previously generated eikosogram
            $("#eikosogram").html("");

            // Get variables and create eikosogram
            var variableNames = PValues.getVarNames();
            categoryA = variableNames[e.point.x];
            categoryB = variableNames[e.point.y];

            // Create display
            controller.createDisplay();

            // Show which eikosogram was created
            scope.eikosogramTitle = categoryA + " & " + categoryB;
        };

        /**
         * Create a heatmap to show the given p values.
         * @param variableNames Names of the variables
         * @param data          P Values (formatted for Highcharts)
         */
        var createPValueHeatmap = function (variableNames, data) {
            // Create the chart
            chart = Highcharts.chart("p-value-heatmap-container", {
                chart: {
                    type: "heatmap"
                },
                title: {
                    text: "P Values"
                },
                xAxis: {
                    categories: variableNames,
                    opposite: true  // Show labels on top
                },
                yAxis: {
                    categories: variableNames,
                    reversed: true,
                    title: null
                },
                colorAxis: {
                    min: 0,
                    max: 1,
                    minColor: "#00FF00",
                    maxColor: "#ff7272",
                    stops: [
                        [0, "#00FF00"],
                        [1 - scope.pValue / 100, "#ffffff"],
                        [1, "#ff7272"]
                    ]
                },
                tooltip: {
                    pointFormatter: function () {
                        return variableNames[this.x] + " & "
                            + variableNames[this.y] + ": <b>"
                            + PValues.roundNumber(this.value, 8) + "</b><br/>";
                    }
                },
                plotOptions: {
                    heatmap: {
                        point: {
                            events: {
                                click: pValueClickHandler
                            }
                        }
                    }
                },
                series: [{
                    name: "P Values",
                    borderWidth: 1,
                    data: data
                }]
            });
        };

        /**
         * Redraw the P Values chart when the selected p-value changes
         */
        scope.pValueChange = function () {
            // If there is a chart, recreate it
            if (!_.isUndefined(chart)) {
                createPValueHeatmap(PValues.getVarNames(), pValuesToHighcharts(pvalues));
            }
        }
    }
]);
