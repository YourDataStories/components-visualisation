angular.module("yds").directive("ydsLine", ["Data", "Filters", function (Data, Filters) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // Id of the project that the data belong
            viewType: "@",          // Name of the array that contains the visualised data
            lang: "@",              // Lang of the visualised data
            extraParams: "=",       // Optional object with extra parameters to send to the API

            exporting: "@",         // Enable or disable the export of the chart
            elementH: "@",          // Set the height of the component
            titleSize: "@",         // The size of the chart's main title

            addToBasket: "@",       // Enable or disable "add to basket" functionality, values: true, false
            basketBtnX: "@",        // X-axis position of the basket button
            basketBtnY: "@",        // Y-axis position of the basket button

            embeddable: "@",        // Enable or disable the embedding of the component
            embedBtnX: "@",         // X-axis position of the embed button
            embedBtnY: "@",         // Y-axis position of the embed button
            popoverPos: "@",        // The side of the embed button from which the embed information window will appear

            enableRating: "@",      // Enable rating buttons for this component

            explanationBtnX: "@",   // Explanation button horizontal position
            explanationBtnY: "@",   // Explanation button vertical position
            disableExplanation: "@" // Set to true to disable the explanation button
        },
        templateUrl: Data.templatePath + "templates/visualisation/line.html",
        link: function (scope, element, attrs) {
            var lineContainer = _.first(angular.element(element[0].querySelector(".line-container")));

            // Create a random id for the element that will render the chart
            scope.elementId = "line" + Data.createRandomId();
            lineContainer.id = scope.elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = parseInt(scope.titleSize);
            var extraParams = scope.extraParams;

            // Check if the projectId attribute is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section";
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
                exporting = "true";

            // Check if the component's height attribute is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Check if the component's title size attribute is defined, else assign default value
            if (_.isUndefined(titleSize) || _.isNaN(titleSize))
                titleSize = 18;

            // Set the height of the chart
            lineContainer.style.height = elementH + "px";

            Data.getProjectVis("line", projectId, viewType, lang, extraParams)
                .then(function (response) {
                    // Check that the component has not been destroyed
                    if (scope.$$destroyed)
                        return;

                    var options = response.data;

                    // Set title size
                    options.title.style = {
                        fontSize: titleSize + "px"
                    };

                    // Set exporting options
                    options.exporting = {
                        buttons: {
                            contextButton: {
                                symbol: "url(" + Data.templatePath + "img/fa-download-small.png)",
                                symbolX: 19,
                                symbolY: 19
                            }
                        },
                        filename: options.title.text || "chart",
                        enabled: (exporting === "true")
                    };

                    // Add events on load and after changing extremes, to add the line filter
                    options.chart.events = {
                        load: function (e) {
                            Filters.addLineFilter(scope.elementId, e.target);
                        }
                    };

                    options.xAxis.events = {
                        afterSetExtremes: function (e) {
                            Filters.addLineFilter(scope.elementId, e.target.chart);
                        }
                    };

                    new Highcharts.StockChart(scope.elementId, options);
                }, function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                    else
                        scope.ydsAlert = error.message;
                });
        }
    };
}]);
