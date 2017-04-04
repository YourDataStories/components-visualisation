/**
 * Directive for tree dropdown used for selection
 */
angular.module("yds").directive("ydsTree", [
    function () {
        return {
            restrict: "E",
            scope: {
                nodes: "@",         // List of nodes to display in the tree (stringified JSON for angular-tree-widget)
                selectedNode: "=",  // Selected node will be kept in this variable
                placeholder: "@"    // Placeholder text for the dropdown
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/tree-dropdown.html",
            link: function (scope) {
                // If there is a problem with the placeholder, set default value
                if (_.isUndefined(scope.placeholder) || scope.placeholder.trim().length == 0) {
                    scope.placeholder = "Make a selection";
                }

                // Get actual nodes as object from the stringified attribute
                scope.treeNodes = angular.fromJson(scope.nodes);

                // Set tree options
                scope.options = {
                    expandOnClick: true,
                    multipleSelection: false,
                    showIcons: false
                };

                // Watch for selection change, and save the selected node to the scope
                scope.$on('selection-changed', function (e, node) {
                    //node = selected node in tree
                    scope.selectedNode = node;
                });
            }
        }
    }
]);
