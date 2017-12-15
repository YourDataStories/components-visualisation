angular.module("yds").directive("ydsBasketBtn", ["$compile", "Data", "Basket", "Filters",
    function ($compile, Data, Basket, Filters) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                var projectId = scope.projectId;
                var viewType = scope.viewType;
                var lang = scope.lang;

                var elementClass = attrs.class;
                var visualisationType = "";
                var defaultVisTypes = ["pie", "line", "scatter", "bubble", "bar", "tree", "map", "grid", "result", "info"];

                // If projectId or viewType attribute is undefined, stop the execution of the directive
                if (_.isUndefined(projectId) || _.isUndefined(viewType)) {
                    scope.addToBasket = false;
                    return false;
                }

                // Check if the language attribute is defined, else assign default value
                if (_.isUndefined(lang))
                    lang = "en";

                // Check if the basket button can be applied to the component
                if (!_.isUndefined(elementClass) && elementClass !== "") {
                    var visTypeFound = false;

                    for (var i = 0; i < defaultVisTypes.length; i++) {				// Check if the main element is a valid yds container
                        var visTypeIndex = elementClass.indexOf(defaultVisTypes[i]);

                        // If the one of the defaultVisTypes exist in the element id, get the visualisation type
                        if (visTypeIndex > -1) {
                            visualisationType = defaultVisTypes[i];
                            visTypeFound = true;
                            break;
                        }
                    }

                    if (!visTypeFound) {
                        console.error("The basket extension cannot be applied on the selected element");
                        return false;
                    }
                } else {
                    return false;
                }

                // Check if the user has enabled the embedding of the selected element
                var enableBasket = scope.addToBasket;

                if (!_.isUndefined(enableBasket) && enableBasket === "true") {
                    if (!_.isUndefined(projectId)) {
                        var basketBtnTemplate = "<button type='button' " +
                            "class='btn btn-default btn-xs embed-btn' " +
                            "ng-click = 'openBasketModal()'>" +
                            "<i class='fa fa-shopping-basket' aria-hidden='true'></i>" +
                            "</button>";

                        // Compile the basket button and append it to the element's container
                        var compiledTemplate = $compile(basketBtnTemplate)(scope);

                        compiledTemplate.css("font-size", 11 + "px");
                        compiledTemplate.css("cursor", "pointer");

                        element.append(compiledTemplate);
                    } else {
                        console.error("The embed extension is not configured properly");
                        return false;
                    }
                } else {
                    return false;
                }

                /**
                 * Open basket modal
                 */
                scope.openBasketModal = function () {
                    var userId = Basket.getUserId();

                    if (_.isUndefined(userId) || userId.length === 0) {
                        console.error("User ID is empty! Using default \"ydsUser\" as user ID...");
                        userId = "ydsUser";
                    }

                    var basketConfig = {
                        user_id: userId,
                        lang: lang,
                        type: "Dataset",
                        component_type: visualisationType,
                        content_type: viewType,
                        component_parent_uuid: projectId,
                        filters: Filters.get(element[0].id)
                    };

                    var modalRestrictions = {
                        Dataset: true,
                        Visualisation: true
                    };

                    Basket.openModal(basketConfig, modalRestrictions);
                };
            }
        }
    }
]);
