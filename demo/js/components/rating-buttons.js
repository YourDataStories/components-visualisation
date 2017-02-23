angular.module('yds').directive('ydsRating', ['$templateRequest', '$compile', 'Data', 'Filters',
    function ($templateRequest, $compile, Data, Filters) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                // Check that the rating is enabled before continuing
                var enableRating = scope.enableRating;

                if (_.isUndefined(enableRating) || enableRating != "true") {
                    // console.warn("Ratings not enabled...");
                    return false;
                }

                // Get the possible attributes for any chart
                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var lang = scope.lang;

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
                    } else {
                        console.log("Visualisation type found: " + visualisationType);
                    }
                } else {
                    return false;
                }

                // Add rating buttons to the chart
                var ratingBtnX = scope.ratingBtnX || 100;
                var ratingBtnY = scope.ratingBtnY || 15;

                $templateRequest("templates/rating-buttons.html").then(function (html) {
                    var template = angular.element(html);

                    // Compile the element
                    var compiledTemplate = $compile(template)(scope);
                    compiledTemplate.css("top", ratingBtnY + "px");
                    compiledTemplate.css("left", ratingBtnX + "px");


                    // Add element as a child to the parent
                    element.parent().append(compiledTemplate);
                });

                // console.log("pId, viewtype", projectId, viewType);
            }
        }
    }
]);
