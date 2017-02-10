angular.module('yds').directive('ydsWorkbenchNew', ['$ocLazyLoad', '$timeout', '$compile', '$uibModal', 'Data', 'Basket',
    function ($ocLazyLoad, $timeout, $compile, $uibModal, Data, Basket) {
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

                // Set user ID in the Basket service so the modal can access it
                Basket.setUserId(scope.userId);

                var editorOptions = {
                    features: "import templates customize export",
                    importer: {
                        options: "plugins",
                        plugins: [
                            "My Library"
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

                        // Get div which contains the parameters of our plugin
                        var divResults = $(".highed-plugin-details").children(".highed-customizer-table");

                        // Replace the parameters table with a span that says "Loading"
                        $(divResults).replaceWith("<span id='library_item_loading_span'>Loading Library Items...</span>");

                        // Get basket items to show in a list
                        Basket.getBasketItems(scope.userId, "dataset")
                            .then(function(response) {
                                // Get items from response and put them in scope
                                scope.libraryItems = response.items;
                                // console.log(scope.libraryItems);

                                // Compile the template which will show all the items with ng-repeat
                                var templateHtml = "<div ng-repeat='item in libraryItems'>{{ item.title }}</div>";

                                var compiledList = $compile(templateHtml)(scope);

                                // Replace the loading span with the compiled list of items
                                $("#library_item_loading_span").replaceWith(compiledList);
                            });
                    });
                });

                /**
                 * Install the Library Import plugin for Highcharts Editor
                 */
                var addBasketImportPlugin = function() {
                    highed.plugins.import.install('My Library', {
                        description: "Select an item from the library to import to the chart",
                        treatAs: "csv",
                        suppressURL: true,
                        fetchAs: false,
                        options: {
                            val1: {
                                type: 'string',
                                label: 'String value',
                                default: 'a string 1234'
                            }
                        },
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
