angular.module('yds').directive('ydsWorkbenchNew', ['$ocLazyLoad', '$timeout', '$window', 'Data', 'Basket', 'Workbench',
    function ($ocLazyLoad, $timeout, $window, Data, Basket, Workbench) {
        return {
            restrict: 'E',
            scope: {
                lang: '@',
                userId: '@'
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/workbench-new.html',
            link: function (scope, element) {
                scope.ydsAlert = "";
                var editorContainer = angular.element(element[0].querySelector('.highcharts-editor-container'));

                //if userId is undefined or empty, stop the execution of the directive
                if (_.isUndefined(scope.userId) || scope.userId.trim().length == 0) {
                    scope.ydsAlert = "The YDS component is not properly configured." +
                        "Please check the corresponding documentation section";
                    return false;
                }

                //check if the language attr is defined, else assign default value
                if (_.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";

                var editorOptions = {
                    features: "import templates customize export",
                    importer: {
                        options: "plugins",
                        plugins: [
                            "BasketImport"
                        ]
                    }
                };

                // Load the required CSS & JS files for the Editor
                $ocLazyLoad.load({
                    files: [
                        "css/highcharts-editor.min.css",
                        "lib/highcharts-editor.js"
                    ],
                    cache: true
                }).then(function () {
                    // Add plugin for basket import
                    addBasketImportPlugin();

                    // Start the Highcharts Editor
                    highed.ready(function () {
                        highed.Editor(editorContainer[0], editorOptions);
                    });
                });

                /**
                 * Install the Basket Import plugin for Highcharts Editor
                 */
                var addBasketImportPlugin = function() {
                    highed.plugins.import.install('BasketImport', {
                        description: "Standard Basket Import",
                        treatAs: 'csv',
                        fetchAs: 'text',
                        filter: function (data, options, fn) {
                            //todo: do things
                            fn(wasInvalid, data);
                        }
                    });
                }
            }
        }
    }
]);
