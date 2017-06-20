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
                        value: "Βελτίωση οδού σύνδεσης Κομοτηνής - Καρυδιάς Ν. Ροδόπη",
                        icon: "road.svg",
                        bgcolor: "#00b2c2"
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "budget",
                        label: "Budget: €978K",
                        value: "€978K",
                        icon: "money.svg",
                        bgcolor: "#00a902"
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "subprojects",
                        label: "Subprojects",
                        value: "Subprojects",
                        icon: "folder.svg",
                        bgcolor: "#004184",
                        numberOfItems: 4
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "financial_decisions",
                        label: "Financial Decisions",
                        value: "Financial Decisions",
                        icon: "credit-card-alt.svg",
                        bgcolor: "#e67100",
                        numberOfItems: numOfFinancialDecisions
                    }
                }
            ],
            "subprojects": [
                {
                    data: {
                        id: "subproject1",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ",
                        value: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ",
                        icon: "folder.svg",
                        bgcolor: "#0081c2",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject2",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 2",
                        value: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 2",
                        icon: "folder.svg",
                        bgcolor: "#0081c2",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject3",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 3",
                        value: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 3",
                        icon: "folder.svg",
                        bgcolor: "#0081c2",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject4",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 4",
                        value: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 4",
                        icon: "folder.svg",
                        bgcolor: "#0081c2",
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
                        value: "ΓΡΑΜΜΑΤΙΚΟΠΟΥΛΟΣ ΑΝΩΝΥΜΗ ΤΕΧΝΙΚΗ ΕΤΑΙΡΙΑ",
                        icon: "user.svg",
                        bgcolor: "#7c00e7"
                    }
                }, {
                    data: {
                        id: subprojectId + "_startDate",
                        label: "Start: 22/12/2010",
                        value: "22/12/2010",
                        icon: "calendar.svg",
                        bgcolor: "#c2000e"
                    }
                }, {
                    data: {
                        id: subprojectId + "_endDate",
                        label: "End: 30/07/2014",
                        value: "30/07/2014",
                        icon: "calendar.svg",
                        bgcolor: "#c2000e"
                    }
                }, {
                    data: {
                        id: subprojectId + "_Budget",
                        label: "Budget: €977,914.00",
                        value: "€977,914.00",
                        icon: "money.svg",
                        bgcolor: "#00a902"
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
                    value: "Financial Decision #" + (i + 1),
                    icon: "credit-card-alt.svg",
                    bgcolor: "#e67100",
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
                        value: "ΠΑΠΑΤΖΙΚΟΥ ΕΛΕΝΗ ΓΕΩΡΓΙΟΣ",
                        icon: "user.svg",
                        bgcolor: "#7c00e7"
                    }
                }, {
                    data: {
                        id: decisionId + "_buyer",
                        label: "Buyer: ΔΗΜΟΣ ΝΑΞΟΥ ΚΑΙ ΜΙΚΡΩΝ ΚΥΚΛΑΔΩΝ",
                        value: "ΔΗΜΟΣ ΝΑΞΟΥ ΚΑΙ ΜΙΚΡΩΝ ΚΥΚΛΑΔΩΝ",
                        icon: "user.svg",
                        bgcolor: "#c900e7"
                    }
                }, {
                    data: {
                        id: decisionId + "_date",
                        label: "Date: 19/05/2014",
                        value: "19/05/2014",
                        icon: "calendar.svg",
                        bgcolor: "#c2000e"
                    }
                }, {
                    data: {
                        id: decisionId + "_amount",
                        label: "Amount: €9,901.50",
                        value: "€9,901.50",
                        icon: "money.svg",
                        bgcolor: "#00a902"
                    }
                }, {
                    data: {
                        id: decisionId + "_type",
                        label: "Type: ΕΓΚΡΙΣΗ ΔΑΠΑΝΗΣ",
                        value: "ΕΓΚΡΙΣΗ ΔΑΠΑΝΗΣ",
                        icon: "question.svg",
                        bgcolor: "#00c5cf"
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

        var getDataMultiple = function (idArray) {
            var deferred = $q.defer();

            // Gather the data for every given ID
            var data = _.chain(fakeData)
                .pick(idArray)
                .map(function (item) {
                    return _.pluck(_.pluck(item, "data"), "value");
                })
                .value();

            deferred.resolve(data);

            return deferred.promise;
        };

        return {
            getData: getData,
            getDataMultiple: getDataMultiple
        };
    }
]);
