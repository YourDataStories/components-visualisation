angular.module("yds").directive("ydsInfo", ["YDS_CONSTANTS", "Data", "Translations", "$sce", function (YDS_CONSTANTS, Data, Translations, $sce) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",     // ID of the project that the data belong
            viewType: "@",      // Type of the info object
            lang: "@",          // Lang of the visualised data
            labelColWidth: "@", // Width of the labels column (1-11, using bootstrap's grid)
            vertical: "@",      // If true, the info component will have a vertical layout
            baseUrl: "@",       // (Optional) Base URL to send to API
            extraParams: "="    // Extra parameters to send with API call
        },
        templateUrl: Data.templatePath + "templates/general-purpose/info.html",
        link: function (scope) {
            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var vertical = scope.vertical;
            var labelColWidth = parseInt(scope.labelColWidth);
            var baseUrl = scope.baseUrl;
            var extraParams = scope.extraParams;

            // Check if the project id is defined
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the projectId or the viewType attribute aren't configured properly. " +
                    "Please check the corresponding documentation section.";
                return false;
            }

            // Check if info-type attribute is empty and assign the default value
            if (_.isUndefined(viewType) || viewType.trim() === "")
                viewType = "default";

            // Check if the language attribute is defined, else assign default value
            if (_.isUndefined(lang) || lang.trim() === "")
                lang = "en";

            // Check if the vertical attribute is defined, else assign default value
            if (_.isUndefined(vertical) || (vertical !== "true" && vertical !== "false"))
                vertical = "false";

            // Check if the labelColWidth attribute is defined and valid, else assign default value
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

            // Add base URL to extraParams, if there is any
            if (!_.isUndefined(baseUrl)) {
                extraParams = _.extend({
                    baseurl: baseUrl
                }, extraParams);
            }

            Data.getProjectVis("info", projectId, viewType, lang, extraParams)
                .then(function (response) {
                    _.each(response.view, function (infoValue) {
                        if (infoValue.type === "url") {
                            // Find URL & value
                            var url = Data.deepObjSearch(response.data, infoValue.url);
                            var val = Data.deepObjSearch(response.data, infoValue.attribute);

                            if (infoValue["addbase"] === 1) {
                                // Add base URL to the data
                                url = YDS_CONSTANTS.PROJECT_DETAILS_URL + "?id=" + url + "&type=" + infoValue["urltype"];
                            }

                            scope.info[infoValue.header] = {
                                value: $sce.trustAsHtml("<a href='" + url + "' target='_blank'>" + val + "</a>"),
                                type: infoValue.type
                            };
                        } else if (_.contains(htmlLists, infoValue.type)) {
                            var items = Data.deepObjSearch(response.data, infoValue.attribute);

                            // Create string with all countries and their flag htmls
                            var listHtmlStr = "";

                            // For "point_name_array", add new line instead of comma
                            var delimiterStr = infoValue.type === "point_name_array" ? "<br />" : ", ";
                            _.each(items, function (item) {
                                var newItem = item.code + " " + item.name;

                                // Add URL if it exists
                                if (_.has(item, "url")) {
                                    newItem = "<a href='" + item.url + "' target='_blank'>" + newItem + "</a>";
                                }

                                listHtmlStr += newItem + delimiterStr;
                            });

                            listHtmlStr = listHtmlStr.slice(0, -delimiterStr.length);

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
