angular.module("yds").directive("ydsExplanation", ["$templateRequest", "$compile", "$location", "Data", "Basket",
    function ($templateRequest, $compile, $location, Data, Basket) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                // Get the possible attributes for any chart
                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var lang = scope.lang;

                var elementClass = attrs.class;
                var visualisationType = "";
                var defaultVisTypes = ["pie", "line", "scatter", "bubble", "bar", "tree", "map", "grid"];

                // Set default language if it's not defined
                if (_.isUndefined(lang) || lang.trim().length === 0) {
                    lang = "en";
                }

                // Find the visualisation type from its class
                if (!_.isUndefined(elementClass) && elementClass.trim().length > 0) {
                    var visTypeFound = false;

                    var visTypesLen = defaultVisTypes.length;
                    for (var i = 0; i < visTypesLen; i++) {
                        var index = elementClass.indexOf(defaultVisTypes[i]);

                        if (index !== -1) {
                            visualisationType = defaultVisTypes[i];
                            visTypeFound = true;

                            break;
                        }
                    }

                    if (!visTypeFound) {
                        console.error("The explanation button cannot be applied on this element!");
                        return false;
                    }
                } else {
                    return false;
                }

                // Add rating buttons to the chart
                $templateRequest("templates/explanation-button.html").then(function (html) {
                    var template = angular.element(html);

                    // Compile the element
                    var compiledTemplate = $compile(template)(scope);

                    // Position this element
                    var yPosition = _.first(element.parent()).offsetWidth / 2;
                    compiledTemplate.css("left", yPosition + "px");
                    console.log(compiledTemplate);

                    // Add element as a child to the parent
                    element.parent().append(compiledTemplate);
                });
            }
        }
    }
]);
