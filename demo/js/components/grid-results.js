angular.module('yds').directive('ydsGridResults', ['Data', 'Filters', 'Search', '$location', function(Data, Filters, Search, $location){
    return {
        restrict: 'E',
        scope: {
            viewType: '@',          // name of the view to use for the grid (also selected tab name in tabbed search)
            lang: '@',              // lang of the visualised data

            sorting: '@',           // enable or disable array sorting, values: true, false
            filtering: '@',         // enable or disable array filtering, values: true, false
            quickFiltering: '@',    // enable or disable array quick filtering, values: true, false
            colResize: '@',         // enable or disable column resize, values: true, false
            pageSize: '@',          // set the number of rows of each page
            elementH: '@',          // set the height of the component

            addToBasket: '@',       // enable or disable "add to basket" functionality, values: true, false
            basketBtnX: '@',        // x-axis position of the basket button
            basketBtnY: '@'         // y-axis position of the basket button
        },
        templateUrl:'templates/grid-advanced.html',
        link: function(scope, element, attrs) {
            //reference the dom elements in which the yds-grid is rendered
            var gridWrapper = angular.element(element[0].querySelector('.component-wrapper'));
            var gridContainer = angular.element(element[0].querySelector('.grid-container'));
            //set the variables which will be used for the creation of the grid
            scope.quickFilterValue = "";
            var grid = {
                elementId: "grid" + Data.createRandomId(),
                viewType: scope.viewType,
                lang: scope.lang,
                sorting: scope.sorting,
                filtering: scope.filtering,
                quickFiltering: scope.quickFiltering,
                colResize: scope.colResize,
                pageSize: scope.pageSize,
                elementH: scope.elementH
            };

            // if viewType is undefined we can't show the grid
            if(_.isUndefined(grid.viewType) || grid.viewType.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the viewType attribute isn't configured properly. " +
                    "Please check the corresponding documentation section";
                return false;
            }

            //check if the language attr is defined, else assign default value
            if(angular.isUndefined(grid.lang) || grid.lang.trim()=="")
                grid.lang = "en";

            //check if the sorting attr is defined, else assign the default value
            if(angular.isUndefined(grid.sorting) || (grid.sorting!="true" && grid.sorting!="false"))
                grid.sorting = "true";

            //check if the filtering attr is defined, else assign the default value
            if(angular.isUndefined(grid.filtering) || (grid.filtering!="true" && grid.filtering!="false"))
                grid.filtering = "false";

            //check if the quick filtering attr is defined, else assign the default value
            if(angular.isUndefined(grid.quickFiltering) || (grid.quickFiltering!="true" && grid.quickFiltering!="false"))
                grid.quickFiltering = "false";

            //check if the colResize attr is defined, else assign default value
            if(angular.isUndefined(grid.colResize) || (grid.colResize!="true" && grid.colResize!="false"))
                grid.colResize = "false";

            //check if the page size attr is defined, else assign default value
            if(angular.isUndefined(grid.pageSize) || isNaN(grid.pageSize))
                grid.pageSize = "100";

            //check if the component's height attr is defined, else assign default value
            if(angular.isUndefined(grid.elementH) || isNaN(grid.elementH))
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
                    scope.gridOptions.api.removeEventListener('afterFilterChanged', filterModifiedListener);
                    Filters.remove(grid.elementId);
                }
            });

            scope.$watch(function () { return Search.getKeyword() }, function () {
                visualizeGrid();
            });

            /**
             * Function called when the "Apply" button is clicked
             */
            scope.applyComboFilters = function() {
                var trimmedQFValue = scope.quickFilterValue.trim();
                if (trimmedQFValue.length>0) {
                    visualizeGrid(trimmedQFValue);
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
             * Function to handle quick filtering
             */
            scope.applyQuickFilter = function(input) {
                if (!_.isUndefined(scope.gridOptions.api))
                    scope.gridOptions.api.setQuickFilter(input);
            };

            /**
             * Finds the first available view for a data type
             * @param responseData
             * @param availableViews
             * @returns {*}
             */
            var findView = function(responseData, availableViews) {
                var possibleViews = _.first(responseData).type; // Types of the data, to look for their views
                var views = availableViews;                     // All returned views from the response
                var responseView = undefined;                   // Variable to store the correct view when found

                // Check if any of the possible views for the data exist
                _.each(possibleViews, function (viewToFind) {
                    _.each(views, function (view) {
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
            var getKeyword = function() {
                var newKeyword = Search.getKeyword();

                if (_.isUndefined(newKeyword) || newKeyword.trim() == "") {
                    newKeyword = "*";
                }

                return newKeyword;
            };

            /**
             * Function to render the grid
             */
            var visualizeGrid = function(quickFilter) {
                var columnDefs = [];

                // If there is no grid, create one before adding data to it
                if (_.isUndefined(scope.gridOptions)) {
                    initGrid();
                }

                // Add data to the grid from the server
                var dataSource = {
                    pageSize: parseInt(grid.pageSize),
                    getRows: function (params) {
                        // Get the search keyword, and merge it with the quick filter if it's defined
                        var keyword = getKeyword();
                        if (!_.isUndefined(quickFilter)) {
                            keyword = "(" + keyword + ") AND " + quickFilter;
                        }

                        // Get data for this page and search term from the server
                        Data.getGridResultData(keyword, grid.viewType, params.startRow, grid.pageSize, grid.lang)
                            .then(function(response) {
                                // Extract needed variables from server response
                                var responseData = response.data.response.docs;             // Get actual results

                                // If there are no results, show empty grid
                                if (_.isEmpty(responseData)) {
                                    params.successCallback(responseData, 0);
                                    return;
                                }

                                var responseView = findView(responseData, response.view);   // Find the correct view
                                var numOfResults = response.data.response.numFound;         // Total results

                                // Format the column definitions returned from the API and add them to the grid
                                columnDefs = Data.prepareGridColumns(responseView);
                                scope.gridOptions.api.setColumnDefs(columnDefs);

                                // Format the data returned from the API and add them to the grid
                                var rowsThisPage = Data.prepareGridData(responseData, responseView);
                                params.successCallback(rowsThisPage, numOfResults);
                            }, function(error) {
                                scope.ydsAlert = error.message;
                            });
                    }
                };

                scope.gridOptions.api.setDatasource(dataSource);
            };

            /**
             * Creates an empty grid
             */
            var initGrid = function() {
                var rawData = [];
                var columnDefs = [];

                //Define the options of the grid component
                scope.gridOptions = {
                    columnDefs: columnDefs,
                    enableColResize: true,
                    enableSorting: true,
                    enableFilter: true,
                    rowModelType: 'pagination'
                };

                new agGrid.Grid(gridContainer[0], scope.gridOptions);
                scope.gridOptions.api.setRowData(rawData);
            }
        }
    };
}]);