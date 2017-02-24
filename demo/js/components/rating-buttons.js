angular.module('yds').directive('ydsRating', ['$templateRequest', '$compile', '$location', 'Data', 'Filters',
    function ($templateRequest, $compile, $location, Data, Filters) {
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

                    // Add start items to scope
                    scope.ratingBtns = [
                        {btnIconFill: false},
                        {btnIconFill: false},
                        {btnIconFill: false}
                    ];
                });

                /**
                 * Make rating (star) buttons filled when the mouse is over one of them, or make them empty
                 * when the mouse leaves the buttons
                 * @param btnIndex      Button index
                 * @param mouseOnButton True if mouse entered the button, or false if it left
                 */
                scope.mouseOverHandler = function (btnIndex, mouseOnButton) {
                    if (!mouseOnButton) {
                        // Make all buttons empty
                        _.each(scope.ratingBtns, function (btn) {
                            btn.btnIconFill = false
                        });
                    } else {
                        // Fill the buttons with index <= btnIndex
                        var btnsToEnable = btnIndex + 1;

                        for (var i = 0; i < btnsToEnable; i++) {
                            scope.ratingBtns[i].btnIconFill = true;
                        }
                    }
                };

                /**
                 * Rate the chart with the specified number of stars
                 * @param stars Number of stars to give to the chart
                 */
                scope.rateChart = function (stars) {
                    console.log("Chart rating: " + stars + " stars");

                    // Get parameters that were used to create the chart
                    var chartParams = {
                        chartType: visualisationType,
                        pageUrl: $location.absUrl(),
                        projectId: projectId,
                        viewType: viewType,
                        extraParams: scope.extraParams,
                        lang: lang
                    };

                    // Remove undefined values from the object
                    chartParams = _.omit(chartParams, function (value) {
                        return _.isUndefined(value);
                    });

                    console.log("Chart parameters:", chartParams);
                }
            }
        }
    }
]);
