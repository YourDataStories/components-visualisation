angular.module("yds").directive("ydsChord", ["$ocLazyLoad", "$timeout", "$sce", "Data", "Filters",
    function ($ocLazyLoad, $timeout, $sce, Data, Filters) {
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
                popoverPos: "@",        // The side from which the embed information window will appear

                enableRating: "@",      // Enable rating buttons for this component
                disableExplanation: "@" // Set to true to disable the explanation button
            },
            templateUrl: Data.templatePath + "templates/visualisation/chord.html",
            link: function (scope, element) {
                var chordContainer = _.first(angular.element(element[0].querySelector(".chord-container")));
                var chordPanelBody = _.first(angular.element(element[0].querySelector(".chord-panel-body")));

                // Create a random id for the element that will render the chart
                scope.elementId = "chord" + Data.createRandomId();
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
                if (_.isUndefined(scope.enablePaging) || (scope.enablePaging !== "true"
                    && scope.enablePaging !== "false"))
                    scope.enablePaging = "false";

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 200;

                // Check if the component's title size attribute is defined, else assign default value
                if (_.isUndefined(titleSize) || titleSize.length === 0 || _.isNaN(titleSize))
                    titleSize = 18;

                // Set some Chord parameters for D3
                var width = elementH,
                    height = elementH,
                    outerRadius = Math.min(width, height) / 2 - 10,
                    innerRadius = outerRadius - 24;

                chordPanelBody.style.maxHeight = (elementH - 100) + "px";

                // Variable to hold Chord instance
                var chord = null;
                var matrix = null;
                var items = null;

                // Initialize variables for the table
                scope.selectedItem = null;
                scope.relatedItems = null;

                // Show loading animation
                scope.loading = true;
                scope.noData = false;

                // Set the height of the chart
                chordContainer.style.height = elementH + "px";

                /**
                 * Chord mouseover function
                 */
                var mouseover = function (d, i) {
                    chord.classed("chord-fade", function (p) {
                        return p.source.index != i
                            && p.target.index != i;
                    });
                };

                /**
                 * Show grid with information about the clicked group.
                 * @param target    Clicked group
                 */
                var groupClickHandler = function (target) {
                    // Get index and data of item
                    var index = target.index;
                    var item = items[index];

                    // Find the matrix row for this item and find the linked companies
                    var matrixRow = matrix[index];
                    var companies = [];
                    _.each(matrixRow, function (value, i) {
                        if (value > 0) {
                            companies.push(_.extend({}, items[i], {
                                value: value
                            }));
                        }
                    });

                    // Sort companies by their values (descending)
                    companies = _.sortBy(companies, "value").reverse();

                    // Make links of the companies trustable as HTML if they are not trusted already
                    _.each(companies, function (company) {
                        if (_.isString(company.link)) {
                            company.link = $sce.trustAsHtml(company.link);
                        }
                    });

                    if (_.isString(item.link)) {
                        item.link = $sce.trustAsHtml(item.link);
                    }

                    // Add the variables to the scope
                    $timeout(function () {
                        scope.selectedItem = item;
                        scope.relatedItems = companies;
                    });
                };

                var createChord = function () {
                    // Get data and visualize bar
                    Data.getProjectVis("chord", projectId, viewType, lang, extraParams)
                        .then(function (response) {
                            // Check that the component has not been destroyed
                            if (scope.$$destroyed)
                                return;

                            if (!_.has(response.data, "matrix") || !_.has(response.data, "nodes")) {
                                // No data returned from API
                                scope.loading = false;
                                scope.noData = true;
                                return;
                            }

                            // Get data from API response
                            matrix = response.data.matrix;
                            items = response.data.nodes;

                            var arc = d3.svg.arc()
                                .innerRadius(innerRadius)
                                .outerRadius(outerRadius);

                            var layout = d3.layout.chord()
                                .padding(.01)
                                .sortSubgroups(d3.ascending)
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

                            // Compute the chord layout.
                            layout.matrix(matrix);

                            // Add a group per neighborhood.
                            var group = svg.selectAll(".group")
                                .data(layout.groups)
                                .enter().append("g")
                                .attr("class", "group")
                                .on("mouseover", mouseover)
                                .on("click", groupClickHandler);

                            // Add a mouseover title.
                            group.append("title").text(function (d, i) {
                                return items[i].name + ": " + d.value + " connections";
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
                            }).remove();

                            // Add the chords.
                            chord = svg.selectAll(".chord")
                                .data(layout.chords)
                                .enter().append("path")
                                .attr("class", "chord")
                                .style("fill", function (d) {
                                    return items[d.source.index].colour;
                                })
                                .attr("d", path);

                            // Add an elaborate mouseover title for each chord.
                            chord.append("title").text(function (d) {
                                return items[d.source.index].name
                                    + " ↔ " + items[d.target.index].name
                                    + ": " + d.source.value;
                            });

                            // Remove loading animation
                            scope.loading = false;
                        }, function (error) {
                            if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                                scope.ydsAlert = "An error has occurred, " +
                                    "please check the configuration of the component.";
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
    }
]);
