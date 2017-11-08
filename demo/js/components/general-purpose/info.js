angular.module("yds").directive("ydsInfo", ["Data", "Translations", "$sce", function (Data, Translations, $sce) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",     // ID of the project that the data belong
            viewType: "@",      // Type of the info object
            lang: "@",          // Lang of the visualised data
            labelColWidth: "@", // Width of the labels column (1-11, using bootstrap's grid)
            vertical: "@",      // If true, the info component will have a vertical layout
            extraParams: "="    // Extra parameters to send with API call
        },
        templateUrl: Data.templatePath + "templates/general-purpose/info.html",
        link: function (scope) {
            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var vertical = scope.vertical;
            var labelColWidth = parseInt(scope.labelColWidth);
            var extraParams = scope.extraParams;

            //check if project id or grid type are defined
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the projectId or the viewType attribute aren't configured properly. " +
                    "Please check the corresponding documentation section.";
                return false;
            }

            //check if info-type attribute is empty and assign the default value
            if (_.isUndefined(viewType) || viewType.trim() === "")
                viewType = "default";

            //check if the language attr is defined, else assign default value
            if (_.isUndefined(lang) || lang.trim() === "")
                lang = "en";

            //check if the vertical attr is defined, else assign default value
            if (_.isUndefined(vertical) || (vertical !== "true" && vertical !== "false"))
                vertical = "false";

            if (_.isUndefined(labelColWidth) || _.isNaN(labelColWidth) || labelColWidth > 11 || labelColWidth < 1) {
                labelColWidth = 4;
            }

            if (vertical !== "true") {
                // Make the label column the given width, and give the info column the remaining space
                scope.labelCol = "col-md-" + labelColWidth;
                scope.infoCol = "col-md-" + (12 - labelColWidth);
            } else {
                // In vertical layout, the labels and values take up whole rows
                scope.labelCol = "col-md-12";
                scope.infoCol = "col-md-12";
            }

            scope.info = {};
            scope.translations = {
                showMore: Translations.get(lang, "showMore"),
                showLess: Translations.get(lang, "showLess")
            };

            // View types that contain code/value pairs with HTML code
            var htmlLists = [
                "country_code_name_array",
                "point_name_array"
            ];

            Data.getProjectVis("info", projectId, viewType, lang, extraParams)
                .then(function (response) {
                    _.each(response.view, function (infoValue) {
                        if (infoValue.type === "url") {
                            scope.info[infoValue.header] = {
                                value: $sce.trustAsHtml(Data.deepObjSearch(response.data, infoValue.attribute)),
                                type: infoValue.type
                            };
                        } else if (_.contains(htmlLists, infoValue.type)) {
                            var items = Data.deepObjSearch(response.data, infoValue.attribute);

                            // Create string with all countries and their flag htmls
                            var listHtmlStr = "";
                            _.each(items, function (item) {
                                listHtmlStr += item.code + " " + item.name + ", ";
                            });

                            listHtmlStr = listHtmlStr.slice(0, -2);

                            scope.info[infoValue.header] = {
                                value: $sce.trustAsHtml(listHtmlStr),
                                type: "html_list"
                            };
                        } else {
                            scope.info[infoValue.header] = {
                                value: Data.deepObjSearch(response.data, infoValue.attribute),
                                type: infoValue.type
                            };
                        }

                        if (_.isArray(scope.info[infoValue.header].value))
                            scope.info[infoValue.header].value = scope.info[infoValue.header].value.join(", ");
                    });
                }, function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                    else
                        scope.ydsAlert = error.message;
                });
        }
    };
}]);
