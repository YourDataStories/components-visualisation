angular.module("yds").directive("ydsGraph", ["Data", "Graph", "$ocLazyLoad", "$timeout",
    function (Data, Graph, $ocLazyLoad, $timeout) {
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

                var mainNodeId = projectId;

                scope.showInfoPanel = false;
                scope.infoPanelContent = "";

                scope.graphLayouts = Graph.getLayouts();
                scope.selectedLayout = _.first(scope.graphLayouts);

                scope.showNodeInfo = false;
                scope.maxDepth = 1;

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

                graphContainer.style.minHeight = elementH + "px";

                // Variable to keep the currently applied layout of the graph (to be able to stop it)
                var oldLayout = null;

                scope.selectLayout = function () {
                    reloadLayout();
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
                 */
                var reloadLayout = function () {
                    if (!_.isNull(oldLayout)) {
                        oldLayout.stop();
                    }

                    oldLayout = cy.elements().layout(scope.selectedLayout).run();
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

                        // Add double tap event to all nodes (after removing them (?))
                        elements.nodes().on("doubleTap", function (event) {
                            loadNodeChildren(event.target);
                        });
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
                 * Get a map of the node IDs that are currently in the graph, and their depth. Uses BFS algorithm,
                 * starting from the "main" node.
                 * @returns {{}}
                 */
                var getNodeDepths = function () {
                    var nodeDepths = {};
                    cy.elements().bfs({
                        roots: "node[id='" + mainNodeId + "']", // Start from main node
                        visit: function (v, e, u, i, depth) {
                            // Save the node's depth to the depth map
                            nodeDepths[v.id()] = depth;
                        }
                    });

                    return nodeDepths;
                };

                /**
                 * Get the children of the given node from the API, and add them to the graph. If the node already has
                 * the correct amount of children "close" it and navigate to the upper graph level.
                 * @param node  Node to load children for
                 */
                var loadNodeChildren = function (node) {
                    var targetNodeData = node.data();

                    if (_.has(targetNodeData, "numberOfItems")) {
                        // Get nodes & edges coming OUT from the clicked node
                        var outgoers = node.outgoers("node");

                        if (outgoers.length < targetNodeData.numberOfItems) {
                            // The node does not have children loaded, so load them
                            Graph.getData(node.id(), lang)
                                .then(function (data) {
                                    addDataToGraph(data);

                                    // Get each node's depth
                                    var nodeDepths = getNodeDepths();

                                    // Check if there are any nodes that we should remove, based on the max depth
                                    console.log("=============================================");
                                    var clickedNodePredecessors = node.predecessors();
                                    var clickedNodeDepth = nodeDepths[node.id()];
                                    var newDepth = clickedNodeDepth + 1;

                                    _.each(nodeDepths, function (depth, nodeId) {
                                        // If the depth difference is larger than the max allowed depth, we should
                                        // check if the node is a predecessor of the clicked one, and if not, remove it
                                        if (Math.abs(depth - newDepth) >= scope.maxDepth) {
                                            // If the node we are checking is not a predecessor of the clicked node,
                                            // and it is not the clicked node, we need to remove it
                                            if (!clickedNodePredecessors.contains(cy.getElementById(nodeId))
                                                && nodeId !== node.id()) {
                                                console.log("=>", nodeId, "needs to be removed");
                                                cy.remove("[id='" + nodeId + "']");
                                            } else {
                                                console.log(nodeId, "is a predecessor of clicked node, will not be removed");
                                            }
                                        }
                                    })
                                }, function (error) {
                                    console.error("Error while loading more nodes: ", error);
                                });
                        } else {
                            // Remove all children of the node
                            removeAllChildNodes(node);

                            // If there are no other "opened" nodes at the clicked node's level, we will "navigate up"
                            var nodeDepths = getNodeDepths();
                            var clickedNodeDepth = nodeDepths[node.id()];
                            var navigateUp = true;
                            _.each(nodeDepths, function (depth) {
                                if (navigateUp && depth > clickedNodeDepth) {
                                    navigateUp = false;
                                }
                            });

                            if (navigateUp) {
                                // Check if the parent of the closed node has any other children. If so, load them
                                var parent = node;  // Start from current node
                                for (var i = 0; i < scope.maxDepth; i++) {
                                    parent = parent.incomers("node");   // Get incomer nodes ("parents" of this node)

                                    // If there is only 1 parent, which should have more children than it does now, load them
                                    if (parent.length === 1 && parent.outgoers("node").length < parent.data().numberOfItems) {
                                        loadNodeChildren(parent);
                                    } else if (parent.length > 1) {
                                        console.warn("Parents are != 1?", parent);
                                    }
                                }
                            }

                            // Reload the graph layout
                            reloadLayout();
                        }
                    } else {
                        console.log("No extra data for this node");
                    }
                };

                /**
                 * Show a node's info in the Info Panel
                 * @param event
                 */
                var nodeClickHandler = function (event) {
                    // Run in $timeout so the scope changes with be reflected
                    $timeout(function () {
                        var data = event.target.data();
                        var newName = (data.label.length > 0) ? (data.label + ": " + data.value) : data.value;

                        // Check if we should hide the node children table
                        if (!_.isUndefined(scope.clickedNode) && scope.clickedNode.name !== newName) {
                            scope.showInfoPanel = false;
                        }

                        // Add clicked node data to scope
                        scope.clickedNode = {
                            name: newName,
                            icon: iconPath + data.icon,
                            iconStyle: {
                                "background-color": data.bgcolor
                            }
                        };

                        scope.showNodeInfo = true;
                    });
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
                                        var value;

                                        // If there is a label, use it, otherwise just use the value
                                        if (data.label.length > 0) {
                                            value = data.label + ": " + data.value
                                        } else {
                                            value = data.value;
                                        }

                                        // If the label is longer than 40 characters, trim it
                                        if (value.length > 40) {
                                            return value.substring(0, 40) + "…";
                                        } else {
                                            return value;
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
                                selector: "node[id='" + mainNodeId + "']",
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

                    // Add node click handler (to show the clicked node's information in the info panel)
                    cy.on("tap", "node", nodeClickHandler);

                    // Add initial data
                    Graph.getData(projectId, lang)
                        .then(function (data) {
                            cy.add(data);
                            reloadLayout(true);

                            cy.nodes().on("doubleTap", function (event) {
                                loadNodeChildren(event.target);
                            });

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
                            drupalPath + "lib/cytoscape/cytoscape.min.js",
                            drupalPath + "lib/cytoscape/dagre.min.js",
                            drupalPath + "lib/cytoscape/cytoscape-dagre.js",
                            drupalPath + "lib/cytoscape/cola.min.js",
                            drupalPath + "lib/cytoscape/cytoscape-cola.js"
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
