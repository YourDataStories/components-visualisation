angular.module("yds").controller("DatasetCorrelationsController", ["$scope", "$ocLazyLoad", "$timeout", "$uibModal", "PValues",
    function ($scope, $ocLazyLoad, $timeout, $uibModal, PValues) {
        var scope = $scope;
        scope.loaded = false;
        scope.eikosogramTitle = "None";
        scope.ydsAlert = "";
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
                $timeout(initController);
            });
        });

        /**
         * Initialize the eikosogram & CSV parsing controller.
         */
        var initController = function () {
            // Initialize controller object if it doesn't exist, or show error
            if (_.isNull(window.mainControl) || _.isUndefined(window.mainControl)) {
                // Create the controller manually...
                window.mainControl = new probability();

                // Show error if it wasn't created successfully, or continue
                if (_.isNull(window.mainControl)) {
                    scope.ydsAlert = "Initialization error, cannot continue.";
                    return;
                }
            }

            controller = window.mainControl;

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
        };

        /**
         * Transform the p-values from a 2D array, to the format that Highcharts heatmaps accept.
         * @param data  2D array of values (as returned from PValues service)
         * @returns {Array} Data formatted for Highcharts heatmap
         */
        var pValuesToHighcharts = function (data) {
            var newData = [];

            _.each(data, function (row, i) {
                _.each(row, function (value, j) {
                    newData.push([i, j, value]);
                });
            });

            return newData;
        };

        /**
         * Show eikosogram for the clicked point in a modal popup.
         * @param e Highcharts click event
         */
        var pValueClickHandler = function (e) {
            // Get variables and create eikosogram
            var variableNames = PValues.getVarNames();
            categoryA = variableNames[e.point.x];
            categoryB = variableNames[e.point.y];

            // Create eikosogram "title"
            var eikosogramTitle = categoryA + " & " + categoryB;

            // Open the modal
            var modalInstance = $uibModal.open({
                animation: true,
                template:
                "<div class='modal-header'>" +
                "   <h4 class='modal-title' id='modal-title'>Eikosogram: <i>" + eikosogramTitle + "</i></h4>" +
                "</div>" +
                "<div class='modal-body' id='modal-body'>" +
                "   <div class='eikosogram-container tab-content'>" +
                "       <div id='eikosogram' style='height: 420px;'></div>" +
                "   </div>" +
                "</div>"
            });

            // Handle modal closing (by doing nothing)
            modalInstance.result.then(function (success) {
            }, function (error) {
            });

            $timeout(function () {
                // Create display
                controller.createDisplay();

                // Because the eikosogram code adds "height: 100%" to a row's style, remove it (causes problem in Firefox)
                $("div.row[style*='height: 100%']").css("height", "");
            });
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
                    type: "heatmap",
                    zoomType: "xy"
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
                    borderColor: "#868686",
                    data: data
                }]
            });
        };

        /**
         * Update the color axis of the P Values chart when the selected p-value changes, to highlight the correct cells
         */
        scope.pValueChange = function () {
            // If there is a chart, recreate it
            if (!_.isUndefined(chart)) {
                _.first(chart.colorAxis).update({
                    stops: [
                        [0, "#00FF00"],
                        [1 - scope.pValue / 100, "#ffffff"],
                        [1, "#ff7272"]
                    ]
                });
            }
        }
    }
]);
