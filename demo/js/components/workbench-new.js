angular.module('yds').directive('ydsWorkbenchNew', ['$ocLazyLoad', '$timeout', '$compile', '$templateRequest', '$uibModal', 'Data', 'Basket', 'ydsEditorService', 'Workbench',
    function ($ocLazyLoad, $timeout, $compile, $templateRequest, $uibModal, Data, Basket, ydsEditorService, Workbench) {
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

                // Variable to keep the selected item in
                scope.selectedItem = null;

                var editor = null;
                var allViews = null;
                scope.viewsLoaded = false;

                //check if the language attr is defined, else assign default value
                if (_.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";

                // Set user ID in the Basket service so the modal can access it
                Basket.setUserId(scope.userId);

                var editorOptions = {
                    features: "import view templates customize export",
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
                    // Add the YDS editor to the Highcharts Editor
                    ydsEditorService.registerEditor();

                    // Add plugin for basket import
                    addBasketImportPlugin();

                    // Start the Highcharts Editor
                    highed.ready(function () {
                        editor = highed.YDSEditor(editorContainer[0], editorOptions, scope);

                        // Get div which contains the parameters of our plugin
                        var divResults = $(".highed-plugin-details").children(".highed-customizer-table");

                        // Replace the parameters table with a span that says "Loading"
                        $(divResults).replaceWith("<span id='library_item_loading_span'>Loading Library Items...</span>");

                        // Hide the import button
                        $(".highed-imp-button").hide();

                        // Get basket items to show in a list
                        Basket.getBasketItems(scope.userId, "dataset")
                            .then(function (response) {
                                // Get items from response and put them in scope
                                scope.libraryItems = response.items;
                                _.map(scope.libraryItems, function (item) {
                                    item.selected = false;
                                    return item;
                                });

                                // Get the template which will show all the items, compile and add it ot the page
                                $templateRequest("templates/workbench/library-list-template.html").then(function (html) {
                                    var template = angular.element(html);

                                    $("#library_item_loading_span").replaceWith(template);

                                    $compile(template)(scope);
                                });
                            });
                    });
                });

                /**
                 * Add data to the chart depending on the selection that has been made in the view/axes selection tab
                 */
                scope.createChart = function () {
                    // todo: Import real data to chart
                    editor.chart.data.settings({
                        "chart": {},
                        "title": {
                            "text": "Imported Chart"
                        },
                        "series": [{
                            "name": "Amount (€)",
                            "data": [15.3, 25.6, 10.15]
                        }]
                    });
                };

                /**
                 * Update the scope object which holds the selected view, when a view is selected from the drop down
                 * @param viewName  Name of view that was selected
                 */
                scope.selectView = function (viewName) {
                    scope.selectedViewObj = _.findWhere(allViews, {type: viewName});
                    // console.log("selecting view", viewName, scope.selectedViewObj);
                };

                /**
                 * Toggle the selected state of a Library item and update the available visualisations for the selected
                 * items
                 * @param item  Clicked item
                 */
                scope.selectItem = function (item) {
                    // Deselect previous item
                    if (!_.isNull(scope.selectedItem)) {
                        scope.selectedItem.selected = false;

                        // If the same item was clicked, do not select it again
                        if (item.basket_item_id == scope.selectedItem.basket_item_id) {
                            scope.selectedItem = null;
                            return;
                        }
                    }

                    // Select new item
                    scope.selectedItem = item;
                    item.selected = true;

                    // Get available views and axes for this item
                    Workbench.getAvailableVisualisations("en", [
                        item.basket_item_id
                    ]).then(function (response) {
                        // Keep view data to use for drop downs later
                        allViews = response.data;

                        // Add available views to the scope
                        scope.availableViews = _.pluck(response.data, "type");
                        scope.viewsLoaded = true;
                    }, function (error) {
                        console.error(error.message);
                        scope.viewsLoaded = false;
                    });
                };

                /**
                 * Install the Library Import plugin for Highcharts Editor
                 */
                var addBasketImportPlugin = function () {
                    highed.plugins.import.install('My Library', {
                        description: "Select an item from the library to import to the chart",
                        treatAs: "json",
                        suppressURL: true,
                        fetchAs: false,
                        options: {
                            val1: {
                                type: 'string',
                                label: 'String value'
                            }
                        },
                        request: function (url, options, fn) {
                            // do nothing (the import button is hidden so this should not be called, ever)
                        }
                    });
                };
            }
        }
    }
]);
