angular.module('yds').directive('ydsWorkbenchNew', ['$ocLazyLoad', '$timeout', '$compile', '$templateRequest', '$uibModal', 'Data', 'Basket', 'Workbench',
    function ($ocLazyLoad, $timeout, $compile, $templateRequest, $uibModal, Data, Basket, Workbench) {
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
                scope.selectedItems = [];
                scope.viewsLoaded = false;
                scope.selection = {};
                scope.chartConfig = {};

                var editor = null;
                var allViews = null;

                //check if the language attr is defined, else assign default value
                if (_.isUndefined(scope.lang) || scope.lang.trim() == "")
                    scope.lang = "en";

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
                        "lib/highcharts-editor.js",
                        "lib/yds-chart-editor.js"
                    ],
                    serie: true,
                    cache: true
                }).then(function () {
                    // Add plugin for basket import
                    addBasketImportPlugin();

                    // Start the Highcharts Editor
                    highed.ready(function () {
                        editor = highed.YDSEditor(editorContainer[0], editorOptions, createViewSelector);

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
                 * Create the view selector inside a parent element, using the template
                 * @param parent    Parent element to put view selector inside of
                 */
                var createViewSelector = function (parent) {
                    // Add class for making content scroll when it's too long to the parent
                    angular.element(parent).addClass("view-selector-step-body");

                    // Add content to the parent
                    $templateRequest("templates/workbench/view-selector.html").then(function (html) {
                        var template = angular.element(html);

                        // Add element as a child to the parent
                        $(parent).append(template);

                        // Compile the element
                        $compile(template)(scope);
                    });
                };

                /**
                 * Add data to the chart depending on the selection that has been made in the view/axes selection tab
                 */
                scope.createChart = function () {
                    // Get selected axes data
                    var selection = {
                        x: _.omit(scope.selection.x, "$$hashKey"),
                        y: _.map(scope.selection.y, function (axis) {
                            // Get only selection from axis configuration object, omitting blacklisted key
                            return _.omit(axis.selected, "$$hashKey");
                        })
                    };

                    // Get chart data
                    Workbench.getLineBarVis("generic", scope.chartConfig.selectedView, selection.x, selection.y,
                        _.pluck(scope.selectedItems, "basket_item_id"), scope.lang, false).then(function (response) {
                        // Add data to chart
                        editor.chart.data.settings(response.data);
                    }, function (error) {
                        console.error(error.message);
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
                        scope.selection.y = [{
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
                    var nonSelectedCombo = _.where(scope.selection.y, {selected: ""});

                    // If there is an empty combobox or the number of comboboxes is equal with the number
                    // of line axes, stop the execution of the function
                    if (nonSelectedCombo.length > 0 || scope.selection.y.length > 5 ||
                        scope.selection.y.length == scope.axes.y.length) {
                        return false;
                    } else {
                        // Create a new combobox with default values and append it to the combobox array
                        var newCombo = {
                            selected: "",
                            options: scope.axes.y
                        };

                        scope.selection.y.push(newCombo);
                    }
                };

                /**
                 * Remove the Y axis specified by the given index
                 * @param index Index of Y axis to remove
                 */
                scope.removeAxisY = function (index) {
                    if (scope.selection.y.length > 1) {
                        scope.selection.y.splice(index, 1);
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
                        var chartAxisY = scope.selection.y;
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
                    if (item.selected == true) {
                        // Remove item from selected items
                        scope.selectedItems = _.without(scope.selectedItems, item);
                    } else {
                        // Add the item to the selected items
                        scope.selectedItems.push(item);
                    }

                    // Toggle the item's selection state
                    item.selected = !item.selected;

                    var selectedItemIds = _.pluck(scope.selectedItems, "basket_item_id");

                    // Get available views and axes for this item
                    Workbench.getAvailableVisualisations(scope.lang, selectedItemIds).then(function (response) {
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
                        description: "Select items from the Library to use them in the next steps.",
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
