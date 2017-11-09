angular.module("yds").factory("Graph", ["YDS_CONSTANTS", "$http", "$q",
    function (YDS_CONSTANTS, $http, $q) {
        var mainNodeId = null;

        /**
         * Get the nodes & edges for a specific node ID.
         * @param parentId  Parent node ID
         * @param lang      Language of the graph
         * @returns {*|promise|o.promise|d|i|t} Nodes & edges for adding to the graph
         */
        var getData = function (parentId, lang) {
            var deferred = $q.defer();

            $http({
                method: "GET",
                url: "http://" + YDS_CONSTANTS.API_GRAPH_NODE,
                params: {
                    id: parentId,
                    lang: lang
                },
                headers: {"Content-Type": "application/json"}
            }).then(function (response) {
                var nodes = response.data.data;

                // Create edges from the given node to each new one
                var edges = [];
                _.each(nodes, function (item) {
                    // Prevent creating edge from the parent node to itself and from a node to the initial graph node
                    if (item.data.id !== parentId && item.data.id !== mainNodeId) {
                        edges.push(createEdge(parentId, item));
                    }
                });

                var totalData = {
                    nodes: nodes,
                    edges: edges
                };

                if (!_.isUndefined(totalData.nodes) && !_.isEmpty(totalData.nodes)) {
                    deferred.resolve(totalData);
                } else {
                    deferred.reject("No data for this node...");
                }

                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });

            return deferred.promise;
        };

        /**
         * Create an edge from the parent node (using its ID) to the target node.
         * @param parentId      Parent ID (source of edge)
         * @param targetNode    Target node (target of edge)
         * @returns {{data: {id: string, source: *, target, bgcolor: *}}}
         */
        var createEdge = function (parentId, targetNode) {
            var edge = {
                data: {
                    id: "edge_" + targetNode.data.id,
                    source: parentId,
                    target: targetNode.data.id,
                    bgcolor: targetNode.data.bgcolor
                }
            };

            // Add edge label if the target node has one
            if (_.has(targetNode.data, "edgeLabel")) {
                edge.data.label = targetNode.data.edgeLabel;
            }

            return edge;
        };

        /**
         * Get a list of the available graph layouts and their configurations
         * @returns {[*,*,*,*,*,*,*,*]} Layouts
         */
        var getLayouts = function () {
            return [
                {
                    name: "concentric",
                    spacingFactor: 1.25
                }, {
                    name: "cola",
                    animate: true,
                    infinite: true,
                    fit: false,
                    nodeSpacing: 75
                }, {
                    name: "random"
                }, {
                    name: "grid"
                }, {
                    name: "circle"
                }, {
                    name: "dagre"
                }, {
                    name: "breadthfirst"
                }, {
                    name: "cose"
                }
            ]
        };

        return {
            getData: getData,
            getLayouts: getLayouts,
            createEdge: createEdge,
            setMainNodeId: function (id) {
                mainNodeId = id;
            }
        };
    }
]);
