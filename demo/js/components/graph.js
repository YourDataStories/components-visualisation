angular.module("yds").directive("ydsGraph", ["Data", "Graph", "$ocLazyLoad",
    function (Data, Graph, $ocLazyLoad) {
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
                var drupalPath = (typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "";
                var iconPath = drupalPath + "img/Font-Awesome-SVG-PNG/"; // Path for the graph node icons

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

                scope.showInfoPanel = false;
                scope.infoPanelContent = "";

                // The Cytoscape instance for this graph component
                var cy = null;

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

                // Define qTip settings
                var qtipConfig = {
                    content: function () {
                        var data = this.data();
                        return "<strong>Node ID:</strong> " + this.id()
                            + "<br/><strong>Value:</strong> " + data.value;
                    },
                    position: {
                        my: "top center",
                        at: "bottom center"
                    },
                    style: {
                        classes: "qtip-bootstrap",
                        tip: {
                            width: 16,
                            height: 8
                        }
                    }
                };

                // Initialize counters for generated edges & nodes
                var oldLayout = null;

                /**
                 * Close the info panel
                 */
                scope.closeInfoPanel = function () {
                    scope.showInfoPanel = false;
                };

                /**
                 * Remove all the outgoing edges and nodes from the given node, and all their own outgoing edges/nodes
                 * recursively.
                 * @param node  Node to remove all children of
                 */
                var removeAllChildNodes = function (node) {
                    var outgoers = node.outgoers();
                    if (outgoers.length > 0) {
                        outgoers.nodes().forEach(removeAllChildNodes);
                    }

                    outgoers.remove();
                };

                /**
                 * Stop the old graph layout (if it exists in the "oldLayout" variable) and create a new one with the
                 * current graph elements.
                 * @param randomize If true, the positions of the elements will be randomized
                 */
                var reloadLayout = function (randomize) {
                    if (!_.isNull(oldLayout)) {
                        oldLayout.stop();
                    }
                    oldLayout = cy.elements().layout({
                        name: "cola",
                        animate: true,
                        infinite: true,
                        randomize: randomize,
                        fit: false,
                        nodeSpacing: 75
                    }).run();
                };

                /**
                 * Callback for adding data from the Graph service to the graph, or showing it in the info panel if the
                 * returned nodes are too many.
                 * @param data  Data for the graph. Expected to be an object with "nodes" and "edges" properties.
                 */
                var addDataToGraph = function (data) {
                    if (data.nodes.length < 50) {
                        // Add the new nodes and their edges to the graph
                        var elements = cy.add(_.union(data.nodes, data.edges));

                        reloadLayout();

                        // Add qtip and double tap event to all nodes (after removing them (?))
                        elements.nodes().on("doubleTap", nodeDoubleTapHandler);
                        elements.nodes().qtip(qtipConfig);
                    } else {
                        // Too many nodes, show them in the info panel
                        var nodeIds = _.pluck(_.pluck(data.nodes, "data"), "id");

                        Graph.getDataMultiple(nodeIds)
                            .then(function (response) {
                                scope.showInfoPanel = true;
                                scope.infoPanelContent = response.data;
                                scope.infoPanelView = response.view;
                            }, function (error) {
                                console.error("Error while getting data for multiple nodes: ", error);
                            });
                    }
                };

                /**
                 * Get the new nodes that need to be added to the graph for the double-clicked node and add them
                 * @param event
                 */
                var nodeDoubleTapHandler = function (event) {
                    var targetNodeData = event.target.data();

                    if (_.has(targetNodeData, "numberOfItems")) {
                        // Get nodes & edges coming OUT from the clicked node
                        var outgoers = event.target.outgoers();

                        if (outgoers.length === 0) {
                            // The node does not have children loaded, so load them
                            Graph.getData(event.target.id())
                                .then(addDataToGraph, function (error) {
                                    console.error("Error while loading more nodes: ", error);
                                });
                        } else {
                            // Remove all children of the node and reload the graph layout
                            removeAllChildNodes(event.target);
                            reloadLayout();
                        }
                    } else {
                        console.log("No extra data for this node");
                    }
                };

                /**
                 * Create the graph
                 */
                var createGraph = function () {
                    // Create graph
                    cy = cytoscape({
                        container: graphContainer,
                        elements: {
                            nodes: [],
                            edges: []
                        },
                        wheelSensitivity: 0.3,
                        style: [
                            {
                                selector: "node",
                                style: {
                                    "text-wrap": "wrap",
                                    "label": function (ele) {
                                        var data = ele.data();

                                        if (data.label.length > 0) {
                                            return data.label + ": " + data.value
                                        } else {
                                            return data.value;
                                        }
                                    },
                                    "background-color": "data(bgcolor)",
                                    "width": "40",
                                    "height": "40",
                                    "padding": "10",
                                    "text-margin-x": "3",
                                    "text-outline-color": "white",
                                    "text-outline-width": "2",
                                    "font-family": "Sans-Serif",
                                    "text-valign": "center",
                                    "text-halign": "right",
                                    "background-image": function (ele) {
                                        // Return the icon path with the icon in the end
                                        return iconPath + ele.data().icon;
                                    },
                                    "background-repeat": "no-repeat",
                                    "background-clip": "none",
                                    "background-fit": "contain",
                                    "background-width-relative-to": "inner",
                                    "background-height-relative-to": "inner"
                                }
                            }, {
                                selector: "node#main",
                                style: {
                                    "width": "80",
                                    "height": "80"
                                }
                            }, {
                                selector: "node:selected",
                                style: {
                                    "background-color": "#0089ff",
                                    "border-color": "#707070",
                                    "border-width": "1"
                                }
                            }
                        ]
                    });

                    // Define custom "double click" event (https://stackoverflow.com/a/24830082)
                    var doubleClickDuration = 300;  // Max time between two taps that will be considered a double tap
                    var tappedBefore;
                    var tappedTimeout;
                    cy.on("tap", function (event) {
                        var tappedNow = event.target;
                        if (tappedTimeout && tappedBefore) {
                            clearTimeout(tappedTimeout);
                        }
                        if (tappedBefore === tappedNow) {
                            tappedNow.trigger("doubleTap");
                            tappedBefore = null;
                        } else {
                            tappedTimeout = setTimeout(function () {
                                tappedBefore = null;
                            }, doubleClickDuration);
                            tappedBefore = tappedNow;
                        }
                    });

                    // Add initial data
                    Graph.getData("main")
                        .then(function (data) {
                            cy.add(data);
                            cy.nodes().qtip(qtipConfig);
                            reloadLayout(true);

                            cy.nodes().on("doubleTap", nodeDoubleTapHandler);

                            // Fit the viewport to the initial nodes after 0.5 sec.
                            setTimeout(function () {
                                cy.fit(cy.nodes(), 30);
                            }, 500);
                        });
                };

                // Load cytoscape if not loaded already and create the graph
                if (typeof cytoscape === "undefined") {
                    $ocLazyLoad.load({
                        files: [
                            drupalPath + "css/jquery.qtip.min.css",
                            drupalPath + "lib/cytoscape/jquery.qtip.min.js",
                            drupalPath + "lib/cytoscape/cytoscape.min.js",
                            drupalPath + "lib/cytoscape/cola.min.js",
                            drupalPath + "lib/cytoscape/cytoscape-cola.js",
                            drupalPath + "lib/cytoscape/cytoscape-qtip.js"
                        ],
                        cache: true,
                        serie: true
                    }).then(createGraph);
                } else {
                    createGraph();
                }
            }
        };
    }
]);
