angular.module("yds").directive("ydsSunburst", ["Data", "DashboardService", function (Data, DashboardService) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",     // Id of the project that the data belong
            viewType: "@",      // Name of the array that contains the visualised data
            lang: "@",          // Lang of the visualised data

            extraParams: "=",   // Extra attributes to pass to the API, if needed
            selectionId: "@",   // ID for saving the selection

            exporting: "@",     // Enable or disable the export of the chart
            elementH: "@"       // Set the height of the component
        },
        templateUrl: Data.templatePath + "templates/visualisation/sunburst.html",
        link: function (scope, element) {
            var sunContainer = _.first(angular.element(element[0].querySelector(".sunburst-container")));

            // Create a random id for the element that will render the chart
            var elementId = "sun" + Data.createRandomId();
            sunContainer.id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var extraParams = scope.extraParams;
            var selectionId = scope.selectionId;

            var chart = null;
            var lastSelection = null;

            // Check if the projectId attr is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured. " +
                    "Please check the corresponding documentation section.";
                return false;
            }

            // Check if view-type attribute is empty and assign the default value
            if (_.isUndefined(viewType) || viewType.trim() === "")
                viewType = "default";

            // Check if the language attribute is defined, else assign default value
            if (_.isUndefined(lang) || lang.trim() === "")
                lang = "en";

            // Check if the exporting attribute is defined, else assign default value
            if (_.isUndefined(exporting) || (exporting !== "true" && exporting !== "false"))
                exporting = "false";

            // Check if the component's height attribute is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Show loading animation
            scope.loading = true;

            // Set the height of the chart
            sunContainer.style.height = elementH + "px";

            // Get data and visualize sunburst
            Data.getProjectVis("sunburst", projectId, viewType, lang, extraParams)
                .then(function (response) {
                    // Check that the component has not been destroyed
                    if (scope.$$destroyed)
                        return;

                    var options = response.data;

                    // Set exporting options
                    options.exporting = {
                        buttons: {
                            contextButton: {
                                symbol: "url(" + Data.templatePath + "img/fa-download-small.png)",
                                symbolX: 19,
                                symbolY: 19
                            }
                        },

                        enabled: (exporting === "true")
                    };

                    // Add selection events to all series
                    _.each(options.series, function (series) {
                        series.allowPointSelect = true;

                        if (!_.has(series, "point")) {
                            series.point = {};
                        }

                        // Add selected point color
                        series.states = {
                            select: {
                                color: "#a4edba",
                                borderColor: "black",
                                dashStyle: "shortdot"
                            }
                        };

                        series.point.events = {
                            select: function (e) {
                                // Set the selected point as selected in DashboardService (in an array)
                                var currSelection = DashboardService.getGridSelection(selectionId);

                                if (!_.contains(currSelection, e.target.id)) {
                                    var newSelection = _.union(currSelection, [e.target.id]);
                                    DashboardService.setGridSelection(selectionId, newSelection);

                                    lastSelection = newSelection;
                                }
                            },
                            unselect: function (e) {
                                // Set the selection as empty array as only a single item should be selected at a time
                                var currSelection = DashboardService.getGridSelection(selectionId);

                                if (_.contains(currSelection, e.target.id)) {
                                    var newSelection = _.without(currSelection, e.target.id);
                                    DashboardService.setGridSelection(selectionId, newSelection);

                                    lastSelection = newSelection;
                                }
                            }
                        }
                    });

                    chart = new Highcharts.Chart(elementId, options);

                    // Remove loading animation
                    scope.loading = false;
                }, function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component";
                    else
                        scope.ydsAlert = error.message;

                    // Remove loading animation
                    scope.loading = false;
                });

            DashboardService.subscribeGridSelectionChanges(scope, function () {
                // If the selection for this sunburst changed, select the appropriate CPV if it exists in a series
                var selection = DashboardService.getGridSelection(selectionId);

                if (!_.isEmpty(selection) && !_.isEqual(lastSelection, selection)) {
                    // Get actual selection (it can be only one in this case)
                    var idToSelect = _.first(selection);

                    // Look in each series for the CPV with the ID to select
                    _.each(chart.series, function (series) {
                        _.each(series.points, function (point) {
                            if (point.id === idToSelect) {
                                point.select(true, false);
                            }
                        });
                    });
                } else if (_.isEmpty(selection)) {
                    // Deselect all points
                    _.each(chart.series, function (series) {
                        _.first(series.points).select(false, false);
                    });
                }
            });
        }
    };
}]);
