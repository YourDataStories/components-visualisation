angular.module("yds").directive("ydsTreeMap", ["Data", "Filters", function (Data, Filters) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // ID of the project
            viewType: "@",          // View type of data
            lang: "@",              // Language of the visualised data
            extraParams: "=",       // Extra attributes to pass to the API, if needed

            exporting: "@",         // Enable or disable the export of the plot
            elementH: "@",          // Set the height of the component
            titleSize: "@",         // The size of the chart"s main title

            addToBasket: "@",       // Enable or disable "add to basket" functionality, values: true, false
            embeddable: "@",        // Enable or disable the embedding of the component
            popoverPos: "@",        // The side of the embed button from which the embed information window will appear

            enableRating: "@",      // Enable rating buttons for this component
            disableExplanation: "@" // Set to true to disable the explanation button
        },
        templateUrl: Data.templatePath + "templates/visualisation/treemap.html",
        link: function (scope, element, attrs) {
            var treemapContainer = _.first(angular.element(element[0].querySelector(".treemap-container")));

            // Create a random id for the element that will render the plot
            scope.elementId = "treemap" + Data.createRandomId();
            treemapContainer.id = scope.elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;
            var extraParams = scope.extraParams;

            // If extra params exist, add them to Filters
            if (!_.isUndefined(extraParams) && !_.isEmpty(extraParams)) {
                Filters.addExtraParamsFilter(scope.elementId, extraParams);
            }

            // Check if the projectId and the viewType attr is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section";
                return false;
            }

            // Check if pie-type attribute is empty and assign the default value
            if (_.isUndefined(viewType) || viewType.trim() === "")
                viewType = "default";

            // Check if the language attribute is defined, else assign default value
            if (_.isUndefined(lang) || lang.trim() === "")
                lang = "en";

            // Check if the exporting attribute is defined, else assign default value
            if (_.isUndefined(exporting) || (exporting !== "true" && exporting !== "false"))
                exporting = "true";

            // Check if the component's height attribute is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Check if the component's title size attribute is defined, else assign default value
            if (_.isUndefined(titleSize) || titleSize.length === 0 || _.isNaN(titleSize))
                titleSize = 18;

            // Show loading animation
            scope.loading = true;

            // Set the height of the plot
            treemapContainer.style.height = elementH + "px";

            Data.getProjectVis("treemap", projectId, viewType, lang, extraParams)
                .then(function (response) {
                    // Check that the component has not been destroyed
                    if (scope.$$destroyed)
                        return;

                    var series = response.data;
                    var chartTitle = response.data.title;
                    chartTitle.style = {
                        fontSize: titleSize + "px"
                    };

                    // Check if the component is properly rendered
                    if (_.isUndefined(series) || !_.isArray(series.data) || _.isUndefined(series)) {
                        scope.ydsAlert = "The YDS component is not properly configured." +
                            "Please check the corresponding documentation section";
                        return false;
                    }

                    var options = {
                        chart: {
                            renderTo: scope.elementId
                        },
                        title: chartTitle,
                        exporting: {
                            buttons: {
                                contextButton: {
                                    symbol: "url(" + Data.templatePath + "img/fa-download-small.png)",
                                    symbolX: 19,
                                    symbolY: 19
                                }
                            },
                            filename: "YDS Treemap - " + chartTitle || "chart",
                            enabled: (exporting === "true")
                        },
                        series: [
                            series
                        ]
                    };

                    new Highcharts.Chart(options);

                    // Remove loading animation
                    scope.loading = false;
                }, function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error was occurred, please check the configuration of the component";
                    else
                        scope.ydsAlert = error.message;

                    // Remove loading animation
                    scope.loading = false;
                });
        }
    };
}]);
