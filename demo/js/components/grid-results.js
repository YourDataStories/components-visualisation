angular.module('yds').directive('ydsGridResults', ['Data', 'Filters', 'Search', 'Basket', 'YDS_CONSTANTS', 'DashboardService', '$compile', '$location', '$q',
    function(Data, Filters, Search, Basket, YDS_CONSTANTS, DashboardService, $compile, $location, $q){
        return {
            restrict: 'E',
            scope: {
                projectId: '@',         // Project ID of data
                viewType: '@',          // Name of the view to use for the grid
                projectDetailsType: '@',// Type to use when viewing details. If undefined, will use the viewType
                lang: '@',              // Lang of the visualised data
                urlParamPrefix: '@',    // Prefix to add before all url parameters (optional)
                useGridApi: '@',        // If true, grid will use the grid API for the request

                viewInDashboard: '@',   // If true, the view button for each row will set the clicked value in DashboardService

                extraParams: '=',       // Extra attributes to pass to the API (optional)

                sorting: '@',           // Enable or disable array sorting, values: true, false
                filtering: '@',         // Enable or disable array filtering, values: true, false
                quickFiltering: '@',    // Enable or disable array quick filtering, values: true, false
                colResize: '@',         // Enable or disable column resize, values: true, false
                pageSize: '@',          // Set the number of rows of each page
                elementH: '@',          // Set the height of the component

                addToBasket: '@',       // Enable or disable "add to basket" functionality, values: true, false
                basketBtnX: '@',        // X-axis position of the basket button
                basketBtnY: '@'         // Y-axis position of the basket button
            },
            templateUrl: ((typeof Drupal != 'undefined')? Drupal.settings.basePath  + Drupal.settings.yds_project.modulePath  +'/' :'') + 'templates/grid-advanced.html',
            link: function(scope, element) {
                // Reference the dom elements in which the yds-grid is rendered
                var gridWrapper = angular.element(element[0].querySelector('.component-wrapper'));
                var gridContainer = angular.element(element[0].querySelector('.grid-container'));

                var prevTab =   "";     // Keeps the previous tab to check if the tab has changed

                // Set the variables which will be used for the creation of the grid
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
                    pageSize: scope.pageSize,
                    elementH: scope.elementH
                };

                var query = "";

                var paramPrefix = scope.urlParamPrefix;
                var projectDetailsType = scope.projectDetailsType;
                var extraParams = scope.extraParams;
                var useGridApi = scope.useGridApi;
                var viewInDashboard = scope.viewInDashboard;

                // If viewType is undefined we can't show the grid
                if(_.isUndefined(grid.viewType) || grid.viewType.trim()=="") {
                    scope.ydsAlert = "The YDS component is not properly initialized " +
                        "because the viewType attribute isn't configured properly. " +
                        "Please check the corresponding documentation section";
                    return false;
                }

                // Check if the projectDetailsType attr is defined, else assign default value
                if(_.isUndefined(projectDetailsType) || projectDetailsType.trim()=="")
                    projectDetailsType = grid.viewType;

                // Check if the language attr is defined, else assign default value
                if(_.isUndefined(grid.projectId) || grid.projectId.trim()=="")
                    grid.projectId = "none";

                // Check if the language attr is defined, else assign default value
                if(_.isUndefined(grid.lang) || grid.lang.trim()=="")
                    grid.lang = "en";

                // if no url parameter prefix is defined or it is only whitespace, use not parameter prefix
                if (_.isUndefined(paramPrefix) || (paramPrefix.trim()=="" && paramPrefix.length > 0))
                    paramPrefix = "";

                // Check if the sorting attr is defined, else assign the default value
                if(_.isUndefined(grid.sorting) || (grid.sorting!="true" && grid.sorting!="false"))
                    grid.sorting = "true";

                // Check if the useGridApi attr is defined, else assign the default value
                if(_.isUndefined(useGridApi) || (useGridApi!="true" && useGridApi!="false"))
                    useGridApi = "false";

                // Check if the viewInDashboard attr is defined, else assign the default value
                if(_.isUndefined(viewInDashboard) || (viewInDashboard!="true" && viewInDashboard!="false"))
                    viewInDashboard = "false";

                // Check if the filtering attr is defined, else assign the default value
                if(_.isUndefined(grid.filtering) || (grid.filtering!="true" && grid.filtering!="false"))
                    grid.filtering = "false";

                // Check if the quick filtering attr is defined, else assign the default value
                if(_.isUndefined(grid.quickFiltering) || (grid.quickFiltering!="true" && grid.quickFiltering!="false"))
                    grid.quickFiltering = "false";

                // Check if the colResize attr is defined, else assign default value
                if(_.isUndefined(grid.colResize) || (grid.colResize!="true" && grid.colResize!="false"))
                    grid.colResize = "false";

                // Check if the page size attr is defined, else assign default value
                if(_.isUndefined(grid.pageSize) || _.isNaN(grid.pageSize))
                    grid.pageSize = "100";

                // Check if the component's height attr is defined, else assign default value
                if(_.isUndefined(grid.elementH) || _.isNaN(grid.elementH))
                    grid.elementH = 200 ;

                // Set the id and the height of the grid component
                gridContainer[0].id = grid.elementId;

                if (grid.quickFiltering === "true") {
                    gridWrapper[0].style.height = (grid.elementH) + 'px';
                    gridContainer[0].style.height = (grid.elementH - 35) + 'px';
                    gridContainer[0].style.minHeight = (grid.elementH - 35) + 'px';
                } else {
                    gridWrapper[0].style.height = grid.elementH + 'px';
                    gridContainer[0].style.height = grid.elementH + 'px';
                    gridContainer[0].style.minHeight = grid.elementH + 'px';
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
                 * function to be called on destroy of the component
                 */
                scope.$on("$destroy", function() {
                    //if the grid filtering is enabled remove the filter event listener
                    if (grid.filtering === "true" || grid.quickFiltering === "true") {
                        if (!_.isUndefined(scope.gridOptions) && _.has(scope.gridOptions, "api")) {
                            scope.gridOptions.api.removeEventListener('afterFilterChanged', filterModifiedListener);
                        }

                        Filters.remove(grid.elementId);
                    }
                });

                /**
                 * Function called when the "Apply" button is clicked
                 */
                scope.applyComboFilters = function() {
                    var trimmedQFValue = scope.quickFilterValue.trim();
                    if (trimmedQFValue.length > 0) {
                        visualizeGrid(trimmedQFValue);
                    } else {
                        scope.clearComboFilters();
                    }
                };

                /**
                 * Clears the quick filter
                 */
                scope.clearComboFilters = function() {
                    scope.applyQuickFilter("");
                    scope.quickFilterValue = "";

                    visualizeGrid();
                };

                /**
                 * Finds the first available view for a data type
                 * @param possibleViewNames
                 * @param availableViews
                 * @returns {*}
                 */
                var findView = function(possibleViewNames, availableViews) {
                    var responseView = undefined;

                    // Check if any of the possible views for the data exist
                    _.each(possibleViewNames, function (viewToFind) {
                        _.each(availableViews, function (view) {
                            if (!_.isUndefined(view[viewToFind]) && _.isUndefined(responseView)) {
                                responseView = view[viewToFind];
                            }
                        });
                    });

                    return responseView;
                };

                /**
                 * Gets the current keyword from the search service
                 * @returns {*}
                 */
                var getSearchQuery = function() {
                    var deferred = $q.defer();

                    var newKeyword = $location.search()[paramPrefix + "q"];

                    if (_.isUndefined(newKeyword) || newKeyword.trim() == "") {
                        newKeyword = "*";
                    }

                    if (_.isUndefined(extraParams) || _.isEmpty(extraParams)) {
                        deferred.resolve(newKeyword);
                    } else {
                        if (query.length == 0) {
                            Data.getType2SolrQuery(grid.viewType, extraParams).then(function(response) {
                                // Remember query so we don't need to call this API every time the page changes
                                query = response.data.q;

                                // Resolve promise
                                deferred.resolve(query);
                            });
                        } else {
                            // Resolve promise with saved query from before
                            deferred.resolve(query);
                        }
                    }

                    return deferred.promise;
                };

                scope.viewBtn = function(itemId) {
                    console.log(itemId);
                };

                /**
                 * Adds 2 columns to the column definitions of a grid in which
                 * the "view" and "add to basket" buttons will be
                 * @param columnDefs    Column definitions array as returned by Data.prepareGridColumns()
                 * @returns {Array.<*>} New column definitions
                 */
                var addButtonsToColumnDefs = function(columnDefs) {
                    var viewBtnColDef = {
                        field: "viewBtn",
                        headerName: "",
                        width: 45,
                        suppressSorting: true,
                        suppressMenu: true,
                        suppressSizeToFit: true
                    };

                    if (viewInDashboard == "true") {
                        viewBtnColDef.cellRenderer = function(params) {
                            var btnStr = "<button type='button' class='btn btn-xs btn-primary'" +
                                "style='margin-top: -4px' ng-click='viewBtn(\"" + params.data.id + "\")'>View</button>";
                            var compiled = $compile(btnStr)(scope);

                            return _.first(compiled);
                        };
                    }

                    var newColDefs = [
                        viewBtnColDef
                        // { field: "basketBtn", headerName: "", width: 60, suppressSorting: true, suppressMenu: true }
                    ];


                    return newColDefs.concat(columnDefs);
                };

                /**
                 * Adds "View" and "Add to basket" buttons to the data
                 * @param rows      Table rows to add buttons to
                 * @returns {Array} Table rows with buttons
                 */
                var addButtonsToGridData = function(rows) {
                    var newRows = [];

                    _.each(rows, function(row) {
                        var viewBtnUrl = YDS_CONSTANTS.PROJECT_DETAILS_URL + "?id=" + row.id + "&type=" + projectDetailsType;

                        row.viewBtn = "<a href='" + viewBtnUrl + "' class='btn btn-xs btn-primary' target='_blank' style='margin-top: -4px'>View</a>";
                        // row.basketBtn = "<a href='" + viewBtnUrl + "' class='btn btn-xs btn-success' target='_blank' style='margin-top: -4px'>Basket</a>";

                        newRows.push(row);
                    });

                    return newRows;
                };

                /**
                 * Save parameters that were used to create the grid to the Filters service, so if the grid is
                 * saved to the Basket, all parameters will be saved
                 * @param query
                 * @param facets
                 * @param rules
                 */
                var saveParamsToFilters = function(query, facets, rules) {
                    // Create parameters object
                    var params = {
                        q: query,
                        fq: facets,
                        rules: rules
                    };

                    // Save the parameters to Filters service
                    Filters.addGridResultsFilter(grid.elementId, params);
                };

                /**
                 * Function to render the grid
                 */
                var visualizeGrid = function(quickFilter) {
                    // Create grid data source
                    var dataSource = {
                        maxPagesInCache: 10,
                        pageSize: parseInt(grid.pageSize),
                        getRows: function (params) {
                            // Function to be called when grid results are retrieved successfully
                            var gridResultDataSuccess = function(response) {
                                // Extract needed variables from server response
                                var responseData = response.data.response.docs;             // Get actual results

                                // If there are no results, show empty grid
                                if (_.isEmpty(responseData)) {
                                    params.successCallback(responseData, 0);
                                    return;
                                }

                                // Create array with possible view names (view type of tab should always be preferred)
                                var resultTypes = _.first(responseData).type;
                                var possibleViewNames = _.union([grid.viewType], resultTypes);

                                // Find correct view for these results and their number
                                var responseView = findView(possibleViewNames, response.view);
                                var numOfResults = response.data.response.numFound;

                                // Format the column definitions returned from the API and add 2 extra columns to them
                                var columnDefs = Data.prepareGridColumns(responseView);
                                var colDefsWithButtons = addButtonsToColumnDefs(columnDefs);

                                scope.gridOptions.api.setColumnDefs(colDefsWithButtons);

                                // Format the data returned from the API and add them to the grid
                                var rowsThisPage = Data.prepareGridData(responseData, responseView);

                                // Check if any rows have no value for some attribute
                                _.each(rowsThisPage, function(row) {
                                    // for each column of the table
                                    _.each(responseView, function(column) {
                                        var attr = column.attribute;

                                        // if it's undefined, try to find it with similar attribute name
                                        if (_.isUndefined(row[attr])) {
                                            var newValue = Data.findValueInResult(row, attr, Search.geti18nLangs(), grid.lang);

                                            if (_.isUndefined(newValue)) {
                                                newValue = "";
                                            } else if (_.isArray(newValue)) {
                                                newValue = newValue.join(", ");
                                            }

                                            Data.createNestedObject(row, attr.split("."), newValue);
                                        }
                                    });
                                });

                                // Add view button for viewing more info about the result
                                var rowsWithButtons = addButtonsToGridData(rowsThisPage);

                                params.successCallback(rowsWithButtons, numOfResults);

                                // Call sizeColumnsToFit, if this grid is in the selected tab of Tabbed Search (so
                                // tab url parameter will be the same as this grid's view type) or if query length
                                // is > 0 (so this grid is using extraParams, which means it's shown in the Dashboard)
                                if (scope.viewType == $location.search()[paramPrefix + "tab"] || query.length > 0) {
                                    scope.gridOptions.api.sizeColumnsToFit();
                                }
                            };

                            // Function to be called when grid results retrieval fails
                            var gridResultDataError = function(error) {
                                scope.ydsAlert = error.message;
                            };

                            if (useGridApi == "false") {
                                // Get the search query, and merge it with the quick filter if it's defined
                                getSearchQuery().then(function(searchQuery) {
                                    var query = searchQuery;
                                    if (!_.isUndefined(quickFilter)) {
                                        query = "(" + query + ") AND " + quickFilter;
                                    }

                                    // Get facets from URL parameters
                                    var facets = $location.search()[paramPrefix + "fq"];

                                    // If there are advanced search rules, get them and perform advanced search
                                    var rules = $location.search()[paramPrefix + "rules"];
                                    if (!_.isUndefined(rules)) {
                                        rules = JSURL.parse(rules);

                                        Data.getGridResultDataAdvanced(query, facets, rules, grid.viewType, params.startRow, grid.pageSize, grid.lang)
                                            .then(gridResultDataSuccess, gridResultDataError);
                                    } else {
                                        var viewType = "";
                                        if (_.isUndefined(extraParams) || _.isEmpty(extraParams)) {
                                            // If extra params do not exist, send view type as normal
                                            // If they exist, the type will be already included in the query
                                            viewType = grid.viewType;
                                        }

                                        // Perform normal search
                                        Data.getGridResultData(query, facets, viewType, params.startRow, grid.pageSize, grid.lang)
                                            .then(gridResultDataSuccess, gridResultDataError);
                                    }

                                    // Save parameters used to create the grid to the filters service
                                    saveParamsToFilters(query, facets, rules);
                                });
                            } else {
                                Data.getProjectVis("grid", grid.projectId, grid.viewType, grid.lang, extraParams)
                                    .then(gridResultDataSuccess, gridResultDataError);
                            }
                        }
                    };

                    // If the grid is being rendered for the first time, create it with the datasource
                    if (_.isUndefined(scope.gridOptions)) {
                        // Define the options of the grid component
                        scope.gridOptions = {
                            columnDefs: [],
                            enableColResize: true,
                            virtualPaging: true,
                            datasource: dataSource
                        };

                        new agGrid.Grid(gridContainer[0], scope.gridOptions);
                    } else {
                        // Add new data source to the grid
                        scope.gridOptions.api.setDatasource(dataSource);
                    }
                };

                if (_.isUndefined(extraParams) && useGridApi == "false") {
                    // If any URL parameters change act accordingly
                    scope.$watch(function () { return JSON.stringify($location.search()) + getSearchQuery(); }, function () {
                        var urlParams = $location.search();

                        // Only look for changes if this grid is in the active tab
                        if (urlParams[paramPrefix + "tab"] == scope.viewType) {
                            // Update prevTab variable to the new tab
                            prevTab = urlParams[paramPrefix + "tab"];

                            // Visualize the grid
                            visualizeGrid();
                        }
                    });
                } else {
                    // Visualize grid using extra params
                    visualizeGrid();
                }
            }
        };
    }
]);
