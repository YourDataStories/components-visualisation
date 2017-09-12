angular.module("yds").directive("ydsExplanation", ["$templateRequest", "$compile", "$window", "$location", "YDS_CONSTANTS",
    function ($templateRequest, $compile, $window, $location, YDS_CONSTANTS) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                // Get the possible attributes for any chart
                var attributes = _.extend({
                    id: scope.projectId,
                    viewType: scope.viewType,
                    lang: scope.lang
                }, scope.extraParams);

                var elementClass = attrs.class;
                var visualisationType = "";
                var defaultVisTypes = ["pie", "line", "scatter", "bubble", "bar", "tree", "map", "grid"];

                // Set default language if it's not defined
                if (_.isUndefined(attributes.lang) || attributes.lang.trim().length === 0) {
                    attributes.lang = "en";
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

                    // Add element as a child to the parent
                    element.parent().append(compiledTemplate);
                });

                /**
                 * Go to the Data Analysis page for this chart
                 */
                scope.viewDataAnalysis = function () {
                    // Generate the URL for the data analysis page
                    var dataAnalysisUrl = YDS_CONSTANTS.DATA_ANALYSIS_URL
                        + "?chart=" + visualisationType;

                    _.each(attributes, function (attrValue, attrKey) {
                        // Add attribute to the URL
                        if (!_.isUndefined(attrValue) && !_.isNull(attrValue)) {
                            dataAnalysisUrl += "&" + attrKey + "=" + encodeURIComponent(attrValue);
                        }
                    });

                    // Redirect to the URL
                    $window.location.href = dataAnalysisUrl;
                }
            }
        }
    }
]);
