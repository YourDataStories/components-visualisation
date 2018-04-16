angular.module("yds").directive("ydsBar", ["Data", "Filters", function (Data, Filters) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // ID of the project
            viewType: "@",          // View type of data
            lang: "@",              // Language of the visualised data

            extraParams: "=",       // Extra attributes to pass to the API, if needed
            enablePaging: "@",      // Enable paging (default is false)
            pageSize: "@",          // Page size for paging
            numberOfItems: "@",     // Number of items, required for paging

            exporting: "@",         // Enable or disable the export of the chart
            elementH: "@",          // Set the height of the component
            titleSize: "@",         // The size of the chart's main title

            addToBasket: "@",       // Enable or disable "add to basket" functionality, values: true, false
            basketBtnX: "@",        // X-axis position of the basket button
            basketBtnY: "@",        // Y-axis position of the basket button

            embeddable: "@",        // Enable or disabled the embedding of the component
            embedBtnX: "@",         // X-axis position of the embed button
            embedBtnY: "@",         // Y-axis position of the embed button
            popoverPos: "@",        // The side of the embed button from which the embed information window will appear

            enableRating: "@",      // Enable rating buttons for this component
            disableExplanation: "@" // Set to true to disable the explanation button
        },
        templateUrl: Data.templatePath + "templates/visualisation/bar.html",
        link: function (scope, element) {
            var barContainer = _.first(angular.element(element[0].querySelector(".bar-container")));

            // Create a random id for the element that will render the chart
            scope.elementId = "bar" + Data.createRandomId();
            barContainer.id = scope.elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var pageSize = parseInt(scope.pageSize);
            var numberOfItems = parseInt(scope.numberOfItems);
            var exporting = scope.exporting;
            var elementH = scope.elementH;
            var titleSize = scope.titleSize;
            var extraParams = scope.extraParams;

            // If extra params exist, add them to Filters
            if (!_.isUndefined(extraParams) && !_.isEmpty(extraParams)) {
                Filters.addExtraParamsFilter(scope.elementId, extraParams);
            }

            // Check if the projectId attribute is defined, else stop the process
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
                exporting = "true";

            // Check if the enablePaging attribute is defined, else assign default value
            if (_.isUndefined(scope.enablePaging) || (scope.enablePaging !== "true" && scope.enablePaging !== "false"))
                scope.enablePaging = "false";

            // Check if the pageSize attribute is defined, else assign default value
            if (_.isUndefined(pageSize) || _.isNaN(pageSize))
                pageSize = 100;

            // Check if the component's height attribute is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Check if the component's title size attribute is defined, else assign default value
            if (_.isUndefined(titleSize) || titleSize.length === 0 || _.isNaN(titleSize))
                titleSize = 18;

            // If paging is enabled and number of items is not specified, turn off paging and show warning in console
            if (scope.enablePaging === "true" && (_.isUndefined(numberOfItems) || _.isNaN(numberOfItems))) {
                console.warn("Error in bar paging configuration! (did you give the number of items?) Paging will be turned off.");
                scope.enablePaging = "false";
            }

            var chart = null;

            // Show loading animation
            scope.loading = true;

            // Setup paging variables
            scope.offset = 0;               // Current offset
            scope.nextOffset = pageSize;    // Offset of the next page
            scope.pageSizeNum = pageSize;   // The page size, parsed in order to be an integer

            // Set the height of the chart
            if (scope.enablePaging === "true") {
                barContainer.style.height = (parseInt(elementH) - 35) + "px";
            } else {
                barContainer.style.height = elementH + "px";
            }

            /**
             * Change the page in the specified direction
             * @param direction Direction to switch page to, accepts "prev" for previous, or "next" for next page.
             */
            scope.changePage = function (direction) {
                // Set the new offset
                switch (direction) {
                    case "prev":
                        scope.offset -= pageSize;
                        break;
                    case "next":
                        scope.offset += pageSize;
                        break;
                }

                // Set the next offset
                if (scope.offset + pageSize <= numberOfItems) {
                    scope.nextOffset = scope.offset + pageSize;
                } else {
                    scope.nextOffset = numberOfItems;
                }

                // Update the bar chart
                chart.showLoading();
                createBar();
            };

            var createBar = function () {
                var params = _.clone(extraParams);

                if (_.isUndefined(params)) {
                    params = {};
                }

                // If paging is enabled, take it into account
                if (scope.enablePaging === "true") {
                    params.offset = scope.offset;
                    params.limit = pageSize;
                }

                // Get data and visualize bar
                Data.getProjectVis("bar", projectId, viewType, lang, params)
                    .then(function (response) {
                        if (_.isNull(chart)) {
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
                                filename: "YDS Bar - " + options.title.text || "chart",
                                enabled: (exporting === "true")
                            };

                            chart = new Highcharts.Chart(scope.elementId, options);
                        } else {
                            // Update the chart's options
                            chart.update(response.data);
                            chart.hideLoading();
                        }

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
            };

            // Create the bar
            createBar();
        }
    };
}]);
