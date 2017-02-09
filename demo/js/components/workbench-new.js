angular.module('yds').directive('ydsWorkbenchNew', ['$ocLazyLoad', '$timeout', '$uibModal', 'Data', 'Basket',
    function ($ocLazyLoad, $timeout, $uibModal, Data, Basket) {
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
                        treatAs: "csv",
                        suppressURL: true,
                        fetchAs: false,
                        request: function(url, options, fn) {
                            // Show modal and give it function to call with data
                            openModal(fn);
                        }
                    });
                };

                var openModal = function (fn) {
                    var modalInstance = $uibModal.open({
                        animation: true,
                        ariaLabelledBy: "modal-title",
                        ariaDescribedBy: "modal-body",
                        templateUrl: "templates/workbench/workbench-modal.html",
                        controller: "WorkbenchModalController"
                    });

                    // Process result of modal
                    modalInstance.result.then(function (data) {
                        // console.log(data);

                        fn(false, data.chartConfig);
                    }, function () {
                        console.log("Modal dismissed at: " + new Date());
                    });
                };
            }
        }
    }
]);
