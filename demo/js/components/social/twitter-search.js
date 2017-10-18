angular.module("yds").directive("ydsTwitterSearch", ["Data", "$timeout",
    function (Data, $timeout) {
        return {
            restrict: "E",
            scope: {
                projectId: "@"     // ID of the project
            },
            templateUrl: Data.templatePath + "templates/twitter-search.html",
            link: function (scope) {
                scope.showWidget = false;

                // Get countries of this project
                Data.getProjectVis("heatmap", scope.projectId, "default", "en").then(function (response) {
                    var countries = _.pluck(response.data, "code");

                    // If we should, show the widget
                    if (!_.isEmpty(countries) && countries.indexOf("ZW") !== -1 && countries.indexOf("NL") !== -1) {
                        scope.showWidget = true;

                        $timeout(twttr.widgets.load);
                    }
                });
            }
        };
    }
]);
