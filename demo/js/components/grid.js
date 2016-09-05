angular.module('yds').directive('ydsGrid', ['Data', 'Filters', 'CountrySelectionService',
    function(Data, Filters, CountrySelectionService){
        return {
            restrict: 'E',
            scope: {
                projectId: '@',         // ID of the project that the data belong
                viewType: '@',          // Name of the array that contains the visualised data
                lang: '@',              // Lang of the visualised data

                useYearRange: '@',      // Use year range from CountrySelectionService for results, values: true, false

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
                basketBtnY: '@'         // Y-axis position of the basket button
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
                    useYearRange: scope.useYearRange,
                    sorting: scope.sorting,
                    filtering: scope.filtering,
                    quickFiltering: scope.quickFiltering,
                    colResize: scope.colResize,
                    paging: scope.paging,
                    pageSize: scope.pageSize,
                    elementH: scope.elementH
                };

                var extraParams = scope.extraParams;

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

                //check if the language attr is defined, else assign default value
                if(_.isUndefined(grid.useYearRange) || grid.useYearRange.trim()=="")
                    grid.useYearRange = "false";

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

                //check if the page size attr is defined, else assign default value
                if(_.isUndefined(grid.pageSize) || _.isNaN(grid.pageSize))
                    grid.pageSize = "100";

                //check if the component's height attr is defined, else assign default value
                if(_.isUndefined(grid.elementH) || _.isNaN(grid.elementH))
                    grid.elementH = 200 ;

                //set the id and the height of the grid component
                gridContainer[0].id = grid.elementId;

                if (grid.quickFiltering === "true") {
                    gridWrapper[0].style.height = (grid.elementH) + 'px';
                    gridContainer[0].style.height = (grid.elementH - 35) + 'px';
                } else {
                    gridWrapper[0].style.height = grid.elementH + 'px';
                }


                /**
                 * function which is being registered to the FilterModified event
                 * when a filter is updated, it updates the filter obj of the component by using the Filters Service
                 **/
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
                 **/
                scope.applyQuickFilter = function(input) {
                    scope.gridOptions.api.setQuickFilter(input);
                };


                /**
                 * function to be called on destroy of the component
                 **/
                scope.$on("$destroy", function() {
                    //if the grid filtering is enabled remove the filter event listener
                    if (grid.filtering === "true" || grid.quickFiltering === "true") {
                        scope.gridOptions.api.removeEventListener('afterFilterChanged', filterModifiedListener);
                        Filters.remove(grid.elementId);
                    }
                });

                var visualizeGrid = function(response) {
                    var rawData = [];
                    var columnDefs = [];

                    if (response.success == false || response.view.length==0) {
                        console.log('an error has occurred');
                        return false;
                    } else {
                        rawData = Data.prepareGridData(response.data, response.view);
                        columnDefs = Data.prepareGridColumns(response.view);
                    }

                    //Define the options of the grid component
                    scope.gridOptions = {
                        columnDefs: columnDefs,
                        enableColResize: (grid.colResize === "true"),
                        enableSorting: (grid.sorting === "true"),
                        enableFilter: (grid.filtering === "true")
                    };

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
                    // Create new grid or update existing grid
                    if (_.isUndefined(grid.agGrid)) {
                        // Create a new Grid Component
                        grid.agGrid = new agGrid.Grid(gridContainer[0], scope.gridOptions);

                        if (grid.useYearRange == "true") {
                            scope.gridOptions.api.sizeColumnsToFit();
                        }
                    } else {
                        // Update grid data
                        grid.agGrid.setRowData(rawData);
                    }

                    //If filtering is enabled, register function to watch for filter updates
                    if (grid.filtering === "true" || grid.quickFiltering === "true") {
                        scope.gridOptions.api.addEventListener('afterFilterChanged', filterModifiedListener);
                    }
                };

                var visualizeGridError = function(error){
                    if (error==null || _.isUndefined(error) || _.isUndefined(error.message))
                        scope.ydsAlert = "An error has occurred, please check the configuration of the component";
                    else
                        scope.ydsAlert = error.message;
                };

                /**
                 * Gets the response from the server, keeps only the countries selected via the heatmap
                 * and calls visualizeGrid with the modified response
                 * @param response
                 */
                var filterResponse = function(response) {
                    var newResponse = response;
                    var newData = [];

                    // Get selected countries from heatmap
                    var selCountries = CountrySelectionService.getCountries();

                    // Get grid data from response
                    var data = response.data;

                    _.each(data, function(responseCountry) {
                        _.each(selCountries, function(selCountry) {
                            if (selCountry.code == responseCountry.code) {
                                newData.push(responseCountry);
                            }
                        });
                    });

                    // Add new data to modified response
                    newResponse.data = newData;

                    // Create grid with modified response
                    visualizeGrid(newResponse);
                };

                /**
                 * Gets the minimum and maximum selected years from the heatmap and if they are not null
                 * gets data for that year range from the API, filters it and if any countries are selected
                 * the visualization is created
                 */
                var visualizeGridWithYearRange = function() {
                    var minYear = CountrySelectionService.getMinYear();
                    var maxYear = CountrySelectionService.getMaxYear();

                    if (!_.isNull(minYear) && !_.isNull(maxYear)) {
                        Data.getProjectVisInYearRange("grid", grid.projectId, grid.viewType, minYear, maxYear, grid.lang)
                            .then(filterResponse, visualizeGridError);
                    }
                };

                // Make appropriate request to the API to get grid data and create the grid
                if (grid.useYearRange == "true") {
                    // Create grid taking into account the year range
                    visualizeGridWithYearRange();

                    // Subscribe to be notified of year range changes to update chart
                    CountrySelectionService.subscribeYearChanges(scope, visualizeGridWithYearRange);

                    // Subscribe to be notified of country selection changes to update chart
                    CountrySelectionService.subscribeSelectionChanges(scope, visualizeGridWithYearRange);
                } else {
                    // Create grid without year data
                    Data.getProjectVis("grid", grid.projectId, grid.viewType, grid.lang, extraParams)
                        .then(visualizeGrid, visualizeGridError);
                }
            }
        };
    }
]);
