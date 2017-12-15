angular.module("yds").directive("ydsEmbed", ["$compile", "Data", "Filters", function ($compile, Data, Filters) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            var projectId = scope.projectId;
            var viewType = scope.viewType;

            var elementClass = attrs.class;
            var embedCode = "";
            var visualisationType = "";
            var defaultVisTypes = ["pie", "line", "scatter", "bubble", "bar", "tree", "map", "grid"];

            // Check if the element has one of the accepted IDs: "pie-container", "line-container", "bar-container", "map-container" etc.
            if (!_.isUndefined(elementClass) && elementClass !== "") {
                var visTypeFound = false;

                for (var i = 0; i < defaultVisTypes.length; i++) {				//check if the main element is a valid yds container
                    var visTypeIndex = elementClass.indexOf(defaultVisTypes[i]);

                    // If the one of the defaultVisTypes exist in the element id, get the visualisation type
                    if (visTypeIndex > -1) {
                        visualisationType = defaultVisTypes[i];
                        visTypeFound = true;
                        break;
                    }
                }

                if (!visTypeFound) {
                    console.error("The embed extension cannot be applied on the selected element");
                    return false;
                }
            } else {
                return false;
            }

            // If projectId or viewType attribute is undefined, stop the execution of the directive
            if (_.isUndefined(projectId) || (_.isUndefined(viewType) && visualisationType !== "map")) {
                scope.embeddable = false;
                return false;
            }

            // Check if the user has enabled the embedding of the selected element
            var embeddable = scope.embeddable;

            if (!_.isUndefined(embeddable) && embeddable === "true") {
                if (!_.isUndefined(projectId)) {
                    var popoverPos = scope.popoverPos;		// Indicates the position of the popover
                    var defaultPos = ["top", "bottom", "left", "right"];

                    // If popover position is undefined assign the default value
                    if (_.isUndefined(popoverPos) || _.indexOf(defaultPos, popoverPos) === -1)
                        popoverPos = "right";

                    scope.popoverOpen = false;    // Flag that indicates if the embed tooltip is shown
                    scope.popover = {
                        content: "",
                        templateUrl: Data.templatePath + "templates/embed-popover.html",
                        title: "Embed Code"
                    };

                    var embedBtnTemplate = "<button type='button' " +
                        "class='btn btn-default btn-xs embed-btn' " +
                        "ng-click='requestEmbed(this)' " +
                        "popover-trigger='none' " +
                        "popover-is-open='popoverOpen' " +
                        "popover-placement='" + popoverPos + "' " +
                        "uib-popover-template='popover.templateUrl'>" +
                        "<span class='glyphicon glyphicon-log-in' aria-hidden='true'></span>" +
                        "</button>";

                    // Compile the embed button and append it to the element's container
                    var compiledTemplate = $compile(embedBtnTemplate)(scope);
                    compiledTemplate.css("z-index", 999);
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

            scope.requestEmbed = function () {
                if (embedCode === "") {          // If the request code doesn't exist
                    var facets = [{
                        facet_values: Filters.get(element[0].id).map(function (f) {
                            return JSON.stringify(f.attrs);
                        })
                    }];
                    var lang = (scope.lang || "en");	// If scope.lang is undefined, use English

                    Data.requestEmbedCode(projectId, facets, visualisationType, viewType, lang)
                        .then(function (response) {
                            embedCode = response.generated_hash;
                            scope.popover.content = "<iframe src=\"" +
                                "http://ydsdev.iit.demokritos.gr/YDSComponents/#!/embed/" + embedCode +
                                "\" style=\"width: 600px; height: 300px\">" +
                                "<p>Your browser does not support iframes.</p>" +
                                "</iframe>";
                            scope.popoverOpen = true;
                        }, function (error) {
                            console.log("Request embed code error:", error);
                        });
                } else {
                    scope.popoverOpen = !scope.popoverOpen;
                }
            };
        }
    }
}]);
