/**
 * Grid that supports selection of items and paging (infinite scrolling) at the same time.
 */
angular.module("yds").directive("ydsGridSelectionPaging", ["Data", "Filters", "DashboardService",
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
                colResize: "@",         // Enable or disable column resize, values: true, false
                numberOfItems: "@",     // This should be set to the number of total items that the grid will show
                pageSize: "@",          // Set the number of rows of each page
                elementH: "@",          // Set the height of the component

                selectionType: "@",     // Selection type ("single" or "multiple")
                dashboardId: "@",       // Used for setting/getting parameters to/from DashboardService
                selectionId: "@",       // ID for saving the selection for the specified dashboardId
                checkboxInNewCol: "@",  // If true, the grid will add the selection checkboxes in a new column

                enableRating: "@"       // Enable rating buttons for this component
            },
            templateUrl: Data.templatePath + "templates/grid.html",
            link: function (scope, element) {
                // Get the DOM elements that will contain the grid
                var gridWrapper = _.first(angular.element(element[0].querySelector(".component-wrapper")));
                var gridContainer = _.first(angular.element(element[0].querySelector(".grid-container")));

                // Set initial grid parameters
                var grid = {
                    elementId: "grid" + Data.createRandomId(),
                    projectId: scope.projectId,
                    viewType: scope.viewType,
                    lang: scope.lang,
                    sorting: scope.sorting,
                    colResize: scope.colResize,
                    pageSize: scope.pageSize,
                    elementH: scope.elementH
                };

                var baseUrl = scope.baseUrl;
                var selectionType = scope.selectionType;
                var dashboardId = scope.dashboardId;
                var selectionId = scope.selectionId;

                // If selection is enabled, this will be used to reselect rows after refreshing the grid data
                var selection = [];
                var hasColDefs = false; // Indicates if the column definitions have been loaded for the grid
                var dataView = null;
                var preventUpdate = false;

                // If extra params exist, add them to Filters
                // if (!_.isUndefined(extraParams) && !_.isEmpty(extraParams)) {
                //     Filters.addExtraParamsFilter(grid.elementId, extraParams);
                // }

                // Check if project id or grid type are defined
                if (_.isUndefined(grid.projectId) || grid.projectId.trim() === "") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly. " +
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

                // Check if the colResize attribute is defined, else assign default value
                if (_.isUndefined(grid.colResize) || (grid.colResize !== "true" && grid.colResize !== "false"))
                    grid.colResize = "false";

                // Check if the page size attribute is defined, else assign default value
                if (_.isUndefined(grid.pageSize) || _.isNaN(grid.pageSize))
                    grid.pageSize = "100";

                // Check if the component's height attribute is defined, else assign default value
                if (_.isUndefined(grid.elementH) || _.isNaN(grid.elementH))
                    grid.elementH = 200;

                // Check if the selectionType attribute is defined, else assign default value
                if (_.isUndefined(selectionType) || (selectionType !== "single" && selectionType !== "multiple"))
                    selectionType = "multiple";

                // Check if the checkboxInNewCol attribute is defined, else assign default value
                if (_.isUndefined(scope.checkboxInNewCol) || (scope.checkboxInNewCol !== "true" && scope.checkboxInNewCol !== "false")) {
                    scope.checkboxInNewCol = "false";
                }

                // Show loading animation
                scope.loading = true;

                // Set the id and the height of the grid
                gridContainer.id = grid.elementId;
                gridWrapper.style.height = grid.elementH + "px";

                // Set cookie variables
                var cookieKey = grid.viewType + "_" + dashboardId;
                // var firstLoad = true;

                var preventSelectionEvent = false;

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
                            var isSelected = _.contains(selection, node.data.id);

                            if (isSelected) {
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
                    var dataSource = {
                        rowCount: null, // behave as infinite scroll
                        maxPagesInCache: 2,
                        overflowSize: parseInt(grid.pageSize),
                        pageSize: parseInt(grid.pageSize),
                        getRows: function (params) {
                            // Function to be called when grid results are retrieved successfully
                            var getDataSuccess = function (response) {
                                // Extract needed variables from server response
                                var responseData = response.data;
                                var responseView = response.view;

                                // Get number of results
                                scope.resultsNum = parseInt(scope.numberOfItems);

                                // Save the view in order to be able to use it for exporting
                                if (_.isNull(dataView)) {
                                    dataView = responseView;
                                }

                                // // Set number of loaded rows
                                // //todo: check if this is needed here
                                // if (params.endRow > scope.loadedRows) {
                                //     scope.loadedRows = params.endRow;
                                //
                                //     if (scope.loadedRows > scope.resultsNum) {
                                //         scope.loadedRows = scope.resultsNum;
                                //     }
                                // }

                                // If there are no results, show empty grid
                                if (_.isEmpty(responseData)) {
                                    params.successCallback(responseData, 0);
                                    return;
                                }

                                if (!hasColDefs) {
                                    // Format the column definitions returned from the API and add 2 extra columns to them
                                    var columnDefs = Data.prepareGridColumns(dataView);

                                    // Check if we should add a new column for the checkboxes to go to
                                    if (scope.checkboxInNewCol === "true") {
                                        columnDefs.unshift({
                                            headerName: "",
                                            width: 30
                                        });
                                    }

                                    // Add checkboxes for selecting rows in the 1st column
                                    _.first(columnDefs).checkboxSelection = true;

                                    scope.gridOptions.api.setColumnDefs(columnDefs);
                                }

                                // Format the data returned from the API and add them to the grid
                                var rowsThisPage = Data.prepareGridData(responseData, responseView);

                                // Check if any rows have no value for some attribute
                                _.each(rowsThisPage, function (row) {
                                    // For each column of the table
                                    _.each(responseView, function (column) {
                                        var attr = column.attribute;

                                        // If it's undefined, try to find it with similar attribute name
                                        if (_.isUndefined(row[attr])) {
                                            var newValue = Data.findValueInResult(row, attr, Search.geti18nLangs(), grid.lang);

                                            if (_.isUndefined(newValue)) {
                                                newValue = "";
                                            } else if (_.isArray(newValue)) {
                                                newValue = newValue.join(", ");
                                            }

                                            // If the new value is an object, prevent nested object creation
                                            // (the grid will display "[object Object]" if we create it)
                                            if (!_.isObject(newValue)) {
                                                Data.createNestedObject(row, attr.split("."), newValue);
                                            }
                                        }
                                    });
                                });

                                var lastRow = -1;
                                if (scope.resultsNum <= params.endRow) {
                                    // We reached the end, so set the last row to the number of total results
                                    lastRow = scope.resultsNum;
                                }

                                params.successCallback(rowsThisPage, lastRow);
                                hasColDefs = true;
                            };

                            // Function to be called when grid results retrieval fails
                            var getDataError = function (error) {
                                scope.ydsAlert = error.message;
                            };

                            var paramsToSend = _.clone(scope.extraParams);
                            if (_.isUndefined(paramsToSend)) {
                                paramsToSend = {};
                            }

                            if (!_.isUndefined(baseUrl) && !_.has(paramsToSend, "baseurl")) {
                                paramsToSend.baseurl = baseUrl;
                            }

                            // Add page size, starting row and sorting parameters
                            // (paging twice because in some cases rows/start is used, in others limit/offset)
                            paramsToSend = _.extend(paramsToSend, {
                                    rows: grid.pageSize,
                                    limit: grid.pageSize,
                                    start: params.startRow,
                                    offset: params.startRow
                                },
                                Data.formatAgGridSortParams(params.sortModel));

                            // If extra params contains null value, prevent grid creation
                            var prevent = false;
                            _.each(paramsToSend, function (param) {
                                if (_.isString(param) && param.indexOf("null") !== -1)
                                    prevent = true;
                            });

                            if (prevent)
                                return;

                            Data.getProjectVis("grid", grid.projectId, grid.viewType, grid.lang, paramsToSend)
                                .then(getDataSuccess, getDataError);
                        }
                    };

                    if (_.isUndefined(scope.gridOptions)) {
                        scope.gridOptions = {
                            columnDefs: [],
                            enableColResize: (grid.colResize === "true"),
                            enableServerSideSorting: (grid.sorting === "true"),
                            rowSelection: selectionType,
                            suppressRowClickSelection: true,
                            virtualPaging: true,
                            datasource: dataSource,
                            onSelectionChanged: function (e) {
                                // Ignore event if grid is loading, or it's marked to be skipped
                                if (scope.loading || preventSelectionEvent) {
                                    preventSelectionEvent = false;
                                    return;
                                }

                                // Prevent next grid update if nothing was deselected
                                preventUpdate = !(!_.isEmpty(selection) && e.selectedRows.length < selection.length);

                                // Get selected row IDs
                                var selRows = _.pluck(e.selectedRows, "id");

                                // Set selected rows in DashboardService
                                DashboardService.setGridSelection(selectionId, selRows);
                                selection = _.clone(selRows);

                                // Save selection to cookies too
                                DashboardService.setCookieObject(cookieKey, selRows);
                            }
                        };

                        new agGrid.Grid(gridContainer, scope.gridOptions);
                    } else {
                        // Add new data source to the grid
                        scope.gridOptions.api.setDatasource(dataSource);
                    }

                    scope.loading = false;
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
