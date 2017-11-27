angular.module("yds").directive("ydsGraph", ["Data", "Graph", "Translations", "$ocLazyLoad", "$timeout",
    function (Data, Graph, Translations, $ocLazyLoad, $timeout) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",     // ID of the project to display
                lang: "@",          // Lang of the visualised data
                elementH: "@",      // Set the height of the component
                enableRating: "@"   // Enable rating buttons for this component
            },
            templateUrl: Data.templatePath + "templates/visualisation/graph.html",
            link: function (scope, element, attrs) {
                var iconPath = Data.templatePath + "img/Font-Awesome-SVG-PNG/"; // Path for the graph node icons

                var graphContainer = _.first(angular.element(element[0].querySelector(".graph-container")));
                graphContainer.id = "graph" + Data.createRandomId();

                var projectId = scope.projectId;
                var lang = scope.lang;
                var elementH = parseInt(scope.elementH);

                var mainNodeId = projectId;

                // Initialize scope variables
                scope.translations = {
                    showMore: Translations.get(lang, "showMore"),
                    showLess: Translations.get(lang, "showLess")
                };

                scope.showInfoPanel = false;
                scope.infoPanelContent = "";

                scope.graphLayouts = Graph.getLayouts();
                scope.selectedLayout = _.first(scope.graphLayouts);

                scope.showNodeInfo = false;
                scope.showNodeInfoComponent = false;
                scope.maxDepth = 1;
                scope.childrenListThreshold = 50;
                scope.showBackBtn = false;

                // The Cytoscape instance for this graph component
                var cy = null;

                // Check if projectId is defined
                if (_.isUndefined(projectId) || projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly configured. " +
                        "Please check the corresponding documentation section.";
                    return false;
                }

                // Check if lang is defined, otherwise set default value
                if (_.isUndefined(lang) || lang.trim() === "")
                    lang = "en";

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
                 * Callback for adding data from the Graph service to the graph
                 * @param data          Data for the graph. Expected to be an object with "nodes" and "edges" properties.
                 * @param fitViewport   If true, will fit the viewport to the nodes after adding them to the graph
                 */
                var addDataToGraph = function (data, fitViewport) {
                    // Add the new nodes and their edges to the graph
                    var elements = cy.add(_.union(data.nodes, data.edges));

                    reloadLayout();

                    // Add double tap event to all nodes (after removing them (?))
                    elements.nodes().on("doubleTap", function (event) {
                        loadNodeChildren(event.target);
                    });

                    if (fitViewport) {
                        // Fit the viewport to the initial nodes after 0.5 sec.
                        setTimeout(function () {
                            cy.fit(cy.nodes(), 30);
                        }, 500);
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
                 * Find the node that we should go "back" to. Starting from the main node and traversing the graph until
                 * we find a node that has > 1 outgoing edges, return the last one with 1 outgoing edge.
                 * @returns {*} Cytoscape.js node
                 */
                var getBackNode = function () {
                    // Start from main node, and traverse the graph until we find the last node with 1 outgoing edge.
                    var currNode = cy.$id(mainNodeId);

                    // While the current node has only 1 outgoing edge, follow it
                    while (currNode.outgoers("node").length === 1) {
                        currNode = _.first(currNode.outgoers("node"));
                    }

                    if (currNode.outgoers("node").length > 1) {
                        if (currNode.incomers("node").length === 1) {
                            currNode = _.first(currNode.incomers("node"));
                        } else {
                            // No node was found with no children, do nothing
                            currNode = null;
                        }
                    }

                    return currNode;
                };

                /**
                 * Navigate "back" from the current Graph state (same action as "navigating up" from the last node that
                 * was opened)
                 */
                scope.navigateBack = function () {
                    // Find which node we should go "back" to
                    var currNode = getBackNode();

                    // If a node was found to open, open it.
                    if (!_.isNull(currNode)) {
                        if (currNode.data().numberOfItems < scope.childrenListThreshold) {
                            // Not a lot of nodes, open the node normally
                            loadNodeChildren(currNode);
                        } else {
                            // The node has too many child nodes, so we remove its current children
                            removeAllChildNodes(currNode);

                            // Load the children of its parent node
                            var parentNodes = currNode.incomers("node");
                            if (parentNodes.length === 1) {
                                loadNodeChildren(_.first(parentNodes));
                            }

                            // And finally "click" the node to show its children in the child list.
                            nodeClickHandler({
                                target: currNode
                            });
                        }
                    }
                };

                /**
                 * Get the children of the given node from the API, and add them to the graph. If the node already has
                 * the correct amount of children "close" it and navigate to the upper graph level.
                 * @param node  Node to load children for
                 */
                var loadNodeChildren = function (node) {
                    var targetNodeData = node.data();

                    // Only load children if the target node has children, and they are less than the threshold
                    if (_.has(targetNodeData, "numberOfItems") && targetNodeData.numberOfItems < scope.childrenListThreshold) {
                        // Get nodes & edges coming OUT from the clicked node
                        var outgoers = node.outgoers("node");

                        if (outgoers.length < targetNodeData.numberOfItems) {
                            // The node does not have children loaded, so load them
                            Graph.getData(node.id(), lang)
                                .then(function (data) {
                                    addDataToGraph(data, false);

                                    // Get each node's depth
                                    var nodeDepths = getNodeDepths();

                                    // Check if there are any nodes that we should remove, based on the max depth
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
                                                // Remove the node's children (if any)
                                                removeAllChildNodes(cy.getElementById(nodeId));

                                                // Remove the node
                                                cy.remove("[id='" + nodeId + "']");
                                            }
                                        }
                                    });

                                    // To enable or disable the "Back" button, check if there is a node that we can go "back" to.
                                    scope.showBackBtn = !_.isNull(getBackNode());
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

                            // To enable or disable the "Back" button, check if there is a node that we can go "back" to.
                            scope.showBackBtn = !_.isNull(getBackNode());
                        }
                    } else if (_.has(targetNodeData, "numberOfItems")) {
                        // Unselect previously clicked node
                        cy.getElementById(scope.clickedNode.id).unselect();

                        // Select new node
                        nodeClickHandler({
                            target: node
                        });
                    }
                };

                /**
                 * Get the data of a node and return its label
                 * @param nodeData      Data of a node (from the API)
                 * @returns {string}    Node name
                 */
                var getNodeName = function (nodeData) {
                    return (nodeData.label.length > 0) ? (nodeData.label + ": " + nodeData.value) : nodeData.value;
                };

                /**
                 * Show a node's info in the Info Panel
                 * @param event
                 */
                var nodeClickHandler = function (event) {
                    // Run in $timeout so the scope changes with be reflected
                    $timeout(function () {
                        var data = event.target.data();
                        var newName = getNodeName(data);

                        // Check if we should hide the node children table
                        if (!_.isUndefined(scope.clickedNode) && scope.clickedNode.name !== newName) {
                            scope.showInfoPanel = false;
                        }

                        // Add clicked node data to scope
                        scope.clickedNode = {
                            id: event.target.id(),
                            name: newName,
                            icon: iconPath + data.icon,
                            numberOfItems: data.numberOfItems,
                            iconStyle: {
                                "background-color": data.bgcolor
                            }
                        };

                        scope.showNodeInfo = true;

                        // If the node contains more children than the threshold, load their names & IDs
                        if (data.numberOfItems > scope.childrenListThreshold) {
                            Graph.getData(event.target.id(), lang).then(function (response) {
                                scope.clickedNode.childrenData = _.chain(response.nodes)
                                    .pluck("data")
                                    .map(function (data) {
                                        // Keep name, id and icon
                                        data.full_label = getNodeName(data);
                                        return data;
                                    })
                                    .value();
                            });
                        }

                        // Refresh info component
                        scope.showNodeInfoComponent = false;
                        $timeout(function () {
                            scope.showNodeInfoComponent = true;
                        });
                    });
                };

                /**
                 * Add the given children node to the graph, and load its children.
                 * (called when a node's child is clicked from the info panel list)
                 * @param nodeData  Data for a node
                 */
                scope.openChildNode = function (nodeData) {
                    // The single node to add
                    var node = {
                        group: "nodes",
                        data: _.omit(nodeData, "$$hashKey", "full_label")
                    };

                    // Add node & edge from the node to its parent (the currently clicked node) to the graph
                    addDataToGraph({
                        nodes: [node],
                        edges: [Graph.createEdge(scope.clickedNode.id, node)]
                    }, false);

                    // "Open" the node
                    loadNodeChildren(cy.getElementById(nodeData.id));
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
                            },
                            {
                                selector: "edge",
                                style: {
                                    "label": "data(label)",
                                    "text-rotation": "autorotate",
                                    "text-outline-color": "white",
                                    "text-outline-width": "2",
                                    "line-color": "data(bgcolor)"
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

                    // Set max zoom
                    cy.maxZoom(1.25);

                    // Add initial data
                    Graph.setMainNodeId(mainNodeId);
                    Graph.getData(mainNodeId, lang)
                        .then(function (data) {
                            addDataToGraph(data, true);
                        });
                };

                // Load cytoscape if not loaded already and create the graph
                if (typeof cytoscape === "undefined") {
                    $ocLazyLoad.load({
                        files: [
                            Data.templatePath + "lib/cytoscape/cytoscape.min.js",
                            Data.templatePath + "lib/cytoscape/dagre.min.js",
                            Data.templatePath + "lib/cytoscape/cytoscape-dagre.js",
                            Data.templatePath + "lib/cytoscape/cola.min.js",
                            Data.templatePath + "lib/cytoscape/cytoscape-cola.js"
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
