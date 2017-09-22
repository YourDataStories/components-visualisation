angular.module("yds").directive("ydsAlternativeNames", ["Data",
    function (Data) {
        return {
            restrict: "E",
            scope: {
                projectId: "@", // Project ID to show alternative names for
                viewType: "@",  // View type of data
                lang: "@",      // Language of data
                elementH: "@"   // Height of the component
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/general-purpose/alternative-names.html",
            link: function (scope) {
                var elementH = parseInt(scope.elementH);

                // Check that projectId has been set, or show error
                if (_.isUndefined(scope.projectId) || scope.projectId.trim().length === 0) {
                    scope.ydsAlert = "Organisation ID is a required parameter! Please check the documentation!";
                    return false;
                }

                // Set default view type
                if (_.isUndefined(scope.viewType) || scope.viewType.trim().length === 0)
                    scope.viewType = "default";

                // Set default language
                if (_.isUndefined(scope.lang) || scope.lang.trim().length === 0)
                    scope.lang = "en";

                // Set default component height
                if (_.isUndefined(elementH) || _.isNaN(elementH))
                    elementH = 300;

                //todo: Set component height

                // Get alternative names
                Data.getProjectVis("info", scope.projectId, scope.viewType, scope.lang)
                    .then(function (response) {
                        scope.names = response.data.names;
                    });
            }
        };
    }
]);
