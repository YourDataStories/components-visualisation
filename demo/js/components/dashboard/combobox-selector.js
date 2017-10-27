angular.module("yds").directive("ydsComboboxSelector", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                title: "@",         // Title
                type: "@",          // Field facet
                dashboardId: "@",   // ID to use for saving the value in DashboardService
                selectionType: "@"  // Selection type for DashboardService
            },
            templateUrl: Data.templatePath + "templates/dashboard/combobox-selector.html",
            link: function (scope, element, attrs) {
                var selectivityContainer = _.first(angular.element(element[0].querySelector(".selectivity-container")));

                var type = scope.type;
                var dashboardId = scope.dashboardId;
                var selectionType = scope.selectionType;

                // Check if dashboardId attribute is defined, else assign default value
                if (_.isUndefined(dashboardId) || dashboardId.length === 0)
                    dashboardId = "default";

                scope.selection = "";

                // Set query depending on selection type
                var query = "*";
                if (selectionType === "trafficobservation.vehicle_type") {
                    query = "type:TrafficObservation AND -vehicleType.label.en:Total AND -vehicleType.label.en:MC " +
                        "AND -vehicleType.label.en:\"LGV/PSV 2Axle\" AND -vehicleType.label.en:\"M'Cycle \& P'Cycle\"" +
                        " AND -vehicleType.label.en:\"OGV1/PSV 3Axle\" AND -vehicleType.label.en:PC " +
                        "AND -vehicleType.label.en:OGV1 AND -vehicleType.label.en:OGV2 AND -vehicleType.label.en:PSV";
                }

                Data.getComboboxFacetItems(query, type)
                    .then(function (response) {
                        scope.selection = _.first(response);

                        var selectivity = $(selectivityContainer).selectivity({
                            items: response,
                            multiple: true,
                            placeholder: "Select " + scope.title
                        });

                        $(selectivity).on("change", function (e) {
                            var newValue = null;
                            if (e.value.length > 0) {
                                newValue = e.value.join(",");
                            }

                            scope.selectionChanged(newValue);
                        });
                    });

                /**
                 * Save the new selection to the DashboardService with the given selection type
                 * @param newSelection  New selected option
                 */
                scope.selectionChanged = function (newSelection) {
                    DashboardService.saveObject(selectionType, newSelection);
                };
            }
        };
    }
]);
