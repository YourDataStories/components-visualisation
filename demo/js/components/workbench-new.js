angular.module('yds').directive('ydsWorkbenchNew', ['$ocLazyLoad', '$timeout', '$window', 'Data', 'Basket', 'Workbench',
    function ($ocLazyLoad, $timeout, $window, Data, Basket, Workbench) {
        return {
            restrict: 'E',
            scope: {
                lang: '@',
                userId: '@'
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/workbench-new.html',
            link: function (scope) {
                scope.ydsAlert = "";

                //if userId is undefined or empty, stop the execution of the directive
                if (_.isUndefined(scope.userId) || scope.userId.trim().length == 0) {
                    scope.ydsAlert = "The YDS component is not properly configured." +
                        "Please check the corresponding documentation section";
                    return false;
                }

                //check if the language attr is defined, else assign default value
                if (_.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";
            }
        }
    }
]);
