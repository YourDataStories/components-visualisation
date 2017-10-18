/**
 * Directive for tree dropdown used for selection
 */
angular.module("yds").directive("ydsTree", ["Data",
    function (Data) {
        return {
            restrict: "E",
            scope: {
                nodes: "@",         // List of nodes to display in the tree (stringified JSON for angular-tree-widget)
                selectedNode: "=",  // Selected node will be kept in this variable
                placeholder: "@"    // Placeholder text for the dropdown
            },
            templateUrl: Data.templatePath + "templates/workbench/tree-dropdown.html",
            link: function (scope) {
                // If there is a problem with the placeholder, set default value
                if (_.isUndefined(scope.placeholder) || scope.placeholder.trim().length === 0) {
                    scope.placeholder = "Make a selection";
                }

                // Get actual nodes as object from the stringified attribute
                scope.treeNodes = angular.fromJson(scope.nodes);

                /**
                 * Add suggested badges to nodes which have a "suggested" property equal to true.
                 * Supports nested nodes like the angular-tree-widget.
                 * @param nodes
                 */
                var addBadgesToSuggestedNodes = function (nodes) {
                    _.each(nodes, function (axis) {
                        if (_.has(axis.children) && _.isArray(axis.children)) {
                            // Call self recursively because this has children
                            addBadgesToSuggestedNodes(axis.children);
                        }

                        if (_.has(axis, "suggested") && axis.suggested === true) {
                            axis.badge = {
                                "type": "label-success",
                                "title": "Suggested"
                            };
                        }
                    });
                };

                // Add badges to the suggested axes
                addBadgesToSuggestedNodes(scope.treeNodes);

                // Set tree options
                scope.options = {
                    expandOnClick: true,
                    multipleSelection: false,
                    showIcons: false
                };

                // Watch for selection change, and save the selected node to the scope
                scope.$on('selection-changed', function (e, node) {
                    // Update the selected node in the scope
                    scope.selectedNode = node;

                    // Close the dropdown
                    scope.dropdownOpen = false;
                });
            }
        }
    }
]);
