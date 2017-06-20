angular.module("yds").factory("Graph", ["$http", "$q",
    function ($http, $q) {
        var numOfFinancialDecisions = 50;

        // Create data
        var fakeData = {
            "main": [
                {
                    group: "nodes",
                    data: {
                        id: "main",
                        label: "Βελτίωση οδού σύνδεσης Κομοτηνής - Καρυδιάς Ν. Ροδόπη",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#00b2c2"
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "budget",
                        label: "Budget: €978K",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "subprojects",
                        label: "Subprojects",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2",
                        numberOfItems: 4
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "financial_decisions",
                        label: "Financial Decisions",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2",
                        numberOfItems: numOfFinancialDecisions
                    }
                }
            ],
            "subprojects": [
                {
                    data: {
                        id: "subproject1",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject2",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 2",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject3",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 3",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject4",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 4",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2",
                        numberOfItems: 4
                    }
                }
            ],
            "financial_decisions": []   // this is generated below
        };

        // Generate data for each subproject
        var i;
        for (i = 1; i < 5; i++) {
            var subprojectId = "subproject" + i;

            fakeData[subprojectId] = [
                {
                    data: {
                        id: subprojectId + "_seller",
                        label: "Seller: ΓΡΑΜΜΑΤΙΚΟΠΟΥΛΟΣ ΑΝΩΝΥΜΗ ΤΕΧΝΙΚΗ ΕΤΑΙΡΙΑ",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }, {
                    data: {
                        id: subprojectId + "_startDate",
                        label: "Start: 22/12/2010",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }, {
                    data: {
                        id: subprojectId + "_endDate",
                        label: "End: 30/07/2014",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }, {
                    data: {
                        id: subprojectId + "_Budget",
                        label: "Budget: €977,914.00",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }
            ];
        }

        // Generate the nodes for the financial decisions
        for (i = 0; i < numOfFinancialDecisions; i++) {
            fakeData["financial_decisions"].push({
                data: {
                    id: "financial_decision" + i,
                    label: "Financial Decision #" + (i + 1),
                    icon: "1497125843_bookshelf.svg",
                    bgcolor: "#c2c2c2",
                    numberOfItems: 5
                }
            })
        }

        // Generate data for each of the 100 financial_decisions
        for (i = 0; i < numOfFinancialDecisions; i++) {
            var decisionId = "financial_decision" + i;

            fakeData[decisionId] = [
                {
                    data: {
                        id: decisionId + "_seller",
                        label: "Seller: ΠΑΠΑΤΖΙΚΟΥ ΕΛΕΝΗ ΓΕΩΡΓΙΟΣ",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }, {
                    data: {
                        id: decisionId + "_buyer",
                        label: "Buyer: ΔΗΜΟΣ ΝΑΞΟΥ ΚΑΙ ΜΙΚΡΩΝ ΚΥΚΛΑΔΩΝ",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }, {
                    data: {
                        id: decisionId + "_date",
                        label: "Date: 19/05/2014",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }, {
                    data: {
                        id: decisionId + "_amount",
                        label: "Amount: €9,901.50",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }, {
                    data: {
                        id: decisionId + "_type",
                        label: "Type: ΕΓΚΡΙΣΗ ΔΑΠΑΝΗΣ",
                        icon: "1497125843_bookshelf.svg",
                        bgcolor: "#c2c2c2"
                    }
                }
            ];
        }

        /**
         * Get the nodes & edges for a specific node ID.
         * @param id                            Parent node ID
         * @returns {*|promise|o.promise|d|i|t} Nodes & edges for adding to the graph
         */
        var getData = function (id) {
            var deferred = $q.defer();

            var nodes = fakeData[id];

            // Create edges from the given node to each new one
            var edges = [];
            _.each(nodes, function (item) {
                if (id !== item.data.id) {  // Prevent creating edge from the main node to itself
                    edges.push({
                        data: {
                            id: "edge_" + item.data.id,
                            source: id,
                            target: item.data.id
                        }
                    });
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

            return deferred.promise;
        };

        return {
            getData: getData
        };
    }
]);
