angular.module("yds").directive("ydsScatter", ["Data", function (Data) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // ID of the project
            viewType: "@",          // View type of data
            lang: "@",              // Language of the visualised data

            exporting: "@",         // Enable or disable the export of the plot
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
            disableExplanation: "@" // Set to true to disable the explanation button
        },
        templateUrl: Data.templatePath + "templates/visualisation/scatter.html",
        link: function (scope, element, attrs) {
            var scatterContainer = _.first(angular.element(element[0].querySelector(".scatter-container")));

            // Create a random id for the element that will render the plot
            scope.elementId = "scatter" + Data.createRandomId();
            scatterContainer.id = scope.elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;

            // Check if the projectId attribute is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured." +
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
                exporting = "true";

            // Check if the component's height attribute is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Check if the component's title size attribute is defined, else assign default value
            if (_.isUndefined(titleSize) || titleSize.length === 0 || _.isNaN(titleSize))
                titleSize = 18;

            // Set the height of the plot
            scatterContainer.style.height = elementH + "px";

            Data.getProjectVis("scatter", projectId, viewType, lang)
                .then(function (response) {
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
                        filename: "YDS Scatter - " + options.title.text || "chart",
                        enabled: (exporting === "true")
                    };

                    new Highcharts.Chart(scope.elementId, options);
                }, function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                    else
                        scope.ydsAlert = error.message;
                });
        }
    };
}]);
