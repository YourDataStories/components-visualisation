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

                var nodeDoubleTapHandler = function (event) {
                    // Generate extra nodes & edges
                    //todo: get the new nodes from API
                    var newData = [];
                    var nodesToGenerate = 4;
                    var edgesToGenerate = 5;
                    var existingNodes = cy.nodes().length;
                    var existingEdges = cy.edges().length;

                    // Generate nodes
                    for (var nodeNum = 0; nodeNum < nodesToGenerate; nodeNum++) {
                        newData.push({
                            group: "nodes",
                            data: {
                                id: existingNodes + nodeNum,
                                name: "Node " + (existingNodes + nodeNum + 1)
                            }
                        });
                    }

                    // Generate edges
                    var newNodesMaxId = existingNodes + nodesToGenerate - 1;
                    var newNodesMinId = existingNodes;

                    for (var edgeNum = 0; edgeNum < edgesToGenerate; edgeNum++) {
                        newData.push({
                            group: "edges",
                            data: {
                                id: "edge" + (existingEdges + edgeNum + 1),
                                name: "Edge " + (existingEdges + edgeNum + 1),
                                source: Math.floor(Math.random() * (newNodesMaxId - newNodesMinId + 1)) + newNodesMinId,
                                target: Math.floor(Math.random() * (newNodesMaxId - newNodesMinId + 1)) + newNodesMinId
                            }
                        });
                    }

                    // Create edge that connects the clicked node with one of the new nodes
                    newData.push({
                        group: "edges",
                        data: {
                            id: "edge" + (existingEdges + edgesToGenerate + 1),
                            name: "Edge " + (existingEdges + edgesToGenerate + 1),
                            source: parseInt(event.cyTarget.id()),  // Double-tapped node ID
                            target: Math.floor(Math.random() * (newNodesMaxId - newNodesMinId + 1)) + newNodesMinId
                        }
                    });

                    // Add new nodes and edges to the graph
                    var newElements = cy.add(newData);

                    // Add qtip and double click event to the new nodes
                    newElements.nodes().qtip(qtipConfig);
                    newElements.nodes().on("doubleTap", nodeDoubleTapHandler);
                };

                /**
                 * Create the graph
                 */
                var createGraph = function () {
                    // Get data
                    //todo: get real data
                    var data = {
                        nodes: [
                            {
                                data: {
                                    id: 0,
                                    name: "Node 1",
                                    icon: "\uf19c"
                                }
                            },
                            {
                                data: {
                                    id: 1,
                                    name: "Node 2",
                                    icon: "\uf15b"
                                }
                            },
                            {
                                data: {
                                    id: 2,
                                    name: "Node 3",
                                    icon: "\uf0e7"
                                }
                            }
                        ],
                        edges: [
                            {
                                data: {
                                    id: "edge1",
                                    name: "Edge 1",
                                    source: 0, target: 1
                                }
                            }, {
                                data: {
                                    id: "edge2",
                                    name: "Edge 2",
                                    source: 1, target: 2
                                }
                            }
                        ]
                    };

                    // Create graph
                    cy = cytoscape({
                        container: graphContainer,
                        elements: data,
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
                                "font-family": "Sans-Serif",
                                "text-valign": "center",
                                "text-halign": "right",
                                "border-width": "1",
                                "border-color": "#707070",
                                "background-image": "img/1497125843_bookshelf.svg", // test icon from: https://www.iconfinder.com/icons/1055107/books_bookshelf_library_icon#size=128
                                "background-fit": "contain",
                                "background-width-relative-to": "inner",
                                "background-height-relative-to": "inner"
                            })
                            .selector(":selected")
                            .css({
                                "background-color": "#0089ff"
                            }),
                        layout: {
                            name: "cola",
                            animate: true,
                            infinite: true,
                            fit: false,
                            nodeSpacing: 40
                        }
                    });

                    // Add qtips to the graph nodes for getting more information
                    cy.nodes().qtip(qtipConfig);

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

                    // Set double click event handler (to load more graph nodes)
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
