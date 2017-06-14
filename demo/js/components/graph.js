angular.module("yds").directive("ydsGraph", ["Data", "$ocLazyLoad",
    function (Data, $ocLazyLoad) {
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
                            + "<br/><strong>Node name:</strong> " + data.name;
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
                var maxNodeLevel = 0;
                var totalGeneratedNodes = 0;
                var totalGeneratedEdges = 0;

                /**
                 * Generate a number of nodes with random edges.
                 * @param nodesToGenerate   Number of nodes to generate
                 * @param edgesToGenerate   Number of edges to generate
                 */
                var newRandomNodes = function (nodesToGenerate, edgesToGenerate) {
                    var newData = [];

                    // Generate nodes
                    for (var nodeNum = 0; nodeNum < nodesToGenerate; nodeNum++) {
                        newData.push({
                            group: "nodes",
                            data: {
                                id: totalGeneratedNodes + nodeNum,
                                name: "Node " + (totalGeneratedNodes + nodeNum + 1),
                                level: maxNodeLevel
                            }
                        });
                    }

                    // Generate edges
                    var newNodesMaxId = totalGeneratedNodes + nodesToGenerate - 1;
                    var newNodesMinId = totalGeneratedNodes;

                    for (var edgeNum = 0; edgeNum < edgesToGenerate; edgeNum++) {
                        newData.push({
                            group: "edges",
                            data: {
                                id: "edge" + (totalGeneratedEdges + edgeNum + 1),
                                name: "Edge " + (totalGeneratedEdges + edgeNum + 1),
                                level: maxNodeLevel,
                                source: Math.floor(Math.random() * (newNodesMaxId - newNodesMinId + 1)) + newNodesMinId,
                                target: Math.floor(Math.random() * (newNodesMaxId - newNodesMinId + 1)) + newNodesMinId
                            }
                        });
                    }

                    // Increase level counter and total created nodes and edges counters
                    maxNodeLevel++;
                    totalGeneratedNodes += nodesToGenerate;
                    totalGeneratedEdges += edgesToGenerate;

                    return newData;
                };

                /**
                 * Get the new nodes that need to be added to the graph for the double-clicked node and add them
                 * @param event
                 */
                var nodeDoubleTapHandler = function (event) {
                    // Generate extra nodes & edges
                    //todo: get the new nodes from API
                    var newData = newRandomNodes(4, 5);

                    // Add new nodes and edges to the graph
                    var newElements = cy.add(newData);

                    // Add qtip and double click event to the new nodes
                    newElements.nodes().qtip(qtipConfig);
                    newElements.nodes().on("doubleTap", nodeDoubleTapHandler);

                    // Create new layout with all the elements
                    cy.layout().stop();
                    cy.elements().layout({
                        name: "cola",
                        animate: true,
                        infinite: true,
                        fit: false,
                        nodeSpacing: 40
                    });

                    // If there are more than 3 levels of nodes, remove the oldest one
                    if (maxNodeLevel > 3) {
                        cy.remove("[level = " + (maxNodeLevel - 4) + "]");
                    }

                    setTimeout(function () {
                        // Fit the viewport to the new nodes
                        cy.fit("node[level = " + (maxNodeLevel - 1) + "]", 40);
                    }, 500);
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
                                "label": "data(name)",
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
                        var tappedNow = event.cyTarget;
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
                    nodeDoubleTapHandler();
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
