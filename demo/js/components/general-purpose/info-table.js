angular.module("yds").directive("ydsInfoTable", ["Data", "Translations", "$sce", function (Data, Translations, $sce) {
    return {
        restrict: "E",
        scope: {
            projectId: "@",     // ID of the project
            viewType: "@",      // Type of the info object
            lang: "@",          // Lang of the visualised data
            baseUrl: "@",       // Base URL to send to API
            isEmptyObj: "=",    // Object that the component will set to true when there is no data to display
            extraParams: "=",   // Extra parameters to send with API call

            addToBasket: "@",   // Enable or disable "add to basket" functionality, values: true, false
            basketBtnX: "@",    // X-axis position of the basket button
            basketBtnY: "@"     // Y-axis position of the basket button
        },
        templateUrl: Data.templatePath + "templates/general-purpose/info-table.html",
        link: function (scope) {
            var projectId = scope.projectId;
            var viewType = scope.viewType;
            var lang = scope.lang;
            var baseUrl = scope.baseUrl;
            var extraParams = scope.extraParams;

            // Check if project id is defined
            if (_.isUndefined(projectId) || projectId.trim() === "") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the projectId isn't configured properly. " +
                    "Please check the corresponding documentation section.";
                return false;
            }

            // Check if info-type attribute is empty and assign the default value
            if (_.isUndefined(viewType) || viewType.trim() === "")
                viewType = "default";

            // Check if the language attribute is defined, else assign default value
            if (_.isUndefined(lang) || lang.trim() === "")
                lang = "en";

            scope.translations = {
                showMore: Translations.get(lang, "showMore"),
                showLess: Translations.get(lang, "showLess")
            };

            // If base URL attribute is defined, add it to the parameters that will be sent
            if (!_.isUndefined(baseUrl) && baseUrl.length > 0) {
                extraParams = _.extend({
                    baseurl: baseUrl
                }, extraParams);
            }

            Data.getProjectVis("info", projectId, viewType, lang, extraParams)
                .then(function (response) {
                    // If the data is empty, set the "empty" object to true
                    if (_.isEmpty(response.data)) {
                        scope.isEmptyObj = true;
                    }

                    scope.info = Data.prepareInfoData(response.data, response.view);
                }, function (error) {
                    if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                    else
                        scope.ydsAlert = error.message;
                });
        }
    };
}]);
