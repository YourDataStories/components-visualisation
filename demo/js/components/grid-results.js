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
            paging: '@',            // enable or disable the paging feature, values: true, false
            pageSize: '@',          // set the number of rows of each page
            elementH: '@',          // set the height of the component

            addToBasket: '@',       // enable or disable "add to basket" functionality, values: true, false
            basketBtnX: '@',        // x-axis position of the basket button
            basketBtnY: '@'         // y-axis position of the basket button
        },
        templateUrl:'templates/grid.html',
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
                paging: scope.paging,
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

            //check if the paging attr is defined, else assign default value
            if(angular.isUndefined(grid.paging) || (grid.paging!="true" && grid.paging!="false"))
                grid.paging = "false";

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
                initGrid();
            });

            /**
             * Get the grid data from the server and create the grid component
             */
            var initGrid = function() {
                // remove the current grid, if it exists
                gridContainer[0].innerHTML = "";    //todo: check if it's possible to update the data of the grid
                scope.ydsAlert = "";

                // Get new keyword from search service and search for it (if there is no keyword, show everything)
                var newKeyword = Search.getKeyword();

                if (_.isUndefined(newKeyword) || newKeyword.trim() == "") {
                    newKeyword = "*";
                }

                Data.getGridResultData(newKeyword, grid.viewType, grid.lang)
                    .then(function (response) {
                        // console.log("Initializing grid with query: " + newKeyword);
                        var rawData = [];
                        var columnDefs = [];

                        if (response.success == false || response.view.length == 0) {
                            console.log('an error has occurred');
                            return false;
                        } else {
                            // find data array to give to prepareGridData function
                            var responseData = response.data.response.docs;

                            if (_.isEmpty(responseData)) {
                                scope.ydsAlert = "There are no results in this category";
                                return;
                            }

                            // find the correct view to give to prepareGridColumns function
                            var possibleViews = _.first(responseData).type; // types of the data, to look for their views
                            var views = response.view;                      // all returned views from the response
                            var responseView = undefined;                   // variable to store the correct view when found

                            // look if any of the possible views for the data exist
                            _.each(possibleViews, function (viewToFind) {
                                _.each(views, function (view) {
                                    if (!_.isUndefined(view[viewToFind])) {
                                        responseView = view[viewToFind];
                                    }
                                });
                            });

                            if (!_.isUndefined(responseView) && !_.isUndefined(responseData)) {
                                rawData = Data.prepareGridData(responseData, responseView);
                                columnDefs = Data.prepareGridColumns(responseView);
                            }
                        }

                        //Define the options of the grid component
                        scope.gridOptions = {
                            columnDefs: columnDefs,
                            enableColResize: (grid.colResize === "true"),
                            enableSorting: (grid.sorting === "true"),
                            enableFilter: (grid.filtering === "true")
                        };

                        //If paging enabled set the required options to the grid configuration
                        if (grid.paging === "true") {
                            var localDataSource = {
                                rowCount: parseInt(rawData.length),     // not setting the row count, infinite paging will be used
                                pageSize: parseInt(grid.pageSize),      // changing to number, as scope keeps it as a string
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

                        //Create a new Grid Component
                        new agGrid.Grid(gridContainer[0], scope.gridOptions);

                        //If filtering is enabled, register function to watch for filter updates
                        if (grid.filtering === "true" || grid.quickFiltering === "true") {
                            scope.gridOptions.api.addEventListener('afterFilterChanged', filterModifiedListener);
                        }
                    }, function (error) {
                        if (error == null || _.isUndefined(error) || _.isUndefined(error.message))
                            scope.ydsAlert = "An error has occurred, please check the configuration of the component";
                        else
                            scope.ydsAlert = error.message;
                    });
            }
        }
    };
}]);