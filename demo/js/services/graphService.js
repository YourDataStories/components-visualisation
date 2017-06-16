angular.module("yds").factory("Graph", ["$http", "$q", "YDS_CONSTANTS", "Data",
    function ($http, $q, YDS_CONSTANTS, Data) {
        // Create data
        var fakeData = {
            "main": [
                {
                    group: "nodes",
                    data: {
                        id: "title",
                        label: "Βελτίωση οδού σύνδεσης Κομοτηνής - Καρυδιάς Ν. Ροδόπη",
                        icon: ""
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "budget",
                        label: "Budget: €978K",
                        icon: ""
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "subprojects",
                        label: "Subprojects",
                        icon: "",
                        numberOfItems: 4
                    }
                }, {
                    group: "nodes",
                    data: {
                        id: "financial_decisions",
                        label: "Financial Decisions",
                        icon: "",
                        numberOfItems: 100
                    }
                }, {
                    data: {
                        id: "title_budget_edge",
                        source: "title",
                        target: "budget"
                    }
                }, {
                    data: {
                        id: "title_subprojects_edge",
                        source: "title",
                        target: "subprojects"
                    }
                }, {
                    data: {
                        id: "title_fd_edge",
                        source: "title",
                        target: "financial_decisions"
                    }
                }
            ],
            "subprojects": [
                {
                    data: {
                        id: "subproject1",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ",
                        icon: "",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject2",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 2",
                        icon: "",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject3",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 3",
                        icon: "",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "subproject4",
                        label: "ΒΕΛΤΙΩΣΗ ΟΔΟΥ ΣΥΝΔΕΣΗΣ ΚΟΜΟΤΗΝΗΣ – ΚΑΡΥΔΙΑΣ 4",
                        icon: "",
                        numberOfItems: 4
                    }
                }, {
                    data: {
                        id: "edge_subproject1",
                        source: "subprojects",
                        target: "subproject1"
                    }
                }, {
                    data: {
                        id: "edge_subproject2",
                        source: "subprojects",
                        target: "subproject2"
                    }
                }, {
                    data: {
                        id: "edge_subproject3",
                        source: "subprojects",
                        target: "subproject3"
                    }
                }, {
                    data: {
                        id: "edge_subproject4",
                        source: "subprojects",
                        target: "subproject4"
                    }
                }
            ]
        };

        // Generate data for each subproject
        for (var i = 1; i < 5; i++) {
            var subprojectId = "subproject" + i;

            var subprojectData = [
                {
                    data: {
                        id: subprojectId + "_seller",
                        label: "Seller: ΓΡΑΜΜΑΤΙΚΟΠΟΥΛΟΣ ΑΝΩΝΥΜΗ ΤΕΧΝΙΚΗ ΕΤΑΙΡΙΑ",
                        icon: ""
                    }
                }, {
                    data: {
                        id: subprojectId + "_startDate",
                        label: "Start: 22/12/2010",
                        icon: ""
                    }
                }, {
                    data: {
                        id: subprojectId + "_endDate",
                        label: "End: 30/07/2014",
                        icon: ""
                    }
                }, {
                    data: {
                        id: subprojectId + "_Budget",
                        label: "Budget: €977,914.00",
                        icon: ""
                    }
                }
            ];

            // add edges
            var edges = [];
            _.each(subprojectData, function (item) {
                edges.push({
                    data: {
                        id: "edge_" + item.data.id,
                        source: subprojectId,
                        target: item.data.id
                    }
                });
            });

            // Add the subproject's data
            fakeData[subprojectId] = _.union(subprojectData, edges);
        }

        //todo: Generate data for the 100 financial_decisions
        // var decisions = [];
        // for (var i = 0; i < 100; i++) {
        // }

        var getData = function (id) {
            return fakeData[id];
        };

        return {
            getData: getData
        };
    }
]);
