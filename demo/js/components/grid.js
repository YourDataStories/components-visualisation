angular.module('yds').directive('ydsGrid', ['Data', 'Filters', function(Data, Filters){
    return {
        restrict: 'E',
        scope: {
            projectId: '@',         //id of the project that the data belong
            tableType: '@',         //name of the array that contains the visualised data
            lang: '@',              //lang of the visualised data
            sorting: '@',           //enable or disable array sorting, values: true, false
            filtering: '@',         //enable or disable array filtering, values: true, false
            quickFiltering: '@',    //enable or disable array quick filtering, values: true, false
            colResize: '@',         //enable or disable column resize, values: true, false
            paging: '@',            //enable or disable the paging feature, values: true, false
            pageSize: '@',          //set the number of rows of each page
            elementH: '@',          //set the height of the component

            addToBasket: '@',       //enable or disable "add to basket" functionality, values: true, false
            basketBtnX: '@',        //x-axis position of the basket button
            basketBtnY: '@'         //y-axis position of the basket button
        },
        templateUrl:'templates/grid.html',
        link: function(scope, element, attrs) {
            var gridWrapper = angular.element(element[0].querySelector('.component-wrapper'));
            var gridContainer = angular.element(element[0].querySelector('.grid-container'));

            //create a random id for the element that will render the chart
            var elementId = "grid" + Data.createRandomId();
            gridContainer[0].id = elementId;

            var projectId = scope.projectId;
            var tableType = scope.tableType;
            var lang = scope.lang;
            var sorting = scope.sorting;
            var filtering = scope.filtering;
            var quickFiltering = scope.quickFiltering;
            var colResize = scope.colResize;
            var paging = scope.paging;
            var pageSize = scope.pageSize;
            var elementH = scope.elementH;

            scope.quickFilterValue = "";

            //check if project id or grid type are defined
            if(angular.isUndefined(projectId) || projectId.trim()=="" || angular.isUndefined(tableType) || tableType.trim()=="") {
                scope.ydsAlert = "The YDS component is not properly initialized " +
                    "because the projectId or the tableType attribute aren't configured properly." +
                    "Please check the corresponding documentation sertion";
                return false;
            }

            //check if the language attr is defined, else assign default value
            if(angular.isUndefined(lang))
                lang = "en";

            //check if the sorting attr is defined, else assign the default value
            if(angular.isUndefined(sorting) || (sorting!="true" && sorting!="false"))
                sorting = "true";

            //check if the filtering attr is defined, else assign the default value
            if(angular.isUndefined(filtering) || (filtering!="true" && filtering!="false"))
                sorting = "false";

            //check if the quick filtering attr is defined, else assign the default value
            if(angular.isUndefined(quickFiltering) || (quickFiltering!="true" && quickFiltering!="false"))
                quickFiltering = "false";

            //check if the colResize attr is defined, else assign default value
            if(angular.isUndefined(colResize) || (colResize!="true" && colResize!="false"))
                colResize = "false";

            //check if the paging attr is defined, else assign default value
            if(angular.isUndefined(paging) || (paging!="true" && paging!="false"))
                paging = "false";

            //check if the page size attr is defined, else assign default value
            if(angular.isUndefined(pageSize) || isNaN(pageSize))
                pageSize = "100";

            //check if the component's height attr is defined, else assign default value
            if(angular.isUndefined(elementH) || isNaN(elementH))
                elementH = 200 ;

            //set the height of the grid
            if (quickFiltering === "true") {
                gridWrapper[0].style.height = (elementH) + 'px';
                gridContainer[0].style.height = (elementH - 35) + 'px';
            } else
                gridWrapper[0].style.height = elementH + 'px';


            //Function that is being registered to the FilterModified event
            //When a filter is updated, it updates the filter obj of the component by using the Filters Service
            var filterModifiedListener = function() {
                var gridFilters = {};

                //get all filters applied to the columns
                if (filtering === "true")
                    gridFilters = scope.gridOptions.api.getFilterModel();

                //if quick filtering is enabled and has length>0, get its value and create an extra filter
                if (quickFiltering === "true")
                    gridFilters['_ydsQuickFilter_'] = scope.quickFilterValue;

                Filters.addGridFilter(elementId, gridFilters);
            };

            //If quick filtering is enabled, create function to handle quick filtering
            scope.applyQuickFilter = function(input) {
                scope.gridOptions.api.setQuickFilter(input);
            };


            /***********************************************************/
            /******* GET DATA FROM THE SERVER AND RENDER THEM **********/
            /***********************************************************/
            Data.getVisualizationData(projectId, tableType)
            .then(function (response) {
                var columnDefs = [];

                if (response.length==0)
                    return false;

                //Get the first object's keys and values
                var objectKeys = _.keys(response[0]);
                var objectValues = _.values(response[0]);

                //Define the name of the grid's columns and the filters which can be applied on them
                for (var i=0; i<objectKeys.length; i++) {
                    var columnInfo = {
                        headerName: objectKeys[i],
                        field: objectKeys[i]
                    };

                    if (!_.isNaN(parseFloat(objectValues[i]))) //is number or date
                        columnInfo.filter = 'number';

                    columnDefs.push(columnInfo)
                }

                //Define the options of the grid component
                scope.gridOptions = {
                    columnDefs: columnDefs,
                    rowSelection: 'multiple',
                    enableColResize: (colResize === "true"),
                    enableSorting: (sorting === "true"),
                    enableFilter: (filtering === "true")
                };

                //If paging enabled set the required options to the grid configuration
                if (paging==="true") {
                    var localDataSource = {
                        rowCount: parseInt(response.length),    // not setting the row count, infinite paging will be used
                        pageSize: parseInt(pageSize),           // changing to number, as scope keeps it as a string
                        getRows: function (params) {
                            var rowsThisPage = response.slice(params.startRow, params.endRow);
                            // see if we have come to the last page. if we have, set lastRow to
                            // the very last row of the last page. if you are getting data from
                            // a server, lastRow could be returned separately if the lastRow is not in the current page.
                            var lastRow = -1;
                            if (response.length <= params.endRow) {
                                lastRow = response.length;
                            }
                            params.successCallback(rowsThisPage, lastRow);
                        }
                    };

                    scope.gridOptions.datasource = localDataSource;
                } else
                    scope.gridOptions.rowData = response;

                //Create a new Grid Component
                new agGrid.Grid(gridContainer[0], scope.gridOptions);

                //If filtering is enabled, register function to watch for filter updates
                if (filtering === "true" || quickFiltering === "true") {
                    scope.gridOptions.api.addEventListener('afterFilterChanged', filterModifiedListener);
                }
            }, function (error) {
                scope.ydsAlert = error.message;
                console.error('error', error);
            });


            /***********************************************************/
            /************ CLEAR COMPONENT DATA ON DESTROY **************/
            /***********************************************************/
            scope.$on("$destroy", function() {
                if (filtering === "true" || quickFiltering === "true") {
                    scope.gridOptions.api.removeEventListener('afterFilterChanged', filterModifiedListener);
                    Filters.remove(elementId);
                }
            });
        }
    };
}]);