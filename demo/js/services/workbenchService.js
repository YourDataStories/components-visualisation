angular.module("yds").factory("Workbench", ["YDS_CONSTANTS", "$q", "$http", "Data",
    function (YDS_CONSTANTS, $q, $http, Data) {
        var slidesConfig = {
            noWrap: false,
            active: 0,
            slides: [{
                images: [{
                    src: Data.templatePath + "img/thumbnails/line_chart.png",
                    name: "Line Chart",
                    type: "linechart"
                }, {
                    src: Data.templatePath + "img/thumbnails/bar_chart.png",
                    name: "Bar Chart",
                    type: "barchart"
                }, {
                    src: Data.templatePath + "img/thumbnails/scatter_chart.png",
                    name: "Scatter Chart",
                    type: "scatterchart"
                }]
            }, {
                images: [{
                    src: Data.templatePath + "img/thumbnails/pie_chart.png",
                    name: "Pie Chart",
                    type: "piechart"
                }]
            }]
        };

        var workbenchConfig = {};
        var baseChartConfig = {};
        var lineChartConfig = {};
        var scatterChartConfig = {};
        var barChartConfig = {};

        return {
            init: function () {
                // Iterate through all the available vis options of the carousel and deactivate them
                _.each(slidesConfig.slides, function (slideView) {
                    _.each(slideView.images, function (image) {
                        image.visible = false;
                    })
                });

                // Initialize the configuration options of workbench
                workbenchConfig = {
                    alert: "",
                    selectedVis: "default",
                    availableViews: [],
                    availableViewsRaw: [],
                    selectedView: "",
                    selectedViewObj: {}
                };

                // Initialize the base configuration object for all charts
                baseChartConfig = {
                    initialized: false,
                    data: [],
                    chart: {},
                    options: {},
                    selectedAxisX: "",
                    axisX: [],
                    axisY: [],
                    axisYConfig: []
                };

                return workbenchConfig;
            },
            initLineChart: function (elementId) {
                // Initialize the configuration options of the line chart component
                _.extend(lineChartConfig, baseChartConfig, {
                    options: {
                        chart: {renderTo: elementId},
                        rangeSelector: {enabled: false},
                        scrollbar: {enabled: false},
                        title: {text: "Not available"},
                        exporting: {enabled: true},
                        navigator: {enabled: false},
                        series: []
                    }
                });

                return lineChartConfig;
            },
            initScatterChart: function (elementId) {
                // Initialize the configuration options of the scatter chart component
                _.extend(scatterChartConfig, baseChartConfig, {
                    options: {
                        chart: {
                            renderTo: elementId,
                            type: "scatter",
                            zoomType: "xy"
                        },
                        rangeSelector: {enabled: false},
                        scrollbar: {enabled: false},
                        title: {text: "Not available"},
                        exporting: {enabled: true},
                        navigator: {enabled: false},
                        series: []
                    }
                });

                return scatterChartConfig;
            },
            initBarChart: function (elementId) {
                // Initialize the configuration options of the bar chart component
                _.extend(barChartConfig, baseChartConfig, {
                    categories: [],
                    options: {
                        chart: {
                            type: "column",
                            renderTo: elementId
                        },
                        title: {text: "Not available"},
                        xAxis: {categories: []},
                        legend: {enabled: true},
                        exporting: {enabled: true},
                        tooltip: {
                            headerFormat: "<span style='font-size:10px'>{point.key}</span><table>",
                            pointFormat: "<tr><td style='color:{series.color};padding:0'>{series.name}: </td>" +
                            "<td style='padding:0'><b>{point.y:.0f}</b></td></tr>",
                            footerFormat: "</table>",
                            shared: true,
                            useHTML: true
                        },
                        plotOptions: {
                            column: {
                                pointPadding: 0.2,
                                borderWidth: 0
                            }
                        },
                        series: []
                    }
                });

                return barChartConfig;
            },
            getSlidesConfig: function () {
                return slidesConfig;
            },
            checkVisAvailability: function (slideId, visType) {
                return _.findWhere(slidesConfig.slides[slideId].images, {type: visType}).visible;
            },
            getWorkbenchVisualisation: function (visType, viewType, xAxis, yAxis, basketIds, lang, sparql) {
                var visUrl = "";
                var deferred = $q.defer();

                switch (visType) {
                    case "linechart":
                        visUrl = "http://" + YDS_CONSTANTS.API_INTERACTIVE_LINE;
                        break;
                    case "scatterchart":
                        visUrl = "http://" + YDS_CONSTANTS.API_INTERACTIVE_SCATTER;
                        break;
                    case "barchart":
                        visUrl = "http://" + YDS_CONSTANTS.API_INTERACTIVE_BAR;
                        break;
                    case "generic":
                        visUrl = "http://" + YDS_CONSTANTS.API_INTERACTIVE_GENERIC;
                        break
                }

                // If sparql parameter is true add parameter to the URL
                if (sparql === true) {
                    visUrl += "?sparql=1";
                }

                $http({
                    method: "POST",
                    url: visUrl,
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    data: {
                        lang: lang,
                        type: viewType,
                        basket_ids: basketIds,
                        axis_x: xAxis,
                        axis_y: yAxis
                    }
                }).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },
            getAvailableVisualisations: function (lang, basketIds) {
                var deferred = $q.defer();

                // Call the service with POST method
                $http({
                    method: "POST",
                    url: "http://" + YDS_CONSTANTS.API_PLOT_INFO + "?lang=" + lang,
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    data: Data.transform(JSON.stringify(basketIds))
                }).then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            },
            getLineChartStatus: function () {
                return lineChartConfig.initialized;
            },
            addLineAxisY: function () {			// function used to add combobox entries for the configuration of the line chart visualization
                // Check if there is any combobox with default value
                var nonSelectedCombo = _.where(lineChartConfig.axisYConfig, {selected: ""});

                // If there is an empty combobox or the number of comboboxes is equals with number
                // Of the line axis, stop the excecution of the function
                if (nonSelectedCombo.length > 0 ||
                    lineChartConfig.axisYConfig.length > 5 ||
                    lineChartConfig.axisYConfig.length === lineChartConfig.axisY.length) {

                    return false;
                } else {
                    var newCombo = {
                        selected: "",
                        options: lineChartConfig.axisY
                    };

                    // Else create a new combobox with default values and append it to the combobox array
                    lineChartConfig.axisYConfig.push(newCombo);
                }
            },
            removeLineAxisY: function (index) {		// Function used to remove combobox entries for the configuration of the line chart visualization
                if (lineChartConfig.axisYConfig.length > 1)
                    lineChartConfig.axisYConfig.splice(index, 1);
            },
            getScatterChartStatus: function () {
                return scatterChartConfig.initialized;
            },
            addScatterAxisY: function () {			// Function used to add combobox entries for the configuration of the scatter chart visualization
                // Check if there is any combobox with default value
                var nonSelectedCombo = _.where(scatterChartConfig.axisYConfig, {selected: ""});

                // If there is an empty combobox or the number of comboboxes is equals with number
                // of the scatter axis, stop the excecution of the function
                if (nonSelectedCombo.length > 0 ||
                    scatterChartConfig.axisYConfig.length > 5 ||
                    scatterChartConfig.axisYConfig.length === scatterChartConfig.axisY.length) {

                    return false;
                } else {
                    var newCombo = {
                        selected: "",
                        options: scatterChartConfig.axisY
                    };

                    // Else create a new combobox with default values and append it to the combobox array
                    scatterChartConfig.axisYConfig.push(newCombo);
                }
            },
            removeScatterAxisY: function (index) {		// Function used to remove combobox entries for the configuration of the scatter chart visualization
                if (scatterChartConfig.axisYConfig.length > 1)
                    scatterChartConfig.axisYConfig.splice(index, 1);
            },
            getBarChartStatus: function () {
                return barChartConfig.initialized;
            },
            addBarAxisY: function () {			// Function used to add combobox entries for the configuration of the bar chart visualization
                // Check if there is any combobox with default value
                var nonSelectedCombo = _.where(barChartConfig.axisYConfig, {selected: ""});

                // If there is an empty combobox or the number of comboboxes is equals with number
                // of the bar axis, stop the execution of the function
                if (nonSelectedCombo.length > 0 ||
                    barChartConfig.axisYConfig.length > 5 ||
                    barChartConfig.axisYConfig.length === barChartConfig.axisY.length) {

                    return false;
                } else {
                    var newCombo = {
                        selected: "",
                        options: barChartConfig.axisY
                    };

                    // Else create a new combobox with default values and append it to the combobox array
                    barChartConfig.axisYConfig.push(newCombo);
                }
            },
            removeBarAxisY: function (index) {		// Function used to remove combobox entries for the configuration of the bar chart visualization
                if (barChartConfig.axisYConfig.length > 1)
                    barChartConfig.axisYConfig.splice(index, 1);
            }
        }
    }
]);
