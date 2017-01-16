angular.module('yds').directive('ydsGrid', ['Data', 'Filters', 'DashboardService', '$timeout',
    function(Data, Filters, DashboardService, $timeout){
        return {
            restrict: 'E',
            scope: {
                projectId: '@',         // ID of the project that the data belong
                viewType: '@',          // Name of the array that contains the visualised data
                lang: '@',              // Lang of the visualised data

                extraParams: '=',       // Extra attributes to pass to the API, if needed

                sorting: '@',           // Enable or disable array sorting, values: true, false
                filtering: '@',         // Enable or disable array filtering, values: true, false
                quickFiltering: '@',    // Enable or disable array quick filtering, values: true, false
                colResize: '@',         // Enable or disable column resize, values: true, false
                paging: '@',            // Enable or disable the paging feature, values: true, false
                pageSize: '@',          // Set the number of rows of each page
                elementH: '@',          // Set the height of the component

                addToBasket: '@',       // Enable or disable "add to basket" functionality, values: true, false
                basketBtnX: '@',        // X-axis position of the basket button
                basketBtnY: '@',        // Y-axis position of the basket button

                exporting: '@',         // Enable or disable export to CSV
                exportBtnX: '@',        // X-axis position of the exporting button
                exportBtnY: '@',        // Y-axis position of the exporting button

                allowSelection: '@',    // Allow row selection
                selectionType: '@',     // Selection type ("single" or "multiple")
                dashboardId: '@',       // Used for setting/getting parameters to/from DashboardService
                selectionId: '@',       // ID for saving the selection for the specified dashboardId

                groupedData: '@',       // Set to true if the response from the API for your view type is grouped data

                embeddable: '@',        // Enable or disable the embedding of the component
                embedBtnX: '@',         // X-axis position of the embed button
                embedBtnY: '@',         // Y-axis position of the embed button
                popoverPos: '@'         // The side of the embed button from which the embed  window will appear
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/grid.html',
            link: function(scope, element, attrs) {
                //reference the dom elements in which the yds-grid is rendered
                var gridWrapper = angular.element(element[0].querySelector('.component-wrapper'));
                var gridContainer = angular.element(element[0].querySelector('.grid-container'));
                //set the variables which will be used for the creation of the grid
                scope.quickFilterValue = "";
                var grid = {
                    elementId: "grid" + Data.createRandomId(),
                    projectId: scope.projectId,
                    viewType: scope.viewType,
                    lang: scope.lang,
                    sorting: scope.sorting,
                    filtering: scope.filtering,
                    quickFiltering: scope.quickFiltering,
                    colResize: scope.colResize,
                    paging: scope.paging,
                    pageSize: scope.pageSize,
                    exporting: scope.exporting,
                    exportBtnX: parseInt(scope.exportBtnX),
                    exportBtnY: parseInt(scope.exportBtnY),
                    elementH: scope.elementH
                };

                var extraParams = scope.extraParams;
                var allowSelection = scope.allowSelection;
                var selectionType = scope.selectionType;
                var dashboardId = scope.dashboardId;
                var selectionId = scope.selectionId;
                var groupedData = scope.groupedData;

                // If selection is enabled, this will be used to reselect rows after refreshing the grid data
                var selection = [];
                var preventUpdate = false;

                // If extra params exist, add them to Filters
                if (!_.isUndefined(extraParams) && !_.isEmpty(extraParams)) {
                    Filters.addExtraParamsFilter(grid.elementId, extraParams);
                }

                //check if project id or grid type are defined
                if(_.isUndefined(grid.projectId) || grid.projectId.trim()=="") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the projectId or the viewType attribute aren't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                //check if view-type attribute is empty and assign the default value
                if(_.isUndefined(grid.viewType) || grid.viewType.trim()=="")
                    grid.viewType = "default";

                //check if the language attr is defined, else assign default value
                if(_.isUndefined(grid.lang) || grid.lang.trim()=="")
                    grid.lang = "en";

                //check if the sorting attr is defined, else assign the default value
                if(_.isUndefined(grid.sorting) || (grid.sorting!="true" && grid.sorting!="false"))
                    grid.sorting = "true";

                //check if the filtering attr is defined, else assign the default value
                if(_.isUndefined(grid.filtering) || (grid.filtering!="true" && grid.filtering!="false"))
                    grid.filtering = "false";

                //check if the quick filtering attr is defined, else assign the default value
                if(_.isUndefined(grid.quickFiltering) || (grid.quickFiltering!="true" && grid.quickFiltering!="false"))
                    grid.quickFiltering = "false";

                //check if the colResize attr is defined, else assign default value
                if(_.isUndefined(grid.colResize) || (grid.colResize!="true" && grid.colResize!="false"))
                    grid.colResize = "false";

                //check if the paging attr is defined, else assign default value
                if(_.isUndefined(grid.paging) || (grid.paging!="true" && grid.paging!="false"))
                    grid.paging = "false";

                //check if the exporting attr is defined, else assign default value
                if(_.isUndefined(grid.exporting) || (grid.exporting!="true" && grid.exporting!="false"))
                    grid.exporting = "false";

                //check if the exportBtnX attr is defined, else assign default value
                if(_.isUndefined(grid.exportBtnX) || _.isNaN(grid.exportBtnX))
                    grid.exportBtnX = 0;

                //check if the exportBtnY attr is defined, else assign default value
                if(_.isUndefined(grid.exportBtnY) || _.isNaN(grid.exportBtnY))
                    grid.exportBtnY = 0;

                //check if the page size attr is defined, else assign default value
                if(_.isUndefined(grid.pageSize) || _.isNaN(grid.pageSize))
                    grid.pageSize = "100";

                //check if the component's height attr is defined, else assign default value
                if(_.isUndefined(grid.elementH) || _.isNaN(grid.elementH))
                    grid.elementH = 200 ;

                //check if the allowSelection attr is defined, else assign default value
                if(_.isUndefined(allowSelection) || (allowSelection!="true" && allowSelection!="false"))
                    allowSelection = "false";

                //check if the groupedData attr is defined, else assign default value
                if(_.isUndefined(groupedData) || (groupedData!="true" && groupedData!="false"))
                    groupedData = "false";

                //check if the selectionType attr is defined, else assign default value
                if(_.isUndefined(selectionType) || (selectionType!="single" && selectionType!="multiple"))
                    selectionType = "multiple";

                // Show loading animation
                scope.loading = true;

                //set the id and the height of the grid component
                gridContainer[0].id = grid.elementId;

                if (grid.quickFiltering === "true") {
                    gridWrapper[0].style.height = (grid.elementH) + 'px';
                    gridContainer[0].style.height = (grid.elementH - 35) + 'px';
                } else {
                    gridWrapper[0].style.height = grid.elementH + 'px';
                }

                // If exporting is enabled, set position of export button
                if (grid.exporting == "true") {
                    scope.exportBtnPos = {
                        left: grid.exportBtnX + "px",
                        top: grid.exportBtnY + "px"
                    }
                }

                /**
                 * function which is being registered to the FilterModified event
                 * when a filter is updated, it updates the filter obj of the component by using the Filters Service
                 */
                var filterModifiedListener = function() {
                    var gridFilters = {};

                    //get all filters applied to the columns
                    if (grid.filtering === "true")
                        gridFilters = scope.gridOptions.api.getFilterModel();

                    //if quick filtering is enabled and has length>0, get its value and create an extra filter
                    if (grid.quickFiltering === "true")
                        gridFilters['_ydsQuickFilter_'] = scope.quickFilterValue;

                    Filters.addGridFilter(grid.elementId, gridFilters);
                };

                /**
                 * function to handle grid's quick filtering
                 */
                scope.applyQuickFilter = function(input) {
                    scope.gridOptions.api.setQuickFilter(input);
                };

                /**
                 * Export grid data to CSV and download it
                 */
                scope.exportGrid = function() {
                    scope.gridOptions.api.exportDataAsCsv();
                };

                /**
                 * function to be called on destroy of the component
                 */
                scope.$on("$destroy", function() {
                    //if the grid filtering is enabled remove the filter event listener
                    if (grid.filtering === "true" || grid.quickFiltering === "true") {
                        scope.gridOptions.api.removeEventListener('afterFilterChanged', filterModifiedListener);
                        Filters.remove(grid.elementId);
                    }
                });

                /**
                 * Select the ones that are indicated in the selection parameter (matches them by their "id" attribute)
                 * If the dashboardId attribute of the component contains "comparison", it deselects all previously
                 * selected rows before selecting the new ones
                 * @param selection Rows to select. Should be array of objects with "id" attributes in them.
                 */
                var selectRows = function(selection) {
                    // Deselect previously selected rows
                    if (dashboardId.indexOf("comparison") != -1 && !preventUpdate)
                        scope.gridOptions.api.deselectAll();

                    // Select new rows
                    if (!_.isEmpty(selection)) {
                        scope.gridOptions.api.forEachNode(function(node) {
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
                var createGrid = function() {
                    // Get data and visualize grid
                    var extraParams = scope.extraParams;

                    // If extra params contains null value, prevent grid creation
                    var prevent = false;
                    _.each(extraParams, function(param) {
                        if (_.isString(param) && param.indexOf("null") != -1)
                            prevent = true;
                    });
                    if (prevent)
                        return;

                    Data.getProjectVis("grid", grid.projectId, grid.viewType, grid.lang, extraParams)
                        .then(function(response) {
                            var rawData = [];
                            var columnDefs = [];

                            if (response.success == false || response.view.length==0) {
                                console.log('an error has occurred');
                                return false;
                            } else {
                                // Get column definitions
                                columnDefs = Data.prepareGridColumns(response.view);

                                // Get data for the grid
                                if (groupedData == "true") {
                                    // For grouped data, use API response directly, and make the first column definition
                                    // use the group renderer
                                    rawData = response.data;

                                    var colToModify = _.first(columnDefs);
                                    if (allowSelection == "true") {
                                        colToModify = columnDefs[1];
                                    }

                                    colToModify.cellRenderer = {
                                        renderer: 'group',
                                        innerRenderer: function(params) {
                                            return params.data.name;
                                        }
                                    };
                                } else {
                                    rawData = Data.prepareGridData(response.data, response.view);
                                }

                            }

                            // If selection is enabled, add checkbox to the first column
                            if (allowSelection == "true") {
                                _.first(columnDefs).checkboxSelection = true;
                            }

                            //Define the options of the grid component
                            scope.gridOptions = {
                                columnDefs: columnDefs,
                                enableColResize: (grid.colResize === "true"),
                                enableSorting: (grid.sorting === "true"),
                                enableFilter: (grid.filtering === "true"),
                                rowsAlreadyGrouped: (groupedData === "true"),
                                icons: {
                                    groupExpanded: '<i class="fa fa-minus-square-o"/>',
                                    groupContracted: '<i class="fa fa-plus-square-o"/>'
                                }
                            };

                            // If selection is enabled, add extra options for it in the gridOptions
                            if (allowSelection == "true") {
                                scope.gridOptions.rowSelection = selectionType;
                                scope.gridOptions.onSelectionChanged = function(e) {
                                    // Set selected rows in DashboardService
                                    DashboardService.setGridSelection(selectionId, e.selectedRows);
                                    selection = e.selectedRows;

                                    // Prevent next grid update
                                    preventUpdate = true;
                                }
                            }

                            //If paging enabled set the required options to the grid configuration
                            if (grid.paging==="true") {
                                var localDataSource = {
                                    rowCount: parseInt(rawData.length),    // not setting the row count, infinite paging will be used
                                    pageSize: parseInt(pageSize),           // changing to number, as scope keeps it as a string
                                    getRows: function (params) {
                                        var rowsThisPage = rawData.slice(params.startRow, params.endRow);
                                        var lastRow = -1;
                                        if (rawData.length <= params.endRow) {
                                            lastRow = rawData.length;
                                        }
                                        params.successCallback(rowsThisPage, lastRow);
                                    }
                                };

                                scope.gridOptions.datasource = localDataSource;
                            } else {
                                scope.gridOptions.rowData = rawData;
                            }

                            new agGrid.Grid(gridContainer[0], scope.gridOptions);

                            //If filtering is enabled, register function to watch for filter updates
                            if (grid.filtering === "true" || grid.quickFiltering === "true") {
                                scope.gridOptions.api.addEventListener('afterFilterChanged', filterModifiedListener);
                            }

                            // Remove loading animation
                            scope.loading = false;

                            // Select any points that were previously selected
                            if (allowSelection == "true" && !_.isEmpty(selection)) {
                                selectRows(selection);
                            }
                        }, function(error) {
                            if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                                scope.ydsAlert = "An error has occurred, please check the configuration of the component";
                            else
                                scope.ydsAlert = error.message;

                            // Remove loading animation
                            scope.loading = false;
                        });
                };

                if (allowSelection == "true") {
                    // Watch for changes in extra parameters and update the grid
                    scope.$watch("extraParams", function (newValue, oldValue) {
                        // Check if the grid should update (ignoring the grid's own selections)
                        var shouldUpdate = !_.isEqual(newValue, oldValue) && !preventUpdate;

                        if (shouldUpdate) {
                            $timeout(function () {
                                // If the grid exists, get current selection and destroy the grid
                                if (_.has(scope.gridOptions, "api")) {
                                    selection = scope.gridOptions.api.getSelectedRows();

                                    scope.gridOptions.api.destroy();
                                }

                                // Show loading animation and hide any errors
                                scope.loading = true;
                                scope.ydsAlert = "";

                                createGrid();
                            });
                        }

                        preventUpdate = false;
                    });

                    // Watch for changes in the selection and select the appropriate rows
                    DashboardService.subscribeGridSelectionChanges(scope, function() {
                        var selection = DashboardService.getGridSelection(selectionId);
                        selectRows(selection);
                    });
                }

                createGrid();
            }
        };
    }
]);
