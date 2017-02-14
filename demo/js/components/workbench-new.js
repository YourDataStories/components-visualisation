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
                    // Get the view object
                    var view = _.findWhere(allViews, {type: viewName});

                    // Get axes from the generic view object
                    var axes = _.findWhere(view.values, {
                        component: "generic"
                    });

                    // Add axes to the scope if the generic view object exists
                    if (_.has(axes, "axis-x") && _.has(axes, "axis-y")) {
                        scope.axes = {
                            x: axes["axis-x"],
                            y: axes["axis-y"]
                        };

                        // Initialize/reset selected Y axes
                        scope.axisYConfig = [{
                            selected: "",
                            options: scope.axes.y
                        }];
                    } else {
                        scope.axes = undefined;
                    }
                };

                /**
                 * Add a new combobox for Y axis selection
                 * @returns {boolean}
                 */
                scope.addAxisY = function () {
                    // Check if there is any combobox with default value
                    var nonSelectedCombo = _.where(scope.axisYConfig, {selected: ""});

                    // If there is an empty combobox or the number of comboboxes is equal with the number
                    // of line axes, stop the execution of the function
                    if (nonSelectedCombo.length > 0 || scope.axisYConfig.length > 5 ||
                        scope.axisYConfig.length == scope.axes.y.length) {
                        return false;
                    } else {
                        // Create a new combobox with default values and append it to the combobox array
                        var newCombo = {
                            selected: "",
                            options: scope.axes.y
                        };

                        scope.axisYConfig.push(newCombo);
                    }
                };

                /**
                 * Remove the Y axis specified by the given index
                 * @param index Index of Y axis to remove
                 */
                scope.removeAxisY = function (index) {
                    if (scope.axisYConfig.length > 1) {
                        scope.axisYConfig.splice(index, 1);
                    }
                };

                /**
                 * Filter function for the Y axis comboboxes (filters out axes that have already been selected in other
                 * comboboxes)
                 * @param index         Index of combobox to filter for
                 * @returns {Function}  Filter
                 */
                scope.yAxisComboboxFilter = function (index) {
                    return function (item) {
                        var attrSelected = false;
                        var chartAxisY = scope.axisYConfig;
                        var axisYConfig = _.clone(chartAxisY);

                        // If the filtered attribute is already selected, return it
                        if (axisYConfig[index].selected != null && axisYConfig[index].selected.attribute == item.attribute)
                            return item;

                        // Else search if the attribute is selected in one of the other compoboxes
                        axisYConfig.splice(index, 1);
                        if (axisYConfig.length > 0) {
                            var existingCombos = _.where(_.pluck(axisYConfig, 'selected'), {attribute: item.attribute});

                            if (existingCombos.length > 0)
                                attrSelected = true;
                        }

                        // If the attribute is not selected in none of the comboboxes return it as available
                        if (!attrSelected)
                            return item;
                    };
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
