angular.module("yds").directive("ydsGrid", ["Data", "Filters", "DashboardService",
    function (Data, Filters, DashboardService) {
        return {
            restrict: "E",
            scope: {
                projectId: "@",         // ID of the project that the data belong
                viewType: "@",          // Name of the array that contains the visualised data
                lang: "@",              // Lang of the visualised data

                extraParams: "=",       // Extra attributes to pass to the API, if needed
                baseUrl: "@",           // Base URL to send to API (optional)

                sorting: "@",           // Enable or disable array sorting, values: true, false
                filtering: "@",         // Enable or disable array filtering, values: true, false
                quickFiltering: "@",    // Enable or disable array quick filtering, values: true, false
                colResize: "@",         // Enable or disable column resize, values: true, false
                elementH: "@",          // Set the height of the component

                allowSelection: "@",    // Allow row selection
                selectionType: "@",     // Selection type ("single" or "multiple")
                dashboardId: "@",       // Used for setting/getting parameters to/from DashboardService
                selectionId: "@",       // ID for saving the selection for the specified dashboardId
                ignoreOwnSelection: "@",// Set to true to ignore the grid's own selections (to prevent refreshing)

                groupedData: "@",       // Set to true if the response from the API for your view type is grouped data

                addToBasket: "@",       // Enable or disable "add to basket" functionality, values: true, false
                basketBtnX: "@",        // X-axis position of the basket button
                basketBtnY: "@",        // Y-axis position of the basket button

                exporting: "@",         // Enable or disable export to CSV
                exportBtnX: "@",        // X-axis position of the exporting button
                exportBtnY: "@",        // Y-axis position of the exporting button

                embeddable: "@",        // Enable or disable the embedding of the component
                embedBtnX: "@",         // X-axis position of the embed button
                embedBtnY: "@",         // Y-axis position of the embed button
                popoverPos: "@",        // The side of the embed button from which the embed window will appear
                fitColumns: "@",        // Set to true to make the grid fit the columns to the grid width after loading

                enableRating: "@",      // Enable rating buttons for this component

                explanationBtnX: "@",   // Explanation button horizontal position
                explanationBtnY: "@",   // Explanation button vertical position
                disableExplanation: "@" // Set to true to disable the explanation button
            },
            templateUrl: Data.templatePath + "templates/visualisation/grid.html",
            link: function (scope, element, attrs) {
                // Reference the dom elements in which the yds-grid is rendered
                var gridWrapper = _.first(angular.element(element[0].querySelector(".component-wrapper")));
                var gridContainer = _.first(angular.element(element[0].querySelector(".grid-container")));

                // Set the variables which will be used for the creation of the grid
                scope.filters = {
                    quickFilterValue: ""
                };

                var grid = {
                    elementId: "grid" + Data.createRandomId(),
                    projectId: scope.projectId,
                    viewType: scope.viewType,
                    lang: scope.lang,
                    sorting: scope.sorting,
                    filtering: scope.filtering,
                    quickFiltering: scope.quickFiltering,
                    colResize: scope.colResize,
                    exporting: scope.exporting,
                    exportBtnX: parseInt(scope.exportBtnX),
                    exportBtnY: parseInt(scope.exportBtnY),
                    elementH: scope.elementH
                };

                var extraParams = scope.extraParams;
                var baseUrl = scope.baseUrl;
                var allowSelection = scope.allowSelection;
                var selectionType = scope.selectionType;
                var dashboardId = scope.dashboardId;
                var selectionId = scope.selectionId;
                var groupedData = scope.groupedData;
                var ignoreOwnSelection = scope.ignoreOwnSelection;
                var fitColumns = scope.fitColumns;

                // If selection is enabled, this will be used to reselect rows after refreshing the grid data
                var selection = [];
                var preventUpdate = false;

                // If extra params exist, add them to Filters
                if (!_.isUndefined(extraParams) && !_.isEmpty(extraParams)) {
                    Filters.addExtraParamsFilter(grid.elementId, extraParams);
                }

                // Check if project id is defined
                if (_.isUndefined(grid.projectId) || grid.projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId isn't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                // Check if view-type attribute is empty and assign the default value
                if (_.isUndefined(grid.viewType) || grid.viewType.trim() === "")
                    grid.viewType = "default";

                // Check if the language attribute is defined, else assign default value
                if (_.isUndefined(grid.lang) || grid.lang.trim() === "")
                    grid.lang = "en";

                // Check if the sorting attribute is defined, else assign the default value
                if (_.isUndefined(grid.sorting) || (grid.sorting !== "true" && grid.sorting !== "false"))
                    grid.sorting = "true";

                // Check if the filtering attribute is defined, else assign the default value
                if (_.isUndefined(grid.filtering) || (grid.filtering !== "true" && grid.filtering !== "false"))
                    grid.filtering = "false";

                // Check if the quick filtering attribute is defined, else assign the default value
                if (_.isUndefined(grid.quickFiltering) || (grid.quickFiltering !== "true" && grid.quickFiltering !== "false"))
                    grid.quickFiltering = "false";

                // Check if the colResize attribute is defined, else assign default value
                if (_.isUndefined(grid.colResize) || (grid.colResize !== "true" && grid.colResize !== "false"))
                    grid.colResize = "false";

                // Check if the exporting attribute is defined, else assign default value
                if (_.isUndefined(grid.exporting) || (grid.exporting !== "true" && grid.exporting !== "false"))
                    grid.exporting = "false";

                // Check if the exportBtnX attribute is defined, else assign default value
                if (_.isUndefined(grid.exportBtnX) || _.isNaN(grid.exportBtnX))
                    grid.exportBtnX = 0;

                // Check if the exportBtnY attribute is defined, else assign default value
                if (_.isUndefined(grid.exportBtnY) || _.isNaN(grid.exportBtnY))
                    grid.exportBtnY = 0;

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(grid.elementH) || _.isNaN(grid.elementH))
                    grid.elementH = 200;

                // Check if the allowSelection attribute is defined, else assign default value
                if (_.isUndefined(allowSelection) || (allowSelection !== "true" && allowSelection !== "false"))
                    allowSelection = "false";

                // Check if the groupedData attribute is defined, else assign default value
                if (_.isUndefined(groupedData) || (groupedData !== "true" && groupedData !== "false"))
                    groupedData = "false";

                // Check if the ignoreOwnSelection attribute is defined, else assign default value
                if (_.isUndefined(ignoreOwnSelection) || (ignoreOwnSelection !== "true" && ignoreOwnSelection !== "false"))
                    ignoreOwnSelection = "false";

                // Check if the fitColumns attribute is defined, else assign default value
                if (_.isUndefined(fitColumns) || (fitColumns !== "true" && fitColumns !== "false"))
                    fitColumns = "false";

                // Check if the selectionType attribute is defined, else assign default value
                if (_.isUndefined(selectionType) || (selectionType !== "single" && selectionType !== "multiple"))
                    selectionType = "multiple";

                // Show loading animation
                scope.loading = true;

                // Set the id and the height of the grid component
                gridContainer.id = grid.elementId;

                if (grid.quickFiltering === "true") {
                    gridWrapper.style.height = (grid.elementH) + "px";
                    gridContainer.style.height = (grid.elementH - 55) + "px";
                } else {
                    gridWrapper.style.height = grid.elementH + "px";
                }

                // If exporting is enabled, set position of export button
                if (grid.exporting === "true") {
                    scope.exportBtnPos = {
                        left: grid.exportBtnX + "px",
                        top: grid.exportBtnY + "px"
                    }
                }

                // Set cookie variables
                var cookieKey = grid.viewType + "_" + dashboardId;
                var firstLoad = true;

                /**
                 * When a filter is updated, update the filter object of the component by using the Filters service
                 */
                var filterModifiedListener = function () {
                    var gridFilters = {};

                    // Get all filters applied to the columns
                    if (grid.filtering === "true")
                        gridFilters = scope.gridOptions.api.getFilterModel();

                    // If quick filtering is enabled and has length > 0, get its value and create an extra filter
                    if (grid.quickFiltering === "true")
                        gridFilters["_ydsQuickFilter_"] = scope.filters.quickFilterValue;

                    Filters.addGridFilter(grid.elementId, gridFilters);
                };

                /**
                 * Handle the grid's quick filtering
                 */
                scope.applyQuickFilter = function (input) {
                    scope.gridOptions.api.setQuickFilter(input);
                };

                /**
                 * Clear grid filters (quick filter and ag-grid column filters)
                 */
                scope.clearComboFilters = function () {
                    // Clear quick filter
                    scope.filters.quickFilterValue = "";
                    scope.gridOptions.api.setQuickFilter("");

                    // Clear ag-grid column filters
                    scope.gridOptions.api.setFilterModel(null);
                    scope.gridOptions.api.onFilterChanged();
                };

                /**
                 * Export grid data to CSV and download it
                 */
                scope.exportGrid = function () {
                    scope.gridOptions.api.exportDataAsCsv();
                };

                /**
                 * Remove filters when the component is destroyed
                 */
                scope.$on("$destroy", function () {
                    // If the grid filtering is enabled remove the filter event listener
                    if (grid.filtering === "true" || grid.quickFiltering === "true") {
                        Filters.remove(grid.elementId);

                        if (_.has(scope.gridOptions, "api")) {
                            scope.gridOptions.api.removeEventListener("afterFilterChanged", filterModifiedListener);
                        }
                    }
                });

                /**
                 * Select the ones that are indicated in the selection parameter (matches them by their "id" attribute)
                 * If the dashboardId attribute of the component contains "comparison", it deselects all previously
                 * selected rows before selecting the new ones
                 * @param selection Rows to select. Should be array ids.
                 */
                var selectRows = function (selection) {
                    // Select new rows
                    if (!_.isEmpty(selection)) {
                        scope.gridOptions.api.forEachNode(function (node) {
                            // Check if this node is in the selection
                            var nodeId = _.has(node.data, "id_original") ? node.data["id_original"] : node.data.id;
                            var isSelected = _.contains(selection, nodeId);

                            if (isSelected) {
                                // If the node we will select is in a group, we also need to expand its parent
                                if (node.level > 0) {
                                    node.parent.expanded = true;

                                    // Call this so the grid will render the expanded group
                                    scope.gridOptions.api.onGroupExpandedOrCollapsed();
                                }

                                // The node was selected before, so select it again
                                scope.gridOptions.api.selectNode(node, (selectionType === "multiple"));
                                scope.gridOptions.api.ensureNodeVisible(node);
                            }

                            preventUpdate = false;
                        });
                    }
                };

                /**
                 * Get the IDs of the selected items of the grid.
                 * If there is an "id_original" attribute, use that, otherwise use the "id" attribute.
                 * @param gridSelection Selection from ag-grid
                 * @returns {*}         Array of IDs
                 */
                var getIdsFromSelection = function (gridSelection) {
                    if (_.has(_.first(gridSelection), "id_original")) {
                        return _.pluck(gridSelection, "id_original");
                    } else {
                        return _.pluck(gridSelection, "id");
                    }
                };

                /**
                 * Return appropriate row style for the grid, depending on the "time" attribute in the row data.
                 * Only used for "trafficobservation.per.direction.time.vehicle.type" grid view type.
                 * @param params
                 * @returns {*}
                 */
                var getRowStyle = function (params) {
                    // If "Time" column is blank, add appropriate color
                    if (_.has(params.data, "time") && params.data.time.trim() === "") {
                        return {"background-color": "#CAE9E3"};
                    }

                    return null;
                };

                /**
                 * Create the grid
                 */
                var createGrid = function () {
                    // Get data and visualize grid
                    var extraParams = _.clone(scope.extraParams);

                    if (!_.isUndefined(baseUrl)) {
                        if (_.isUndefined(extraParams)) {
                            extraParams = {};
                        }

                        extraParams.baseurl = baseUrl;
                    }

                    // If extra params contains null value, prevent grid creation
                    var prevent = false;
                    _.each(extraParams, function (param) {
                        if (_.isString(param) && param.indexOf("null") !== -1)
                            prevent = true;
                    });
                    if (prevent)
                        return;

                    Data.getProjectVis("grid", grid.projectId, grid.viewType, grid.lang, extraParams)
                        .then(function (response) {
                            // Check for conditions in which the grid creation should be stopped
                            if (!_.isUndefined(scope.extraParams) && !_.isEqual(extraParams, scope.extraParams)) {
                                // If the extra parameters that were sent with the request are NOT the same with the
                                // current ones, abort grid creation (in case the request takes some time, and
                                // parameters change in the meantime)
                                return;
                            } else if (response.success === false || response.view.length === 0) {
                                console.error("An error has occurred!");
                                return false;
                            }

                            // If the grid exists already, get current selection and destroy the grid
                            if (_.has(scope.gridOptions, "api")) {
                                selection = getIdsFromSelection(scope.gridOptions.api.getSelectedRows());

                                scope.gridOptions.api.destroy();
                            }

                            // Get column definitions
                            var columnDefs = Data.prepareGridColumns(response.view);

                            // Get data for the grid
                            var rawData = [];

                            if (groupedData === "true") {
                                // For grouped data, use API response directly, and make the first column definition
                                // use the group renderer
                                rawData = response.data;

                                var colToModify = _.first(columnDefs);
                                if (allowSelection === "true") {
                                    colToModify = columnDefs[1];
                                }

                                colToModify.cellRenderer = {
                                    renderer: "group",
                                    innerRenderer: function (params) {
                                        return params.data.name;
                                    }
                                };
                            } else {
                                rawData = Data.prepareGridData(response.data, response.view);
                            }

                            // If selection is enabled, add checkbox to the first column
                            if (allowSelection === "true") {
                                _.first(columnDefs).checkboxSelection = true;
                            }

                            // Define the options of the grid component
                            scope.gridOptions = {
                                columnDefs: columnDefs,
                                rowData: rawData,
                                enableColResize: (grid.colResize === "true"),
                                enableSorting: (grid.sorting === "true"),
                                enableFilter: (grid.filtering === "true"),
                                rowsAlreadyGrouped: (groupedData === "true"),
                                icons: {
                                    groupExpanded: "<i class='fa fa-minus-square-o'/>",
                                    groupContracted: "<i class='fa fa-plus-square-o'/>"
                                }
                            };

                            // Only for the traffic observations view type, add row style function
                            if (scope.viewType === "trafficobservation.per.direction.time.vehicle.type") {
                                scope.gridOptions.getRowStyle = getRowStyle;
                            }

                            // If selection is enabled, add extra options for it in the gridOptions
                            if (allowSelection === "true") {
                                scope.gridOptions.rowSelection = selectionType;
                                scope.gridOptions.suppressRowClickSelection = true;
                                scope.gridOptions.onSelectionChanged = function (e) {
                                    // Ignore event if grid is loading, or it's marked to be skipped
                                    if (scope.loading) {
                                        return;
                                    }

                                    // Prevent next grid update if needed
                                    preventUpdate = !(!_.isEmpty(selection) && e.selectedRows.length < selection.length);

                                    // Get selected row IDs
                                    var selRows = getIdsFromSelection(e.selectedRows);

                                    // Set selected rows in DashboardService
                                    DashboardService.setGridSelection(selectionId, selRows);
                                    selection = _.clone(selRows);

                                    // Save selection to cookies too
                                    DashboardService.setCookieObject(cookieKey, selRows);
                                }
                            }

                            new agGrid.Grid(gridContainer, scope.gridOptions);

                            // If filtering is enabled, register function to watch for filter updates
                            if (grid.filtering === "true" || grid.quickFiltering === "true") {
                                scope.gridOptions.api.addEventListener("afterFilterChanged", filterModifiedListener);
                            }

                            // Fit the columns to fit the grid width (if enabled)
                            if (fitColumns === "true") {
                                scope.gridOptions.api.sizeColumnsToFit();
                            }

                            // Remove loading animation
                            scope.loading = false;

                            // At first load of grid, check if there are any cookies with a selection for this grid
                            if (firstLoad) {
                                var cookieSel = DashboardService.getCookieObject(cookieKey);

                                if (!_.isEmpty(cookieSel)) {
                                    // Add selection from cookie to the selection variable, so the rows will be selected
                                    // below if selection is enabled
                                    selection = cookieSel;
                                }

                                firstLoad = false;
                            }

                            // Select any points that were previously selected
                            if (allowSelection === "true" && !_.isEmpty(selection)) {
                                selectRows(selection);
                            }
                        }, function (error) {
                            if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                                scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                            else
                                scope.ydsAlert = error.message;

                            // Remove loading animation
                            scope.loading = false;
                        });
                };

                if (allowSelection === "true") {
                    // Watch for changes in extra parameters and update the grid
                    scope.$watch("extraParams", function (newValue, oldValue) {
                        if (ignoreOwnSelection === "true") {
                            // Remove own selection from the extra params, to not cause a refresh...
                            newValue = _.omit(newValue, selectionId);
                            oldValue = _.omit(oldValue, selectionId);
                        }

                        // Check if the grid should update (ignoring the grid's own selections)
                        if (!_.isEqual(newValue, oldValue) && !preventUpdate) {
                            // Show loading animation and hide any errors
                            scope.loading = true;
                            scope.ydsAlert = "";

                            createGrid();
                        }

                        preventUpdate = false;
                    });

                    // Watch for changes in the selection and select the appropriate rows
                    DashboardService.subscribeGridSelectionChanges(scope, function () {
                        var newSelection = DashboardService.getGridSelection(selectionId);

                        // Call selectRows if selection changed...
                        if (!_.isUndefined(newSelection) && !_.isEqual(newSelection, selection)) {
                            selectRows(newSelection);
                        }
                    });
                }

                createGrid();
            }
        };
    }
]);
