angular.module('yds').directive('ydsRating', ['$templateRequest', '$compile', '$location', 'Data', 'Basket',
    function ($templateRequest, $compile, $location, Data, Basket) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                // Check that the rating is enabled before continuing
                var enableRating = scope.enableRating;

                if (_.isUndefined(enableRating) || enableRating != "true") {
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
                    }
                } else {
                    return false;
                }

                // Get user ID from Basket service
                var userId = Basket.getUserId();
                if (_.isUndefined(userId) || userId.trim().length == 0) {
                    console.warn("Username not set: using default \"ydsUser\"");
                    userId = "ydsUser";
                }

                // Add rating buttons to the chart
                $templateRequest(Data.templatePath + "templates/chart-buttons/rating-buttons.html").then(function (html) {
                    var template = angular.element(html);

                    // Compile the element
                    var compiledTemplate = $compile(template)(scope);

                    // Add element as a child to the parent
                    element.parent().append(compiledTemplate);
                });

                /**
                 * Rate the chart with the specified number of stars
                 * @param stars Number of stars to give to the chart
                 */
                scope.rateChart = function (stars) {
                    // If number of stars is undefined or not a number, abort
                    if (_.isUndefined(stars) || !_.isNumber(stars)) {
                        return;
                    }

                    // Get parameters that were used to create the chart and the rating
                    var chartParams = {
                        chart_type: visualisationType,
                        page_url: $location.absUrl(),
                        project_id: projectId,
                        view_type: viewType,
                        extra_params: _.isEmpty(scope.extraParams) ? undefined : JSON.stringify(scope.extraParams),
                        lang: lang,
                        user_id: userId,
                        rating: stars
                    };

                    // Save rating
                    Data.saveRating(chartParams);
                };
            }
        }
    }
]);
