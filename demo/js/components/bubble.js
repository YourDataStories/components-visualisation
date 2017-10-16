angular.module("yds").directive("ydsBubble", ["YDS_CONSTANTS", "Data", "$window", function (YDS_CONSTANTS, Data, $window) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // ID of the project that the data belong
            viewType: "@",          // Name of the array that contains the visualised data
            lang: "@",              // Lang of the visualised data

            extraParams: "=",       // Extra attributes to pass to the API, if needed
            baseUrl: "@",           // Base URL to send to API (optional)

            exporting: "@",         // Enable or disable the export of the plot
            elementH: "@",          // Set the height of the component
            titleSize: "@",         // The size of the chart's main title
            legend: "@",            // Enable or disable chart legend

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
        templateUrl: Data.templatePath + "templates/bubble.html",
        link: function (scope, element, attrs) {
            var bubbleContainer = angular.element(element[0].querySelector(".bubble-container"));

            // Create a random id for the element that will render the plot
            var elementId = "bubble" + Data.createRandomId();
            bubbleContainer[0].id = elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;
            var legend = scope.legend;
            var extraParams = scope.extraParams;
            var baseUrl = scope.baseUrl;

            // Check if the projectId and the viewType attr is defined, else stop the process
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly configured." +
                    "Please check the corresponding documentation section";
                return false;
            }

            // Check if pie-type attribute is empty and assign the default value
            if (_.isUndefined(viewType) || viewType.trim() === "")
                viewType = "default";

            // Check if the language attr is defined, else assign default value
            if (_.isUndefined(lang) || lang.trim() === "")
                lang = "en";

            // Check if the exporting attr is defined, else assign default value
            if (_.isUndefined(exporting) || (exporting !== "true" && exporting !== "false"))
                exporting = "true";

            // Check if legend attr is defined, else assign default value
            if (_.isUndefined(legend) || legend.trim() === "")
                legend = "false";

            // Check if the component's height attr is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Check if the component's title size attr is defined, else assign default value
            if (_.isUndefined(titleSize) || titleSize.length === 0 || _.isNaN(titleSize))
                titleSize = 18;

            // Set the height of the plot
            bubbleContainer[0].style.height = elementH + "px";

            // Add base URL to extra params, if needed
            if (!_.isUndefined(baseUrl) && baseUrl.length > 0) {
                extraParams = _.extend({
                    baseurl: baseUrl
                }, extraParams);
            }

            Data.getProjectVis("bubble", projectId, viewType, lang, extraParams)
                .then(function (response) {
                    var options = response.data;

                    // Add element ID to render the chart to in the options
                    options.chart.renderTo = elementId;

                    // Set title size in options
                    options.title.style = {
                        fontSize: titleSize + "px"
                    };

                    // Set legend in options
                    options.legend.enabled = (legend === "true");

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

                    // Add function to check if URI for a point exists in order to open details page for it
                    options.plotOptions.series.point = {
                        events: {
                            click: function (event) {
                                var point = event.point;
                                if (_.has(point, "uri") && _.has(point, "type")) {
                                    var url = null;
                                    if (point.type === "aurl") {
                                        // Absolute URL, use it as is
                                        url = point.uri;
                                    } else {
                                        url = YDS_CONSTANTS.PROJECT_DETAILS_URL + "?id=" + point.uri + "&type=" + point.type;
                                    }

                                    $window.open(url, "_blank");
                                }
                            }
                        }
                    };

                    new Highcharts.Chart(options);
                }, function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component";
                    else
                        scope.ydsAlert = error.message;
                });
        }
    };
}]);
