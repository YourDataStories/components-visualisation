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

                //todo: load cytoscape if not loaded, else just call createGraph()

                var getData = function () {
                    return {
                        nodes: [
                            {
                                data: {
                                    id: 0,
                                    name: "Node 1",
                                    icon: "\uf15b"
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
                                    icon: "\uf15b"
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
                };

                var createGraph = function () {
                    // Get data
                    var data = getData();

                    // Create graph
                    var cy = cytoscape({
                        container: graphContainer,
                        elements: data,
                        wheelSensitivity: 0.3,
                        style: cytoscape.stylesheet()
                            .selector("node")
                            .css({
                                "text-wrap": "wrap",
                                "content": function (ele) {
                                    return ele.data("icon") + "\n" + ele.data("name");
                                },
                                "width": "label",
                                "padding": "10px",
                                "font-family": "FontAwesome, Sans-Serif",
                                "text-valign": "center",
                                "text-halign": "center"
                            })
                            .selector("edge")
                            .css({
                                "label": "data(name)"
                            }),
                        layout: {
                            name: "cose",
                            animate: true
                        }
                    });
                };

                // Create the graph
                createGraph();
            }
        };
    }
]);
