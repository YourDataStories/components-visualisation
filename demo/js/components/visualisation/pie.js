angular.module("yds").directive("ydsPie", ["Data", "Filters", function (Data, Filters) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // ID of the project
            viewType: "@",          // View type of data
            lang: "@",              // Language of the visualised data
            extraParams: "=",       // Extra attributes to pass to the API, if needed

            exporting: "@",         // Enable or disable the export of the chart
            elementH: "@",          // Set the height of the component
            titleSize: "@",         // The size of the chart"s main title

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
        templateUrl: Data.templatePath + "templates/visualisation/pie.html",
        link: function (scope, element, attrs) {
            var pieContainer = _.first(angular.element(element[0].querySelector(".pie-container")));

            // Create a random id for the element that will render the chart
            scope.elementId = "pie" + Data.createRandomId();
            pieContainer.id = scope.elementId;

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

            // Check if the projectId is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured. " +
                    "Please check the corresponding documentation section.";
                return false;
            }

            // Check if view type attribute is empty and assign the default value
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

            // Set the height of the chart
            pieContainer.style.height = elementH + "px";

            // Get the pie data from the server
            Data.getProjectVis("pie", scope.projectId, viewType, lang, extraParams)
                .then(function (response) {
                    // Check that the component has not been destroyed
                    if (scope.$$destroyed)
                        return;

                    var options = response.data;

                    // Set title size in options
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
                        filename: "YDS Pie - " + options.title.text || "chart",
                        enabled: (exporting === "true")
                    };

                    // Create dataLabels object if it doesn't exist
                    if (_.isUndefined(options.plotOptions.pie.dataLabels)) {
                        options.plotOptions.pie.dataLabels = {};
                    }

                    // Add data label formatter function to trim names to 45 characters
                    options.plotOptions.pie.dataLabels.formatter = function () {
                        if (this.key.length > 45) {
                            this.key = this.key.substring(0, 45) + "…";
                        }

                        return this.key + ": " + this.percentage.toFixed(1) + "%";
                    };

                    // Create the chart
                    new Highcharts.Chart(scope.elementId, options);

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
        }
    };
}]);
