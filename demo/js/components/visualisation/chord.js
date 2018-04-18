angular.module("yds").directive("ydsChord", ["Data", "Filters", function (Data, Filters) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",         // ID of the project
            viewType: "@",          // View type of data
            lang: "@",              // Language of the visualised data

            extraParams: "=",       // Extra attributes to pass to the API, if needed

            elementH: "@",          // Set the height of the component
            titleSize: "@",         // The size of the chart's main title

            addToBasket: "@",       // Enable or disable "add to basket" functionality, values: true, false
            embeddable: "@",        // Enable or disabled the embedding of the component
            popoverPos: "@",        // The side of the embed button from which the embed information window will appear

            enableRating: "@",      // Enable rating buttons for this component
            disableExplanation: "@" // Set to true to disable the explanation button
        },
        templateUrl: Data.templatePath + "templates/visualisation/chord.html",
        link: function (scope, element) {
            var chordContainer = _.first(angular.element(element[0].querySelector(".chord-container")));

            // Create a random id for the element that will render the chart
            scope.elementId = "bar" + Data.createRandomId();
            chordContainer.id = scope.elementId;

            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
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

            // Check if the enablePaging attribute is defined, else assign default value
            if (_.isUndefined(scope.enablePaging) || (scope.enablePaging !== "true" && scope.enablePaging !== "false"))
                scope.enablePaging = "false";

            // Check if the component's height attribute is defined, else assign default value
            if (_.isUndefined(elementH) || _.isNaN(elementH))
                elementH = 200;

            // Check if the component's title size attribute is defined, else assign default value
            if (_.isUndefined(titleSize) || titleSize.length === 0 || _.isNaN(titleSize))
                titleSize = 18;

            var chart = null;

            // Show loading animation
            scope.loading = true;

            // Set the height of the chart
            chordContainer.style.height = elementH + "px";

            var createChord = function () {
                var params = _.clone(extraParams);

                if (_.isUndefined(params)) {
                    //todo: can remove if no extra things are added to it
                    params = {};
                }

                // Get data and visualize bar
                Data.getProjectVis("chord", projectId, viewType, lang, params)
                    .then(function (response) {
                        if (_.isNull(chart)) {
                            // Check that the component has not been destroyed
                            if (scope.$$destroyed)
                                return;

                            var options = response.data;

                            console.log("Chord", options);
                            scope.chordData = options;
                        } else {
                            // Update the chart's options
                            console.log("Chord update");
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
            createChord();
        }
    };
}]);
