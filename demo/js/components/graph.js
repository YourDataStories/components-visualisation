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
                            + "<br/><strong>Node name:</strong> " + data.label;
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
                            var newData = Graph.getData(event.target.id());

                            if (!_.isUndefined(newData)) {
                                // Add the new data to the graph
                                var elements = cy.add(newData);

                                if (!_.isNull(oldLayout)) {
                                    oldLayout.stop();
                                }
                                oldLayout = cy.elements().layout({
                                    name: "cola",
                                    animate: true,
                                    infinite: true,
                                    fit: false,
                                    nodeSpacing: 75
                                }).run();

                                // Add qtip and double tap event to all nodes (after removing them (?))
                                elements.nodes().on("doubleTap", nodeDoubleTapHandler);
                                elements.nodes().qtip(qtipConfig);
                            } else {
                                // This should not happen, unless there is a server error (?)
                                console.error("Error getting data for node...");
                            }
                        } else {
                            // Remove all children of the node
                            removeAllChildNodes(event.target);
                        }
                    } else {
                        console.log("No extra data for this node");
                    }

                    // setTimeout(function () {
                    //     // Fit the viewport to the new nodes
                    //     cy.fit("node[level = " + (maxNodeLevel - 1) + "]", 40);
                    // }, 500);
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
                        style: cytoscape.stylesheet()
                            .selector("node")
                            .css({
                                "text-wrap": "wrap",
                                "label": "data(label)",
                                "background-color": "#c2c2c2",
                                "width": "40",
                                "height": "40",
                                "padding": "5",
                                "text-margin-x": "3",
                                "text-outline-color": "white",
                                "text-outline-width": "2",
                                "font-family": "Sans-Serif",
                                "text-valign": "center",
                                "text-halign": "right",
                                "background-image": "img/1497125843_bookshelf.svg", // test icon from: https://www.iconfinder.com/icons/1055107/books_bookshelf_library_icon#size=128
                                "background-repeat": "no-repeat",
                                "background-clip": "none",
                                "background-fit": "contain",
                                "background-width-relative-to": "inner",
                                "background-height-relative-to": "inner"
                            })
                            .selector("node[id=\"main\"]")
                            .css({
                                "width": "80",
                                "height": "80"
                            })
                            .selector("node:selected")
                            .css({
                                "background-color": "#0089ff",
                                "border-color": "#707070",
                                "border-width": "3"
                            })
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
                    cy.add(Graph.getData("main"));
                    cy.nodes().qtip(qtipConfig);
                    oldLayout = cy.elements().layout({
                        name: "cola",
                        animate: true,
                        infinite: true,
                        randomize: true,
                        fit: false,
                        nodeSpacing: 75
                    }).run();

                    cy.nodes().on("doubleTap", nodeDoubleTapHandler);
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
