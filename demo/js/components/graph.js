angular.module("yds").directive("ydsGraph", ["Data",
    function (Data) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",     // ID of the project to display
                viewType: "@",      // View type of the graph
                lang: "@",          // Lang of the visualised data

                extraParams: "=",   // Extra attributes to pass to the API, if needed
                baseUrl: "@",       // Base URL to send to API (optional)

                exporting: "@",     // Enable or disable the export of the plot
                elementH: "@",      // Set the height of the component

                enableRating: "@"   // Enable rating buttons for this component
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/graph.html",
            link: function (scope, element, attrs) {
                var graphContainer = _.first(angular.element(element[0].querySelector(".graph-container")));

                var elementId = "graph" + Data.createRandomId();
                graphContainer.id = elementId;

                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var lang = scope.lang;

                var extraParams = scope.extraParams;
                var baseUrl = scope.baseUrl;

                var exporting = scope.exporting;
                var elementH = parseInt(scope.elementH);

                // Check if projectId is defined
                if (_.isUndefined(projectId) || projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly configured. " +
                        "Please check the corresponding documentation section.";
                    return false;
                }

                // Check if view type is defined, otherwise set default value
                if (_.isUndefined(viewType) || viewType.trim() === "")
                    viewType = "default";

                // Check if lang is defined, otherwise set default value
                if (_.isUndefined(lang) || lang.trim() === "")
                    lang = "en";

                // Check if exporting is defined, otherwise set default value
                if (_.isUndefined(exporting) || (exporting !== "true" && exporting !== "false"))
                    exporting = "false";

                // Check if the element height is defined, otherwise set default value
                if (_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 200;

                graphContainer.style.height = elementH + "px";

                // Create the graph
                var g = Viva.Graph.graph();

                // Add graph data
                g.addNode("Node 1", {
                    icon: "\uf197"
                });
                g.addNode("Node 2", {
                    icon: "\uf080"
                });
                g.addLink("Node 1", "Node 2");

                // Add node rendering functions
                var graphics = Viva.Graph.View.svgGraphics();
                var nodeSize = 24;

                graphics.node(function (node) {
                    // The function is called every time renderer needs a ui to display node
                    var myNode = Viva.Graph.svg("g"),
                        icon = Viva.Graph.svg("text")
                            .attr("font-family", "FontAwesome")
                            .attr("font-size", "24px")
                            .text(node.data.icon),
                        text = Viva.Graph.svg("text")
                            .attr("x", "30px")
                            .attr("y", "-4px")
                            .text(node.id);

                    myNode.append(icon);
                    myNode.append(text);

                    return myNode;
                }).placeNode(function (nodeUI, pos) {
                    nodeUI.attr('transform',
                        'translate(' +
                        (pos.x - nodeSize / 2) + ',' + (pos.y + nodeSize / 2) +
                        ')');
                });

                // Render the graph
                var renderer = Viva.Graph.View.renderer(g, {
                    container: graphContainer,
                    graphics: graphics
                });
                renderer.run();
            }
        };
    }
]);
