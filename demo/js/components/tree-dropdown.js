/**
 * Directive for tree dropdown used for selection
 */
angular.module("yds").directive("ydsTree", [
    function () {
        return {
            restrict: "E",
            scope: {
                nodes: "=",
                placeholder: "@"
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/tree-dropdown.html",
            link: function (scope) {
                // If there is a problem with the placeholder, set default value
                if (_.isUndefined(scope.placeholder) || scope.placeholder.trim().length == 0) {
                    scope.placeholder = "Make a selection";
                }

                // Set tree options
                scope.options = {
                    expandOnClick: true,
                    multipleSelection: false,
                    showIcons: false
                };
            }
        }
    }
]);
