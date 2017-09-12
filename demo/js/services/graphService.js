angular.module("yds").factory("Graph", ["YDS_CONSTANTS", "$http", "$q",
    function (YDS_CONSTANTS, $http, $q) {
        /**
         * Get the nodes & edges for a specific node ID.
         * @param id                            Parent node ID
         * @param lang                          Language of the graph
         * @returns {*|promise|o.promise|d|i|t} Nodes & edges for adding to the graph
         */
        var getData = function (id, lang) {
            var deferred = $q.defer();

            // var nodes = fakeData[id];
            $http({
                method: "GET",
                url: "http://" + YDS_CONSTANTS.API_GRAPH_NODE,
                params: {
                    id: id,
                    lang: lang
                },
                headers: {"Content-Type": "application/json"}
            }).then(function (response) {
                var nodes = response.data.data;

                // Create edges from the given node to each new one
                var edges = [];
                _.each(nodes, function (item) {
                    if (id !== item.data.id) {  // Prevent creating edge from the main node to itself
                        var edge = {
                            data: {
                                id: "edge_" + item.data.id,
                                source: id,
                                target: item.data.id,
                                bgcolor: item.data.bgcolor
                            }
                        };

                        // Add edge label if the parent node has one
                        if (_.has(item.data, "edgeLabel")) {
                            edge.data.label = item.data.edgeLabel;
                            console.log(edge.data);
                        }

                        edges.push(edge);
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
         * Get data for multiple node IDs, and turn them into a grid format
         * @param idArray   Array with node IDs to get data for
         * @param lang      Language of data
         */
        var getDataMultiple = function (idArray, lang) {
            var deferred = $q.defer();

            // Gather the data for every given ID
            var promises = idArray.map(function (id) {
                return getData(id, lang);
            });

            $q.all(promises).then(function (response) {
                var data = response.map(function (item) {
                    return _.pluck(_.pluck(item.nodes, "data"), "value");
                });

                // Gather the table headers, assuming that all nodes have the same values in them
                var sampleNodes = response[_.first(idArray)];
                var labels = _.pluck(_.pluck(sampleNodes, "data"), "label");

                deferred.resolve({
                    data: data,
                    view: labels
                });
            });

            return deferred.promise;
        };

        /**
         * Get a list of the available graph layouts and their configurations
         * @returns {[*,*,*,*,*,*,*,*]} Layouts
         */
        var getLayouts = function () {
            return [
                {
                    name: "concentric"
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
            getDataMultiple: getDataMultiple,
            getLayouts: getLayouts
        };
    }
]);
