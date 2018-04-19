angular.module("yds").directive("ydsChord", ["$ocLazyLoad", "Data", "Filters", function ($ocLazyLoad, Data, Filters) {
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

                            //////////////////////// CHORD ////////////////////////
                            var width = elementH,
                                height = elementH,
                                outerRadius = Math.min(width, height) / 2 - 10,
                                innerRadius = outerRadius - 24;

                            var formatPercent = d3.format(".1%");

                            var arc = d3.svg.arc()
                                .innerRadius(innerRadius)
                                .outerRadius(outerRadius);

                            var layout = d3.layout.chord()
                                .padding(.04)
                                .sortSubgroups(d3.descending)
                                .sortChords(d3.ascending);

                            var path = d3.svg.chord()
                                .radius(innerRadius);

                            var svg = d3.select(".chord-container").append("svg")
                                .attr("width", width)
                                .attr("height", height)
                                .append("g")
                                .attr("id", "circle")
                                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

                            svg.append("circle")
                                .attr("r", outerRadius);

                            // Get data from API response
                            var matrix = response.data.matrix;
                            var items = response.data.nodes;

                            // Compute the chord layout.
                            layout.matrix(matrix);

                            // Add a group per neighborhood.
                            var group = svg.selectAll(".group")
                                .data(layout.groups)
                                .enter().append("g")
                                .attr("class", "group")
                            ;
                            // .on("mouseover", mouseover);

                            // Add a mouseover title.
                            group.append("title").text(function (d, i) {
                                return items[i].name + ": " + formatPercent(d.value) + " of origins";
                            });

                            // Add the group arc.
                            var groupPath = group.append("path")
                                .attr("id", function (d, i) {
                                    return "group" + i;
                                })
                                .attr("d", arc)
                                .style("fill", function (d, i) {
                                    return items[i].colour;
                                });

                            // Add a text label.
                            var groupText = group.append("text")
                                .attr("x", 6)
                                .attr("dy", 15);

                            groupText.append("textPath")
                                .attr("xlink:href", function (d, i) {
                                    return "#group" + i;
                                })
                                .text(function (d, i) {
                                    return items[i].name;
                                });

                            // Remove the labels that don't fit. :(
                            groupText.filter(function (d, i) {
                                return groupPath[0][i].getTotalLength() / 2 - 16 < this.getComputedTextLength();
                            })
                                .remove();

                            // Add the chords.
                            var chord = svg.selectAll(".chord")
                                .data(layout.chords)
                                .enter().append("path")
                                .attr("class", "chord")
                                .style("fill", function (d) {
                                    return items[d.source.index].colour;
                                })
                                .attr("d", path);

                            // Add an elaborate mouseover title for each chord.
                            // chord.append("title").text(function (d) {
                            //     return cities[d.source.index].name
                            //         + " → " + cities[d.target.index].name
                            //         + ": " + formatPercent(d.source.value)
                            //         + "\n" + cities[d.target.index].name
                            //         + " → " + cities[d.source.index].name
                            //         + ": " + formatPercent(d.target.value);
                            // });
                            //
                            // function mouseover(d, i) {
                            //     chord.classed("fade", function (p) {
                            //         return p.source.index != i
                            //             && p.target.index != i;
                            //     });
                            // }

                            //////////////////////// CHORD ////////////////////////

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

            if (!_.has(window, "d3")) {
                $ocLazyLoad.load({
                    files: ["https://d3js.org/d3.v3.min.js"],
                    cache: true
                }).then(function () {
                    createChord();
                });
            } else {
                // Create the bar
                createChord();
            }
        }
    };
}]);
