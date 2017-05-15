angular.module('yds').directive('ydsDcatApItem', ['Data',
    function (Data) {
        return {
            restrict: 'E',
            scope: {
                itemUri: '@'  // ID of item to describe
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/dcat-ap-item.html',
            link: function (scope) {
                Data.getItemDescription(scope.itemUri).then(function (response) {
                    scope.itemData = response.data;
                });
            }
        };
    }
]);
