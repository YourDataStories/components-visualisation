angular.module('yds').directive('ydsRating', ['$compile', 'Data', 'Filters', function($compile, Data, Filters) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var enableRating = scope.enableRating;

            // Check that the rating is enabled before continuing
            if (_.isUndefined(enableRating) || enableRating != "true") {
                // console.warn("Ratings not enabled...");
                return false;
            }

            var elementClass = attrs.class;
            var visualisationType = "";
            var defaultVisTypes = ["pie", "line", "scatter", "bubble", "bar", "tree", "map", "grid"];

            // Set default language if it's not defined
            if (_.isUndefined(lang) || lang.trim().length == 0) {
                lang = "en";
            }

            // Find the visualisation type from its class
            if (!_.isUndefined(elementClass) && elementClass.trim().length > 0) {
                var visTypeFound = false;

                var visTypesLen = defaultVisTypes.length;
                for (var i = 0; i < visTypesLen; i++) {
                    var index = elementClass.indexOf(defaultVisTypes[i]);

                    if (index != -1) {
                        visualisationType = defaultVisTypes[i];
                        visTypeFound = true;

                        break;
                    }
                }

                if (!visTypeFound) {
                    console.error("The rating extension cannot be applied on this element!");
                    return false;
                }
            } else {
                return false;
            }

            // console.log("pId, viewtype", projectId, viewType);
        }
    }
}]);
