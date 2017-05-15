angular.module("yds").directive("ydsDcatApItem", ["Data",
    function (Data) {
        return {
            restrict: "E",
            scope: {
                itemUri: "@",   // ID of item to describe
                baseUrl: "@"    // URL for item description page
            },
            templateUrl: ((typeof Drupal != "undefined") ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + "/" : "") + "templates/dcat-ap-item.html",
            link: function (scope) {
                Data.getItemDescription(scope.itemUri, scope.baseUrl)
                    .then(function (data) {
                        scope.itemData = data;
                    });
            }
        };
    }
]);
