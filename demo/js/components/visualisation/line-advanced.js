angular.module("yds").directive("ydsLineAdvanced", ["$timeout", "$q", "Data", function ($timeout, $q, Data) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",     // Id of the project that the data belong
            viewType: "@",      // Name of the array that contains the visualised data
            lang: "@",          // Lang of the visualised data

            showNavigator: "@", // Enable or disable line chart's navigation
            exporting: "@",     // Enable or disable the export of the chart
            elementH: "@",      // Set the height of the component
            titleSize: "@",     // The size of the chart's main title

            combobox: "@",			// Set the types of the combobox filters (year, country)
            comboboxLabels: "@",	// Set the labels that will be used for each combobox
            comboboxAttrs: "@"		// Set the parameter each combobox will sent to the the server
        },
        templateUrl: Data.templatePath + "templates/visualisation/line-advanced.html",
        link: function (scope, element, attrs) {
            // Get the DOM element in which the chart is rendered
            var lineContainer = _.first(angular.element(element[0].querySelector(".line-container")));

            // Set the variables which will be used for the creation of the line chart
            var line = {
                elementId: "line" + Data.createRandomId(),
                projectId: scope.projectId,
                viewType: scope.viewType,
                lang: scope.lang,
                showNavigator: scope.showNavigator,
                exporting: scope.exporting,
                elementH: scope.elementH,
                titleSize: scope.titleSize,
                combobox: scope.combobox,
                comboboxLabels: scope.comboboxLabels,
                comboboxAttrs: scope.comboboxAttrs
            };

            // Array containing the selected data of the rendered comboboxes
            scope.comboboxFilters = [];

            // Object containing the data for each different type of combobox
            scope.comboboxData = {};

            // Check if the projectId attribute is defined, else stop the process
            if (_.isUndefined(line.projectId) || line.projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section";
                return false;
            }

            // Check if view-type attribute is empty and assign the default value
            if (_.isUndefined(line.viewType) || line.viewType.trim() === "")
                line.viewType = "default";

            // Check if the language attribute is defined, else assign default value
            if (_.isUndefined(line.lang) || line.lang.trim() === "")
                line.lang = "en";

            // Check if the exporting attribute is defined, else assign default value
            if (_.isUndefined(line.showNavigator) || (line.showNavigator !== "true" && line.showNavigator !== "false"))
                line.showNavigator = "true";

            // Check if the exporting attribute is defined, else assign default value
            if (_.isUndefined(line.exporting) || (line.exporting !== "true" && line.exporting !== "false"))
                line.exporting = "true";

            // Check if the component's height attribute is defined, else assign default value
            if (_.isUndefined(line.elementH) || _.isNaN(line.elementH))
                line.elementH = 200;

            // Check if the component's title size attribute is defined, else assign default value
            if (_.isUndefined(line.titleSize) || _.isNaN(line.titleSize))
                line.titleSize = 18;

            // Add the unique id generated for the line component and set its height
            lineContainer.id = line.elementId;
            lineContainer.style.height = line.elementH + "px";

            /**
             * Show errors on top of the visualization
             */
            var showAlert = function (alertMsg, predefined, persistent) {
                if (!predefined)
                    scope.ydsAlert = alertMsg;
                else
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly. " +
                        "Please check the corresponding documentation section.";

                if (!persistent)
                    $timeout(function () {
                        scope.ydsAlert = "";
                    }, 2000);
            };

            /**
             * Get the required data of each different type of combobox
             */
            var getComboFilterData = function (name, attribute) {
                var deferred = $q.defer();

                Data.getComboboxFilters(line.projectId, "combobox." + name, attribute, line.lang)
                    .then(function (response) {
                        scope.comboboxData[attribute] = response.data;

                        // Find the filter entry and assign the default value
                        var filterObj = _.findWhere(scope.comboboxFilters, {"attribute": attribute});
                        if (!_.isUndefined(filterObj)) {
                            filterObj.selected = _.findWhere(response.data, response.default);
                        }

                        deferred.resolve(response);
                    }, function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            };

            /**
             * Extract the combobox values defined on the element's attributes
             */
            var extractFilters = function () {
                // Check if all the required attributes for the rendering of the comboboxes are defined
                if (!_.isUndefined(line.combobox) && !_.isUndefined(line.comboboxLabels) && !_.isUndefined(line.comboboxAttrs)) {
                    // Extract and trim their values
                    var filterPromises = [];
                    line.combobox = line.combobox.replace(/ /g, "").split(",");
                    line.comboboxAttrs = line.comboboxAttrs.replace(/ /g, "").split(",");
                    line.comboboxLabels = line.comboboxLabels.split(",");

                    // If the different combobox attributes have the same length, extract and save its values
                    if (line.combobox.length === line.comboboxLabels.length &&
                        line.combobox.length === line.comboboxAttrs.length &&
                        line.comboboxLabels.length === line.comboboxAttrs.length) {

                        // Iterate through the user provided comboboxes and fetch their data
                        _.each(line.combobox, function (value, index) {
                            var newFilter = {
                                selected: "",
                                type: value,
                                label: line.comboboxLabels[index],
                                attribute: line.comboboxAttrs[index]
                            };

                            scope.comboboxFilters.push(newFilter);
                            filterPromises.push(getComboFilterData(newFilter.type, newFilter.attribute));
                        });

                        // When the data of all the filters have been returned, create the corresponding visualization
                        $q.all(filterPromises).then(function () {
                            scope.applyComboFilters();
                        }, function (error) {
                            showAlert("", true, true);
                        });
                    } else {
                        showAlert("", true, true);
                    }
                } else {
                    showAlert("", true, true);
                }
            };

            /**
             * Render the line chart based on the available filters
             */
            var visualizeLineChart = function (filters) {
                // If the line chart is being initialized for the first time
                // set its options and render the chart without data
                if (_.isUndefined(line.chart)) {
                    var options = {
                        chart: {renderTo: line.elementId},
                        rangeSelector: {
                            enabled: (line.showNavigator === "true"),
                            selected: 1
                        },
                        scrollbar: {enabled: (line.showNavigator === "true")},
                        title: {
                            text: "",
                            style: {fontSize: line.titleSize + "px"}
                        },
                        exporting: {enabled: (line.exporting === "true")},
                        navigator: {enabled: (line.showNavigator === "true")}
                    };

                    line.chart = new Highcharts.StockChart(options);
                }

                // If the chart has already been rendered, fetch data from the server and visualize the results
                Data.getProjectVisAdvanced("line", line.projectId, line.viewType, line.lang, filters)
                    .then(function (response) {
                        // Find and set chart title
                        for (var i = 0; i < response.view.length; i++) {
                            if (response.view[i].header === "Title") {
                                var lineTitleAttr = response.view[i].attribute;                     // Get title attribute
                                var lineTitle = Data.deepObjSearch(response.data, lineTitleAttr);   // Find chart title

                                line.chart.setTitle({text: lineTitle});                             // Set chart title
                                break;
                            }
                        }

                        // Remove the existing line chart series
                        while (line.chart.series.length > 0)
                            line.chart.series[0].remove(true);

                        // Add the new series to the line chart
                        var series = response.data.series;

                        _.each(series, function (s) {
                            line.chart.addSeries(s);
                        });

                        // Update the chart's x and y axes
                        _.each(response.view, function (view) {
                            if (view.header === "xAxis") {
                                // Update type for x axis
                                line.chart.xAxis[0].update({
                                    type: view.type
                                });
                            } else if (view.header === "yAxis") {
                                // Update type for all y axes
                                _.each(line.chart.yAxis, function (axis) {
                                    axis.update({
                                        type: view.type
                                    });
                                });
                            }
                        });
                    }, function (error) {
                        showAlert(error.message, false, false);
                    });
            };

            /**
             * function called when the 'apply filters' btn is clicked
             */
            scope.applyComboFilters = function () {
                var appliedFilters = {};

                // Iterate through the data of the rendered filters and check which of them are selected
                _.each(scope.comboboxFilters, function (filter) {
                    if (!_.isNull(filter.selected) && !_.isUndefined(filter.selected.value))
                        appliedFilters[filter.attribute] = filter.selected.value;
                });

                // If at least one of the filters is not selected show an error message
                if (_.keys(appliedFilters).length !== scope.comboboxFilters.length) {
                    var errorMsg = "Please select a value for all the available filters";
                    showAlert(errorMsg, false, false);
                } else {
                    // If all the filters is selected update the line
                    visualizeLineChart(appliedFilters);
                }
            };

            /**
             * function called when the 'clear filters' btn is clicked
             */
            scope.clearComboFilters = function () {
                // Clear the filters' error message and initialize the selected value of each filter
                scope.ydsAlert = "";

                _.each(scope.comboboxFilters, function (filter) {
                    filter.selected = "";
                });
            };

            // Extract the user provided filters, and render the line chart
            extractFilters();
        }
    };
}]);
