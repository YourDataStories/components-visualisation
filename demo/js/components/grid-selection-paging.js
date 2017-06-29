/**
 * Grid that supports selection of items and paging (infinite scrolling) at the same time.
 */
angular.module('yds').directive('ydsGridSelectionPaging', ['Data', 'Filters', 'DashboardService',
    function (Data, Filters, DashboardService) {
        return {
            restrict: 'E',
            scope: {
                projectId: '@',         // ID of the project that the data belong
                viewType: '@',          // Name of the array that contains the visualised data
                lang: '@',              // Lang of the visualised data

                extraParams: '=',       // Extra attributes to pass to the API, if needed
                baseUrl: '@',           // Base URL to send to API (optional)

                sorting: '@',           // Enable or disable array sorting, values: true, false
                colResize: '@',         // Enable or disable column resize, values: true, false
                numberOfItems: '@',     // This should be set to the number of total items that the grid will show
                pageSize: '@',          // Set the number of rows of each page
                elementH: '@',          // Set the height of the component

                selectionType: '@',     // Selection type ("single" or "multiple")
                dashboardId: '@',       // Used for setting/getting parameters to/from DashboardService
                selectionId: '@',       // ID for saving the selection for the specified dashboardId

                addToBasket: '@',       // Enable or disable "add to basket" functionality, values: true, false
                basketBtnX: '@',        // X-axis position of the basket button
                basketBtnY: '@',        // Y-axis position of the basket button

                exporting: '@',         // Enable or disable export to CSV
                exportBtnX: '@',        // X-axis position of the exporting button
                exportBtnY: '@',        // Y-axis position of the exporting button

                embeddable: '@',        // Enable or disable the embedding of the component
                embedBtnX: '@',         // X-axis position of the embed button
                embedBtnY: '@',         // Y-axis position of the embed button
                popoverPos: '@',        // The side of the embed button from which the embed  window will appear

                enableRating: '@'       // Enable rating buttons for this component
            },
            templateUrl: ((typeof Drupal != 'undefined') ? Drupal.settings.basePath + Drupal.settings.yds_project.modulePath + '/' : '') + 'templates/grid.html',
            link: function (scope, element) {
                // Get the DOM elements that will contain the grid
                var gridWrapper = _.first(angular.element(element[0].querySelector('.component-wrapper')));
                var gridContainer = _.first(angular.element(element[0].querySelector('.grid-container')));

                // Set initial grid parameters
                scope.quickFilterValue = "";
                var grid = {
                    elementId: "grid" + Data.createRandomId(),
                    projectId: scope.projectId,
                    viewType: scope.viewType,
                    lang: scope.lang,
                    sorting: scope.sorting,
                    colResize: scope.colResize,
                    pageSize: scope.pageSize,
                    exporting: scope.exporting,
                    exportBtnX: parseInt(scope.exportBtnX),
                    exportBtnY: parseInt(scope.exportBtnY),
                    elementH: scope.elementH
                };

                var extraParams = scope.extraParams;
                var baseUrl = scope.baseUrl;
                var selectionType = scope.selectionType;
                var dashboardId = scope.dashboardId;
                var selectionId = scope.selectionId;

                // If selection is enabled, this will be used to reselect rows after refreshing the grid data
                var selection = [];
                var preventUpdate = false;

                // If extra params exist, add them to Filters
                if (!_.isUndefined(extraParams) && !_.isEmpty(extraParams)) {
                    Filters.addExtraParamsFilter(grid.elementId, extraParams);
                }

                //check if project id or grid type are defined
                if (_.isUndefined(grid.projectId) || grid.projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                //check if view-type attribute is empty and assign the default value
                if (_.isUndefined(grid.viewType) || grid.viewType.trim() === "")
                    grid.viewType = "default";

                //check if the language attr is defined, else assign default value
                if (_.isUndefined(grid.lang) || grid.lang.trim() === "")
                    grid.lang = "en";

                //check if the sorting attr is defined, else assign the default value
                if (_.isUndefined(grid.sorting) || (grid.sorting !== "true" && grid.sorting !== "false"))
                    grid.sorting = "true";

                //check if the colResize attr is defined, else assign default value
                if (_.isUndefined(grid.colResize) || (grid.colResize !== "true" && grid.colResize !== "false"))
                    grid.colResize = "false";

                //check if the exporting attr is defined, else assign default value
                if (_.isUndefined(grid.exporting) || (grid.exporting !== "true" && grid.exporting !== "false"))
                    grid.exporting = "false";

                //check if the exportBtnX attr is defined, else assign default value
                if (_.isUndefined(grid.exportBtnX) || _.isNaN(grid.exportBtnX))
                    grid.exportBtnX = 0;

                //check if the exportBtnY attr is defined, else assign default value
                if (_.isUndefined(grid.exportBtnY) || _.isNaN(grid.exportBtnY))
                    grid.exportBtnY = 0;

                //check if the page size attr is defined, else assign default value
                if (_.isUndefined(grid.pageSize) || _.isNaN(grid.pageSize))
                    grid.pageSize = "100";

                //check if the component's height attr is defined, else assign default value
                if (_.isUndefined(grid.elementH) || _.isNaN(grid.elementH))
                    grid.elementH = 200;

                //check if the selectionType attr is defined, else assign default value
                if (_.isUndefined(selectionType) || (selectionType !== "single" && selectionType !== "multiple"))
                    selectionType = "multiple";

                // Show loading animation
                scope.loading = true;

                //set the id and the height of the grid component
                gridContainer.id = grid.elementId;
                gridWrapper.style.height = grid.elementH + 'px';

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

                var preventSelectionEvent = false;

                /**
                 * Export grid data to CSV and download it
                 */
                scope.exportGrid = function () {
                    //todo: this will not work with virtual paging
                    scope.gridOptions.api.exportDataAsCsv();
                };

                /**
                 * Select the ones that are indicated in the selection parameter (matches them by their "id" attribute)
                 * If the dashboardId attribute of the component contains "comparison", it deselects all previously
                 * selected rows before selecting the new ones
                 * @param selection Rows to select. Should be array of objects with "id" attributes in them.
                 */
                var selectRows = function (selection) {
                    // Deselect previously selected rows
                    if (dashboardId.indexOf("comparison") !== -1 && !preventUpdate) {
                        // Prevent the next selection event from doing anything (because deselectAll() will fire it)
                        preventSelectionEvent = true;

                        scope.gridOptions.api.deselectAll();
                    }

                    // Select new rows
                    if (!_.isEmpty(selection)) {
                        scope.gridOptions.api.forEachNode(function (node) {
                            // Check if this node is in the selection
                            var result = _.findWhere(selection, {
                                id: node.data.id
                            });

                            if (!_.isUndefined(result)) {
                                // If the node we will select is in a group, we also need to expand its parent
                                if (node.level > 0) {
                                    node.parent.expanded = true;

                                    // Call this so the grid will render the expanded group
                                    scope.gridOptions.api.onGroupExpandedOrCollapsed();
                                }

                                // The node was selected before, so select it again
                                scope.gridOptions.api.selectNode(node, true);
                                scope.gridOptions.api.ensureNodeVisible(node);
                            }

                            preventUpdate = false;
                        });
                    }
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
                                selection = scope.gridOptions.api.getSelectedRows();

                                scope.gridOptions.api.destroy();
                            }

                            // Get column definitions
                            var columnDefs = Data.prepareGridColumns(response.view);

                            // Get data for the grid
                            var rawData = Data.prepareGridData(response.data, response.view);

                            // Add checkbox to the first column
                            _.first(columnDefs).checkboxSelection = true;

                            //Define the options of the grid component
                            scope.gridOptions = {
                                columnDefs: columnDefs,
                                enableColResize: (grid.colResize === "true"),
                                enableSorting: (grid.sorting === "true"),
                                enableFilter: (grid.filtering === "true")
                            };

                            // If selection is enabled, add extra options for it in the gridOptions
                            scope.gridOptions.rowSelection = selectionType;
                            scope.gridOptions.suppressRowClickSelection = true;
                            scope.gridOptions.onSelectionChanged = function (e) {
                                // Ignore event if grid is loading, or it's marked to be skipped
                                if (scope.loading || preventSelectionEvent) {
                                    preventSelectionEvent = false;

                                    return;
                                }

                                // Prevent next grid update if nothing was deselected
                                preventUpdate = !(!_.isEmpty(selection) && e.selectedRows.length < selection.length);

                                // Set selected rows in DashboardService
                                DashboardService.setGridSelection(selectionId, e.selectedRows);
                                selection = _.clone(e.selectedRows);

                                // Save selection to cookies too
                                DashboardService.setCookieObject(cookieKey, e.selectedRows);
                            };

                            scope.gridOptions.rowData = rawData;

                            new agGrid.Grid(gridContainer, scope.gridOptions);

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
                            selectRows(selection);
                        }, function (error) {
                            if (_.isNull(error) || _.isUndefined(error) || _.isUndefined(error.message))
                                scope.ydsAlert = "An error has occurred, please check the configuration of the component.";
                            else
                                scope.ydsAlert = error.message;

                            // Remove loading animation
                            scope.loading = false;
                        });
                };

                // Watch for changes in extra parameters and update the grid
                scope.$watch("extraParams", function (newValue, oldValue) {
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
                    var selection = DashboardService.getGridSelection(selectionId);
                    selectRows(selection);
                });

                createGrid();
            }
        };
    }
]);
