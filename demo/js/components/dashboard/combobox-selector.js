angular.module("yds").directive("ydsComboboxSelector", ["$timeout", "DashboardService", "Data",
    function ($timeout, DashboardService, Data) {
        return {
            restrict: "E",
            scope: {
                title: "@",         // Title
                type: "@",          // Field facet
                selectionType: "@"  // Selection type for DashboardService
            },
            templateUrl: Data.templatePath + "templates/dashboard/combobox-selector.html",
            link: function (scope, element, attrs) {
                var selectivityContainer = _.first(angular.element(element[0].querySelector(".selectivity-container")));

                var type = scope.type;
                var selectionType = scope.selectionType;


                Data.getComboboxFacetItems("*", type)
                    .then(function (response) {
                        // Check if there is a saved selection in the cookies, and use that as default
                        var defaultSelection = null;
                        var cookieValue = DashboardService.getCookieObject(selectionType);
                        if (!_.isUndefined(cookieValue)) {
                            defaultSelection = cookieValue.split(",");
                        }

                        // Create selectivity menu
                        var selectivity = $(selectivityContainer).selectivity({
                            items: response,
                            multiple: true,
                            value: defaultSelection,
                            placeholder: "Select " + scope.title
                        });

                        // Listen for selectivity selection change events
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
